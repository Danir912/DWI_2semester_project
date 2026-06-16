import {computed, inject} from '@angular/core';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {catchError, forkJoin, exhaustMap, of, pipe, switchMap, tap} from 'rxjs';

import {CrmApiService} from '../../core/api/crm-api.service';
import {
  ArchivedContact,
  Contact,
  ContactFilters,
  ContactPayload,
  ContactReminderItem,
  Interaction,
  Note,
  Reminder,
} from '../../shared/models/contact.model';
import {calculateStats, DEFAULT_FILTERS, filterContacts} from './contacts.utils';

interface ContactsState {
  contacts: Contact[];
  trash: ArchivedContact[];
  filters: ContactFilters;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const TRASH_STORAGE_KEY = 'contact-crm.trash';
const TRASH_TTL_DAYS = 7;

const initialState: ContactsState = {
  contacts: [],
  trash: readTrash(),
  filters: DEFAULT_FILTERS,
  selectedId: null,
  loading: false,
  error: null,
};

function readTrash(): ArchivedContact[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(TRASH_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ArchivedContact[];
  } catch {
    localStorage.removeItem(TRASH_STORAGE_KEY);
    return [];
  }
}

function persistTrash(trash: ArchivedContact[]): void {
  localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));
}

function purgeExpired(trash: ArchivedContact[], today = new Date()): ArchivedContact[] {
  return trash.filter((item) => new Date(item.expiresAt) > today);
}

function createArchivedContact(contact: Contact, deletedAt = new Date()): ArchivedContact {
  const expiresAt = new Date(deletedAt);

  expiresAt.setDate(expiresAt.getDate() + TRASH_TTL_DAYS);

  return {
    contact,
    deletedAt: deletedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

function createImportId(): string {
  return `imported-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const ContactsStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withComputed((store) => ({
    filteredContacts: computed(() => filterContacts(store.contacts(), store.filters())),
    categories: computed(() => Array.from(new Set(store.contacts().map((contact) => contact.category))).sort()),
    selectedContact: computed(() => store.contacts().find((contact) => contact.id === store.selectedId()) ?? null),
    reminders: computed(() =>
      store
        .contacts()
        .flatMap((contact) => contact.reminders.map((reminder) => ({contact, reminder})))
        .sort(
          (left, right) =>
            new Date(left.reminder.dueDate).getTime() - new Date(right.reminder.dueDate).getTime(),
        ),
    ),
    pendingRemindersCount: computed(() =>
      store.contacts().reduce(
        (sum, contact) => sum + contact.reminders.filter((reminder) => !reminder.completed).length,
        0,
      ),
    ),
    trashCount: computed(() => store.trash().length),
    stats: computed(() => calculateStats(store.contacts())),
  })),
  withMethods((store, api = inject(CrmApiService)) => {
    const persistContact = (contact: Contact): void => {
      patchState(store, ({contacts}) => ({
        contacts: contacts.map((item) => (item.id === contact.id ? contact : item)),
      }));

      api.updateContact(contact).subscribe({
        error: () => patchState(store, {error: 'Изменения контакта не сохранены'}),
      });
    };

    return {
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, {loading: true, error: null})),
        exhaustMap(() =>
          api.getContacts().pipe(
            tap((contacts) =>
              patchState(store, ({trash}) => {
                const nextTrash = purgeExpired(trash);

                persistTrash(nextTrash);

                return {
                  contacts,
                  trash: nextTrash,
                  selectedId: contacts[0]?.id ?? null,
                  loading: false,
                };
              }),
            ),
            catchError(() => {
              patchState(store, {loading: false, error: 'Не удалось загрузить контакты'});
              return of(null);
            }),
          ),
        ),
      ),
    ),
    setFilters(filters: Partial<ContactFilters>): void {
      patchState(store, (state) => {
        const nextFilters = {...state.filters, ...filters};
        const visibleContacts = filterContacts(state.contacts, nextFilters);
        const selectedVisible = visibleContacts.some((contact) => contact.id === state.selectedId);

        return {
          filters: nextFilters,
          selectedId: selectedVisible ? state.selectedId : (visibleContacts[0]?.id ?? null),
        };
      });
    },
    selectContact(id: string): void {
      patchState(store, {selectedId: id});
    },
    contactById(id: string): Contact | null {
      return store.contacts().find((contact) => contact.id === id) ?? null;
    },
    createContact: rxMethod<ContactPayload>(
      pipe(
        tap(() => patchState(store, {loading: true, error: null})),
        switchMap((payload) =>
          api.createContact(payload).pipe(
            tap((contact) =>
              patchState(store, ({contacts}) => ({
                contacts: [contact, ...contacts],
                selectedId: contact.id,
                loading: false,
              })),
            ),
            catchError(() => {
              patchState(store, {loading: false, error: 'Контакт не сохранён'});
              return of(null);
            }),
          ),
        ),
      ),
    ),
    updateContact: rxMethod<Contact>(
      pipe(
        switchMap((contact) =>
          api.updateContact(contact).pipe(
            tap((updated) =>
              patchState(store, ({contacts}) => ({
                contacts: contacts.map((item) => (item.id === updated.id ? updated : item)),
              })),
            ),
          ),
        ),
      ),
    ),
    archiveContact: rxMethod<Contact>(
      pipe(
        switchMap((contact) =>
          api.deleteContact(contact.id).pipe(
            tap(() =>
              patchState(store, ({contacts, trash}) => {
                const nextContacts = contacts.filter((item) => item.id !== contact.id);
                const nextTrash = purgeExpired([
                  createArchivedContact(contact),
                  ...trash.filter((item) => item.contact.id !== contact.id),
                ]);

                persistTrash(nextTrash);

                return {contacts: nextContacts, trash: nextTrash, selectedId: nextContacts[0]?.id ?? null};
              }),
            ),
          ),
        ),
      ),
    ),
    restoreContact: rxMethod<ArchivedContact>(
      pipe(
        switchMap((archived) => {
          const alreadyRestored = store.contacts().some((contact) => contact.id === archived.contact.id);
          const nextTrash = store.trash().filter((item) => item.contact.id !== archived.contact.id);

          persistTrash(nextTrash);
          patchState(store, {
            trash: nextTrash,
            selectedId: archived.contact.id,
          });

          if (alreadyRestored) {
            return of(archived.contact);
          }

          return api.restoreContact(archived.contact).pipe(
            tap((contact) =>
              patchState(store, ({contacts}) => ({
                contacts: contacts.some((item) => item.id === contact.id) ? contacts : [contact, ...contacts],
                selectedId: contact.id,
              })),
            ),
          );
        }),
      ),
    ),
    deleteArchivedForever(id: string): void {
      patchState(store, ({trash}) => {
        const nextTrash = trash.filter((item) => item.contact.id !== id);

        persistTrash(nextTrash);

        return {trash: nextTrash};
      });
    },
    purgeExpiredTrash(): void {
      patchState(store, ({trash}) => {
        const nextTrash = purgeExpired(trash);

        persistTrash(nextTrash);

        return {trash: nextTrash};
      });
    },
    addInteraction(contactId: string, interaction: Interaction): void {
      const contact = store.contacts().find((item) => item.id === contactId);

      if (!contact) {
        return;
      }

      persistContact({
        ...contact,
        interactions: [interaction, ...contact.interactions],
        lastContactAt: interaction.date,
      });
    },
    addNote(contactId: string, note: Note): void {
      const contact = store.contacts().find((item) => item.id === contactId);

      if (!contact) {
        return;
      }

      persistContact({...contact, notes: [note, ...contact.notes]});
    },
    addReminder(contactId: string, reminder: Reminder): void {
      const contact = store.contacts().find((item) => item.id === contactId);

      if (!contact) {
        return;
      }

      persistContact({...contact, reminders: [reminder, ...contact.reminders]});
    },
    toggleReminder(contactId: string, reminderId: string, completed: boolean): void {
      const contact = store.contacts().find((item) => item.id === contactId);

      if (!contact) {
        return;
      }

      persistContact({
        ...contact,
        reminders: contact.reminders.map((reminder) =>
          reminder.id === reminderId ? {...reminder, completed} : reminder,
        ),
      });
    },
    reminderStatusLabel(item: ContactReminderItem): string {
      return item.reminder.completed ? 'Выполнено' : 'Ожидает';
    },
    importContacts(contacts: Contact[]): void {
      const importedAt = new Date().toISOString();
      const existingIds = new Set(store.contacts().map((contact) => contact.id));
      const normalized = contacts.map((contact) => ({
        ...contact,
        id: contact.id || createImportId(),
        importedAt,
      }));
      const importedIds = new Set(normalized.map((contact) => contact.id));
      const nextContacts = [
        ...normalized,
        ...store.contacts().filter((contact) => !importedIds.has(contact.id)),
      ];

      patchState(store, {
        contacts: nextContacts,
        selectedId: normalized[0]?.id ?? store.selectedId(),
        loading: true,
        error: null,
      });

      const requests = normalized.map((contact) => api.upsertContact(contact, existingIds.has(contact.id)));

      if (!requests.length) {
        patchState(store, {loading: false});
        return;
      }

      forkJoin(requests).subscribe({
        next: (savedContacts) =>
          patchState(store, ({contacts: currentContacts}) => ({
            contacts: currentContacts.map(
              (contact) => savedContacts.find((saved) => saved.id === contact.id) ?? contact,
            ),
            loading: false,
          })),
        error: () => patchState(store, {loading: false, error: 'Импортированные контакты не синхронизированы'}),
      });
    },
    };
  }),
);

import {computed, inject} from '@angular/core';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {catchError, exhaustMap, of, pipe, switchMap, tap} from 'rxjs';

import {CrmApiService} from '../../core/api/crm-api.service';
import {
  Contact,
  ContactFilters,
  ContactPayload,
  Interaction,
  Note,
  Reminder,
} from '../../shared/models/contact.model';
import {calculateStats, DEFAULT_FILTERS, filterContacts} from './contacts.utils';

interface ContactsState {
  contacts: Contact[];
  filters: ContactFilters;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  filters: DEFAULT_FILTERS,
  selectedId: null,
  loading: false,
  error: null,
};

export const ContactsStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withComputed((store) => ({
    filteredContacts: computed(() => filterContacts(store.contacts(), store.filters())),
    categories: computed(() => Array.from(new Set(store.contacts().map((contact) => contact.category))).sort()),
    selectedContact: computed(() => store.contacts().find((contact) => contact.id === store.selectedId()) ?? null),
    stats: computed(() => calculateStats(store.contacts())),
  })),
  withMethods((store, api = inject(CrmApiService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, {loading: true, error: null})),
        exhaustMap(() =>
          api.getContacts().pipe(
            tap((contacts) =>
              patchState(store, {
                contacts,
                selectedId: contacts[0]?.id ?? null,
                loading: false,
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
    deleteContact: rxMethod<string>(
      pipe(
        switchMap((id) =>
          api.deleteContact(id).pipe(
            tap(() =>
              patchState(store, ({contacts}) => {
                const next = contacts.filter((contact) => contact.id !== id);

                return {contacts: next, selectedId: next[0]?.id ?? null};
              }),
            ),
          ),
        ),
      ),
    ),
    addInteraction(contactId: string, interaction: Interaction): void {
      patchState(store, ({contacts}) => ({
        contacts: contacts.map((contact) =>
          contact.id === contactId
            ? {...contact, interactions: [interaction, ...contact.interactions], lastContactAt: interaction.date}
            : contact,
        ),
      }));
    },
    addNote(contactId: string, note: Note): void {
      patchState(store, ({contacts}) => ({
        contacts: contacts.map((contact) =>
          contact.id === contactId ? {...contact, notes: [note, ...contact.notes]} : contact,
        ),
      }));
    },
    addReminder(contactId: string, reminder: Reminder): void {
      patchState(store, ({contacts}) => ({
        contacts: contacts.map((contact) =>
          contact.id === contactId ? {...contact, reminders: [reminder, ...contact.reminders]} : contact,
        ),
      }));
    },
    importContacts(contacts: Contact[]): void {
      patchState(store, {contacts, selectedId: contacts[0]?.id ?? null});
    },
  })),
);

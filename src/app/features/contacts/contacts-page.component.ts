import {ChangeDetectionStrategy, Component, OnInit, computed, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  TuiButton,
  TuiDataList,
  TuiError,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiSegmented,
} from '@taiga-ui/kit';

import {Contact, ContactPayload, ContactStatus, InteractionType} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';
import {createId} from './contacts.utils';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiBadge,
    TuiButton,
    TuiDataList,
    TuiError,
    TuiLoader,
    TuiSegmented,
    TuiTextfield,
  ],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent implements OnInit {
  protected readonly store = inject(ContactsStore);
  private readonly fb = inject(FormBuilder);
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly statusLabels: Record<ContactStatus, string> = {
    new: 'Новый',
    active: 'Активный',
    inactive: 'Неактивный',
  };
  protected readonly statusOptions: Array<ContactStatus | 'all'> = ['all', 'new', 'active', 'inactive'];
  protected readonly statusFilterIndex = computed(() =>
    this.statusOptions.indexOf(this.store.filters.status()),
  );
  protected editingId: string | null = null;

  protected readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    category: ['Клиенты', Validators.required],
    status: ['new' as ContactStatus, Validators.required],
    nextContactAt: [this.today, Validators.required],
  });

  protected readonly activityForm = this.fb.nonNullable.group({
    type: ['call' as InteractionType, Validators.required],
    summary: [''],
    note: [''],
    reminderText: [''],
    reminderDate: [this.today],
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected setStatusFilter(index: number): void {
    this.store.setFilters({status: this.statusOptions[index]});
  }

  protected edit(contact: Contact): void {
    this.editingId = contact.id;
    this.contactForm.patchValue({
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      category: contact.category,
      status: contact.status,
      nextContactAt: contact.nextContactAt,
    });
  }

  protected resetForm(): void {
    this.editingId = null;
    this.contactForm.reset({
      name: '',
      company: '',
      email: '',
      phone: '',
      category: 'Клиенты',
      status: 'new',
      nextContactAt: this.today,
    });
  }

  protected saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const value = this.contactForm.getRawValue();
    const payload: ContactPayload = {
      ...value,
      lastContactAt: this.today,
      notes: [],
      interactions: [],
      reminders: [],
    };

    if (this.editingId) {
      const current = this.store.contacts().find((contact) => contact.id === this.editingId);

      if (current) {
        this.store.updateContact({...current, ...payload});
      }
    } else {
      this.store.createContact(payload);
    }

    this.resetForm();
  }

  protected addActivity(contact: Contact): void {
    const value = this.activityForm.getRawValue();

    if (value.summary.trim()) {
      this.store.addInteraction(contact.id, {
        id: createId('interaction'),
        type: value.type,
        date: this.today,
        summary: value.summary.trim(),
      });
    }

    if (value.note.trim()) {
      this.store.addNote(contact.id, {
        id: createId('note'),
        createdAt: this.today,
        text: value.note.trim(),
      });
    }

    if (value.reminderText.trim()) {
      this.store.addReminder(contact.id, {
        id: createId('reminder'),
        dueDate: value.reminderDate,
        text: value.reminderText.trim(),
        completed: false,
      });
    }

    this.activityForm.reset({
      type: 'call',
      summary: '',
      note: '',
      reminderText: '',
      reminderDate: this.today,
    });
  }

  protected exportContacts(): void {
    const blob = new Blob([JSON.stringify(this.store.contacts(), null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'contact-crm-backup.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  protected importContacts(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const parsed = JSON.parse(String(reader.result)) as Contact[];
      this.store.importContacts(parsed);
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected trackById(_: number, contact: Contact): string {
    return contact.id;
  }
}

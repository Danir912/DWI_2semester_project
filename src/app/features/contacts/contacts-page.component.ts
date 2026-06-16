import {ChangeDetectionStrategy, Component, OnInit, computed, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TuiButton, TuiError, TuiLoader, TuiTextfield} from '@taiga-ui/core';
import {TuiBadge, TuiSegmented} from '@taiga-ui/kit';

import {Contact, ContactPayload, ContactStatus} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TuiBadge, TuiButton, TuiError, TuiLoader, TuiSegmented, TuiTextfield],
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

  protected readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    category: ['Клиенты', Validators.required],
    status: ['new' as ContactStatus, Validators.required],
    nextContactAt: [this.today, Validators.required],
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected setStatusFilter(index: number): void {
    this.store.setFilters({status: this.statusOptions[index]});
  }

  protected resetNewContactForm(): void {
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

    const payload: ContactPayload = {
      ...this.contactForm.getRawValue(),
      lastContactAt: this.today,
      notes: [],
      interactions: [],
      reminders: [],
    };

    this.store.createContact(payload);
    this.resetNewContactForm();
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

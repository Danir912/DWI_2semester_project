import {ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {TuiButton, TuiTextfield} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {Contact, ContactPayload, ContactStatus, InteractionType} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';
import {createId} from './contacts.utils';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TuiBadge, TuiButton, TuiTextfield],
  templateUrl: './contact-detail-page.component.html',
  styleUrl: './contact-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDetailPageComponent implements OnInit {
  readonly id = input.required<string>();

  protected readonly store = inject(ContactsStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly statusLabels: Record<ContactStatus, string> = {
    new: 'Новый',
    active: 'Активный',
    inactive: 'Неактивный',
  };
  protected readonly contact = computed(() => this.store.contactById(this.id()));
  protected isEditing = false;

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

  constructor() {
    effect(() => {
      const contact = this.contact();

      if (contact && !this.isEditing) {
        this.patchContactForm(contact);
      }
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected startEdit(contact: Contact): void {
    this.isEditing = true;
    this.patchContactForm(contact);
  }

  protected cancelEdit(contact: Contact): void {
    this.patchContactForm(contact);
    this.isEditing = false;
  }

  protected saveContact(contact: Contact): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const payload: ContactPayload = {
      ...this.contactForm.getRawValue(),
      lastContactAt: contact.lastContactAt,
      notes: contact.notes,
      interactions: contact.interactions,
      reminders: contact.reminders,
    };

    this.store.updateContact({...contact, ...payload});
    this.isEditing = false;
  }

  protected archive(contact: Contact): void {
    const confirmed = confirm(`Переместить "${contact.name}" в корзину на 7 дней?`);

    if (!confirmed) {
      return;
    }

    this.store.archiveContact(contact);
    void this.router.navigateByUrl('/contacts');
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

  private patchContactForm(contact: Contact): void {
    this.contactForm.reset({
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      category: contact.category,
      status: contact.status,
      nextContactAt: contact.nextContactAt,
    });
  }
}

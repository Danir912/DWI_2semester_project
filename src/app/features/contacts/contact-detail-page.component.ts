import {ChangeDetectionStrategy, Component, OnInit, computed, inject, input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {TuiButton} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {Contact, ContactStatus, InteractionType, Reminder} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';
import {createId} from './contacts.utils';
import {I18nPipe} from '../../shared/pipes/i18n.pipe';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  imports: [I18nPipe, ReactiveFormsModule, RouterLink, TuiBadge, TuiButton],
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

  protected toggleReminder(contact: Contact, reminder: Reminder): void {
    this.store.toggleReminder(contact.id, reminder.id, !reminder.completed);
  }
}

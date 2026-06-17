import {ChangeDetectionStrategy, Component, OnInit, computed, inject, input} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {TuiButton} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {Contact, InteractionType, Reminder} from '../../shared/models/contact.model';
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
  protected readonly contact = computed(() => this.store.contactById(this.id()));

  protected readonly interactionForm = this.fb.nonNullable.group({
    type: ['call' as InteractionType, Validators.required],
    date: [this.today, Validators.required],
    summary: ['', Validators.required],
  });
  protected readonly noteForm = this.fb.nonNullable.group({
    text: ['', Validators.required],
  });
  protected readonly reminderForm = this.fb.nonNullable.group({
    text: ['', Validators.required],
    dueDate: [this.today, Validators.required],
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

  protected addInteraction(contact: Contact): void {
    if (this.interactionForm.invalid || !this.interactionForm.controls.summary.value.trim()) {
      this.interactionForm.markAllAsTouched();
      return;
    }

    const value = this.interactionForm.getRawValue();

    this.store.addInteraction(contact.id, {
      id: createId('interaction'),
      type: value.type,
      date: value.date,
      summary: value.summary.trim(),
    });

    this.interactionForm.reset({
      type: 'call',
      date: this.today,
      summary: '',
    });
  }

  protected addNote(contact: Contact): void {
    if (this.noteForm.invalid || !this.noteForm.controls.text.value.trim()) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const value = this.noteForm.getRawValue();

    this.store.addNote(contact.id, {
      id: createId('note'),
      createdAt: this.today,
      text: value.text.trim(),
    });

    this.noteForm.reset({text: ''});
  }

  protected addReminder(contact: Contact): void {
    if (this.reminderForm.invalid || !this.reminderForm.controls.text.value.trim()) {
      this.reminderForm.markAllAsTouched();
      return;
    }

    const value = this.reminderForm.getRawValue();

    this.store.addReminder(contact.id, {
      id: createId('reminder'),
      dueDate: value.dueDate,
      text: value.text.trim(),
      completed: false,
    });

    this.reminderForm.reset({
      text: '',
      dueDate: this.today,
    });
  }

  protected toggleReminder(contact: Contact, reminder: Reminder): void {
    this.store.toggleReminder(contact.id, reminder.id, !reminder.completed);
  }
}

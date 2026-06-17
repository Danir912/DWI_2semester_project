import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {TuiButton, TuiTextfield} from '@taiga-ui/core';

import {Contact, ContactPayload} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';
import {I18nPipe} from '../../shared/pipes/i18n.pipe';

@Component({
  selector: 'app-contact-edit-page',
  standalone: true,
  imports: [I18nPipe, ReactiveFormsModule, RouterLink, TuiButton, TuiTextfield],
  templateUrl: './contact-edit-page.component.html',
  styleUrl: './contact-edit-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactEditPageComponent implements OnInit {
  readonly id = input.required<string>();

  protected readonly store = inject(ContactsStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly contact = computed(() => this.store.contactById(this.id()));

  protected readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    category: ['Клиенты', Validators.required],
    nextContactAt: [''],
  });

  constructor() {
    effect(() => {
      const contact = this.contact();

      if (contact) {
        this.patchContactForm(contact);
      }
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected saveContact(contact: Contact): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const payload: ContactPayload = {
      ...this.contactForm.getRawValue(),
      status: contact.status,
      lastContactAt: contact.lastContactAt,
      notes: contact.notes,
      interactions: contact.interactions,
      reminders: contact.reminders,
    };

    this.store.updateContact({...contact, ...payload});
    void this.router.navigate(['/contacts', contact.id]);
  }

  protected resetChanges(contact: Contact): void {
    this.patchContactForm(contact);
  }

  private patchContactForm(contact: Contact): void {
    this.contactForm.reset({
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      category: contact.category,
      nextContactAt: contact.nextContactAt,
    });
  }
}

import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable} from 'rxjs';

import {Contact, ContactPayload, Interaction, Note, Reminder} from '../../shared/models/contact.model';

@Injectable({providedIn: 'root'})
export class CrmApiService {
  private readonly http = inject(HttpClient);

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>('/api/contacts');
  }

  createContact(payload: ContactPayload): Observable<Contact> {
    return this.http.post<Contact>('/api/contacts', {
      id: `contact-${Date.now()}`,
      ...payload,
    });
  }

  restoreContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>('/api/contacts', contact);
  }

  upsertContact(contact: Contact, exists: boolean): Observable<Contact> {
    return exists ? this.updateContact(contact) : this.restoreContact(contact);
  }

  updateContact(contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(`/api/contacts/${contact.id}`, contact);
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`/api/contacts/${id}`);
  }

  addInteraction(contact: Contact, interaction: Interaction): Observable<Contact> {
    return this.updateContact({
      ...contact,
      interactions: [interaction, ...contact.interactions],
      lastContactAt: interaction.date,
    });
  }

  addNote(contact: Contact, note: Note): Observable<Contact> {
    return this.updateContact({...contact, notes: [note, ...contact.notes]});
  }

  addReminder(contact: Contact, reminder: Reminder): Observable<Contact> {
    return this.updateContact({...contact, reminders: [reminder, ...contact.reminders]});
  }
}

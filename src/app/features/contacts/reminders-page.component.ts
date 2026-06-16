import {ChangeDetectionStrategy, Component, OnInit, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TuiButton} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {ContactReminderItem} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';
import {I18nPipe} from '../../shared/pipes/i18n.pipe';

@Component({
  selector: 'app-reminders-page',
  standalone: true,
  imports: [I18nPipe, RouterLink, TuiBadge, TuiButton],
  templateUrl: './reminders-page.component.html',
  styleUrl: './reminders-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemindersPageComponent implements OnInit {
  protected readonly store = inject(ContactsStore);

  ngOnInit(): void {
    this.store.load();
  }

  protected toggle(item: ContactReminderItem): void {
    this.store.toggleReminder(item.contact.id, item.reminder.id, !item.reminder.completed);
  }

  protected isOverdue(item: ContactReminderItem): boolean {
    return !item.reminder.completed && new Date(item.reminder.dueDate) < new Date();
  }
}

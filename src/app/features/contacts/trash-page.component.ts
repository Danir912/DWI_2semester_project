import {ChangeDetectionStrategy, Component, OnInit, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TuiButton} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {ArchivedContact} from '../../shared/models/contact.model';
import {ContactsStore} from './contacts.store';

@Component({
  selector: 'app-trash-page',
  standalone: true,
  imports: [RouterLink, TuiBadge, TuiButton],
  templateUrl: './trash-page.component.html',
  styleUrl: './trash-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashPageComponent implements OnInit {
  protected readonly store = inject(ContactsStore);

  ngOnInit(): void {
    this.store.purgeExpiredTrash();
  }

  protected restore(item: ArchivedContact): void {
    this.store.restoreContact(item);
  }

  protected deleteForever(item: ArchivedContact): void {
    const confirmed = confirm(`Удалить "${item.contact.name}" навсегда? Это действие нельзя отменить.`);

    if (confirmed) {
      this.store.deleteArchivedForever(item.contact.id);
    }
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('ru-RU', {dateStyle: 'medium'}).format(new Date(value));
  }
}

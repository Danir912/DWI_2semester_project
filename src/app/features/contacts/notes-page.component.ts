import {ChangeDetectionStrategy, Component, OnInit, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TuiButton} from '@taiga-ui/core';
import {TuiBadge} from '@taiga-ui/kit';

import {ContactsStore} from './contacts.store';
import {I18nPipe} from '../../shared/pipes/i18n.pipe';

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [I18nPipe, RouterLink, TuiBadge, TuiButton],
  templateUrl: './notes-page.component.html',
  styleUrl: './notes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPageComponent implements OnInit {
  protected readonly store = inject(ContactsStore);

  ngOnInit(): void {
    this.store.load();
  }
}

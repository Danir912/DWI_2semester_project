import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {AsyncPipe} from '@angular/common';
import {TuiRoot} from '@taiga-ui/core';

import {AuthService} from './core/auth/auth.service';
import {AppPreferencesService} from './core/preferences/app-preferences.service';
import {I18nPipe} from './shared/pipes/i18n.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, I18nPipe, RouterLink, RouterOutlet, TuiRoot],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  protected readonly preferences = inject(AppPreferencesService);
}

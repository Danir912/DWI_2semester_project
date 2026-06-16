import {Pipe, PipeTransform, inject} from '@angular/core';

import {AppPreferencesService} from '../../core/preferences/app-preferences.service';

@Pipe({
  name: 'i18n',
  standalone: true,
  pure: false,
})
export class I18nPipe implements PipeTransform {
  private readonly preferences = inject(AppPreferencesService);

  transform(key: string): string {
    return this.preferences.t(key);
  }
}

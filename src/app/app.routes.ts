import {Routes} from '@angular/router';

import {authGuard} from './core/auth/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'contacts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contacts/contacts-page.component').then((m) => m.ContactsPageComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'contacts',
  },
  {
    path: '**',
    redirectTo: 'contacts',
  },
];

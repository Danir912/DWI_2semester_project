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
    path: 'contacts/trash',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contacts/trash-page.component').then((m) => m.TrashPageComponent),
  },
  {
    path: 'contacts/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contacts/contact-detail-page.component').then((m) => m.ContactDetailPageComponent),
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

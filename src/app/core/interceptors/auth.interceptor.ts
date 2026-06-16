import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';

import {AuthService} from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const apiRequest = request.url.startsWith('/api')
    ? request.clone({
        url: request.url.replace('/api', 'http://localhost:3000'),
        setHeaders: token ? {Authorization: `Bearer ${token}`} : {},
      })
    : request;

  return next(apiRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
      }

      return throwError(() => error);
    }),
  );
};

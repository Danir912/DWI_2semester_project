import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, map, tap} from 'rxjs';
import {Router} from '@angular/router';

import {AuthSession, AuthUser, LoginPayload} from './auth.models';

const STORAGE_KEY = 'contact-crm.session';

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.readSession());

  readonly session$ = this.sessionSubject.asObservable();
  readonly user$: Observable<AuthUser | null> = this.session$.pipe(map((session) => session?.user ?? null));

  get token(): string | null {
    return this.sessionSubject.value?.token ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http.get<AuthUser[]>('/api/users', {params: {email: payload.email}}).pipe(
      map((users) => {
        const user = users[0];

        if (!user || payload.password.length < 6) {
          throw new Error('Неверный email или пароль');
        }

        return {
          token: `mock-token-${user.id}-${Date.now()}`,
          user,
        };
      }),
      tap((session) => this.setSession(session)),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSubject.next(null);
    void this.router.navigateByUrl('/login');
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}

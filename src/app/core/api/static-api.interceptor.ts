import {HttpErrorResponse, HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import {of, throwError} from 'rxjs';

import {AuthUser} from '../auth/auth.models';
import {Contact} from '../../shared/models/contact.model';

interface StaticDatabase {
  users: AuthUser[];
  contacts: Contact[];
}

const STORAGE_KEY = 'contact-crm.static-api';

const STATIC_DATABASE: StaticDatabase = {
  users: [
    {
      id: 'user-1',
      name: 'Данир',
      email: 'manager@example.com',
    },
  ],
  contacts: [
    {
      id: 'contact-1',
      name: 'Алина Соколова',
      company: 'Northwind Logistics',
      email: 'alina@northwind.test',
      phone: '+7 999 120-44-19',
      category: 'Клиенты',
      status: 'active',
      lastContactAt: '2026-06-12',
      nextContactAt: '2026-06-18',
      notes: [
        {
          id: 'note-1',
          createdAt: '2026-06-12',
          text: 'Интересуется автоматизацией повторных заказов.',
        },
      ],
      interactions: [
        {
          id: 'interaction-1',
          type: 'call',
          date: '2026-06-12',
          summary: 'Обсудили пилотный запуск CRM для отдела продаж.',
        },
      ],
      reminders: [
        {
          id: 'reminder-1',
          dueDate: '2026-06-18',
          text: 'Отправить КП после согласования бюджета.',
          completed: false,
        },
      ],
    },
    {
      id: 'contact-2',
      name: 'Игорь Волков',
      company: 'DataBridge',
      email: 'igor@databridge.test',
      phone: '+7 999 447-02-80',
      category: 'Партнёры',
      status: 'active',
      lastContactAt: '2026-06-09',
      nextContactAt: '2026-06-17',
      notes: [],
      interactions: [
        {
          id: 'interaction-2',
          type: 'email',
          date: '2026-06-09',
          summary: 'Получен запрос на совместный вебинар.',
        },
      ],
      reminders: [],
    },
    {
      id: 'contact-3',
      name: 'Мария Ким',
      company: 'Retail Pro',
      email: 'maria@retailpro.test',
      phone: '+7 999 771-16-33',
      category: 'Лиды',
      status: 'new',
      lastContactAt: '2026-05-28',
      nextContactAt: '2026-06-10',
      notes: [
        {
          id: 'note-2',
          createdAt: '2026-05-28',
          text: 'Вернуться к разговору после внутреннего тендера.',
        },
      ],
      interactions: [],
      reminders: [
        {
          id: 'reminder-2',
          dueDate: '2026-06-10',
          text: 'Уточнить статус тендера.',
          completed: false,
        },
      ],
    },
  ],
};

export const staticApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isStaticStand() || !request.url.startsWith('/api')) {
    return next(request);
  }

  const db = readDatabase();
  const url = request.url.replace('/api', '');
  const [, resource, id] = url.split('/');

  if (resource === 'users' && request.method === 'GET') {
    const email = request.params.get('email');
    const users = email ? db.users.filter((user) => user.email === email) : db.users;

    return of(new HttpResponse({status: 200, body: users}));
  }

  if (resource === 'contacts') {
    if (request.method === 'GET' && !id) {
      return of(new HttpResponse({status: 200, body: db.contacts}));
    }

    if (request.method === 'GET' && id) {
      const contact = db.contacts.find((item) => item.id === id);

      return contact ? of(new HttpResponse({status: 200, body: contact})) : notFound(request.url);
    }

    if (request.method === 'POST') {
      const contact = request.body as Contact;
      const nextContacts = [contact, ...db.contacts.filter((item) => item.id !== contact.id)];

      writeDatabase({...db, contacts: nextContacts});

      return of(new HttpResponse({status: 201, body: contact}));
    }

    if (request.method === 'PUT' && id) {
      const contact = request.body as Contact;
      const exists = db.contacts.some((item) => item.id === id);
      const contacts = exists
        ? db.contacts.map((item) => (item.id === id ? contact : item))
        : [contact, ...db.contacts];

      writeDatabase({...db, contacts});

      return of(new HttpResponse({status: 200, body: contact}));
    }

    if (request.method === 'DELETE' && id) {
      writeDatabase({...db, contacts: db.contacts.filter((contact) => contact.id !== id)});

      return of(new HttpResponse({status: 200, body: null}));
    }
  }

  return notFound(request.url);
};

function isStaticStand(): boolean {
  return !['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function readDatabase(): StaticDatabase {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    writeDatabase(STATIC_DATABASE);
    return clone(STATIC_DATABASE);
  }

  try {
    return JSON.parse(raw) as StaticDatabase;
  } catch {
    writeDatabase(STATIC_DATABASE);
    return clone(STATIC_DATABASE);
  }
}

function writeDatabase(database: StaticDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function notFound(url: string) {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        url,
      }),
  );
}

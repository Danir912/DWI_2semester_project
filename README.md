# Contact CRM

Учебный семестровый проект на Angular 21: менеджер контактов, взаимодействий,
заметок и напоминаний с mock API, авторизацией и Signal Store.

## Стек

- Angular 21, TypeScript, standalone components
- Taiga UI 4
- NgRx Signal Store
- json-server mock API
- Jest для unit-тестов
- Playwright для component/e2e-сценариев
- ESLint, Prettier, Stylelint

## Запуск

```bash
npm install
npm run mock
npm start
```

Приложение: http://localhost:4300  
Mock API: http://localhost:3000

Демо-вход:

- Email: `manager@example.com`
- Password: `password`

## Скрипты

```bash
npm run build
npm test
npm run test:e2e
npm run lint
npm run stylelint
```

## Архитектура

- `src/app/core` — auth service, guard, interceptor, API service.
- `src/app/shared` — общие типы и модели.
- `src/app/features/auth` — login flow.
- `src/app/features/contacts` — список контактов, карточка, редактирование, напоминания, корзина, Signal Store, фильтры и статистика.
- `mock/db.json` — mock-данные пользователей и контактов.

## Реализованные требования

- Авторизация с token storage в `localStorage`.
- Guard для защищённого маршрута `/contacts`.
- HTTP interceptor для mock API и Authorization header.
- CRUD контактов на mock API.
- Поиск, фильтрация, сортировка.
- Заметки, взаимодействия и напоминания в карточке контакта.
- Отдельный маршрут карточки контакта: `/contacts/:id`.
- Отдельный маршрут редактирования: `/contacts/:id/edit`.
- Общий центр напоминаний: `/contacts/reminders`, отметка выполнения сохраняется в `mock/db.json`.
- Корзина удалённых контактов: `/contacts/trash`, восстановление и удаление навсегда.
- Импорт и экспорт JSON.
- Вычисляемые показатели: всего контактов, активные, просроченные напоминания, follow-up progress.
- Адаптивная верстка desktop/tablet/mobile.

## Деплой

Планируемый вариант: Vercel или GitLab Pages. Публичный URL после деплоя:

`https://contact-crm.example.com`

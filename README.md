# Contact CRM

Учебный CRM-проект на Angular 21 для управления контактами, историей коммуникаций, заметками и follow-up задачами.

Приложение покрывает основной рабочий сценарий менеджера: войти в систему, найти контакт, открыть карточку, зафиксировать звонок, письмо или встречу, добавить заметку, поставить напоминание и отследить состояние отношений.

## Стенд

Публичная версия: https://danir912.github.io/DWI_2semester_project/

Демо-вход:

- Email: `manager@example.com`
- Password: любой пароль от 6 символов, например `password`

На стенде используется in-browser mock API с сохранением данных в `localStorage`. При локальной разработке приложение работает с `json-server`.

## Стек

- Angular 21, TypeScript, standalone components
- Taiga UI 4
- NgRx Signal Store
- RxJS
- json-server mock API
- Jest
- Playwright
- ESLint, Prettier, Stylelint
- GitHub Actions и GitHub Pages

## Возможности

- Авторизация с mock-token в `localStorage`.
- Защищенные маршруты через Angular guard.
- Список контактов с поиском, фильтрацией по категории/статусу и сортировкой.
- Карточка контакта с историей коммуникаций.
- Отдельная страница редактирования базовых данных контакта.
- Раздельные формы для взаимодействий, заметок и напоминаний.
- Автоматический статус контакта:
  - `new` — нет взаимодействий;
  - `active` — последнее взаимодействие было в последние 30 дней;
  - `inactive` — последнее взаимодействие больше 30 дней назад.
- Общий раздел напоминаний `/contacts/reminders`.
- Выполненные напоминания хранятся 7 дней после закрытия, затем удаляются.
- Общий раздел заметок `/contacts/notes`.
- Корзина удаленных контактов `/contacts/trash`.
- Импорт JSON с upsert-синхронизацией в mock API.
- Экспорт JSON для резервной копии.
- RU/EN локализация.
- Адаптивная верстка для desktop, tablet и mobile.

## Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить mock API:

```bash
npm run mock
```

В отдельном терминале запустить Angular:

```bash
npm start
```

Приложение будет доступно по адресу:

```text
http://127.0.0.1:4300
```

Mock API:

```text
http://127.0.0.1:3000
```

## Скрипты

```bash
npm run lint
npm run stylelint
npm test
npm run test:e2e
npm run build
```

## Архитектура

`src/app/core`  
Авторизация, guard, interceptors, API service и настройки приложения.

`src/app/shared`  
Общие модели и pipe для локализации.

`src/app/features/auth`  
Страница входа.

`src/app/features/contacts`  
Основная CRM-логика: список контактов, карточка, редактирование, заметки, напоминания, корзина и Signal Store.

`mock/db.json`  
Демо-данные для локального `json-server`.

`tools/prepare-pages.mjs`  
Подготовка production-сборки к публикации на GitHub Pages.

## Авторизация

Авторизация в виде заглушки (т.к. нет полноценного backend-а) и работает через mock API.

Пользователь ищется по email в `mock/db.json`, а пароль проверяется только по минимальной длине. После входа приложение создает mock-token и сохраняет его в `localStorage`.

Guard не пускает на защищенные маршруты без токена, а interceptor добавляет `Authorization` header к API-запросам.

Регистрации в прототипе нет. Для реального продукта (при развитии в будущем) эту часть нужно заменить backend-авторизацией с проверкой пароля, обновлением токена и разделением данных по пользователям.

## CI/CD

CI/CD настроен через GitHub Actions.

Pipeline выполняет:

- установку зависимостей;
- ESLint;
- Stylelint;
- unit-тесты;
- production build;
- подготовку GitHub Pages artifact;
- deploy на GitHub Pages.

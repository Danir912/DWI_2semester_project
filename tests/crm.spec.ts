import {expect, test} from '@playwright/test';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const dbPath = resolve('mock/db.json');

test.afterAll(async () => {
  const db = JSON.parse(await readFile(dbPath, 'utf-8')) as {
    contacts: Array<{email: string}>;
    $schema?: string;
  };

  db.contacts = db.contacts.filter(
    (contact) =>
      !['qa@example.test', 'trash@example.test', 'edit@example.test', 'reminder@example.test'].includes(
        contact.email,
      ) && contact.email !== 'import@example.test',
  );
  delete db.$schema;
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
});

test('login opens contacts workspace', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await expect(page.getByRole('heading', {name: 'Контакты'})).toBeVisible();
});

test('filters contacts by search query', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByPlaceholder('Имя, компания, email').fill('DataBridge');
  await expect(page.getByRole('link', {name: /Игорь Волков/})).toBeVisible();
  await expect(page.getByRole('link', {name: /Алина Соколова/})).toBeHidden();
});

test('creates a contact', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByRole('textbox', {name: 'Имя'}).fill('Тестовый Контакт');
  await page.getByRole('textbox', {name: 'Компания'}).fill('QA Studio');
  await page.getByRole('textbox', {name: 'Email'}).fill('qa@example.test');
  await page.getByRole('textbox', {name: 'Телефон'}).fill('+7 900 000-00-00');
  await page.getByRole('button', {name: 'Добавить'}).click();
  await page.getByRole('link', {name: /Тестовый Контакт/}).click();
  await expect(page.getByRole('heading', {name: 'Тестовый Контакт'})).toBeVisible();
});

test('moves a contact to trash and restores it', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByRole('textbox', {name: 'Имя'}).fill('Trash Candidate');
  await page.getByRole('textbox', {name: 'Компания'}).fill('Archive Lab');
  await page.getByRole('textbox', {name: 'Email'}).fill('trash@example.test');
  await page.getByRole('textbox', {name: 'Телефон'}).fill('+7 900 111-11-11');
  await page.getByRole('button', {name: 'Добавить'}).click();
  await page.getByRole('link', {name: /Trash Candidate/}).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', {name: 'Удалить'}).click();
  await expect(page.getByRole('heading', {name: 'Контакты'})).toBeVisible();
  await page.getByRole('link', {name: /Корзина/}).click();
  await expect(page.getByRole('heading', {name: 'Корзина'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Trash Candidate'})).toBeVisible();
  await page.getByRole('button', {name: 'Восстановить'}).click();
  await page.getByRole('link', {name: /Все контакты/}).click();
  await expect(page.getByRole('link', {name: /Trash Candidate/})).toBeVisible();
});

test('edits a contact on a separate page', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByRole('textbox', {name: 'Имя'}).fill('Edit Candidate');
  await page.getByRole('textbox', {name: 'Компания'}).fill('Before Co');
  await page.getByRole('textbox', {name: 'Email'}).fill('edit@example.test');
  await page.getByRole('textbox', {name: 'Телефон'}).fill('+7 900 222-22-22');
  await page.getByRole('button', {name: 'Добавить'}).click();
  await page.getByRole('link', {name: /Edit Candidate/}).click();
  await page.getByRole('link', {name: 'Изменить'}).click();
  await expect(page.getByRole('heading', {name: 'Изменить контакт'})).toBeVisible();
  await page.getByRole('textbox', {name: 'Компания'}).fill('After Co');
  await page.getByRole('button', {name: 'Сохранить'}).click();
  await expect(page.getByText(/After Co/)).toBeVisible();
});

test('marks reminder as completed', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByRole('textbox', {name: 'Имя'}).fill('Reminder Candidate');
  await page.getByRole('textbox', {name: 'Компания'}).fill('Follow Up Lab');
  await page.getByRole('textbox', {name: 'Email'}).fill('reminder@example.test');
  await page.getByRole('textbox', {name: 'Телефон'}).fill('+7 900 333-33-33');
  await page.getByRole('button', {name: 'Добавить'}).click();
  await page.getByRole('link', {name: /Reminder Candidate/}).click();
  await page.getByLabel('Напоминание').fill('Проверить выполнение');
  await page.getByRole('button', {name: 'Записать'}).click();
  await page.getByRole('link', {name: /Все контакты/}).click();
  await page.getByRole('link', {name: /Напоминания/}).click();
  await expect(page.getByRole('heading', {name: 'Напоминания'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Проверить выполнение'})).toBeVisible();
  const reminder = page.locator('.reminder-card').filter({hasText: 'Проверить выполнение'});

  await reminder.getByRole('button', {name: 'Выполнено'}).click();
  await expect(reminder.getByText('Выполнено')).toBeVisible();
});

test('persists imported contacts after reload', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();

  const importResponse = page.waitForResponse(
    (response) => response.url().includes('/contacts') && response.request().method() === 'POST',
  );

  await page.locator('input[type="file"]').setInputFiles('tests/fixtures/import-contacts.json');
  await importResponse;
  await expect(page.getByRole('link', {name: /Imported Contact/})).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', {name: /Imported Contact/})).toBeVisible();
});

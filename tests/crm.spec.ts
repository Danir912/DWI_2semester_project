import {expect, test} from '@playwright/test';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const dbPath = resolve('mock/db.json');

test.afterAll(async () => {
  const db = JSON.parse(await readFile(dbPath, 'utf-8')) as {
    contacts: Array<{email: string}>;
    $schema?: string;
  };

  db.contacts = db.contacts.filter((contact) => contact.email !== 'qa@example.test');
  delete db.$schema;
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
});

test('login opens contacts workspace', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await expect(page.getByRole('heading', {name: /Контакты, действия/})).toBeVisible();
});

test('filters contacts by search query', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByPlaceholder('Имя, компания, email').fill('DataBridge');
  await expect(page.getByRole('button', {name: /Игорь Волков/})).toBeVisible();
  await expect(page.getByRole('button', {name: /Алина Соколова/})).toBeHidden();
});

test('creates a contact', async ({page}) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Войти'}).click();
  await page.getByRole('textbox', {name: 'Имя'}).fill('Тестовый Контакт');
  await page.getByRole('textbox', {name: 'Компания'}).fill('QA Studio');
  await page.getByRole('textbox', {name: 'Email'}).fill('qa@example.test');
  await page.getByRole('textbox', {name: 'Телефон'}).fill('+7 900 000-00-00');
  await page.getByRole('button', {name: 'Добавить'}).click();
  await expect(page.getByRole('heading', {name: 'Тестовый Контакт'})).toBeVisible();
});

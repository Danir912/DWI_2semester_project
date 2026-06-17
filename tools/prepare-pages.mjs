import {copyFile, readFile, writeFile} from 'node:fs/promises';

const indexPath = 'dist/contact-crm/browser/index.html';
const fallbackPath = 'dist/contact-crm/browser/404.html';
const baseHref = '/DWI_2semester_project/';

const indexHtml = await readFile(indexPath, 'utf-8');
const withBaseHref = indexHtml.replace('<base href="/">', `<base href="${baseHref}">`);

await writeFile(indexPath, withBaseHref);
await copyFile(indexPath, fallbackPath);

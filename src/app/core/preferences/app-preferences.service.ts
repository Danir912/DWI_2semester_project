import {Injectable, effect, signal} from '@angular/core';

export type AppLanguage = 'ru' | 'en';
export type AppTheme = 'light' | 'dark';

const LANGUAGE_KEY = 'contact-crm.language';
const THEME_KEY = 'contact-crm.theme';

const DICTIONARY: Record<AppLanguage, Record<string, string>> = {
  ru: {
    appSubtitle: 'контакты и взаимодействия',
    contacts: 'Контакты',
    logout: 'Выйти',
    language: 'EN',
    themeDark: 'Тёмная',
    themeLight: 'Светлая',
    workspace: 'Контактная база',
    contactsTitle: 'Контакты',
    reminders: 'Напоминания',
    trash: 'Корзина',
    import: 'Импорт',
    export: 'Экспорт',
    searchPlaceholder: 'Имя, компания, email',
    category: 'Категория',
    allCategories: 'Все категории',
    sort: 'Сортировка',
    lastContact: 'Последний контакт',
    nextContact: 'Следующий контакт',
    name: 'Имя',
    all: 'Все',
    new: 'Новые',
    active: 'Активные',
    inactiveShort: 'Неакт.',
    totalContacts: 'контактов',
    activeContacts: 'активных',
    overdue: 'просрочено',
    withFollowUp: 'с follow-up',
    newContact: 'Новый контакт',
    company: 'Компания',
    email: 'Email',
    phone: 'Телефон',
    status: 'Статус',
    nextContactField: 'Следующий контакт',
    add: 'Добавить',
    clear: 'Очистить',
    backContacts: '← Все контакты',
    edit: 'Изменить',
    delete: 'Удалить',
    type: 'Тип',
    interactionSummary: 'Итог взаимодействия',
    note: 'Заметка',
    reminder: 'Напоминание',
    date: 'Дата',
    record: 'Записать',
    contactReminders: 'Напоминания',
    completed: 'Выполнено',
    pending: 'Ожидает',
    returnToWork: 'Вернуть в работу',
    noReminders: 'Напоминаний пока нет',
    history: 'История',
    editContact: 'Изменить контакт',
    save: 'Сохранить',
    resetOriginal: 'Вернуть исходные',
    remindersDescription: 'Все follow-up задачи по контактам. Отметка выполнения сохраняется в mock JSON.',
    pendingCount: 'Ожидает',
    trashDescription: 'Удалённые контакты хранятся 7 дней. На этой странице их можно восстановить или удалить навсегда.',
    restore: 'Восстановить',
    deleteForever: 'Удалить навсегда',
    trashEmpty: 'Корзина пуста',
  },
  en: {
    appSubtitle: 'contacts and interactions',
    contacts: 'Contacts',
    logout: 'Log out',
    language: 'RU',
    themeDark: 'Dark',
    themeLight: 'Light',
    workspace: 'Contact database',
    contactsTitle: 'Contacts',
    reminders: 'Reminders',
    trash: 'Trash',
    import: 'Import',
    export: 'Export',
    searchPlaceholder: 'Name, company, email',
    category: 'Category',
    allCategories: 'All categories',
    sort: 'Sort',
    lastContact: 'Last contact',
    nextContact: 'Next contact',
    name: 'Name',
    all: 'All',
    new: 'New',
    active: 'Active',
    inactiveShort: 'Inactive',
    totalContacts: 'contacts',
    activeContacts: 'active',
    overdue: 'overdue',
    withFollowUp: 'with follow-up',
    newContact: 'New contact',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    nextContactField: 'Next contact',
    add: 'Add',
    clear: 'Clear',
    backContacts: '← All contacts',
    edit: 'Edit',
    delete: 'Delete',
    type: 'Type',
    interactionSummary: 'Interaction summary',
    note: 'Note',
    reminder: 'Reminder',
    date: 'Date',
    record: 'Record',
    contactReminders: 'Reminders',
    completed: 'Completed',
    pending: 'Pending',
    returnToWork: 'Return to work',
    noReminders: 'No reminders yet',
    history: 'History',
    editContact: 'Edit contact',
    save: 'Save',
    resetOriginal: 'Reset original',
    remindersDescription: 'All follow-up tasks by contact. Completion is saved to mock JSON.',
    pendingCount: 'Pending',
    trashDescription: 'Deleted contacts are kept for 7 days. Restore them or delete them permanently here.',
    restore: 'Restore',
    deleteForever: 'Delete forever',
    trashEmpty: 'Trash is empty',
  },
};

@Injectable({providedIn: 'root'})
export class AppPreferencesService {
  readonly language = signal<AppLanguage>(this.readValue<AppLanguage>(LANGUAGE_KEY, 'ru'));
  readonly theme = signal<AppTheme>(this.readValue<AppTheme>(THEME_KEY, 'light'));

  constructor() {
    effect(() => {
      const language = this.language();
      const theme = this.theme();

      localStorage.setItem(LANGUAGE_KEY, language);
      localStorage.setItem(THEME_KEY, theme);
      document.documentElement.lang = language;
      document.documentElement.dataset['theme'] = theme;
    });
  }

  t(key: string): string {
    return DICTIONARY[this.language()][key] ?? key;
  }

  toggleLanguage(): void {
    this.language.update((language) => (language === 'ru' ? 'en' : 'ru'));
  }

  toggleTheme(): void {
    this.theme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
  }

  private readValue<T extends string>(key: string, fallback: T): T {
    const value = localStorage.getItem(key);

    return (value ?? fallback) as T;
  }
}

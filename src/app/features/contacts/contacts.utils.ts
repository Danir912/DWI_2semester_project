import {
  Contact,
  ContactFilters,
  ContactStatus,
  CrmStats,
  Reminder,
} from '../../shared/models/contact.model';

export const DEFAULT_FILTERS: ContactFilters = {
  search: '',
  category: 'all',
  status: 'all',
  sortBy: 'lastContactAt',
};

export function filterContacts(contacts: Contact[], filters: ContactFilters): Contact[] {
  const query = filters.search.trim().toLowerCase();

  return contacts
    .filter((contact) => {
      const matchesQuery =
        !query ||
        [contact.name, contact.company, contact.email, contact.phone, contact.category]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesCategory = filters.category === 'all' || contact.category === filters.category;
      const matchesStatus =
        filters.status === 'all' || resolveContactStatus(contact) === filters.status;

      return matchesQuery && matchesCategory && matchesStatus;
    })
    .sort((left, right) => {
      if (filters.sortBy === 'name') {
        return left.name.localeCompare(right.name, 'ru');
      }

      return dateValue(right[filters.sortBy]) - dateValue(left[filters.sortBy]);
    });
}

export function calculateStats(contacts: Contact[], today = new Date()): CrmStats {
  const todayKey = toDateKey(today);
  const overdueReminders = contacts.reduce(
    (sum, contact) =>
      sum +
      contact.reminders.filter(
        (reminder) => !reminder.completed && compareDateKeys(reminder.dueDate, todayKey) < 0,
      ).length,
    0,
  );
  const withFutureFollowUp = contacts.filter(
    (contact) => contact.nextContactAt && compareDateKeys(contact.nextContactAt, todayKey) >= 0,
  ).length;

  return {
    total: contacts.length,
    active: contacts.filter((contact) => resolveContactStatus(contact, today) === 'active').length,
    overdueReminders,
    followUpProgress: contacts.length
      ? Math.round((withFutureFollowUp / contacts.length) * 100)
      : 0,
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeContact(contact: Contact, today = new Date()): Contact {
  return {
    ...contact,
    status: resolveContactStatus(contact, today),
  };
}

export function resolveContactStatus(contact: Contact, today = new Date()): ContactStatus {
  if (!contact.interactions.length) {
    return 'new';
  }

  const lastInteractionDate = contact.interactions
    .map((interaction) => interaction.date)
    .filter(Boolean)
    .sort(compareDateKeys)
    .at(-1);

  if (!lastInteractionDate) {
    return 'new';
  }

  const inactiveThreshold = dateValue(toDateKey(today)) - 30 * 24 * 60 * 60 * 1000;

  return dateValue(lastInteractionDate) >= inactiveThreshold ? 'active' : 'inactive';
}

export function resolveNextContactAt(
  currentNextContactAt: string,
  candidateDate: string,
  today = new Date(),
): string {
  const todayKey = toDateKey(today);

  if (!candidateDate || compareDateKeys(candidateDate, todayKey) < 0) {
    return currentNextContactAt;
  }

  if (!currentNextContactAt || compareDateKeys(currentNextContactAt, todayKey) < 0) {
    return candidateDate;
  }

  return compareDateKeys(candidateDate, currentNextContactAt) < 0
    ? candidateDate
    : currentNextContactAt;
}

export function resolvePendingFollowUp(reminders: Reminder[], today = new Date()): string {
  const todayKey = toDateKey(today);

  return (
    reminders
      .filter((reminder) => !reminder.completed && compareDateKeys(reminder.dueDate, todayKey) >= 0)
      .map((reminder) => reminder.dueDate)
      .sort(compareDateKeys)[0] ?? ''
  );
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function compareDateKeys(left: string, right: string): number {
  return dateValue(left) - dateValue(right);
}

function dateValue(value: string): number {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return 0;
  }

  return Date.UTC(year, month - 1, day);
}

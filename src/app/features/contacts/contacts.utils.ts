import {Contact, ContactFilters, CrmStats} from '../../shared/models/contact.model';

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
      const matchesStatus = filters.status === 'all' || contact.status === filters.status;

      return matchesQuery && matchesCategory && matchesStatus;
    })
    .sort((left, right) => {
      if (filters.sortBy === 'name') {
        return left.name.localeCompare(right.name, 'ru');
      }

      return new Date(right[filters.sortBy]).getTime() - new Date(left[filters.sortBy]).getTime();
    });
}

export function calculateStats(contacts: Contact[], today = new Date()): CrmStats {
  const overdueReminders = contacts.reduce(
    (sum, contact) =>
      sum +
      contact.reminders.filter((reminder) => !reminder.completed && new Date(reminder.dueDate) < today)
        .length,
    0,
  );
  const withFutureFollowUp = contacts.filter(
    (contact) => contact.nextContactAt && new Date(contact.nextContactAt) >= today,
  ).length;

  return {
    total: contacts.length,
    active: contacts.filter((contact) => contact.status === 'active').length,
    overdueReminders,
    followUpProgress: contacts.length ? Math.round((withFutureFollowUp / contacts.length) * 100) : 0,
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

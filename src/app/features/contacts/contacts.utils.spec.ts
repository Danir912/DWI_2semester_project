import {Contact} from '../../shared/models/contact.model';
import {calculateStats, filterContacts} from './contacts.utils';

const contacts: Contact[] = [
  {
    id: '1',
    name: 'Алина',
    company: 'Northwind',
    email: 'a@test.dev',
    phone: '+1',
    category: 'Клиенты',
    status: 'active',
    lastContactAt: '2026-06-10',
    nextContactAt: '2026-06-20',
    notes: [],
    interactions: [],
    reminders: [],
  },
  {
    id: '2',
    name: 'Игорь',
    company: 'DataBridge',
    email: 'i@test.dev',
    phone: '+2',
    category: 'Партнёры',
    status: 'new',
    lastContactAt: '2026-06-15',
    nextContactAt: '2026-06-10',
    notes: [],
    interactions: [],
    reminders: [{id: 'r1', dueDate: '2026-06-10', text: 'Позвонить', completed: false}],
  },
];

describe('contacts utils', () => {
  it('filters by search query', () => {
    const result = filterContacts(contacts, {
      search: 'data',
      category: 'all',
      status: 'all',
      sortBy: 'name',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.company).toBe('DataBridge');
  });

  it('filters by category and status', () => {
    const result = filterContacts(contacts, {
      search: '',
      category: 'Клиенты',
      status: 'active',
      sortBy: 'name',
    });

    expect(result.map((contact) => contact.id)).toEqual(['1']);
  });

  it('sorts by last contact date', () => {
    const result = filterContacts(contacts, {
      search: '',
      category: 'all',
      status: 'all',
      sortBy: 'lastContactAt',
    });

    expect(result[0]?.id).toBe('2');
  });

  it('calculates crm stats', () => {
    const stats = calculateStats(contacts, new Date('2026-06-16'));

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.overdueReminders).toBe(1);
    expect(stats.followUpProgress).toBe(50);
  });
});

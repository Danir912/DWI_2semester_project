import {Contact} from '../../shared/models/contact.model';
import {
  calculateStats,
  filterContacts,
  normalizeContact,
  resolveContactStatus,
  resolveNextContactAt,
  resolvePendingFollowUp,
} from './contacts.utils';

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
    interactions: [{id: 'i1', type: 'call', date: '2026-06-10', summary: 'Follow-up call'}],
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

  it('resolves status from interaction history', () => {
    expect(resolveContactStatus(contacts[1]!, new Date('2026-06-16'))).toBe('new');
    expect(resolveContactStatus(contacts[0]!, new Date('2026-06-16'))).toBe('active');
    expect(
      resolveContactStatus(
        {
          ...contacts[0]!,
          interactions: [{id: 'old', type: 'email', date: '2026-04-01', summary: 'Old email'}],
        },
        new Date('2026-06-16'),
      ),
    ).toBe('inactive');
  });

  it('normalizes stored contact status', () => {
    const normalized = normalizeContact(
      {...contacts[0]!, status: 'inactive'},
      new Date('2026-06-16'),
    );

    expect(normalized.status).toBe('active');
  });

  it('adds completion date to migrated completed reminders', () => {
    const normalized = normalizeContact(
      {
        ...contacts[0]!,
        reminders: [{id: 'done', dueDate: '2026-06-18', text: 'Done', completed: true}],
      },
      new Date('2026-06-20T10:00:00.000Z'),
    );

    expect(normalized.reminders[0]?.completedAt).toBe('2026-06-20T10:00:00.000Z');
  });

  it('purges completed reminders after one week', () => {
    const normalized = normalizeContact(
      {
        ...contacts[0]!,
        nextContactAt: '2026-06-18',
        reminders: [
          {
            id: 'done',
            dueDate: '2026-06-18',
            text: 'Done',
            completed: true,
            completedAt: '2026-06-10T10:00:00.000Z',
          },
        ],
      },
      new Date('2026-06-18T10:00:00.000Z'),
    );

    expect(normalized.reminders).toEqual([]);
    expect(normalized.nextContactAt).toBe('');
  });

  it('keeps nearest future follow-up date', () => {
    expect(resolveNextContactAt('2026-07-16', '2026-06-23', new Date('2026-06-16'))).toBe(
      '2026-06-23',
    );
    expect(resolveNextContactAt('2026-06-23', '2026-07-16', new Date('2026-06-16'))).toBe(
      '2026-06-23',
    );
    expect(resolveNextContactAt('2026-06-23', '2026-06-10', new Date('2026-06-16'))).toBe(
      '2026-06-23',
    );
  });

  it('resolves pending follow-up from incomplete future reminders', () => {
    expect(
      resolvePendingFollowUp(
        [
          {id: 'past', dueDate: '2026-06-10', text: 'Past', completed: false},
          {id: 'done', dueDate: '2026-06-17', text: 'Done', completed: true},
          {id: 'future', dueDate: '2026-06-20', text: 'Future', completed: false},
        ],
        new Date('2026-06-16'),
      ),
    ).toBe('2026-06-20');
  });
});

export type ContactStatus = 'new' | 'active' | 'inactive';
export type InteractionType = 'call' | 'meeting' | 'email';

export interface Interaction {
  id: string;
  type: InteractionType;
  date: string;
  summary: string;
}

export interface Reminder {
  id: string;
  dueDate: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  createdAt: string;
  text: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  category: string;
  status: ContactStatus;
  lastContactAt: string;
  nextContactAt: string;
  notes: Note[];
  interactions: Interaction[];
  reminders: Reminder[];
}

export interface ArchivedContact {
  contact: Contact;
  deletedAt: string;
  expiresAt: string;
}

export type ContactPayload = Omit<Contact, 'id'>;

export interface ContactFilters {
  search: string;
  category: string;
  status: ContactStatus | 'all';
  sortBy: 'name' | 'lastContactAt' | 'nextContactAt';
}

export interface CrmStats {
  total: number;
  active: number;
  overdueReminders: number;
  followUpProgress: number;
}

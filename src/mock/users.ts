import type { User } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', username: 'admin', passwordHash: 'admin123', role: 'admin', displayName: 'Admin', active: true },
  { id: 'u2', username: 'cashier', passwordHash: 'cash123', role: 'cashier', displayName: 'Salman', active: true },
  { id: 'u3', username: 'ejaz', passwordHash: 'admin123', role: 'admin', displayName: 'Ejaz', active: true },
];

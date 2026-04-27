import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: storage.get<User>('currentUser'),
  login: (username, password) => {
    const users = storage.get<User[]>('users') ?? [];
    const found = users.find(u => u.username === username && u.passwordHash === password);
    if (found) {
      storage.set('currentUser', found);
      set({ user: found });
      return true;
    }
    return false;
  },
  logout: () => {
    storage.remove('currentUser');
    set({ user: null });
  },
}));

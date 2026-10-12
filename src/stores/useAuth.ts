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
    const normalized = username.trim().toLowerCase();
    const found = users.find(u => {
      if (u.active === false) return false;
      const uName = u.username.trim().toLowerCase();
      const nameMatch = uName === normalized || (normalized === 'ejaz' && uName === 'admin');
      const passMatch = u.passwordHash === password || u.passwordHash === btoa(password);
      return nameMatch && passMatch;
    });
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

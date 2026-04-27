import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Party } from '@/types';

interface PartiesState {
  parties: Party[];
  add: (p: Party) => void;
  update: (p: Party) => void;
  remove: (id: string) => void;
}

function save(parties: Party[]) { storage.set('parties', parties); }

export const useParties = create<PartiesState>((set) => ({
  parties: storage.get<Party[]>('parties') ?? [],
  add: (p) => set(s => { const updated = [...s.parties, p]; save(updated); return { parties: updated }; }),
  update: (p) => set(s => { const updated = s.parties.map(x => x.id === p.id ? p : x); save(updated); return { parties: updated }; }),
  remove: (id) => set(s => { const updated = s.parties.filter(x => x.id !== id); save(updated); return { parties: updated }; }),
}));

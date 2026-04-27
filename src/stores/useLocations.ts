import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Location } from '@/types';

interface LocationsState {
  locations: Location[];
  add: (l: Omit<Location, 'id'>) => void;
  update: (l: Location) => void;
  remove: (id: string) => void;
}

export const useLocations = create<LocationsState>((set, get) => ({
  locations: storage.get<Location[]>('locations') ?? [],
  add: (l) => {
    const next: Location = { ...l, id: `L${Date.now()}` };
    const locations = [...get().locations, next];
    storage.set('locations', locations);
    set({ locations });
  },
  update: (l) => {
    const locations = get().locations.map(x => x.id === l.id ? l : x);
    storage.set('locations', locations);
    set({ locations });
  },
  remove: (id) => {
    const locations = get().locations.filter(x => x.id !== id);
    storage.set('locations', locations);
    set({ locations });
  },
}));

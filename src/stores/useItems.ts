import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { ItemMaster, ItemSub, Item } from '@/types';

interface ItemsState {
  masters: ItemMaster[];
  subs: ItemSub[];
  items: Item[];
  addMaster: (m: ItemMaster) => void;
  updateMaster: (m: ItemMaster) => void;
  removeMaster: (id: string) => void;
  addSub: (s: ItemSub) => void;
  updateSub: (s: ItemSub) => void;
  removeSub: (id: string) => void;
  addItem: (i: Item) => void;
  updateItem: (i: Item) => void;
  removeItem: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
}

export const useItems = create<ItemsState>((set) => ({
  masters: storage.get<ItemMaster[]>('itemMasters') ?? [],
  subs: storage.get<ItemSub[]>('itemSubs') ?? [],
  items: storage.get<Item[]>('items') ?? [],
  addMaster: (m) => set(s => { const u = [...s.masters, m]; storage.set('itemMasters', u); return { masters: u }; }),
  updateMaster: (m) => set(s => { const u = s.masters.map(x => x.id === m.id ? m : x); storage.set('itemMasters', u); return { masters: u }; }),
  removeMaster: (id) => set(s => { const u = s.masters.filter(x => x.id !== id); storage.set('itemMasters', u); return { masters: u }; }),
  addSub: (sv) => set(s => { const u = [...s.subs, sv]; storage.set('itemSubs', u); return { subs: u }; }),
  updateSub: (sv) => set(s => { const u = s.subs.map(x => x.id === sv.id ? sv : x); storage.set('itemSubs', u); return { subs: u }; }),
  removeSub: (id) => set(s => { const u = s.subs.filter(x => x.id !== id); storage.set('itemSubs', u); return { subs: u }; }),
  addItem: (i) => set(s => { const u = [...s.items, i]; storage.set('items', u); return { items: u }; }),
  updateItem: (i) => set(s => { const u = s.items.map(x => x.id === i.id ? i : x); storage.set('items', u); return { items: u }; }),
  removeItem: (id) => set(s => { const u = s.items.filter(x => x.id !== id); storage.set('items', u); return { items: u }; }),
  adjustStock: (id, delta) => set(s => {
    const u = s.items.map(x => x.id === id ? { ...x, stock: x.stock + delta } : x);
    storage.set('items', u);
    return { items: u };
  }),
}));

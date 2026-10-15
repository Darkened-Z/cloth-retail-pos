import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { mockAccounts } from '@/mock/accounts';
import type { AccountMaster, AccountSub, Account } from '@/types';

interface CoaState {
  masters: AccountMaster[];
  subs: AccountSub[];
  accounts: Account[];
  addMaster: (m: AccountMaster) => void;
  updateMaster: (m: AccountMaster) => void;
  removeMaster: (id: string) => void;
  addSub: (s: AccountSub) => void;
  updateSub: (s: AccountSub) => void;
  removeSub: (id: string) => void;
  addAccount: (a: Account) => void;
  updateAccount: (a: Account) => void;
  removeAccount: (id: string) => void;
}

export const useCoa = create<CoaState>((set) => ({
  masters: storage.get<AccountMaster[]>('accountMasters') ?? [],
  subs: storage.get<AccountSub[]>('accountSubs') ?? [],
  accounts: (() => {
    if (storage.get('empty_mode')) {
      return storage.get<Account[]>('accounts') ?? [];
    }
    const saved = storage.get<Account[]>('accounts');
    if (!saved || saved.length === 0 || !saved.some(a => a.id === 'A831') || saved.find(a => a.id === 'A100')?.openingBalance !== 5340000) {
      storage.set('accounts', mockAccounts);
      return mockAccounts;
    }
    return saved;
  })(),
  addMaster: (m) => set(s => { const u = [...s.masters, m]; storage.set('accountMasters', u); return { masters: u }; }),
  updateMaster: (m) => set(s => { const u = s.masters.map(x => x.id === m.id ? m : x); storage.set('accountMasters', u); return { masters: u }; }),
  removeMaster: (id) => set(s => { const u = s.masters.filter(x => x.id !== id); storage.set('accountMasters', u); return { masters: u }; }),
  addSub: (sv) => set(s => { const u = [...s.subs, sv]; storage.set('accountSubs', u); return { subs: u }; }),
  updateSub: (sv) => set(s => { const u = s.subs.map(x => x.id === sv.id ? sv : x); storage.set('accountSubs', u); return { subs: u }; }),
  removeSub: (id) => set(s => { const u = s.subs.filter(x => x.id !== id); storage.set('accountSubs', u); return { subs: u }; }),
  addAccount: (a) => set(s => { const u = [...s.accounts, a]; storage.set('accounts', u); return { accounts: u }; }),
  updateAccount: (a) => set(s => { const u = s.accounts.map(x => x.id === a.id ? a : x); storage.set('accounts', u); return { accounts: u }; }),
  removeAccount: (id) => set(s => { const u = s.accounts.filter(x => x.id !== id); storage.set('accounts', u); return { accounts: u }; }),
}));

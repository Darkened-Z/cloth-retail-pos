import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { ExpenseVoucher } from '@/types';

interface ExpensesState { expenses: ExpenseVoucher[]; add: (e: ExpenseVoucher) => void; update: (e: ExpenseVoucher) => void; remove: (id: string) => void; }

export const useExpenses = create<ExpensesState>((set) => ({
  expenses: storage.get<ExpenseVoucher[]>('expenses') ?? [],
  add: (e) => set(s => { const u = [e, ...s.expenses]; storage.set('expenses', u); return { expenses: u }; }),
  update: (e) => set(s => { const u = s.expenses.map(x => x.id === e.id ? e : x); storage.set('expenses', u); return { expenses: u }; }),
  remove: (id) => set(s => { const u = s.expenses.filter(x => x.id !== id); storage.set('expenses', u); return { expenses: u }; }),
}));

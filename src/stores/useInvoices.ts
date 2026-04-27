import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { SalesInvoice } from '@/types';

interface InvoicesState {
  invoices: SalesInvoice[];
  add: (inv: SalesInvoice) => void;
  update: (inv: SalesInvoice) => void;
  remove: (id: string) => void;
}

export const useInvoices = create<InvoicesState>((set) => ({
  invoices: storage.get<SalesInvoice[]>('invoices') ?? [],
  add: (inv) => set(s => { const u = [inv, ...s.invoices]; storage.set('invoices', u); return { invoices: u }; }),
  update: (inv) => set(s => { const u = s.invoices.map(x => x.id === inv.id ? inv : x); storage.set('invoices', u); return { invoices: u }; }),
  remove: (id) => set(s => { const u = s.invoices.filter(x => x.id !== id); storage.set('invoices', u); return { invoices: u }; }),
}));

import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { PurchaseVoucher } from '@/types';

interface PurchaseState { vouchers: PurchaseVoucher[]; add: (v: PurchaseVoucher) => void; update: (v: PurchaseVoucher) => void; remove: (id: string) => void; }

export const usePurchase = create<PurchaseState>((set) => ({
  vouchers: storage.get<PurchaseVoucher[]>('purchaseVouchers') ?? [],
  add: (v) => set(s => { const u = [v, ...s.vouchers]; storage.set('purchaseVouchers', u); return { vouchers: u }; }),
  update: (v) => set(s => { const u = s.vouchers.map(x => x.id === v.id ? v : x); storage.set('purchaseVouchers', u); return { vouchers: u }; }),
  remove: (id) => set(s => { const u = s.vouchers.filter(x => x.id !== id); storage.set('purchaseVouchers', u); return { vouchers: u }; }),
}));

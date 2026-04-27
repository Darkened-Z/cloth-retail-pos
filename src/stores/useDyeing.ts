import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { DyeingVoucher } from '@/types';

interface DyeingState { vouchers: DyeingVoucher[]; add: (v: DyeingVoucher) => void; update: (v: DyeingVoucher) => void; remove: (id: string) => void; }

export const useDyeing = create<DyeingState>((set) => ({
  vouchers: storage.get<DyeingVoucher[]>('dyeingVouchers') ?? [],
  add: (v) => set(s => { const u = [v, ...s.vouchers]; storage.set('dyeingVouchers', u); return { vouchers: u }; }),
  update: (v) => set(s => { const u = s.vouchers.map(x => x.id === v.id ? v : x); storage.set('dyeingVouchers', u); return { vouchers: u }; }),
  remove: (id) => set(s => { const u = s.vouchers.filter(x => x.id !== id); storage.set('dyeingVouchers', u); return { vouchers: u }; }),
}));

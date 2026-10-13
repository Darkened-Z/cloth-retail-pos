import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { mockDyeingVouchers } from '@/mock/dyeing';
import type { DyeingVoucher } from '@/types';

interface DyeingState {
  vouchers: DyeingVoucher[];
  add: (v: DyeingVoucher) => void;
  update: (v: DyeingVoucher) => void;
  remove: (id: string) => void;
}

export const useDyeing = create<DyeingState>((set) => ({
  vouchers: (() => {
    const saved = storage.get<DyeingVoucher[]>('dyeingVouchers');
    if (!saved || saved.length === 0 || saved[0]?.totalValue !== 6300) {
      storage.set('dyeingVouchers', mockDyeingVouchers);
      return mockDyeingVouchers;
    }
    return saved;
  })(),
  add: (v) => set(s => { const u = [v, ...s.vouchers]; storage.set('dyeingVouchers', u); return { vouchers: u }; }),
  update: (v) => set(s => { const u = s.vouchers.map(x => x.id === v.id ? v : x); storage.set('dyeingVouchers', u); return { vouchers: u }; }),
  remove: (id) => set(s => { const u = s.vouchers.filter(x => x.id !== id); storage.set('dyeingVouchers', u); return { vouchers: u }; }),
}));

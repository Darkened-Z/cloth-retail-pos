import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Shop } from '@/types';
import { mockShop } from '@/mock/shop';

interface ShopState {
  shop: Shop;
  update: (s: Partial<Shop>) => void;
}

export const useShop = create<ShopState>((set) => ({
  shop: storage.get<Shop>('shop') ?? mockShop,
  update: (s) => set(prev => {
    const updated = { ...prev.shop, ...s };
    storage.set('shop', updated);
    return { shop: updated };
  }),
}));

import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { ReceiptVoucher, PaymentVoucher } from '@/types';

interface VouchersState {
  receipts: ReceiptVoucher[];
  payments: PaymentVoucher[];
  addReceipt: (v: Omit<ReceiptVoucher, 'id' | 'serial'>) => void;
  updateReceipt: (v: ReceiptVoucher) => void;
  removeReceipt: (id: string) => void;
  addPayment: (v: Omit<PaymentVoucher, 'id' | 'serial'>) => void;
  updatePayment: (v: PaymentVoucher) => void;
  removePayment: (id: string) => void;
}

export const useVouchers = create<VouchersState>((set, get) => ({
  receipts: storage.get<ReceiptVoucher[]>('receiptVouchers') ?? [],
  payments: storage.get<PaymentVoucher[]>('paymentVouchers') ?? [],
  addReceipt: (v) => {
    const receipts = get().receipts;
    const serial = `RV-${String(receipts.length + 1).padStart(3, '0')}`;
    const next: ReceiptVoucher = { ...v, id: `RV${Date.now()}`, serial };
    const updated = [...receipts, next];
    storage.set('receiptVouchers', updated);
    set({ receipts: updated });
  },
  updateReceipt: (v) => {
    const updated = get().receipts.map(r => r.id === v.id ? v : r);
    storage.set('receiptVouchers', updated);
    set({ receipts: updated });
  },
  removeReceipt: (id) => {
    const updated = get().receipts.filter(r => r.id !== id);
    storage.set('receiptVouchers', updated);
    set({ receipts: updated });
  },
  addPayment: (v) => {
    const payments = get().payments;
    const serial = `PYV-${String(payments.length + 1).padStart(3, '0')}`;
    const next: PaymentVoucher = { ...v, id: `PYV${Date.now()}`, serial };
    const updated = [...payments, next];
    storage.set('paymentVouchers', updated);
    set({ payments: updated });
  },
  updatePayment: (v) => {
    const updated = get().payments.map(p => p.id === v.id ? v : p);
    storage.set('paymentVouchers', updated);
    set({ payments: updated });
  },
  removePayment: (id) => {
    const updated = get().payments.filter(p => p.id !== id);
    storage.set('paymentVouchers', updated);
    set({ payments: updated });
  },
}));

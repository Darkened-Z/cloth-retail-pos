import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { ReceiptVoucher, PaymentVoucher } from '@/types';

interface VouchersState {
  receipts: ReceiptVoucher[];
  payments: PaymentVoucher[];
  addReceipt: (v: Omit<ReceiptVoucher, 'id' | 'serial'>) => void;
  addPayment: (v: Omit<PaymentVoucher, 'id' | 'serial'>) => void;
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
  addPayment: (v) => {
    const payments = get().payments;
    const serial = `PV-${String(payments.length + 1).padStart(3, '0')}`;
    const next: PaymentVoucher = { ...v, id: `PV${Date.now()}`, serial };
    const updated = [...payments, next];
    storage.set('paymentVouchers', updated);
    set({ payments: updated });
  },
}));

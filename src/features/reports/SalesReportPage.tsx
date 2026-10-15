import { useMemo } from 'react';
import { useInvoices } from '@/stores/useInvoices';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useShop } from '@/stores/useShop';
import {
  TransactionRegisterReport,
  type RegisterLineItem,
} from './TransactionRegisterReport';

export function SalesReportPage() {
  const { invoices } = useInvoices();
  const { parties } = useParties();
  const { items } = useItems();
  const { shop } = useShop();

  const lines: RegisterLineItem[] = useMemo(() => {
    const partyMap = new Map(parties.map((p) => [p.id, p]));
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const result: RegisterLineItem[] = [];

    invoices.forEach((inv) => {
      const customer = partyMap.get(inv.customerId);
      const partyName = customer?.name ?? inv.customerId;

      (inv.lines || []).forEach((line, idx) => {
        const item = itemMap.get(line.itemId);
        const itemName = item?.name ?? line.itemId;
        const lotNo = (line as unknown as { lotNo?: string }).lotNo ?? '';
        
        // Compute than: use explicitly stored than if any, or compute from item unit/gazana
        let than = (line as unknown as { than?: number }).than;
        if (typeof than !== 'number' || isNaN(than)) {
          if (line.unit === 'thaan' || item?.unit === 'thaan') {
            than = line.qty;
          } else if (item?.gazana && item.gazana > 0) {
            than = Math.round((line.qty / item.gazana) * 100) / 100;
          } else {
            than = 1;
          }
        }

        result.push({
          id: `${inv.id}-${idx}`,
          voucherSerial: inv.serial,
          voucherId: inv.id,
          date: inv.date,
          partyId: inv.customerId,
          partyName,
          itemId: line.itemId,
          itemName,
          lotNo,
          than: Number(than) || 0,
          qty: Number(line.qty) || 0,
          unit: (line.unit || item?.unit || 'MTR').toUpperCase(),
          rate: Number(line.rate) || 0,
          amount: Number(line.amount) || 0,
        });
      });
    });

    return result;
  }, [invoices, parties, items]);

  return (
    <TransactionRegisterReport
      title="Sales Report"
      mode="sales"
      lines={lines}
      parties={parties}
      items={items}
      shop={shop}
    />
  );
}

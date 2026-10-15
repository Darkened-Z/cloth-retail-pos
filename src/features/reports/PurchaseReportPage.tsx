import { useMemo } from 'react';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useShop } from '@/stores/useShop';
import {
  TransactionRegisterReport,
  type RegisterLineItem,
} from './TransactionRegisterReport';

export function PurchaseReportPage() {
  const { vouchers: purchases } = usePurchase();
  const { parties } = useParties();
  const { items } = useItems();
  const { shop } = useShop();

  const lines: RegisterLineItem[] = useMemo(() => {
    const partyMap = new Map(parties.map((p) => [p.id, p]));
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const result: RegisterLineItem[] = [];

    purchases.forEach((pv) => {
      const supplier = partyMap.get(pv.supplierId);
      const partyName = supplier?.name ?? pv.supplierId;

      (pv.lines || []).forEach((line, idx) => {
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
          id: `${pv.id}-${idx}`,
          voucherSerial: pv.serial,
          voucherId: pv.id,
          date: pv.date,
          partyId: pv.supplierId,
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
  }, [purchases, parties, items]);

  return (
    <TransactionRegisterReport
      title="Purchase Report"
      mode="purchase"
      lines={lines}
      parties={parties}
      items={items}
      shop={shop}
    />
  );
}

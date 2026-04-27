import type { ItemMaster, ItemSub, Item } from '@/types';

export const mockItemMasters: ItemMaster[] = [
  { id: 'IM1', name: 'GREY FABRICS' },
  { id: 'IM2', name: 'DYED FABRICS' },
  { id: 'IM3', name: 'SUN SHINE' },
  { id: 'IM4', name: 'DELIVERY' },
  { id: 'IM5', name: 'PACKING' },
  { id: 'IM6', name: 'RADDO' },
];

export const mockItemSubs: ItemSub[] = [
  { id: 'IS10', masterId: 'IM1', name: 'WASH N WEAR' },
  { id: 'IS11', masterId: 'IM1', name: 'BOSKI' },
  { id: 'IS12', masterId: 'IM1', name: 'COTTON' },
  { id: 'IS13', masterId: 'IM1', name: 'WINTER' },
  { id: 'IS20', masterId: 'IM2', name: 'DYED WASH N WEAR' },
  { id: 'IS21', masterId: 'IM2', name: 'DYED BOSKI' },
  { id: 'IS22', masterId: 'IM2', name: 'KHADAR' },
  { id: 'IS30', masterId: 'IM3', name: 'CUT PIECES' },
  { id: 'IS40', masterId: 'IM4', name: 'DELIVERY CHARGES' },
  { id: 'IS50', masterId: 'IM5', name: 'PACKING MATERIAL' },
  { id: 'IS60', masterId: 'IM6', name: 'RADDO FABRIC' },
];

export const mockItems: Item[] = [
  { id: 'IT001', subId: 'IS10', name: 'GREY WASH AND WEAR 50/50',  unit: 'meter', purchasePrice: 85,  salePrice: 110, gazana: 0,  stock: 450, minStock: 50 },
  { id: 'IT002', subId: 'IS10', name: 'GREY WASH AND WEAR 40/40',  unit: 'meter', purchasePrice: 75,  salePrice: 95,  gazana: 0,  stock: 300, minStock: 50 },
  { id: 'IT003', subId: 'IS11', name: 'GREY BOSKI PLAIN',          unit: 'meter', purchasePrice: 120, salePrice: 155, gazana: 0,  stock: 200, minStock: 30 },
  { id: 'IT004', subId: 'IS11', name: 'GREY BOSKI HEAVY',          unit: 'meter', purchasePrice: 140, salePrice: 175, gazana: 0,  stock: 150, minStock: 25 },
  { id: 'IT005', subId: 'IS12', name: 'GREY COTTON PLAIN',         unit: 'meter', purchasePrice: 60,  salePrice: 80,  gazana: 0,  stock: 500, minStock: 80 },
  { id: 'IT006', subId: 'IS12', name: 'GREY COTTON DOBBY',         unit: 'meter', purchasePrice: 70,  salePrice: 92,  gazana: 0,  stock: 280, minStock: 50 },
  { id: 'IT007', subId: 'IS13', name: 'GREY WINTER KHADDAR',       unit: 'meter', purchasePrice: 95,  salePrice: 125, gazana: 0,  stock: 8,   minStock: 40 },
  { id: 'IT008', subId: 'IS13', name: 'GREY WINTER LATHA',         unit: 'meter', purchasePrice: 88,  salePrice: 115, gazana: 0,  stock: 180, minStock: 30 },
  { id: 'IT009', subId: 'IS20', name: 'DYED WASH N WEAR BLACK',    unit: 'meter', purchasePrice: 130, salePrice: 165, gazana: 5,  stock: 220, minStock: 30 },
  { id: 'IT010', subId: 'IS20', name: 'DYED WASH N WEAR NAVY',     unit: 'meter', purchasePrice: 130, salePrice: 165, gazana: 5,  stock: 195, minStock: 30 },
  { id: 'IT011', subId: 'IS21', name: 'DYED BOSKI MAROON',         unit: 'meter', purchasePrice: 175, salePrice: 220, gazana: 8,  stock: 12,  minStock: 20 },
  { id: 'IT012', subId: 'IS21', name: 'DYED BOSKI BOTTLE GREEN',   unit: 'meter', purchasePrice: 175, salePrice: 220, gazana: 8,  stock: 140, minStock: 20 },
  { id: 'IT013', subId: 'IS22', name: 'KHADAR BROWN',              unit: 'meter', purchasePrice: 65,  salePrice: 85,  gazana: 3,  stock: 320, minStock: 40 },
  { id: 'IT014', subId: 'IS22', name: 'KHADAR MULTI',              unit: 'meter', purchasePrice: 70,  salePrice: 90,  gazana: 3,  stock: 180, minStock: 40 },
  { id: 'IT015', subId: 'IS30', name: 'CUT PIECES MIXED',          unit: 'thaan', purchasePrice: 200, salePrice: 350, gazana: 0,  stock: 45,  minStock: 5  },
  { id: 'IT016', subId: 'IS40', name: 'DELIVERY CHARGES',          unit: 'thaan', purchasePrice: 0,   salePrice: 150, gazana: 0,  stock: 999, minStock: 0  },
  { id: 'IT017', subId: 'IS50', name: 'POLYTHENE BAG LARGE',       unit: 'thaan', purchasePrice: 50,  salePrice: 70,  gazana: 0,  stock: 3,   minStock: 10 },
  { id: 'IT018', subId: 'IS60', name: 'RADDO MIXED',               unit: 'thaan', purchasePrice: 80,  salePrice: 120, gazana: 0,  stock: 60,  minStock: 10 },
];

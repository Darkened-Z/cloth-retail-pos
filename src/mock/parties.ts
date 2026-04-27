import type { Party } from '@/types';

export const mockParties: Party[] = [
  // Customers
  { id: 'P001', type: 'customer', name: 'Muhammad Arshad',       phone: '0300-1112233', address: 'Ghanta Ghar, Faisalabad',   openingBalance: 85000,  currentBalance: 180000, creditDays: 30 },
  { id: 'P002', type: 'customer', name: 'Haji Bashir Ahmed',     phone: '0301-2223344', address: 'D Ground, Faisalabad',       openingBalance: 120000, currentBalance: 250000, creditDays: 45 },
  { id: 'P003', type: 'customer', name: 'Tariq Cloth House',     phone: '0302-3334455', address: 'Katchery Bazaar, Faisalabad',openingBalance: 200000, currentBalance: 420000, creditDays: 30 },
  { id: 'P004', type: 'customer', name: 'Riaz Fabrics',          phone: '0303-4445566', address: 'Lylpur Market, Faisalabad',  openingBalance: 50000,  currentBalance: 95000,  creditDays: 15 },
  { id: 'P005', type: 'customer', name: 'Khalid Traders',        phone: '0304-5556677', address: 'Clock Tower, Faisalabad',    openingBalance: 75000,  currentBalance: 165000, creditDays: 30 },
  { id: 'P006', type: 'customer', name: 'Sajid Cloth Center',    phone: '0305-6667788', address: 'Canal Road, Faisalabad',     openingBalance: 30000,  currentBalance: 85000,  creditDays: 30 },
  { id: 'P007', type: 'customer', name: 'Imran General Store',   phone: '0306-7778899', address: 'Millat Road, Faisalabad',    openingBalance: 60000,  currentBalance: 130000, creditDays: 45 },
  { id: 'P008', type: 'customer', name: 'Shahzad Fabrics',       phone: '0307-8889900', address: 'Satiana Road, Faisalabad',   openingBalance: 90000,  currentBalance: 210000, creditDays: 30 },
  { id: 'P009', type: 'customer', name: 'Ali Brothers',          phone: '0308-9990011', address: 'Gulberg, Faisalabad',        openingBalance: 40000,  currentBalance: 70000,  creditDays: 15 },
  { id: 'P010', type: 'customer', name: 'Usman Cloth Mart',      phone: '0309-0001122', address: 'Susan Road, Faisalabad',     openingBalance: 110000, currentBalance: 240000, creditDays: 60 },
  { id: 'P011', type: 'customer', name: 'Farooq Traders',        phone: '0310-1112233', address: 'Jhang Road, Faisalabad',     openingBalance: 25000,  currentBalance: 55000,  creditDays: 30 },
  { id: 'P012', type: 'customer', name: 'Hassan Fabrics',        phone: '0311-2223344', address: 'Sargodha Road, Faisalabad',  openingBalance: 80000,  currentBalance: 175000, creditDays: 30 },
  { id: 'P013', type: 'customer', name: 'Bilal Cloth House',     phone: '0312-3334455', address: 'Chiniot Road, Faisalabad',   openingBalance: 45000,  currentBalance: 95000,  creditDays: 45 },
  { id: 'P014', type: 'customer', name: 'Naeem Brothers',        phone: '0313-4445566', address: 'Jaranwala Road, Faisalabad', openingBalance: 55000,  currentBalance: 115000, creditDays: 30 },
  { id: 'P015', type: 'customer', name: 'Aamir Textile',         phone: '0314-5556677', address: 'Sammundri Road, Faisalabad', openingBalance: 70000,  currentBalance: 145000, creditDays: 30 },
  // Suppliers
  { id: 'P101', type: 'supplier', name: 'MASTER WEAVING MILLS',  phone: '0321-1112233', address: 'Nishatabad, Faisalabad',     openingBalance: 50000,  currentBalance: 50000,  creditDays: 30 },
  { id: 'P102', type: 'supplier', name: 'AL-REHMAN TEXTILES',    phone: '0322-2223344', address: 'Sheikhupura Road, Lahore',   openingBalance: 30000,  currentBalance: 30000,  creditDays: 45 },
  { id: 'P103', type: 'supplier', name: 'CHAUDHRY MILLS',        phone: '0323-3334455', address: 'Industrial Estate, FSD',     openingBalance: 80000,  currentBalance: 80000,  creditDays: 30 },
  // Dyers
  { id: 'P201', type: 'dyer', name: 'NAZAKAT DYEING',            phone: '0331-1112233', address: 'Millat Road, Faisalabad',   openingBalance: 0,      currentBalance: 25000,  creditDays: 15 },
  { id: 'P202', type: 'dyer', name: 'RS DYEING',                 phone: '0332-2223344', address: 'Canal Road, Faisalabad',    openingBalance: 0,      currentBalance: 18000,  creditDays: 15 },
  { id: 'P203', type: 'dyer', name: 'HQ DYEING',                 phone: '0333-3334455', address: 'Ghulam Muhammad Abad, FSD', openingBalance: 0,      currentBalance: 32000,  creditDays: 15 },
  { id: 'P204', type: 'dyer', name: 'FAZAL-E-RABBI DYEING',      phone: '0334-4445566', address: 'Satiana Road, Faisalabad',  openingBalance: 0,      currentBalance: 15000,  creditDays: 15 },
];

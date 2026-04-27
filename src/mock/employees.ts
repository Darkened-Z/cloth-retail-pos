import type { Employee } from '@/types';

export const mockEmployees: Employee[] = [
  { id: 'E001', name: 'Salman Raza',    cnic: '33100-1234567-1', phone: '0300-1111111', address: 'Peoples Colony, Faisalabad', role: 'Cashier',   joiningDate: '2022-01-15', salaryType: 'monthly', salaryAmount: 45000, deductForAbsence: true,  active: true },
  { id: 'E002', name: 'Umar Farooq',   cnic: '33100-2345678-2', phone: '0301-2222222', address: 'Gulberg, Faisalabad',        role: 'Salesman',  joiningDate: '2021-06-01', salaryType: 'monthly', salaryAmount: 40000, deductForAbsence: true,  active: true },
  { id: 'E003', name: 'Asif Mehmood',  cnic: '33100-3456789-3', phone: '0302-3333333', address: 'Madina Town, Faisalabad',    role: 'Salesman',  joiningDate: '2023-03-10', salaryType: 'monthly', salaryAmount: 38000, deductForAbsence: true,  active: true },
  { id: 'E004', name: 'Shahid Ali',    cnic: '33100-4567890-4', phone: '0303-4444444', address: 'Canal Road, Faisalabad',     role: 'Helper',    joiningDate: '2020-09-01', salaryType: 'monthly', salaryAmount: 28000, deductForAbsence: true,  active: true },
  { id: 'E005', name: 'Zubair Hussain',cnic: '33100-5678901-5', phone: '0304-5555555', address: 'Satiana Road, Faisalabad',   role: 'Helper',    joiningDate: '2022-11-20', salaryType: 'monthly', salaryAmount: 28000, deductForAbsence: true,  active: true },
  { id: 'E006', name: 'Naveed Iqbal',  cnic: '33100-6789012-6', phone: '0305-6666666', address: 'Susan Road, Faisalabad',     role: 'Accountant',joiningDate: '2019-04-15', salaryType: 'monthly', salaryAmount: 60000, deductForAbsence: false, active: true },
  { id: 'E007', name: 'Kamran Shah',   cnic: '33100-7890123-7', phone: '0306-7777777', address: 'Jhang Road, Faisalabad',     role: 'Loader',    joiningDate: '2023-08-01', salaryType: 'daily',   salaryAmount: 1200,  deductForAbsence: true,  active: true },
  { id: 'E008', name: 'Rizwan Ahmad',  cnic: '33100-8901234-8', phone: '0307-8888888', address: 'Chiniot Road, Faisalabad',   role: 'Cleaner',   joiningDate: '2021-02-14', salaryType: 'daily',   salaryAmount: 900,   deductForAbsence: true,  active: true },
];

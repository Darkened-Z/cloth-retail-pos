import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Employee, AttendanceRecord, Advance, PayrollRun } from '@/types';

interface EmployeesState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  advances: Advance[];
  payrollRuns: PayrollRun[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (e: Employee) => void;
  removeEmployee: (id: string) => void;
  markAttendance: (r: AttendanceRecord) => void;
  addAdvance: (a: Advance) => void;
  removeAdvance: (id: string) => void;
  savePayrollRun: (r: PayrollRun) => void;
}

export const useEmployees = create<EmployeesState>((set) => ({
  employees: storage.get<Employee[]>('employees') ?? [],
  attendance: storage.get<AttendanceRecord[]>('attendance') ?? [],
  advances: storage.get<Advance[]>('advances') ?? [],
  payrollRuns: storage.get<PayrollRun[]>('payrollRuns') ?? [],

  addEmployee: (e) => set(s => { const u = [...s.employees, e]; storage.set('employees', u); return { employees: u }; }),
  updateEmployee: (e) => set(s => { const u = s.employees.map(x => x.id === e.id ? e : x); storage.set('employees', u); return { employees: u }; }),
  removeEmployee: (id) => set(s => { const u = s.employees.filter(x => x.id !== id); storage.set('employees', u); return { employees: u }; }),

  markAttendance: (r) => set(s => {
    const existing = s.attendance.filter(x => !(x.date === r.date && x.employeeId === r.employeeId));
    const u = [...existing, r];
    storage.set('attendance', u);
    return { attendance: u };
  }),

  addAdvance: (a) => set(s => { const u = [...s.advances, a]; storage.set('advances', u); return { advances: u }; }),
  removeAdvance: (id) => set(s => { const u = s.advances.filter(x => x.id !== id); storage.set('advances', u); return { advances: u }; }),

  savePayrollRun: (r) => set(s => {
    const existing = s.payrollRuns.filter(x => !(x.month === r.month && x.employeeId === r.employeeId));
    const u = [...existing, r];
    storage.set('payrollRuns', u);
    return { payrollRuns: u };
  }),
}));

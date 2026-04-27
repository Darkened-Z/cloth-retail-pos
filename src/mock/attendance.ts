import type { AttendanceRecord } from '@/types';
import { mockEmployees } from './employees';

export function generateAttendance(days = 90): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  for (let d = days; d >= 1; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);
    const dow = date.getDay();
    if (dow === 0) continue; // skip Sundays
    for (const emp of mockEmployees) {
      if (!emp.active) continue;
      const r = Math.random();
      let status: AttendanceRecord['status'];
      if (r < 0.03) status = 'A';
      else if (r < 0.05) status = 'H';
      else if (r < 0.06) status = 'L';
      else status = 'P';
      records.push({ date: dateStr, employeeId: emp.id, status });
    }
  }
  return records;
}

export const mockAttendance = generateAttendance(90);

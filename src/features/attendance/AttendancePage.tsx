import { useState } from 'react';
import { useEmployees } from '@/stores/useEmployees';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type Status = 'P' | 'A' | 'H' | 'L';
const STATUS_COLORS: Record<Status, string> = { P: 'bg-success text-white', A: 'bg-danger text-white', H: 'bg-accent text-black', L: 'bg-gray-400 text-white' };

export function AttendancePage() {
  const { employees, attendance, markAttendance } = useEmployees();
  const [date, setDate] = useState(todayISO());
  const active = employees.filter(e => e.active);

  function getStatus(empId: string): Status | null {
    const rec = attendance.find(a => a.employeeId === empId && a.date === date);
    return rec ? rec.status as Status : null;
  }

  function cycle(empId: string) {
    const cur = getStatus(empId);
    const order: Status[] = ['P', 'A', 'H', 'L'];
    const next = cur ? order[(order.indexOf(cur) + 1) % 4] : 'P';
    markAttendance({ date, employeeId: empId, status: next });
  }

  function markAllPresent() {
    const unmarked = active.filter(emp => !getStatus(emp.id));
    const targets = unmarked.length > 0 ? unmarked : active;
    targets.forEach(emp => markAttendance({ date, employeeId: emp.id, status: 'P' }));
  }

  useKeyboardShortcuts({
    f9: () => markAllPresent(),
  });

  const summary = { P: 0, A: 0, H: 0, L: 0 };
  active.forEach(e => { const s = getStatus(e.id); if (s) summary[s]++; });

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">ATTENDANCE</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={markAllPresent}
            className="flex-1 sm:flex-none border-2 border-black bg-accent px-4 py-2 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white"
          >
            MARK ALL PRESENT (F9)
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 sm:flex-none border-2 border-black bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {(Object.entries(summary) as [Status, number][]).map(([s, c]) => (
          <div key={s} className={`border-2 border-black p-3 text-center ${STATUS_COLORS[s]} shadow-brutal`}>
            <div className="font-display text-2xl">{c}</div>
            <div className="text-xs font-mono font-bold whitespace-nowrap">{s === 'P' ? 'PRESENT' : s === 'A' ? 'ABSENT' : s === 'H' ? 'HALF-DAY' : 'LEAVE'}</div>
          </div>
        ))}
      </div>

      <div className="text-xs font-mono text-gray-500 mb-3">Click a name to toggle status: P → A → H → L → P</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {active.map(emp => {
          const s = getStatus(emp.id);
          return (
            <button key={emp.id} onClick={() => cycle(emp.id)}
              className={`border-2 border-black p-3 text-left brutal-press shadow-brutal hover:opacity-90 transition-colors ${s ? STATUS_COLORS[s] : 'bg-white hover:bg-muted'}`}>
              <div className="font-sans font-bold text-sm leading-tight">{emp.name}</div>
              <div className="text-xs font-mono mt-1 opacity-80">{emp.role}</div>
              <div className="font-display text-xl mt-1">{s ?? '—'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Printer, Download, Filter, Search, Calendar, ChevronRight } from 'lucide-react';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { Party, Item, Shop } from '@/types';

export type ReportViewMode = 'datewise' | 'partywise' | 'itemwise';

export interface RegisterLineItem {
  id: string;
  voucherSerial: string;
  voucherId: string;
  date: string; // YYYY-MM-DD
  partyId: string;
  partyName: string;
  itemId: string;
  itemName: string;
  lotNo?: string;
  than: number;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Props {
  title: string; // e.g. "Sales Report" or "Purchase Report"
  mode: 'sales' | 'purchase';
  lines: RegisterLineItem[];
  parties: Party[];
  items: Item[];
  shop: Shop;
}

function formatDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
}

function formatDec2(val: number): string {
  return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TransactionRegisterReport({ title, mode, lines, parties, items, shop }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const [viewMode, setViewMode] = useState<ReportViewMode>('datewise');
  const [partyFilter, setPartyFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const printDate = formatDDMMYYYY(today);

  // Quick preset ranges
  function setPreset(days: number | 'all' | 'month') {
    const now = new Date();
    if (days === 'all') {
      setFrom('2020-01-01');
      setTo(today);
    } else if (days === 'month') {
      const monthStart = today.slice(0, 8) + '01';
      setFrom(monthStart);
      setTo(today);
    } else {
      const d = new Date();
      d.setDate(now.getDate() - days);
      setFrom(d.toISOString().slice(0, 10));
      setTo(today);
    }
  }

  // Filter lines by date, party, item, and search
  const filteredLines = useMemo(() => {
    return lines.filter(l => {
      if (l.date < from || l.date > to) return false;
      if (partyFilter && l.partyId !== partyFilter) return false;
      if (itemFilter && l.itemId !== itemFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchSerial = l.voucherSerial.toLowerCase().includes(q);
        const matchItem = l.itemName.toLowerCase().includes(q);
        const matchParty = l.partyName.toLowerCase().includes(q);
        const matchLot = (l.lotNo || '').toLowerCase().includes(q);
        if (!matchSerial && !matchItem && !matchParty && !matchLot) return false;
      }
      return true;
    });
  }, [lines, from, to, partyFilter, itemFilter, searchTerm]);

  // Overall Grand Totals
  const grandTotalThan = useMemo(() => filteredLines.reduce((s, l) => s + (l.than || 0), 0), [filteredLines]);
  const grandTotalQty = useMemo(() => filteredLines.reduce((s, l) => s + (l.qty || 0), 0), [filteredLines]);
  const grandTotalAmount = useMemo(() => filteredLines.reduce((s, l) => s + (l.amount || 0), 0), [filteredLines]);

  // Distinct common unit for grand total if single unit, otherwise empty
  const grandTotalUnit = useMemo(() => {
    if (filteredLines.length === 0) return '';
    const first = filteredLines[0].unit;
    return filteredLines.every(l => l.unit === first) ? first : '';
  }, [filteredLines]);

  // Grouped by Party
  const partyGroups = useMemo(() => {
    const map = new Map<string, { partyName: string; lines: RegisterLineItem[]; subtotalThan: number; subtotalQty: number; subtotalAmount: number; unit: string }>();
    filteredLines.forEach(l => {
      const key = l.partyId;
      if (!map.has(key)) {
        map.set(key, { partyName: l.partyName, lines: [], subtotalThan: 0, subtotalQty: 0, subtotalAmount: 0, unit: l.unit });
      }
      const g = map.get(key)!;
      g.lines.push(l);
      g.subtotalThan += l.than || 0;
      g.subtotalQty += l.qty || 0;
      g.subtotalAmount += l.amount || 0;
      if (g.unit !== l.unit) g.unit = '';
    });
    return Array.from(map.values()).sort((a, b) => a.partyName.localeCompare(b.partyName));
  }, [filteredLines]);

  // Grouped by Item
  const itemGroups = useMemo(() => {
    const map = new Map<string, { itemName: string; lines: RegisterLineItem[]; subtotalThan: number; subtotalQty: number; subtotalAmount: number; unit: string }>();
    filteredLines.forEach(l => {
      const key = l.itemId;
      if (!map.has(key)) {
        map.set(key, { itemName: l.itemName, lines: [], subtotalThan: 0, subtotalQty: 0, subtotalAmount: 0, unit: l.unit });
      }
      const g = map.get(key)!;
      g.lines.push(l);
      g.subtotalThan += l.than || 0;
      g.subtotalQty += l.qty || 0;
      g.subtotalAmount += l.amount || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [filteredLines]);

  // Export to CSV
  function exportCSV() {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (viewMode === 'datewise') {
      headers = ['V. No', 'Date', 'ItemName', 'Lot No', 'Than', 'Qty', 'Unit', 'Rate', 'Amount', 'Party Name'];
      rows = filteredLines.map(l => [
        `"${l.voucherSerial}"`,
        `"${formatDDMMYYYY(l.date)}"`,
        `"${l.itemName}"`,
        `"${l.lotNo || ''}"`,
        formatDec2(l.than),
        formatDec2(l.qty),
        `"${l.unit}"`,
        formatDec2(l.rate),
        formatDec2(l.amount),
        `"${l.partyName}"`,
      ]);
    } else if (viewMode === 'partywise') {
      headers = ['Party Name', 'V. No', 'Date', 'ItemName', 'Than', 'Qty', 'Unit', 'Rate', 'Amount'];
      partyGroups.forEach(g => {
        g.lines.forEach(l => {
          rows.push([
            `"${g.partyName}"`,
            `"${l.voucherSerial}"`,
            `"${formatDDMMYYYY(l.date)}"`,
            `"${l.itemName}"`,
            formatDec2(l.than),
            formatDec2(l.qty),
            `"${l.unit}"`,
            formatDec2(l.rate),
            formatDec2(l.amount),
          ]);
        });
        rows.push([`"${g.partyName} Subtotal"`, '', '', '', formatDec2(g.subtotalThan), formatDec2(g.subtotalQty), `"${g.unit}"`, '', formatDec2(g.subtotalAmount)]);
      });
    } else {
      headers = ['Item Name', 'V. No', 'Date', 'Party Name', 'Lot No', 'Than', 'Qty', 'Unit', 'Rate', 'Amount'];
      itemGroups.forEach(g => {
        g.lines.forEach(l => {
          rows.push([
            `"${g.itemName}"`,
            `"${l.voucherSerial}"`,
            `"${formatDDMMYYYY(l.date)}"`,
            `"${l.partyName}"`,
            `"${l.lotNo || ''}"`,
            formatDec2(l.than),
            formatDec2(l.qty),
            `"${l.unit}"`,
            formatDec2(l.rate),
            formatDec2(l.amount),
          ]);
        });
        rows.push([`"${g.itemName} Subtotal"`, '', '', '', '', formatDec2(g.subtotalThan), formatDec2(g.subtotalQty), `"${g.unit}"`, '', formatDec2(g.subtotalAmount)]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${viewMode}_${from}_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const activeTitle = `${title} ${viewMode === 'datewise' ? 'Datewise' : viewMode === 'partywise' ? 'Partywise' : 'Itemwise'}`;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Interactive Control Header (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        {/* Top Title & View Mode Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-gray-500">
                {mode === 'sales' ? 'SELLING' : 'BUYING'} &bull; REGISTER
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-mono font-bold uppercase text-primary">
                {viewMode}
              </span>
            </div>
            <h1 className="font-display text-2xl uppercase tracking-tight text-slate-900 mt-0.5">
              {activeTitle}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT (Ctrl+P)</span>
            </button>
            <button
              onClick={exportCSV}
              type="button"
              className="border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs Strip */}
        <div className="flex border-2 border-black w-full sm:w-fit bg-white shadow-brutal-sm overflow-x-auto">
          {([
            ['datewise', `${title} Datewise`],
            ['partywise', `${title} Partywise`],
            ['itemwise', `${title} Itemwise`],
          ] as [ReportViewMode, string][]).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold uppercase border-r-2 border-black last:border-0 whitespace-nowrap transition-colors ${
                viewMode === v ? 'bg-black text-white' : 'bg-white hover:bg-accent text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter Controls Toolbar */}
        <div className="border-2 border-black bg-white p-3 sm:p-4 shadow-brutal-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date Range From/To */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Filter by Party */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
                Filter by {mode === 'sales' ? 'Customer' : 'Supplier'}
              </label>
              <select
                value={partyFilter}
                onChange={e => setPartyFilter(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- All {mode === 'sales' ? 'Customers' : 'Suppliers'} --</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Item */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-gray-600 mb-1">
                Filter by Item
              </label>
              <select
                value={itemFilter}
                onChange={e => setItemFilter(e.target.value)}
                className="w-full border-2 border-black px-3 py-1.5 text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- All Fabric Items --</option>
                {items.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Presets & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase text-gray-500 mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => setPreset(0)}
                className="px-2.5 py-1 text-[11px] font-mono font-bold border border-black bg-gray-50 hover:bg-accent"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="px-2.5 py-1 text-[11px] font-mono font-bold border border-black bg-gray-50 hover:bg-accent"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setPreset('month')}
                className="px-2.5 py-1 text-[11px] font-mono font-bold border border-black bg-gray-50 hover:bg-accent"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="px-2.5 py-1 text-[11px] font-mono font-bold border border-black bg-gray-50 hover:bg-accent"
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setPreset('all')}
                className="px-2.5 py-1 text-[11px] font-mono font-bold border border-black bg-gray-50 hover:bg-accent"
              >
                All Time
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search serial, item, party..."
                className="w-full pl-8 pr-3 py-1 text-xs border border-black bg-white focus:outline-none focus:ring-1 focus:ring-accent font-sans"
              />
            </div>
          </div>
        </div>

        {/* Top KPI Quick Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border-2 border-black bg-white p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-500">Total Lines</span>
            <div className="text-xl font-display font-mono font-bold mt-0.5">{filteredLines.length} entries</div>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-500">Total Quantity</span>
            <div className="text-xl font-display font-mono font-bold text-blue-700 mt-0.5">
              {formatDec2(grandTotalQty)} {grandTotalUnit}
            </div>
          </div>
          <div className="border-2 border-black bg-white p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-500">Total Amount</span>
            <div className="text-xl font-display font-mono font-bold text-emerald-700 mt-0.5">
              PKR {formatDec2(grandTotalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT & DOCUMENT CANVAS: Formatted exactly to match user's screenshot
          ========================================================================= */}
      <div className="bg-white border-2 border-black p-4 sm:p-8 shadow-brutal print:border-none print:p-0 print:shadow-none min-h-[600px]">
        {/* Document Header matching screenshot */}
        <div className="relative pb-3 mb-3">
          {/* Top Left Shop Meta */}
          <div className="text-left font-sans text-xs">
            <div className="font-black text-sm italic tracking-tight text-slate-900 uppercase">
              {shop.name || 'HAFIZ FABRICS'}
            </div>
            <div className="text-slate-700 uppercase mt-0.5 font-medium">
              {shop.address || 'P-169 GULBERG FAISALABAD'}
            </div>
            <div className="text-slate-700 font-mono mt-0.5">
              {shop.phone || '03217829442'}
            </div>
          </div>

          {/* Top Right Print Date */}
          <div className="absolute top-0 right-0 text-right font-sans text-xs text-slate-800">
            <span>Print Date: {printDate}</span>
          </div>

          {/* Centered Maroon / Dark Red Report Heading */}
          <div className="text-center mt-2">
            <h2 className="text-base sm:text-lg font-bold text-[#8B0000] tracking-normal font-sans">
              {activeTitle}
            </h2>
            <p className="text-xs text-slate-800 mt-0.5 font-medium font-sans">
              From {formatDDMMYYYY(from)} To {formatDDMMYYYY(to)}
            </p>
          </div>
        </div>

        {/* Crisp black rule separator matching screenshot */}
        <hr className="border-t-2 border-black mb-1" />

        {/* -------------------------------------------------------------
            VIEW 1: DATEWISE REPORT (Screenshot 1)
            Columns: V. No | Date | ItemName | Lot No | Than | Qty | Unit | Rate | Amount | Party Name
           ------------------------------------------------------------- */}
        {viewMode === 'datewise' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-black text-slate-900 font-bold">
                  <th className="py-2 text-left font-bold w-24">V. No</th>
                  <th className="py-2 text-left font-bold w-24">Date</th>
                  <th className="py-2 text-left font-bold">ItemName</th>
                  <th className="py-2 text-center font-bold w-20">Lot No</th>
                  <th className="py-2 text-right font-bold w-16">Than</th>
                  <th className="py-2 text-right font-bold w-20">Qty</th>
                  <th className="py-2 text-left font-bold w-16 pl-2">Unit</th>
                  <th className="py-2 text-right font-bold w-24">Rate</th>
                  <th className="py-2 text-right font-bold w-28">Amount</th>
                  <th className="py-2 text-left font-bold pl-4">Party Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLines.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-1.5 font-mono text-slate-800">{l.voucherSerial}</td>
                    <td className="py-1.5 font-mono text-slate-800">{formatDDMMYYYY(l.date)}</td>
                    <td className="py-1.5 text-slate-900 font-medium">{l.itemName}</td>
                    <td className="py-1.5 text-center text-slate-500 font-mono">{l.lotNo || '—'}</td>
                    <td className="py-1.5 text-right font-mono text-slate-800">{formatDec2(l.than)}</td>
                    <td className="py-1.5 text-right font-mono text-slate-900 font-medium">{formatDec2(l.qty)}</td>
                    <td className="py-1.5 text-left text-slate-700 pl-2">{l.unit}</td>
                    <td className="py-1.5 text-right font-mono text-slate-900">{formatDec2(l.rate)}</td>
                    <td className="py-1.5 text-right font-mono font-semibold text-slate-900">{formatDec2(l.amount)}</td>
                    <td className="py-1.5 text-left text-slate-900 uppercase font-medium pl-4">{l.partyName}</td>
                  </tr>
                ))}
                {filteredLines.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-mono">
                      No records found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Bottom Grand Total Row */}
              {filteredLines.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-black font-bold text-blue-700">
                    <td colSpan={4} className="py-2 text-left font-bold text-xs uppercase text-blue-800">
                      Grand Total
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalThan)}</td>
                    <td className="py-2 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalQty)}</td>
                    <td className="py-2 text-left text-blue-800 pl-2">{grandTotalUnit}</td>
                    <td className="py-2"></td>
                    <td className="py-2 text-right font-mono font-bold text-blue-800 text-sm">
                      {formatDec2(grandTotalAmount)}
                    </td>
                    <td className="py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 2: PARTYWISE REPORT (Screenshot 2)
            Grouped by Party Name (Blue Underlined)
            Columns: V. No | Date | ItemName | Than | Qty | Unit | Rate | Amount
            Subtotal per party, Grand Total at bottom
           ------------------------------------------------------------- */}
        {viewMode === 'partywise' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-black text-slate-900 font-bold">
                  <th className="py-2 text-left font-bold w-24">V. No</th>
                  <th className="py-2 text-left font-bold w-24">Date</th>
                  <th className="py-2 text-left font-bold">ItemName</th>
                  <th className="py-2 text-right font-bold w-20">Than</th>
                  <th className="py-2 text-right font-bold w-20">Qty</th>
                  <th className="py-2 text-left font-bold w-20 pl-2">Unit</th>
                  <th className="py-2 text-right font-bold w-28">Rate</th>
                  <th className="py-2 text-right font-bold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {partyGroups.map(group => (
                  <tr key={group.partyName} className="border-none">
                    <td colSpan={8} className="p-0">
                      {/* Party Group Header: Blue Underlined text matching screenshot 2 */}
                      <div className="pt-3 pb-1 text-left">
                        <span className="text-blue-800 font-bold underline uppercase tracking-wide cursor-default">
                          {group.partyName}
                        </span>
                      </div>

                      <table className="w-full text-xs font-sans border-collapse">
                        <tbody>
                          {group.lines.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/70">
                              <td className="py-1 text-left w-24 font-mono text-slate-800">{l.voucherSerial}</td>
                              <td className="py-1 text-left w-24 font-mono text-slate-800">{formatDDMMYYYY(l.date)}</td>
                              <td className="py-1 text-left text-slate-900 font-medium">{l.itemName}</td>
                              <td className="py-1 text-right w-20 font-mono text-slate-800">{formatDec2(l.than)}</td>
                              <td className="py-1 text-right w-20 font-mono text-slate-900 font-medium">{formatDec2(l.qty)}</td>
                              <td className="py-1 text-left w-20 text-slate-700 pl-2">{l.unit}</td>
                              <td className="py-1 text-right w-28 font-mono text-slate-900">{formatDec2(l.rate)}</td>
                              <td className="py-1 text-right w-28 font-mono font-semibold text-slate-900">{formatDec2(l.amount)}</td>
                            </tr>
                          ))}

                          {/* Party Subtotal matching screenshot 2 */}
                          <tr className="text-blue-800 font-bold pt-1 pb-2">
                            <td colSpan={3} className="py-1 text-left font-bold text-blue-800">
                              Subtotal
                            </td>
                            <td className="py-1 text-right font-mono text-blue-800">{formatDec2(group.subtotalThan)}</td>
                            <td className="py-1 text-right font-mono text-blue-800">{formatDec2(group.subtotalQty)}</td>
                            <td className="py-1 text-left text-blue-800 pl-2">{group.unit}</td>
                            <td className="py-1"></td>
                            <td className="py-1 text-right font-mono font-bold text-blue-800">
                              {formatDec2(group.subtotalAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}

                {partyGroups.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-mono">
                      No records found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Bottom Grand Total matching screenshot 2 */}
              {partyGroups.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-black font-bold text-blue-800">
                    <td colSpan={3} className="py-2.5 text-left font-bold text-sm text-blue-800">
                      Grand Total
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalThan)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalQty)}</td>
                    <td className="py-2.5 text-left text-blue-800 pl-2">{grandTotalUnit}</td>
                    <td className="py-2.5"></td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800 text-sm">
                      {formatDec2(grandTotalAmount)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 3: ITEMWISE REPORT (Screenshot 3)
            Grouped by Item Name (Blue Underlined)
            Columns: V. No | Date | Party Name | Lot No | Than | Qty | Unit | Rate | Amount
            Subtotal per item, Grand Total at bottom
           ------------------------------------------------------------- */}
        {viewMode === 'itemwise' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-black text-slate-900 font-bold">
                  <th className="py-2 text-left font-bold w-24">V. No</th>
                  <th className="py-2 text-left font-bold w-24">Date</th>
                  <th className="py-2 text-left font-bold">Party Name</th>
                  <th className="py-2 text-center font-bold w-20">Lot No</th>
                  <th className="py-2 text-right font-bold w-16">Than</th>
                  <th className="py-2 text-right font-bold w-20">Qty</th>
                  <th className="py-2 text-left font-bold w-20 pl-2">Unit</th>
                  <th className="py-2 text-right font-bold w-24">Rate</th>
                  <th className="py-2 text-right font-bold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemGroups.map(group => (
                  <tr key={group.itemName} className="border-none">
                    <td colSpan={9} className="p-0">
                      {/* Item Group Header: Blue Underlined text matching screenshot 3 */}
                      <div className="pt-3 pb-1 text-left">
                        <span className="text-blue-800 font-bold underline tracking-wide cursor-default">
                          {group.itemName}
                        </span>
                      </div>

                      <table className="w-full text-xs font-sans border-collapse">
                        <tbody>
                          {group.lines.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/70">
                              <td className="py-1 text-left w-24 font-mono text-slate-800">{l.voucherSerial}</td>
                              <td className="py-1 text-left w-24 font-mono text-slate-800">{formatDDMMYYYY(l.date)}</td>
                              <td className="py-1 text-left text-slate-900 uppercase font-medium">{l.partyName}</td>
                              <td className="py-1 text-center w-20 text-slate-500 font-mono">{l.lotNo || '—'}</td>
                              <td className="py-1 text-right w-16 font-mono text-slate-800">{formatDec2(l.than)}</td>
                              <td className="py-1 text-right w-20 font-mono text-slate-900 font-medium">{formatDec2(l.qty)}</td>
                              <td className="py-1 text-left w-20 text-slate-700 pl-2">{l.unit}</td>
                              <td className="py-1 text-right w-24 font-mono text-slate-900">{formatDec2(l.rate)}</td>
                              <td className="py-1 text-right w-28 font-mono font-semibold text-slate-900">{formatDec2(l.amount)}</td>
                            </tr>
                          ))}

                          {/* Item Subtotal matching screenshot 3 */}
                          <tr className="text-blue-800 font-bold pt-1 pb-2">
                            <td colSpan={4} className="py-1 text-left font-bold text-blue-800">
                              Subtotal
                            </td>
                            <td className="py-1 text-right font-mono text-blue-800">{formatDec2(group.subtotalThan)}</td>
                            <td className="py-1 text-right font-mono text-blue-800">{formatDec2(group.subtotalQty)}</td>
                            <td className="py-1 text-left text-blue-800 pl-2">{group.unit}</td>
                            <td className="py-1"></td>
                            <td className="py-1 text-right font-mono font-bold text-blue-800">
                              {formatDec2(group.subtotalAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}

                {itemGroups.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-mono">
                      No records found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Bottom Grand Total matching screenshot 3 */}
              {itemGroups.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-black font-bold text-blue-800">
                    <td colSpan={4} className="py-2.5 text-left font-bold text-sm text-blue-800">
                      Grand Total
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalThan)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800">{formatDec2(grandTotalQty)}</td>
                    <td className="py-2.5 text-left text-blue-800 pl-2">{grandTotalUnit}</td>
                    <td className="py-2.5"></td>
                    <td className="py-2.5 text-right font-mono font-bold text-blue-800 text-sm">
                      {formatDec2(grandTotalAmount)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

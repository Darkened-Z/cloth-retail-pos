interface Shortcut {
  key: string;
  label: string;
}

export function ShortcutFooter({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <footer className="hidden md:flex print:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm text-slate-700 px-5 py-2 gap-x-5 gap-y-1.5 flex-wrap items-center shadow-[0_-1px_3px_rgba(15,23,42,0.05)]">
      <span className="text-[11px] font-sans uppercase tracking-wider text-blue-600 font-semibold border-r border-slate-200 pr-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
        Shortcuts
      </span>
      {shortcuts.map(s => (
        <span key={s.key} className="text-xs font-sans flex gap-1.5 items-center">
          <kbd className="border border-slate-300 bg-slate-100 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-800 font-semibold shadow-sm">
            {s.key}
          </kbd>
          <span className="text-slate-600 font-medium">{s.label}</span>
        </span>
      ))}
    </footer>
  );
}

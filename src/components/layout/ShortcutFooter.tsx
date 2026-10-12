interface Shortcut { key: string; label: string; }

export function ShortcutFooter({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <footer className="hidden md:flex print:hidden border-t-2 border-black bg-black text-white px-4 py-1.5 gap-5 flex-wrap items-center">
      <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold border-r border-white/30 pr-3">
        KEYS
      </span>
      {shortcuts.map(s => (
        <span key={s.key} className="text-xs font-mono flex gap-1.5 items-center">
          <kbd className="border border-white/80 bg-white/10 px-1.5 py-0.5 text-[11px] text-accent font-bold">{s.key}</kbd>
          <span className="text-gray-200">{s.label}</span>
        </span>
      ))}
    </footer>
  );
}

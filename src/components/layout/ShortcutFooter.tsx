interface Shortcut { key: string; label: string; }

export function ShortcutFooter({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <footer className="hidden md:flex print:hidden fixed bottom-0 left-0 right-0 z-30 border-t-2 border-black bg-black text-white px-4 py-2 gap-x-5 gap-y-1.5 flex-wrap items-center shadow-[0_-2px_0_#000]">
      <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold border-r border-white/30 pr-3">
        KEYS
      </span>
      {shortcuts.map(s => (
        <span key={s.key} className="text-xs font-mono flex gap-1.5 items-center">
          <kbd className="border border-white/80 bg-white/15 px-1.5 py-0.5 text-xs text-accent font-bold">{s.key}</kbd>
          <span className="text-white font-medium">{s.label}</span>
        </span>
      ))}
    </footer>
  );
}

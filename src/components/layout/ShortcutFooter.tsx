interface Shortcut { key: string; label: string; }

export function ShortcutFooter({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <footer className="border-t-2 border-black bg-black text-white px-4 py-1.5 flex gap-6 flex-wrap">
      {shortcuts.map(s => (
        <span key={s.key} className="text-xs font-mono flex gap-1.5 items-center">
          <span className="border border-white px-1.5 py-0.5 text-accent">{s.key}</span>
          <span className="text-gray-300">{s.label}</span>
        </span>
      ))}
    </footer>
  );
}

import { useEffect } from "react";

export interface ContextMenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[200] bg-[#111214] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={`w-full px-3 py-1.5 text-sm text-left transition-colors ${
            item.danger
              ? 'text-red-400 hover:bg-red-500/20'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

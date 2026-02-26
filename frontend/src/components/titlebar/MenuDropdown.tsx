'use client';

import React, { useEffect, useRef } from 'react';

export interface MenuAction {
  label: string;
  shortcut?: string; // display only, e.g. "Cmd+S"
  onClick?: () => void;
  disabled?: boolean;
  dividerAfter?: boolean; // renders a separator after this item
  submenu?: MenuAction[]; // for "Open Recent ▶"
  icon?: React.ReactNode;
}

interface MenuDropdownProps {
  label: string; // "File", "Edit", etc.
  items: MenuAction[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function MenuDropdown({
  label,
  items,
  isOpen,
  onToggle,
  onClose,
}: MenuDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = React.useState<number | null>(null);

  // Close on outside click (use mousedown to prevent same-click-that-opened firing close)
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleItemClick = (item: MenuAction) => {
    if (item.disabled) return;
    if (item.submenu) {
      // Submenu toggle would go here if needed
      return;
    }
    item.onClick?.();
    onClose();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={`
          px-3 py-1 text-sm text-[#cccccc] hover:bg-[#2a2d2e] rounded
          ${isOpen ? 'bg-[#2a2d2e]' : ''}
        `}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[240px] bg-[#252526] border border-[#454545] shadow-lg"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          {items.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center justify-between px-3 py-1 text-[13px]
                  ${
                    item.disabled
                      ? 'text-[#555555] cursor-not-allowed'
                      : 'text-[#cccccc] hover:bg-[#094771] cursor-pointer'
                  }
                `}
                style={{ textAlign: 'left' }}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.submenu && <span className="ml-auto text-[#858585]">▶</span>}
                </span>
                {item.shortcut && !item.submenu && (
                  <span className="text-[#858585] ml-4">{item.shortcut}</span>
                )}
              </button>
              {item.dividerAfter && (
                <div className="h-px bg-[#3c3c3c] my-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

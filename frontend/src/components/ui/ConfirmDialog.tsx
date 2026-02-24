'use client';

import { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg shadow-2xl w-[480px] max-w-[90vw] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
          {danger ? (
            <AlertTriangle className="w-5 h-5 text-[var(--red)]" />
          ) : (
            <Info className="w-5 h-5 text-[var(--cyan)]" />
          )}
          <h2 className="text-lg font-semibold text-[var(--text-0)]">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-[var(--text-1)] leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--text-0)] bg-[var(--bg-3)] border border-[var(--border)] rounded hover:bg-[var(--bg-4)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
              danger
                ? 'bg-[var(--red)] hover:bg-[#cc4444]'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-bright)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add keyframes for animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out;
    }
  `;
  if (!document.head.querySelector('style[data-confirm-dialog]')) {
    style.setAttribute('data-confirm-dialog', 'true');
    document.head.appendChild(style);
  }
}

'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastType } from '@/hooks/useToast';

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: () => void;
}

function ToastItem({ id, type, message, onClose }: ToastItemProps) {
  useEffect(() => {
    // Animation entrance
    const el = document.getElementById(`toast-${id}`);
    if (el) {
      el.style.animation = 'slideInRight 0.3s ease-out';
    }
  }, [id]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[var(--green)]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[var(--red)]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--yellow)]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[var(--cyan)]" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-[var(--green)]';
      case 'error':
        return 'border-l-[var(--red)]';
      case 'warning':
        return 'border-l-[var(--yellow)]';
      case 'info':
        return 'border-l-[var(--cyan)]';
    }
  };

  return (
    <div
      id={`toast-${id}`}
      className={`
        pointer-events-auto
        min-w-[320px] max-w-[420px]
        bg-[var(--bg-2)] border border-[var(--border)] ${getBorderColor()}
        border-l-4 rounded-lg shadow-lg
        flex items-start gap-3 p-4
        cursor-pointer hover:bg-[var(--bg-3)] transition-colors
      `}
      onClick={onClose}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm text-[var(--text-0)] leading-relaxed break-words">
        {message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex-shrink-0 text-[var(--text-2)] hover:text-[var(--text-0)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Add keyframes for animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

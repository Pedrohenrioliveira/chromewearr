import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-[420px]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        className={cn(
          'relative w-[calc(100%-2rem)] bg-white p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150',
          maxWidth
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-sm uppercase tracking-widest font-bold text-text-primary">
              {title}
            </span>
            <button
              onClick={onClose}
              className="text-xl leading-none text-text-secondary hover:text-primary transition-colors"
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

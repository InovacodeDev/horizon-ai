'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-error text-white hover:bg-error/90',
    warning: 'bg-warning text-white hover:bg-warning/90',
    info: 'bg-primary text-white hover:bg-primary/90',
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg w-full max-w-md shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-on-surface-variant">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end p-6 pt-0">
          <Button variant="text" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]}`}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

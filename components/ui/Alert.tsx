'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from '@/components/assets/Icons';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type = 'info', title, message, onClose, className = '' }: AlertProps) {
  const styles = {
    success: {
      container: 'bg-green-bg border-green-border text-green-text',
      icon: <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />,
    },
    error: {
      container: 'bg-red-bg border-red-border text-red-text',
      icon: <XCircleIcon className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      container: 'bg-orange-bg border-orange-border text-orange-text',
      icon: <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />,
    },
    info: {
      container: 'bg-blue-info-bg border-blue-info-border text-blue-info-text',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = styles[type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${style.container} ${className}`} role="alert">
      {style.icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors-smooth focus-ring"
          aria-label="Fechar alerta"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Alert;

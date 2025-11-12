'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface TerminateRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relationshipId: string;
  role: 'responsible' | 'member';
  otherUserName: string;
}

export function TerminateRelationshipModal({
  isOpen,
  onClose,
  onSuccess,
  relationshipId,
  role,
  otherUserName,
}: TerminateRelationshipModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/family/relationships/${relationshipId}/terminate`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao encerrar compartilhamento');
      }

      // Close modal and notify parent
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao encerrar compartilhamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Encerrar Compartilhamento" maxWidth="md">
      <div className="p-6">
        {/* Warning Icon and Message */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 bg-red-bg rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Tem certeza que deseja encerrar?
            </h3>
            <p className="text-text-secondary mb-4">
              {role === 'responsible'
                ? `Você está prestes a encerrar o compartilhamento com ${otherUserName}.`
                : `Você está prestes a encerrar o compartilhamento com ${otherUserName}.`}
            </p>
          </div>
        </div>

        {/* Consequences List */}
        <div className="bg-orange-bg border border-orange-border rounded-md p-4 mb-6">
          <p className="font-medium text-text-primary mb-3">
            Ao encerrar o compartilhamento:
          </p>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-orange-text flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>
                Você não poderá mais visualizar as contas e transações de {otherUserName}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-orange-text flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>
                {otherUserName} não poderá mais visualizar suas contas e transações
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-orange-text flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>
                Todos os dados históricos serão preservados, mas o acesso compartilhado será
                removido
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-primary flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Ambos os usuários receberão uma notificação por email sobre o encerramento
              </span>
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Encerrando...' : 'Encerrar Compartilhamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

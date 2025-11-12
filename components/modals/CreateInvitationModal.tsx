'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { CreateInvitationDto } from '@/lib/types/sharing.types';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInvitationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvitationModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate email format
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateInvitationDto = {
        invitedEmail: email,
      };

      const res = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      setSuccess(true);
      setEmail('');
      
      // Show success message briefly before closing
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Convite" maxWidth="md">
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-bg border border-green-border text-green-text px-4 py-3 rounded-md mb-4">
            Convite criado com sucesso! Um email foi enviado para o destinatário.
          </div>
        )}

        <div className="mb-6">
          <Input
            id="invited-email"
            type="email"
            label="Email do Convidado"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || success}
            helperText="O usuário receberá um email com o link para aceitar o convite"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />
        </div>

        <div className="bg-blue-light border border-blue-primary/20 rounded-md p-4 mb-6">
          <div className="flex gap-3">
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
            <div className="text-sm text-text-primary">
              <p className="font-medium mb-1">Sobre o compartilhamento:</p>
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
                <li>Ambos poderão visualizar contas, transações e faturas</li>
                <li>Cada um mantém controle sobre seus próprios dados</li>
                <li>O convite expira em 7 dias</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading || success}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || success || !email}
          >
            {loading ? 'Enviando...' : success ? 'Enviado!' : 'Enviar Convite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

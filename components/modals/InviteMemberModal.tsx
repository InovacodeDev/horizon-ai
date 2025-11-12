'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    try {
      await onInvite(email);
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Convidar Membro">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-3">
            Email do Membro
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            disabled={loading}
            required
          />
          {error && (
            <p className="text-sm text-error mt-3">{error}</p>
          )}
        </div>

        <div className="bg-primary-container/20 border border-primary/20 rounded-lg p-5">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Importante:</strong> O membro convidado terá acesso de leitura aos seus dados financeiros, 
            incluindo contas, transações e cartões de crédito. Ele não poderá modificar ou excluir seus dados.
          </p>
        </div>

        <div className="flex gap-4 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

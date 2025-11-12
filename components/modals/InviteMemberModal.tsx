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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-2">
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
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-on-surface-variant">
            <strong>Importante:</strong> O membro convidado terá acesso de leitura aos seus dados financeiros, 
            incluindo contas, transações e cartões de crédito. Ele não poderá modificar ou excluir seus dados.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
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

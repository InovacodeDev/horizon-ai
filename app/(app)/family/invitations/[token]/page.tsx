'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import type { ValidateInvitationResponse } from '@/lib/types/sharing.types';

interface InvitationPageProps {
  params: {
    token: string;
  };
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [invitation, setInvitation] = useState<ValidateInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    validateInvitation();
  }, [params.token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/family/invitations/validate?token=${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Convite inválido');
      }

      setInvitation(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao validar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      setError(null);

      const res = await fetch('/api/family/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: params.token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      // Redirect to family page after successful acceptance
      router.push('/family?accepted=true');
    } catch (err: any) {
      setError(err.message || 'Erro ao aceitar convite');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      setError(null);

      const res = await fetch('/api/family/invitations/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: params.token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao rejeitar convite');
      }

      // Redirect to family page after rejection
      router.push('/family?rejected=true');
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar convite');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-bg-secondary rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-bg-secondary rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-new-primary border border-border-primary rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-text"
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
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Convite Inválido</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button variant="primary" onClick={() => router.push('/family')}>
            Ir para Conta Conjunta
          </Button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.invitation.expires_at) < new Date();
  const cannotAccept = !invitation.canAccept || isExpired;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <div className="max-w-lg w-full bg-surface-new-primary border border-border-primary rounded-lg shadow-soft-xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Convite para Conta Conjunta
            </h1>
            <p className="text-text-secondary">
              Você foi convidado para compartilhar dados financeiros
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-bg-secondary rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {invitation.responsibleUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-tertiary mb-1">Convidado por:</p>
                <h3 className="font-semibold text-text-primary">
                  {invitation.responsibleUser.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {invitation.responsibleUser.email}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-primary">
              <p className="text-xs text-text-tertiary">
                Enviado em{' '}
                {new Date(invitation.invitation.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {isExpired ? (
                <p className="text-xs text-red-text mt-1">
                  Este convite expirou em{' '}
                  {new Date(invitation.invitation.expires_at).toLocaleDateString('pt-BR')}
                </p>
              ) : (
                <p className="text-xs text-text-tertiary mt-1">
                  Expira em{' '}
                  {new Date(invitation.invitation.expires_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Information Box */}
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
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-2">
                  Ao aceitar este convite:
                </p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Você poderá visualizar as contas e transações do convidante</li>
                  <li>O convidante poderá visualizar suas contas e transações</li>
                  <li>Cada um mantém controle sobre seus próprios dados</li>
                  <li>Você pode encerrar o compartilhamento a qualquer momento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Cannot Accept Warning */}
          {cannotAccept && invitation.reason && (
            <div className="bg-orange-bg border border-orange-border text-orange-text px-4 py-3 rounded-md mb-6">
              {invitation.reason}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={processing || isExpired}
              className="flex-1"
            >
              Recusar
            </Button>
            <Button
              variant="primary"
              onClick={handleAccept}
              disabled={processing || cannotAccept}
              loading={processing}
              className="flex-1"
            >
              {processing ? 'Aceitando...' : 'Aceitar Convite'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

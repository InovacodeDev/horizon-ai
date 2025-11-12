'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { CreateInvitationModal } from '@/components/modals/CreateInvitationModal';
import { TerminateRelationshipModal } from '@/components/modals/TerminateRelationshipModal';
import type { 
  SharingRelationshipDetails, 
  SharingInvitation,
  GetRelationshipResponse,
  GetMembersResponse 
} from '@/lib/types/sharing.types';

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] = useState<SharingRelationshipDetails | null>(null);
  const [role, setRole] = useState<'responsible' | 'member' | null>(null);
  const [members, setMembers] = useState<SharingRelationshipDetails[]>([]);
  const [invitations, setInvitations] = useState<SharingInvitation[]>([]);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current relationship
      const relationshipRes = await fetch('/api/family/relationships');
      if (!relationshipRes.ok) throw new Error('Failed to load relationship');
      const relationshipData: GetRelationshipResponse = await relationshipRes.json();
      
      setRelationship(relationshipData.relationship);
      setRole(relationshipData.role);

      // If user is responsible, fetch members and invitations
      if (relationshipData.role === 'responsible') {
        const [membersRes, invitationsRes] = await Promise.all([
          fetch('/api/family/members'),
          fetch('/api/family/invitations'),
        ]);

        if (membersRes.ok) {
          const membersData: GetMembersResponse = await membersRes.json();
          setMembers(membersData.members);
        }

        if (invitationsRes.ok) {
          const invitationsData = await invitationsRes.json();
          setInvitations(invitationsData.invitations || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationCreated = () => {
    setIsInvitationModalOpen(false);
    loadData();
  };

  const handleRelationshipTerminated = () => {
    setIsTerminateModalOpen(false);
    loadData();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/family/invitations/${invitationId}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to cancel invitation');
      
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/family/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to resend invitation');
      
      alert('Convite reenviado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-bg-secondary rounded w-48 mb-4"></div>
          <div className="h-4 bg-bg-secondary rounded w-96 mb-8"></div>
          <div className="h-32 bg-bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">Conta Conjunta</h1>
        <p className="text-text-secondary">
          Gerencie o compartilhamento de dados financeiros com familiares ou parceiros
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red-text px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* No Active Relationship */}
      {!relationship && (
        <div className="bg-surface-new-primary border border-border-primary rounded-lg p-6">
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              Nenhuma conta conjunta ativa
            </h3>
            <p className="text-text-secondary mb-6">
              Convide alguém para compartilhar dados financeiros ou aguarde um convite
            </p>
            <Button variant="primary" onClick={() => setIsInvitationModalOpen(true)}>
              Criar Convite
            </Button>
          </div>
        </div>
      )}

      {/* Member View - Show Responsible User */}
      {relationship && role === 'member' && (
        <div className="space-y-6">
          <div className="bg-surface-new-primary border border-border-primary rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Conta Conjunta Ativa
                </h2>
                <p className="text-sm text-text-secondary">
                  Você está compartilhando dados com:
                </p>
              </div>
              <span className="px-3 py-1 bg-green-bg text-green-text text-xs font-medium rounded-full">
                Ativo
              </span>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {relationship.responsibleUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary">
                    {relationship.responsibleUser.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {relationship.responsibleUser.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-text-tertiary mb-4">
              Compartilhamento iniciado em{' '}
              {new Date(relationship.relationship.started_at).toLocaleDateString('pt-BR')}
            </div>

            <Button
              variant="danger"
              onClick={() => setIsTerminateModalOpen(true)}
              className="w-full"
            >
              Encerrar Compartilhamento
            </Button>
          </div>
        </div>
      )}

      {/* Responsible View - Show Members and Invitations */}
      {relationship && role === 'responsible' && (
        <div className="space-y-6">
          {/* Active Members */}
          <div className="bg-surface-new-primary border border-border-primary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Membros Ativos ({members.length})
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInvitationModalOpen(true)}
              >
                Adicionar Membro
              </Button>
            </div>

            {members.length === 0 ? (
              <p className="text-text-secondary text-center py-4">
                Nenhum membro ativo no momento
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.relationship.$id}
                    className="bg-bg-secondary rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {member.memberUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {member.memberUser.name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {member.memberUser.email}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          Desde {new Date(member.relationship.started_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTerminateModalOpen(true)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-surface-new-primary border border-border-primary rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Convites Pendentes ({invitations.filter(i => i.status === 'pending').length})
              </h2>

              <div className="space-y-3">
                {invitations
                  .filter((inv) => inv.status === 'pending')
                  .map((invitation) => (
                    <div
                      key={invitation.$id}
                      className="bg-bg-secondary rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {invitation.invited_email}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-1">
                          Enviado em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                          {' • '}
                          Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.$id)}
                        >
                          Reenviar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.$id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateInvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        onSuccess={handleInvitationCreated}
      />

      {relationship && (
        <TerminateRelationshipModal
          isOpen={isTerminateModalOpen}
          onClose={() => setIsTerminateModalOpen(false)}
          onSuccess={handleRelationshipTerminated}
          relationshipId={relationship.relationship.$id}
          role={role || 'member'}
          otherUserName={
            role === 'member'
              ? relationship.responsibleUser.name
              : relationship.memberUser.name
          }
        />
      )}
    </div>
  );
}

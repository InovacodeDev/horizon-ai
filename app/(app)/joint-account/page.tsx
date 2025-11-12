'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, Trash2Icon } from '@/components/assets/Icons';
import Skeleton from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import type { SharingRelationshipDetails } from '@/lib/types/sharing.types';

const JointAccountPageSkeleton: React.FC = () => (
  <>
    <header className="mb-8">
      <Skeleton className="h-10 w-80 mb-2" />
      <Skeleton className="h-6 w-96" />
    </header>
    <main className="space-y-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-20 w-full" />
      </Card>
    </main>
  </>
);

interface MemberCardProps {
  member: SharingRelationshipDetails;
  onRemove: (relationshipId: string, memberName: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onRemove }) => {
  const startedAt = new Date(member.relationship.started_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary-container flex items-center justify-center">
          <span className="text-on-primary-container font-semibold text-lg">
            {member.memberUser.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-on-surface">{member.memberUser.name}</p>
          <p className="text-sm text-on-surface-variant">{member.memberUser.email}</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Membro desde {startedAt}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={() => onRemove(member.relationship.$id, member.memberUser.name)}
        leftIcon={<Trash2Icon className="w-4 h-4" />}
      >
        Remover
      </Button>
    </div>
  );
};

export default function JointAccountPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<SharingRelationshipDetails[]>([]);
  const [relationship, setRelationship] = useState<SharingRelationshipDetails | null>(null);
  const [role, setRole] = useState<'responsible' | 'member' | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch relationship and members
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch relationship
      const relationshipResponse = await fetch('/api/family/relationships', {
        credentials: 'include',
      });

      if (relationshipResponse.ok) {
        const relationshipData = await relationshipResponse.json();
        setRelationship(relationshipData.data.relationship);
        setRole(relationshipData.data.role);

        // If user is responsible, fetch members
        if (relationshipData.data.role === 'responsible') {
          const membersResponse = await fetch('/api/family/members', {
            credentials: 'include',
          });

          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setMembers(membersData.data.members || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching joint account data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteMember = async (email: string) => {
    try {
      const response = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitedEmail: email }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao enviar convite');
      }

      alert('Convite enviado com sucesso!');
      setIsInviteModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar convite');
    }
  };

  const handleRemoveMember = async (relationshipId: string) => {
    try {
      const response = await fetch(`/api/family/relationships/${relationshipId}/terminate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao remover membro');
      }

      alert('Membro removido com sucesso!');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Erro ao remover membro');
    }
  };

  const handleLeaveJointAccount = async () => {
    if (!relationship) return;

    try {
      const response = await fetch(`/api/family/relationships/${relationship.relationship.$id}/terminate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao sair da conta conjunta');
      }

      alert('Você saiu da conta conjunta com sucesso!');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Erro ao sair da conta conjunta');
    }
  };

  if (loading) {
    return <JointAccountPageSkeleton />;
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-light text-on-surface">Conta Conjunta</h1>
        <p className="text-base text-on-surface-variant mt-1">
          Gerencie o compartilhamento de dados financeiros
        </p>
      </header>

      <main className="space-y-6">
        {/* Owner View - Show members and invite button */}
        {role === 'responsible' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Membros</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Usuários que têm acesso aos seus dados financeiros
                </p>
              </div>
              <Button
                leftIcon={<PlusIcon className="w-5 h-5" />}
                onClick={() => setIsInviteModalOpen(true)}
              >
                Convidar Membro
              </Button>
            </div>

            {members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <MemberCard
                    key={member.relationship.$id}
                    member={member}
                    onRemove={(relationshipId, memberName) => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Remover Membro',
                        message: `Tem certeza que deseja remover ${memberName} da conta conjunta? Ele perderá acesso aos seus dados financeiros.`,
                        onConfirm: () => handleRemoveMember(relationshipId),
                        variant: 'warning',
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-on-surface-variant">
                  Nenhum membro adicionado ainda. Convide alguém para compartilhar seus dados financeiros.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Member View - Show responsible user and leave button */}
        {role === 'member' && relationship && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Conta Conjunta Ativa</h2>
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-on-primary-container font-semibold text-lg">
                    {relationship.responsibleUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{relationship.responsibleUser.name}</p>
                  <p className="text-sm text-on-surface-variant">{relationship.responsibleUser.email}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Você tem acesso aos dados financeiros desta pessoa
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Sair da Conta Conjunta',
                    message: `Tem certeza que deseja sair da conta conjunta com ${relationship.responsibleUser.name}? Você perderá acesso aos dados financeiros.`,
                    onConfirm: handleLeaveJointAccount,
                    variant: 'warning',
                  });
                }}
              >
                Sair da Conta Conjunta
              </Button>
            </div>
          </Card>
        )}

        {/* No relationship - Show info */}
        {!role && (
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-on-primary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-2">Nenhuma Conta Conjunta Ativa</h3>
              <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                Você pode convidar membros para compartilhar seus dados financeiros ou aceitar um convite de outra pessoa.
              </p>
              <Button
                leftIcon={<PlusIcon className="w-5 h-5" />}
                onClick={() => setIsInviteModalOpen(true)}
              >
                Convidar Membro
              </Button>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-primary-container/20 border border-primary/20">
          <h3 className="text-lg font-semibold text-on-surface mb-3">Como funciona a Conta Conjunta?</h3>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Compartilhe seus dados financeiros com membros da família ou parceiros</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Membros podem visualizar suas contas, transações e cartões de crédito</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Membros NÃO podem modificar ou excluir seus dados (somente leitura)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Você pode remover membros ou sair da conta conjunta a qualquer momento</span>
            </li>
          </ul>
        </Card>
      </main>

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant={confirmModal.variant}
      />
    </>
  );
}

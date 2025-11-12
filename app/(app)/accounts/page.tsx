'use client';

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DotsVerticalIcon, PlusIcon, WalletIcon, CreditCardIcon } from "@/components/assets/Icons";
import Skeleton from "@/components/ui/Skeleton";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountsWithSharing } from "@/hooks/useAccountsWithSharing";
import { useTotalBalance } from "@/hooks/useTotalBalance";
import { useCreditCardsWithCache } from "@/hooks/useCreditCardsWithCache";
import { OwnershipBadge } from "@/components/ui/OwnershipBadge";
import { AddAccountModal } from "@/components/modals/AddAccountModal";
import { AddCreditCardModal } from "@/components/modals/AddCreditCardModal";
import { EditCreditCardModal } from "@/components/modals/EditCreditCardModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { TransferBalanceModal } from "@/components/modals/TransferBalanceModal";
import type { Account, AccountStatus, CreditCard } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ProcessDueTransactions } from "@/components/ProcessDueTransactions";
import { reprocessAccountBalanceAction } from "@/actions/balance-sync.actions";
import type { CreateCreditCardInput } from "@/components/modals/AddCreditCardModal";
import type { UpdateCreditCardInput } from "@/components/modals/EditCreditCardModal";

const AccountCardSkeleton: React.FC = () => (
    <Card className="p-4 flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="text-right space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
    </Card>
);

const AccountsScreenSkeleton: React.FC = () => (
    <>
        <header className="flex justify-between items-center mb-8">
            <div>
                <Skeleton className="h-10 w-80 mb-2" />
                <Skeleton className="h-6 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
        </header>
        <main className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <AccountCardSkeleton key={i} />
            ))}
        </main>
    </>
);

interface CreditCardItemProps {
    card: CreditCard;
    onDelete: () => void;
    onViewStatement: () => void;
    onEdit: () => void;
}

const CreditCardItem: React.FC<CreditCardItemProps> = ({ card, onDelete, onViewStatement, onEdit }) => {
    const usagePercentage = (card.used_limit / card.credit_limit) * 100;
    const data = card.data ? (typeof card.data === 'string' ? JSON.parse(card.data) : card.data) : {};
    
    // Check if this is a shared credit card (read-only)
    const isShared = 'isOwn' in card && !card.isOwn;
    
    return (
        <div className="bg-gray-50 rounded-lg p-3 flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CreditCardIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-on-surface truncate">{card.name}</p>
                        <p className="text-xs text-on-surface-variant">**** {card.last_digits}</p>
                        {/* Show read-only indicator for shared cards */}
                        {isShared && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded mt-1 inline-block">
                                Somente Leitura
                            </span>
                        )}
                    </div>
                </div>
                {data.brand && (
                    <span className="text-xs px-2 py-0.5 bg-white rounded uppercase font-medium text-gray-600 flex-shrink-0">
                        {data.brand}
                    </span>
                )}
            </div>
            
            <div className="flex-grow">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate">
                        R$ {card.used_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex-shrink-0 ml-1">{usagePercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div 
                        className={`h-1.5 rounded-full ${
                            usagePercentage > 80 ? 'bg-red-500' : 
                            usagePercentage > 50 ? 'bg-yellow-500' : 
                            'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-600">
                    Limite: R$ {card.credit_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                    Fecha: {card.closing_day} • Vence: {card.due_day}
                </p>
            </div>
            
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
                <button
                    onClick={onViewStatement}
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-1.5 px-2 rounded text-xs font-medium"
                >
                    Ver Fatura
                </button>
                {/* Only show edit/delete buttons for own credit cards */}
                {!isShared ? (
                    <>
                        <button
                            onClick={onEdit}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                            aria-label="Edit card"
                            title="Editar cartão"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"
                            aria-label="Delete card"
                            title="Excluir cartão"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => alert('Você não pode modificar cartões compartilhados')}
                        className="text-gray-300 cursor-not-allowed p-1.5 rounded"
                        aria-label="Read-only card"
                        title="Somente leitura"
                        disabled
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

interface AccountCardProps {
    account: Account;
    creditCards: CreditCard[];
    onDelete: (accountId: string) => void;
    onAddCreditCard: () => void;
    onDeleteCreditCard: (cardId: string) => void;
    onEditCreditCard: (card: CreditCard) => void;
    onViewCreditCardStatement: (cardId: string) => void;
    onConfirmDelete: (accountId: string, accountName: string) => void;
    onConfirmDeleteCard: (cardId: string, cardName: string) => void;
    onReprocessBalance: (accountId: string, accountName: string) => Promise<void>;
    isReprocessing: boolean;
    canReprocess: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  creditCards,
  onAddCreditCard,
  onEditCreditCard,
  onViewCreditCardStatement,
  onConfirmDelete,
  onConfirmDeleteCard,
  onReprocessBalance,
  isReprocessing,
  canReprocess,
}) => {
  const [expanded, setExpanded] = useState(false);
    
    const statusColor: Record<AccountStatus, string> = {
        Connected: "bg-green-500",
        "Sync Error": "bg-yellow-500",
        Disconnected: "bg-gray-400",
        Manual: "bg-blue-500",
    };

    const accountTypeLabel: Record<string, string> = {
        checking: "Conta Corrente",
        savings: "Poupança",
        investment: "Investimento",
        other: "Outro",
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="h-12 w-12 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <WalletIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-on-surface">{account.name}</p>
                        <div className={`w-2 h-2 rounded-full ${statusColor[account.status || 'Manual']}`}></div>
                        {account.is_manual && (
                            <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium">Manual</span>
                        )}
                        {/* Ownership Badge */}
                        {'isOwn' in account && (
                            <OwnershipBadge
                                isOwn={account.isOwn as boolean}
                                ownerName={(account as any).ownerName}
                                ownerId={(account as any).ownerId}
                                size="sm"
                            />
                        )}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">{accountTypeLabel[account.account_type]}</p>
                </div>
                <div className="text-right">
                    {isReprocessing ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            <p className="font-semibold text-xl text-on-surface-variant">
                                Calculando...
                            </p>
                        </div>
                    ) : (
                        <p className="font-semibold text-xl text-on-surface">
                            {(account.balance ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                    )}
                    <p className="text-sm text-on-surface-variant mt-1">
                        {creditCards.length} cartão(ões)
                    </p>
                </div>
                <DropdownMenu
                    trigger={
                        <button
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Account menu"
                        >
                            <DotsVerticalIcon className="h-5 w-5" />
                        </button>
                    }
                >
                    <DropdownMenuItem
                        onClick={() => {
                            // TODO: Implement Open Finance integration
                            alert("Integração com Open Finance em breve!");
                        }}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    >
                        Integrar com Open Finance
                    </DropdownMenuItem>
                    {canReprocess ? (
                        <DropdownMenuItem
                            onClick={() => {
                                if (isReprocessing) return;
                                onReprocessBalance(account.$id, account.name);
                            }}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            }
                        >
                            {isReprocessing ? 'Reprocessando...' : 'Reprocessar Saldo'}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => alert('Aguarde 15 minutos antes de reprocessar esta conta novamente.')}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        >
                            Aguardar cooldown (15min)
                        </DropdownMenuItem>
                    )}
                    {/* Only show delete option for own accounts */}
                    {(!('isOwn' in account) || (account as any).isOwn) && (
                        <DropdownMenuItem
                            onClick={() => onConfirmDelete(account.$id, account.name)}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                            variant="danger"
                        >
                            Excluir conta
                        </DropdownMenuItem>
                    )}
                    {/* Show read-only indicator for shared accounts */}
                    {('isOwn' in account && !(account as any).isOwn) && (
                        <DropdownMenuItem
                            onClick={() => alert('Você não pode excluir contas compartilhadas')}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        >
                            Somente Leitura
                        </DropdownMenuItem>
                    )}
                </DropdownMenu>
            </div>
            
            {expanded && (
                <div className="mt-6 pt-6 border-t border-outline">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-base text-on-surface">Cartões de Crédito</h4>
                        <Button 
                            variant="ghost" 
                            onClick={onAddCreditCard}
                            leftIcon={<PlusIcon className="w-4 h-4" />}
                        >
                            Adicionar Cartão
                        </Button>
                    </div>
                    
                    {creditCards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {creditCards.map((card, index) => (
                                <CreditCardItem 
                                    key={card.$id || `card-${index}`} 
                                    card={card}
                                    onViewStatement={() => onViewCreditCardStatement(card.$id)}
                                    onEdit={() => onEditCreditCard(card)}
                                    onDelete={() => onConfirmDeleteCard(card.$id, card.name)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum cartão de crédito cadastrado
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
};

export default function AccountsPage() {
    const router = useRouter();
    const { accounts, loading, createAccount, deleteAccount } = useAccounts();
    const { accounts: accountsWithSharing, loading: loadingSharing } = useAccountsWithSharing();
    const { loading: loadingBalance } = useTotalBalance();
    
    // Local state for accounts to allow manual updates
    const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
    
    // Use cached credit cards hook
    const { creditCards: allCreditCards, deleteCreditCard: deleteCreditCardFromHook, fetchCreditCards } = useCreditCardsWithCache();
    
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [activeAccountForCard, setActiveAccountForCard] = useState<string>('');
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [reprocessingAccountId, setReprocessingAccountId] = useState<string | null>(null);
    const [lastReprocessTime, setLastReprocessTime] = useState<Record<string, number>>({});
    
    // Confirmation modal states
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const handleAddCreditCard = (accountId: string) => {
        setActiveAccountForCard(accountId);
        setIsAddCardModalOpen(true);
    };

    const handleCreateCreditCard = async (input: CreateCreditCardInput) => {
        try {
            const response = await fetch('/api/credit-cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error('Failed to create credit card');
            }
        } catch (error) {
            console.error('Error creating credit card:', error);
            throw error;
        }
    };

    const handleDeleteCreditCard = async (creditCardId: string) => {
        try {
            await deleteCreditCardFromHook(creditCardId);
        } catch (error) {
            console.error('Error deleting credit card:', error);
            throw error;
        }
    };

    const handleViewCreditCardStatement = (creditCardId: string) => {
        // Navigate to credit card bills page with the specific card selected
        router.push(`/credit-card-bills?cardId=${creditCardId}`);
    };

    const handleEditCreditCard = (card: CreditCard) => {
        setEditingCard(card);
        setIsEditCardModalOpen(true);
    };

    const handleUpdateCreditCard = async (input: UpdateCreditCardInput) => {
        if (!editingCard) return;

        try {
            const response = await fetch(`/api/credit-cards/${editingCard.$id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error('Failed to update credit card');
            }

            // Refresh credit cards
            await fetchCreditCards();
        } catch (error) {
            console.error('Error updating credit card:', error);
            throw error;
        }
    };

    // Filter credit cards by account
    const getCreditCardsForAccount = (accountId: string) => {
        return allCreditCards.filter(card => card.account_id === accountId);
    };

    // Check if account can be reprocessed (15 minutes cooldown)
    const canReprocessAccount = (accountId: string): boolean => {
        const lastTime = lastReprocessTime[accountId];
        if (!lastTime) return true;
        
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        return (now - lastTime) >= fifteenMinutes;
    };

    // Handle reprocess balance for a specific account
    const handleReprocessBalance = async (accountId: string, _accountName: string) => {
        if (!canReprocessAccount(accountId)) {
            alert('Aguarde 15 minutos antes de reprocessar esta conta novamente.');
            return;
        }

        setReprocessingAccountId(accountId);
        try {
            const result = await reprocessAccountBalanceAction(accountId);
            if (result.success && result.balance !== undefined) {
                // Update last reprocess time
                setLastReprocessTime(prev => ({
                    ...prev,
                    [accountId]: Date.now()
                }));
                
                console.log('✅ Saldo reprocessado com sucesso. Novo saldo:', result.balance);
                
                // Atualizar apenas esta conta no estado local
                setLocalAccounts(prev => 
                    prev.map(account => 
                        account.$id === accountId 
                            ? { ...account, balance: result.balance! }
                            : account
                    )
                );
            } else {
                alert(result.error || 'Erro ao reprocessar saldo');
            }
        } catch (error) {
            console.error('Error reprocessing account balance:', error);
            alert('Erro ao reprocessar saldo');
        } finally {
            setReprocessingAccountId(null);
        }
    };

    // Sync local accounts when hook accounts change (from realtime or initial load)
    useEffect(() => {
        setLocalAccounts(accounts);
    }, [accounts]);
    
    // Use accounts with sharing for display (includes ownership metadata)
    const displayAccounts = accountsWithSharing.length > 0 ? accountsWithSharing : localAccounts;
    
    // Calculate total balance from accounts with sharing (includes shared accounts)
    const calculatedTotalBalance = accountsWithSharing.length > 0
        ? accountsWithSharing.reduce((sum, account) => sum + (account.balance || 0), 0)
        : localAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    const formattedBalance = calculatedTotalBalance.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    if (loading || loadingBalance || loadingSharing) {
        return <AccountsScreenSkeleton />;
    }

    return (
        <>
            <ProcessDueTransactions />
            <header className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-4xl font-light text-on-surface">Suas Contas</h1>
                    <p className="text-base text-on-surface-variant mt-1">
                        Gerencie suas contas e cartões de crédito
                    </p>
                </div>
                <div className="flex items-end gap-6">
                    <div className="text-right">
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Saldo Total</p>
                        <h2 className="text-3xl font-normal text-primary">{formattedBalance}</h2>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline"
                            leftIcon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            }
                            onClick={() => setIsTransferModalOpen(true)}
                            disabled={accounts.length < 2}
                        >
                            Transferir
                        </Button>
                        <Button 
                            leftIcon={<PlusIcon className="w-5 h-5" />}
                            onClick={() => setIsAddAccountModalOpen(true)}
                        >
                            Adicionar Conta
                        </Button>
                    </div>
                </div>
            </header>
            
            <main className="space-y-4">
                {displayAccounts.length > 0 ? (
                    displayAccounts.map((account, index) => (
                        <AccountCard
                            key={account.$id || `account-${index}`}
                            account={account}
                            creditCards={getCreditCardsForAccount(account.$id)}
                            onDelete={deleteAccount}
                            onAddCreditCard={() => handleAddCreditCard(account.$id)}
                            onDeleteCreditCard={handleDeleteCreditCard}
                            onEditCreditCard={handleEditCreditCard}
                            onViewCreditCardStatement={handleViewCreditCardStatement}
                            onConfirmDelete={(accountId, accountName) => {
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Excluir Conta',
                                    message: `Tem certeza que deseja excluir a conta "${accountName}"? Esta ação não pode ser desfeita.`,
                                    onConfirm: () => deleteAccount(accountId),
                                    variant: 'danger',
                                });
                            }}
                            onConfirmDeleteCard={(cardId, cardName) => {
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Excluir Cartão de Crédito',
                                    message: `Tem certeza que deseja excluir o cartão "${cardName}"? Esta ação não pode ser desfeita.`,
                                    onConfirm: () => handleDeleteCreditCard(cardId),
                                    variant: 'danger',
                                });
                            }}
                            onReprocessBalance={handleReprocessBalance}
                            isReprocessing={reprocessingAccountId === account.$id}
                            canReprocess={canReprocessAccount(account.$id)}
                        />
                    ))
                ) : (
                    <Card className="p-8 text-center flex flex-col items-center">
                        <div className="p-3 bg-primary-container rounded-full mb-4">
                            <WalletIcon className="w-8 h-8 text-on-primary-container" />
                        </div>
                        <h3 className="text-xl font-medium text-on-surface">Nenhuma Conta Cadastrada</h3>
                        <p className="text-on-surface-variant mt-1 mb-6 max-w-sm">
                            Adicione sua primeira conta para começar a gerenciar suas finanças com o Horizon AI.
                        </p>
                        <Button 
                            leftIcon={<PlusIcon className="w-5 h-5" />}
                            onClick={() => setIsAddAccountModalOpen(true)}
                        >
                            Adicionar Conta
                        </Button>
                    </Card>
                )}
            </main>

            <AddAccountModal
                isOpen={isAddAccountModalOpen}
                onClose={() => setIsAddAccountModalOpen(false)}
                onSubmit={createAccount}
            />

            <AddCreditCardModal
                isOpen={isAddCardModalOpen}
                onClose={() => {
                    setIsAddCardModalOpen(false);
                    setActiveAccountForCard('');
                }}
                onSubmit={handleCreateCreditCard}
                accountId={activeAccountForCard}
            />

            {editingCard && (
                <EditCreditCardModal
                    isOpen={isEditCardModalOpen}
                    onClose={() => {
                        setIsEditCardModalOpen(false);
                        setEditingCard(null);
                    }}
                    onSubmit={handleUpdateCreditCard}
                    creditCard={editingCard}
                />
            )}

            <TransferBalanceModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                accounts={accounts}
                onSuccess={() => {
                    // Accounts will be automatically refreshed via realtime
                }}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText || "Excluir"}
                cancelText="Cancelar"
            />
        </>
    );
}

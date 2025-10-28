'use client';

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DotsVerticalIcon, PlusIcon, WalletIcon, CreditCardIcon } from "@/components/assets/Icons";
import Skeleton from "@/components/ui/Skeleton";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { useAccounts } from "@/hooks/useAccounts";
import { useTotalBalance } from "@/hooks/useTotalBalance";
import { useCreditCardsWithCache } from "@/hooks/useCreditCardsWithCache";
import { AddAccountModal } from "@/components/modals/AddAccountModal";
import { AddCreditCardModal } from "@/components/modals/AddCreditCardModal";
import type { Account, AccountStatus, CreditCard } from "@/lib/types";
import { useRouter } from "next/navigation";

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
}

const CreditCardItem: React.FC<CreditCardItemProps> = ({ card, onDelete, onViewStatement }) => {
    const usagePercentage = (card.used_limit / card.credit_limit) * 100;
    const data = card.data ? (typeof card.data === 'string' ? JSON.parse(card.data) : card.data) : {};
    
    return (
        <div className="bg-gray-50 rounded-lg p-3 flex flex-col h-full">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CreditCardIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-on-surface truncate">{card.name}</p>
                        <p className="text-xs text-on-surface-variant">**** {card.last_digits}</p>
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
                    Ver Extrato
                </button>
                <button
                    onClick={onDelete}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"
                    aria-label="Delete card"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
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
    onViewCreditCardStatement: (cardId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ 
    account,
    onDelete, 
    onAddCreditCard,
    onViewCreditCardStatement
}) => {
    const [expanded, setExpanded] = useState(false);

    const { creditCards, deleteCreditCard: deleteCreditCardFromHook, fetchCreditCards } = useCreditCardsWithCache({
        accountId: account.$id,
        enableRealtime: true,
    });
    
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

    const onDeleteCreditCard = async (creditCardId: string) => {
        try {
            await deleteCreditCardFromHook(creditCardId);
        } catch (error) {
            console.error('Error deleting credit card:', error);
            throw error;
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                    <WalletIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-on-surface">{account.name}</p>
                        <div className={`w-2 h-2 rounded-full ${statusColor[account.status || 'Manual']}`}></div>
                        {account.is_manual && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Manual</span>
                        )}
                    </div>
                    <p className="text-sm text-on-surface-variant">{accountTypeLabel[account.account_type]}</p>
                </div>
                <div className="text-right">
                    <p className="font-medium text-lg text-on-surface">
                        {(account.balance ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                        {creditCards.length} cartão(ões)
                    </p>
                </div>
                <DropdownMenu
                    trigger={
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-600 p-2"
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
                    <DropdownMenuItem
                        onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
                                onDelete(account.$id);
                            }
                        }}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        }
                        variant="danger"
                    >
                        Excluir conta
                    </DropdownMenuItem>
                </DropdownMenu>
            </div>
            
            {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-sm text-gray-700">Cartões de Crédito</h4>
                        <Button 
                            variant="text" 
                            onClick={onAddCreditCard}
                            leftIcon={<PlusIcon className="w-4 h-4" />}
                        >
                            Adicionar Cartão
                        </Button>
                    </div>
                    
                    {creditCards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {creditCards.map((card, index) => (
                                <CreditCardItem 
                                    key={card.$id || `card-${index}`} 
                                    card={card}
                                    onViewStatement={() => onViewCreditCardStatement(card.$id)}
                                    onDelete={() => {
                                        if (confirm(`Tem certeza que deseja excluir o cartão "${card.name}"?`)) {
                                            onDeleteCreditCard(card.$id);
                                        }
                                    }}
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
    const { totalBalance, loading: loadingBalance } = useTotalBalance();
    
    // Use cached credit cards hook
    const { creditCards: allCreditCards, deleteCreditCard: deleteCreditCardFromHook, fetchCreditCards } = useCreditCardsWithCache();
    
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [activeAccountForCard, setActiveAccountForCard] = useState<string>('');

    const handleAddCreditCard = (accountId: string) => {
        setActiveAccountForCard(accountId);
        setIsAddCardModalOpen(true);
    };

    const handleCreateCreditCard = async (input: any) => {
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
        // Calculate current month for filtering
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Navigate to transactions screen with filters
        router.push(`/transactions?creditCardId=${creditCardId}&month=${month}`);
    };

    // Filter credit cards by account
    const getCreditCardsForAccount = (accountId: string) => {
        return allCreditCards.filter(card => card.account_id === accountId);
    };

    // Calculate total balance from accounts
    const calculatedTotalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    const formattedBalance = calculatedTotalBalance.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    if (loading || loadingBalance) {
        return <AccountsScreenSkeleton />;
    }

    return (
        <>
            <header className="flex justify-between items-end mb-8">
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
                    <Button 
                        leftIcon={<PlusIcon className="w-5 h-5" />}
                        onClick={() => setIsAddAccountModalOpen(true)}
                    >
                        Adicionar Conta
                    </Button>
                </div>
            </header>
            
            <main className="space-y-4">
                {accounts.length > 0 ? (
                    accounts.map((account, index) => (
                        <AccountCard
                            key={account.$id || `account-${index}`}
                            account={account}
                            creditCards={getCreditCardsForAccount(account.$id)}
                            onDelete={deleteAccount}
                            onAddCreditCard={() => handleAddCreditCard(account.$id)}
                            onDeleteCreditCard={handleDeleteCreditCard}
                            onViewCreditCardStatement={handleViewCreditCardStatement}
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
        </>
    );
}

'use client';

import React, { useMemo, useState, useEffect } from "react";
import { AVAILABLE_CATEGORY_ICONS } from "@/lib/constants";
import { TRANSACTION_CATEGORIES, getCategoryById } from "@/lib/constants/categories";
import type { Transaction as APITransaction, TransactionType } from "@/lib/types";

import { SearchIcon, FilterIcon, SwapIcon, PlusIcon, XIcon } from "@/components/assets/Icons";
import Input from "@/components/ui/Input";
import CurrencyInput from "@/components/ui/CurrencyInput";
import DateInput from "@/components/ui/DateInput";
import CategorySelect from "@/components/ui/CategorySelect";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useSearchParams } from "next/navigation";
import { getCurrentDateInUserTimezone } from "@/lib/utils/timezone";
import { ProcessDueTransactions } from "@/components/ProcessDueTransactions";
import { ImportTransactionsModal } from "@/components/transactions/ImportTransactionsModal";

// UI Transaction type for display
interface Transaction {
  $id: string;
  description: string;
  amount: number;
  date: string;
  bankName: string;
  category: string;
  type: 'credit' | 'debit' | 'pix' | 'boleto';
  direction: 'in' | 'out';
  icon: React.FC<{ className?: string }>;
  notes?: string;
  account_id?: string;
  credit_card_id?: string;
  source?: string;
  apiType?: string;
}

// Helper function to convert date string to ISO string in user's timezone
const dateToUserTimezone = (dateString: string): string => {
    // Parse the date string as YYYY-MM-DD in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date object at midnight in the local timezone
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // Get the timezone offset for this specific date
    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const tzDate = {
        year: parseInt(parts.find((p) => p.type === 'year')?.value || '0'),
        month: parseInt(parts.find((p) => p.type === 'month')?.value || '0'),
        day: parseInt(parts.find((p) => p.type === 'day')?.value || '0'),
        hour: parseInt(parts.find((p) => p.type === 'hour')?.value || '0'),
        minute: parseInt(parts.find((p) => p.type === 'minute')?.value || '0'),
        second: parseInt(parts.find((p) => p.type === 'second')?.value || '0'),
    };

    // Create a date in UTC that represents the same moment
    const utcDate = new Date(
        Date.UTC(tzDate.year, tzDate.month - 1, tzDate.day, tzDate.hour, tzDate.minute, tzDate.second),
    );

    return utcDate.toISOString();
};

const TransactionItemSkeleton: React.FC = () => (
    <li className="flex items-center py-4 px-2">
        <Skeleton className="h-10 w-10 rounded-full mr-4" />
        <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-6 w-20" />
    </li>
);

const TransactionsScreenSkeleton: React.FC = () => (
    <>
        <header className="mb-8">
            <Skeleton className="h-10 w-1/2 mb-2" />
            <Skeleton className="h-6 w-3/4" />
            <div className="mt-6 flex items-center gap-4">
                <div className="flex-grow max-w-sm">
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-10 w-28" />
            </div>
        </header>
        <main>
            {[...Array(2)].map((_, i) => (
                <div key={i} className="mb-6">
                    <Skeleton className="h-5 w-1/4 mb-4" />
                    <ul className="divide-y divide-outline bg-surface-container rounded-xl">
                        {[...Array(3)].map((_, j) => (
                            <TransactionItemSkeleton key={j} />
                        ))}
                    </ul>
                </div>
            ))}
        </main>
    </>
);

const TransactionTypeBadge: React.FC<{ type: Transaction['type'] }> = ({ type }) => {
    const typeStyles: Record<Transaction['type'], string> = {
        credit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        debit: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        pix: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        boleto: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    const typeLabels: Record<Transaction['type'], string> = {
        credit: "Crédito",
        debit: "Débito",
        pix: "Pix",
        boleto: "Boleto",
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${typeStyles[type]}`}>{typeLabels[type]}</span>
    );
};

const TransactionCategoryBadge: React.FC<{ categoryId: string }> = ({ categoryId }) => {
    const category = getCategoryById(categoryId);
    if (!category) return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Sem Categoria</span>;
    
    const categoryStyles: Record<string, string> = {
        food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        groceries: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        transport: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        housing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        utilities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        internet: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        phone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        health: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        education: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        entertainment: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
        shopping: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        travel: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        gifts: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        coffee: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        credit_card: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        credit_card_bill: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        taxes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        other_expense: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        salary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        freelance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        investment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        bonus: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        refund: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        other_income: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        balance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        transfer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${categoryStyles[categoryId] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
            {category.name}
        </span>
    );
};

const TransactionItem: React.FC<{ transaction: Transaction; onClick: () => void }> = ({ transaction, onClick }) => {
    const isIncome = transaction.direction === 'in';
    const amountColor = isIncome ? "text-secondary" : "text-on-surface";
    const formattedAmount = `${isIncome ? "+" : ""}${Math.abs(transaction.amount).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })}`;
    const Icon = transaction.icon;

    return (
        <li>
            <button
                onClick={onClick}
                className="w-full flex items-center py-3 px-2 text-left hover:bg-primary/5 rounded-lg transition-colors"
            >
                <div className="p-3 bg-primary-container rounded-full mr-4">
                    <Icon className="w-5 h-5 text-on-primary-container" />
                </div>
                <div className="flex-grow">
                    <p className="font-medium text-on-surface">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span>{transaction.bankName}</span>
                        <span className="text-outline">|</span>
                        <TransactionCategoryBadge categoryId={transaction.category} />
                        <span className="text-outline">|</span>
                        <TransactionTypeBadge type={transaction.type} />
                    </div>
                </div>
                <p className={`text-base font-medium ${amountColor}`}>{formattedAmount}</p>
            </button>
        </li>
    );
};

const formatDateForGrouping = (isoDate: string): string => {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Hoje";
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return "Ontem";
    }
    return date.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const formatDateForDetails = (isoDate: string): string => {
    return new Date(isoDate).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const ActiveFilterTag: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <div className="flex items-center bg-primary-container text-on-primary-container text-sm font-medium pl-3 pr-1 py-1 rounded-full">
        {label}
        <button onClick={onRemove} className="ml-1 p-0.5 rounded-full hover:bg-black/10">
            <XIcon className="w-4 h-4" />
        </button>
    </div>
);

export default function TransactionsPage() {
    const searchParams = useSearchParams();
    const userId = "default-user"; // TODO: Get from session
    
    // Fetch transactions from API
    const { 
        transactions: apiTransactions, 
        loading: isLoadingTransactions, 
        error: transactionsError,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        refetch,
        hasMore,
        loadMore
    } = useTransactions({ userId });
    
    // Fetch accounts and credit cards
    const { accounts } = useAccounts();
    const { creditCards: allCreditCards } = useCreditCards();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const initialNewTransactionState = {
        description: "",
        amount: 0,
        date: getCurrentDateInUserTimezone(),
        bankName: "",
        category: "",
        type: "debit" as Transaction['type'],
        direction: "in",
        notes: "",
        flow: "expense",
        accountId: "",
        creditCardId: "",
        isRecurring: false,
        recurringFrequency: "monthly" as 'daily' | 'weekly' | 'monthly' | 'yearly',
        recurringEndDate: "",
        taxAmount: undefined as number | undefined,
    };
    const [newTransaction, setNewTransaction] = useState(initialNewTransactionState);

    const [filters, setFilters] = useState({
        dateRange: "all",
        category: "all",
        account: "all",
        minAmount: "",
        maxAmount: "",
    });

    // Convert API transactions to UI format
    const transactions: Transaction[] = useMemo(() => {
        return apiTransactions.map((apiTx) => {
            // Map API type to UI TransactionType
            const mapTransactionType = (type: string, source?: string): Transaction['type'] => {
                if (source === 'integration' || source === 'import') {
                    return 'pix';
                }
                return 'credit';
            };

            // Get icon for category
            const category = getCategoryById(apiTx.category || '');
            const categoryIcon = category?.icon || SwapIcon;

            // Find account name from account_id
            const account = accounts.find((acc) => acc.$id === apiTx.account_id);
            const accountName = account?.name || (apiTx.account_id ? apiTx.account_id : 'Manual Entry');

            return {
                $id: apiTx.$id,
                description: apiTx.description || apiTx.merchant || 'Transaction',
                amount: apiTx.amount, // Amount is already signed based on direction
                date: apiTx.date,
                bankName: accountName,
                category: apiTx.category || 'Uncategorized',
                type: mapTransactionType(apiTx.type, apiTx.source),
                direction: apiTx.direction,
                icon: categoryIcon,
                notes: apiTx.description,
                account_id: apiTx.account_id,
                credit_card_id: apiTx.credit_card_id,
                source: apiTx.source,
                apiType: apiTx.type,
            };
        });
    }, [apiTransactions, accounts]);

    const allCategories = useMemo(() => [...new Set(transactions.map((tx) => tx.category))], [transactions]);
    const allAccounts = useMemo(() => [...new Set(transactions.map((tx) => tx.bankName))], [transactions]);

    const filteredTransactions = useMemo(() => {
        // Deduplicate transactions by ID first
        const uniqueTransactions = Array.from(
            new Map(transactions.map(tx => [tx.$id, tx])).values()
        );
        
        return uniqueTransactions.filter((tx) => {
            const searchMatch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = filters.category === "all" || tx.category === filters.category;
            const accountMatch = filters.account === "all" || tx.bankName === filters.account;
            const amount = Math.abs(tx.amount);
            const minAmountMatch = filters.minAmount === "" || amount >= parseFloat(filters.minAmount);
            const maxAmountMatch = filters.maxAmount === "" || amount <= parseFloat(filters.maxAmount);

            // Date filtering is now handled server-side in the useTransactions hook
            return searchMatch && categoryMatch && accountMatch && minAmountMatch && maxAmountMatch;
        });
    }, [searchTerm, filters, transactions]);

    const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
        const dateGroup = formatDateForGrouping(tx.date);
        (acc[dateGroup] = acc[dateGroup] || []).push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    const totalSum = useMemo(
        () => filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        [filteredTransactions]
    );

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const removeFilter = (filterKey: keyof typeof filters) => {
        const defaultValues = { dateRange: "all", category: "all", account: "all", minAmount: "", maxAmount: "" };
        setFilters((prev) => ({ ...prev, [filterKey]: defaultValues[filterKey] }));
    };

    const resetFilters = () => {
        setFilters({ dateRange: "all", category: "all", account: "all", minAmount: "", maxAmount: "" });
        setSearchTerm("");
    };

    const handleOpenAddModal = () => {
        setNewTransaction(initialNewTransactionState);
        setIsAddModalOpen(true);
    };

    const handleImportComplete = async (count: number) => {
        setIsImportModalOpen(false);
        await refetch();
    };

    const handleAddNewTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const finalAmount = Math.abs(newTransaction.amount);
            let transactionType: TransactionType;
            
            // Map flow to transaction type
            if (newTransaction.flow === "salary") {
                transactionType = "salary";
            } else if (newTransaction.flow === "expense") {
                transactionType = "expense";
            } else {
                transactionType = "income";
            }

            // For salary, set recurring automatically and description to "Salário"
            const isRecurring = newTransaction.flow === "salary" ? true : newTransaction.isRecurring;
            const description = newTransaction.flow === "salary" ? "Salário" : newTransaction.description;
            const recurringPattern = newTransaction.flow === "salary" 
                ? {
                    frequency: 'monthly' as const,
                    interval: 1,
                    // No endDate for salary
                }
                : newTransaction.isRecurring 
                    ? {
                        frequency: newTransaction.recurringFrequency,
                        interval: 1,
                        endDate: newTransaction.recurringEndDate || undefined,
                    }
                    : undefined;

            await createTransaction({
                amount: finalAmount,
                type: transactionType,
                category: newTransaction.category,
                description: description,
                date: dateToUserTimezone(newTransaction.date),
                currency: 'BRL',
                account_id: newTransaction.accountId || undefined,
                credit_card_id: newTransaction.creditCardId || undefined,
                merchant: newTransaction.bankName,
                tags: newTransaction.notes ? [newTransaction.notes] : undefined,
                is_recurring: isRecurring,
                recurring_pattern: recurringPattern,
                tax_amount: newTransaction.flow === "salary" && newTransaction.taxAmount ? newTransaction.taxAmount : undefined,
            });

            await refetch();
            
            setIsAddModalOpen(false);
            setNewTransaction(initialNewTransactionState);
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    const handleEditTransaction = (transaction: Transaction) => {
        // Only allow editing manual transactions
        if (transaction.source !== 'manual') {
            alert('Apenas transações manuais podem ser editadas');
            return;
        }

        setTransactionToEdit(transaction);
        setNewTransaction({
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            date: transaction.date.split('T')[0],
            bankName: transaction.bankName,
            category: transaction.category,
            type: transaction.type,
            direction: transaction.direction,
            notes: transaction.notes || '',
            flow: transaction.apiType === 'income' ? 'income' : 'expense',
            accountId: transaction.account_id || '',
            creditCardId: transaction.credit_card_id || '',
            isRecurring: false,
            recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
            recurringEndDate: '',
            taxAmount: undefined,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!transactionToEdit) return;

        try {
            const finalAmount = Math.abs(newTransaction.amount);
            const transactionType = newTransaction.flow === "expense" ? "expense" : "income";

            await updateTransaction(transactionToEdit.$id, {
                amount: finalAmount,
                type: transactionType as TransactionType,
                category: newTransaction.category,
                description: newTransaction.description,
                date: dateToUserTimezone(newTransaction.date),
                account_id: newTransaction.accountId || undefined,
            });

            await refetch();
            
            setIsEditModalOpen(false);
            setTransactionToEdit(null);
        } catch (error) {
            console.error('Error updating transaction:', error);
        }
    };

    const handleDeleteClick = (transaction: Transaction) => {
        // Only allow deleting manual transactions
        if (transaction.source !== 'manual') {
            alert('Apenas transações manuais podem ser removidas');
            return;
        }

        setTransactionToDelete(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            await deleteTransaction(transactionToDelete.$id);
            await refetch();
            
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
            setSelectedTransaction(null);
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    // Filter credit cards based on selected account
    const availableCreditCards = useMemo(() => {
        if (!newTransaction.accountId) return [];
        return allCreditCards.filter(card => card.account_id === newTransaction.accountId);
    }, [newTransaction.accountId, allCreditCards]);

    // Reset credit card selection when account changes
    useEffect(() => {
        setNewTransaction(prev => ({ ...prev, creditCardId: "" }));
    }, [newTransaction.accountId]);

    // Fetch transactions on mount and when date filter changes
    useEffect(() => {
        if (!userId) return;

        // Convert dateRange to actual date filters
        let startDate: string | undefined;
        let endDate: string | undefined;

        if (filters.dateRange !== "all") {
            const now = new Date();
            endDate = now.toISOString();

            if (filters.dateRange === "7d") {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 7);
                startDate = cutoff.toISOString();
            } else if (filters.dateRange === "30d") {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 30);
                startDate = cutoff.toISOString();
            }
        }

        // Fetch with date filters
        fetchTransactions({ userId, startDate, endDate });
    }, [userId, filters.dateRange, fetchTransactions]);

    // Show loading skeleton on initial load
    if (isLoadingTransactions && apiTransactions.length === 0) {
        return <TransactionsScreenSkeleton />;
    }

    const activeFilterCount =
        Object.values(filters).filter((v) => v !== "all" && v !== "").length + (searchTerm ? 1 : 0);

    return (
        <>
            <ProcessDueTransactions />
            <header className="mb-8">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-4xl font-light text-on-surface">Todas as Transações</h1>
                        <p className="text-base text-on-surface-variant mt-1">
                            Pesquise e filtre todo seu histórico de transações.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-on-surface-variant">Total Filtrado</p>
                        <p className={`text-3xl font-medium ${totalSum >= 0 ? "text-secondary" : "text-error"}`}>
                            {totalSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-grow max-w-md">
                        <Input
                            type="search"
                            placeholder="Buscar transações..."
                            leftIcon={<SearchIcon className="h-5 w-5 text-on-surface-variant" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        leftIcon={<FilterIcon className="w-5 h-5" />}
                    >
                        Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => setIsImportModalOpen(true)}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        }
                    >
                        Importar Extrato
                    </Button>
                    <Button leftIcon={<PlusIcon className="w-5 h-5" />} onClick={handleOpenAddModal}>
                        Adicionar Transação
                    </Button>
                </div>
            </header>

            {showFilters && (
                <Card className="p-6 mb-6 transition-all duration-200 ease-in-out">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <Input
                            id="minAmount"
                            name="minAmount"
                            label="Valor Mínimo"
                            type="number"
                            placeholder="0.00"
                            value={filters.minAmount}
                            onChange={handleFilterChange}
                        />
                        <Input
                            id="maxAmount"
                            name="maxAmount"
                            label="Valor Máximo"
                            type="number"
                            placeholder="1000.00"
                            value={filters.maxAmount}
                            onChange={handleFilterChange}
                        />
                        <div>
                            <label htmlFor="account" className="block text-sm font-medium text-on-surface-variant mb-1">
                                Conta
                            </label>
                            <select
                                id="account"
                                name="account"
                                value={filters.account}
                                onChange={handleFilterChange}
                                className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200"
                            >
                                <option value="all">Todas as Contas</option>
                                {allAccounts.sort().map((acc) => (
                                    <option key={acc} value={acc}>
                                        {acc}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="category"
                                className="block text-sm font-medium text-on-surface-variant mb-1"
                            >
                                Categoria
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200"
                            >
                                <option value="all">Todas as Categorias</option>
                                {allCategories.sort().map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="dateRange"
                                className="block text-sm font-medium text-on-surface-variant mb-1"
                            >
                                Data
                            </label>
                            <select
                                id="dateRange"
                                name="dateRange"
                                value={filters.dateRange}
                                onChange={handleFilterChange}
                                className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200"
                            >
                                <option value="all">Todo o Período</option>
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <Button variant="ghost" onClick={resetFilters}>
                            Limpar Todos os Filtros
                        </Button>
                    </div>
                </Card>
            )}

            {activeFilterCount > 0 && (
                <div className="mb-6 flex items-center gap-2 flex-wrap">
                    {searchTerm && (
                        <ActiveFilterTag label={`Search: "${searchTerm}"`} onRemove={() => setSearchTerm("")} />
                    )}
                    {filters.account !== "all" && (
                        <ActiveFilterTag
                            label={`Account: ${filters.account}`}
                            onRemove={() => removeFilter("account")}
                        />
                    )}
                    {filters.category !== "all" && (
                        <ActiveFilterTag
                            label={`Category: ${filters.category}`}
                            onRemove={() => removeFilter("category")}
                        />
                    )}
                    {filters.dateRange !== "all" && (
                        <ActiveFilterTag
                            label={`Date: Last ${filters.dateRange === "7d" ? "7" : "30"} days`}
                            onRemove={() => removeFilter("dateRange")}
                        />
                    )}
                    {(filters.minAmount || filters.maxAmount) && (
                        <ActiveFilterTag
                            label={`Amount: ${filters.minAmount || "0"} - ${filters.maxAmount || "∞"}`}
                            onRemove={() => {
                                removeFilter("minAmount");
                                removeFilter("maxAmount");
                            }}
                        />
                    )}
                </div>
            )}

            <main>
                {Object.keys(groupedTransactions).length > 0 ? (
                    <>
                        {Object.entries(groupedTransactions).map(([date, transactions], groupIndex) => (
                            <div key={`${date}-${groupIndex}`} className="mb-6">
                                <h2 className="font-medium text-sm text-on-surface-variant pb-2 border-b border-outline mb-3">
                                    {date}
                                </h2>
                                <ul className="divide-y divide-outline bg-surface-container rounded-lg p-1">
                                    {(transactions as Transaction[]).map((tx, txIndex) => (
                                        <TransactionItem
                                            key={`${tx.$id}-${txIndex}`}
                                            transaction={tx}
                                            onClick={() => setSelectedTransaction(tx)}
                                        />
                                    ))}
                                </ul>
                            </div>
                        ))}
                        
                        {/* Infinite Scroll Trigger */}
                        {hasMore && (
                            <div className="flex justify-center py-8">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={isLoadingTransactions}
                                >
                                    {isLoadingTransactions ? 'Carregando...' : 'Carregar Mais'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                        <SearchIcon className="w-12 h-12 mx-auto text-outline" />
                        <h3 className="text-xl font-medium text-on-surface mt-4">Nenhuma transação encontrada</h3>
                        <p className="text-on-surface-variant text-sm mt-1">
                            Tente ajustar sua pesquisa ou critérios de filtro.
                        </p>
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </main>

            {/* Add Transaction Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Nova Transação" maxWidth="xl">
                <form onSubmit={handleAddNewTransaction} className="flex flex-col max-h-[80vh]">
                    <div className="p-6 overflow-y-auto flex-1">
                        {/* Tipo de Transação - Full Width */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">
                                Tipo de Transação *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <label
                                    className={`text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        newTransaction.flow === "expense"
                                            ? "bg-primary-container border-primary text-on-primary-container"
                                            : "border-outline hover:bg-surface-variant/20"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="flow"
                                        value="expense"
                                        checked={newTransaction.flow === "expense"}
                                        onChange={(e) =>
                                            setNewTransaction({ ...newTransaction, flow: e.target.value, taxAmount: undefined })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="font-medium">Despesa</span>
                                </label>
                                <label
                                    className={`text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        newTransaction.flow === "income"
                                            ? "bg-primary-container border-primary text-on-primary-container"
                                            : "border-outline hover:bg-surface-variant/20"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="flow"
                                        value="income"
                                        checked={newTransaction.flow === "income"}
                                        onChange={(e) =>
                                            setNewTransaction({ ...newTransaction, flow: e.target.value, taxAmount: undefined })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="font-medium">Receita</span>
                                </label>
                                <label
                                    className={`text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        newTransaction.flow === "salary"
                                            ? "bg-primary-container border-primary text-on-primary-container"
                                            : "border-outline hover:bg-surface-variant/20"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="flow"
                                        value="salary"
                                        checked={newTransaction.flow === "salary"}
                                        onChange={(e) =>
                                            setNewTransaction({ ...newTransaction, flow: e.target.value })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="font-medium">Salário</span>
                                </label>
                            </div>
                        </div>

                        {/* Two Column Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Description - Hidden for Salary */}
                            {newTransaction.flow !== "salary" && (
                                <Input
                                    label="Descrição"
                                    id="description"
                                    value={newTransaction.description}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    required
                                />
                            )}
                            
                            <div className={newTransaction.flow === "salary" ? "col-span-1" : ""}>
                                <CurrencyInput
                                    label={newTransaction.flow === "salary" ? "Valor do Salário Bruto" : "Valor"}
                                    id="amount"
                                    value={newTransaction.amount}
                                    onChange={(value) => setNewTransaction({ ...newTransaction, amount: value })}
                                    required
                                />
                            </div>
                            
                            {/* Tax Amount - Only for Salary */}
                            {newTransaction.flow === "salary" && (
                                <>
                                    <div className="col-span-1">
                                        <CurrencyInput
                                            label="Imposto Retido na Fonte"
                                            id="taxAmount"
                                            value={newTransaction.taxAmount || 0}
                                            onChange={(value) => setNewTransaction({ ...newTransaction, taxAmount: value })}
                                        />
                                    </div>
                                    
                                    {/* Net Salary Calculation */}
                                    {newTransaction.taxAmount && newTransaction.taxAmount > 0 && (
                                        <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Salário Bruto:</span>
                                                    <span className="font-medium text-green-600">
                                                        + R$ {newTransaction.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Imposto:</span>
                                                    <span className="font-medium text-red-600">
                                                        - R$ {newTransaction.taxAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                                                    <span>Salário Líquido:</span>
                                                    <span className="text-blue-600">
                                                        R$ {(newTransaction.amount - newTransaction.taxAmount).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            <DateInput
                                label="Data"
                                id="date"
                                value={newTransaction.date}
                                onChange={(value) => setNewTransaction({ ...newTransaction, date: value })}
                                required
                            />
                            
                            {/* Account Selection */}
                            <div>
                                <label htmlFor="account" className="block text-sm font-medium text-on-surface-variant mb-1">
                                    Conta *
                                </label>
                                <select
                                    id="account"
                                    name="account"
                                    value={newTransaction.accountId}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, accountId: e.target.value })}
                                    required
                                    className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">Selecione uma conta</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.$id} value={acc.$id}>
                                            {acc.name} - {acc.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Credit Card Selection */}
                            {newTransaction.accountId && availableCreditCards.length > 0 && (
                                <div>
                                    <label htmlFor="creditCard" className="block text-sm font-medium text-on-surface-variant mb-1">
                                        Cartão de Crédito (opcional)
                                    </label>
                                    <select
                                        id="creditCard"
                                        name="creditCard"
                                        value={newTransaction.creditCardId}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, creditCardId: e.target.value })}
                                        className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">Nenhum cartão</option>
                                        {availableCreditCards.map((card) => (
                                            <option key={card.$id} value={card.$id}>
                                                {card.name} - **** {card.last_digits}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* Category Selection */}
                            <CategorySelect
                                label="Categoria"
                                id="category"
                                value={newTransaction.category}
                                onChange={(categoryId) => setNewTransaction({ ...newTransaction, category: categoryId })}
                                type={newTransaction.flow === 'expense' ? 'expense' : 'income'}
                                required
                            />
                            
                            {/* Transaction Type Selection */}
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-on-surface-variant mb-1">
                                    Tipo de Pagamento *
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    value={newTransaction.type}
                                    onChange={(e) =>
                                        setNewTransaction({ ...newTransaction, type: e.target.value as Transaction['type'] })
                                    }
                                    required
                                    className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="debit">Débito</option>
                                    <option value="pix">Pix</option>
                                    <option value="boleto">Boleto</option>
                                </select>
                            </div>
                        </div>

                        {/* Salary Recurring Info */}
                        {newTransaction.flow === "salary" && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium">Recorrência Automática</p>
                                        <p className="mt-1">
                                            Este salário será configurado como recorrente mensal sem data de término.
                                            {newTransaction.taxAmount && newTransaction.taxAmount > 0 && (
                                                <span> Uma transação de imposto também será criada automaticamente.</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes - Full Width */}
                        <div className="mt-4">
                            <textarea
                                id="notes"
                                placeholder="Observações (opcional)"
                                rows={3}
                                value={newTransaction.notes}
                                onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                                className="w-full p-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        {/* Recurring Transaction Options */}
                        <div className="border-t border-outline pt-4 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newTransaction.isRecurring}
                                    onChange={(e) => setNewTransaction({ 
                                        ...newTransaction, 
                                        isRecurring: e.target.checked 
                                    })}
                                    className="w-5 h-5 rounded border-outline text-primary focus:ring-2 focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-on-surface">
                                    Transação Recorrente
                                </span>
                            </label>
                            <p className="text-xs text-on-surface-variant mt-1 ml-7">
                                Marque se esta transação se repete regularmente
                            </p>

                            {newTransaction.isRecurring && (
                                <div className="mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="frequency" className="block text-sm font-medium text-on-surface-variant mb-1">
                                                Frequência *
                                            </label>
                                            <select
                                                id="frequency"
                                                value={newTransaction.recurringFrequency}
                                                onChange={(e) => setNewTransaction({ 
                                                    ...newTransaction, 
                                                    recurringFrequency: e.target.value as any 
                                                })}
                                                className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                            >
                                                <option value="daily">Diária</option>
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensal</option>
                                                <option value="yearly">Anual</option>
                                            </select>
                                        </div>

                                        <DateInput
                                            label="Data de Término (opcional)"
                                            id="recurringEndDate"
                                            value={newTransaction.recurringEndDate}
                                            onChange={(value) => setNewTransaction({ 
                                                ...newTransaction, 
                                                recurringEndDate: value 
                                            })}
                                        />
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-2">
                                        Deixe em branco para recorrência indefinida
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-surface-variant/20 flex justify-end gap-3 border-t border-outline sticky bottom-0">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Salvar Transação</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Transaction Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Transação" maxWidth="xl">
                <form onSubmit={handleUpdateTransaction}>
                    <div className="p-6">
                        {/* Tipo de Transação - Full Width */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">
                                Tipo de Transação *
                            </label>
                            <div className="flex gap-2">
                                <label
                                    className={`flex-1 text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        newTransaction.flow === "expense"
                                            ? "bg-primary-container border-primary text-on-primary-container"
                                            : "border-outline hover:bg-surface-variant/20"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="flow"
                                        value="expense"
                                        checked={newTransaction.flow === "expense"}
                                        onChange={(e) =>
                                            setNewTransaction({ ...newTransaction, flow: e.target.value })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="font-medium">Despesa</span>
                                </label>
                                <label
                                    className={`flex-1 text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        newTransaction.flow === "income"
                                            ? "bg-primary-container border-primary text-on-primary-container"
                                            : "border-outline hover:bg-surface-variant/20"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="flow"
                                        value="income"
                                        checked={newTransaction.flow === "income"}
                                        onChange={(e) =>
                                            setNewTransaction({ ...newTransaction, flow: e.target.value })
                                        }
                                        className="sr-only"
                                    />
                                    <span className="font-medium">Receita</span>
                                </label>
                            </div>
                        </div>

                        {/* Two Column Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Descrição"
                                id="description"
                                value={newTransaction.description}
                                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                required
                            />
                            
                            <CurrencyInput
                                label="Valor"
                                id="amount"
                                value={newTransaction.amount}
                                onChange={(value) => setNewTransaction({ ...newTransaction, amount: value })}
                                required
                            />
                            
                            <DateInput
                                label="Data"
                                id="date"
                                value={newTransaction.date}
                                onChange={(value) => setNewTransaction({ ...newTransaction, date: value })}
                                required
                            />
                            
                            <div>
                                <label htmlFor="account" className="block text-sm font-medium text-on-surface-variant mb-1">
                                    Conta *
                                </label>
                                <select
                                    id="account"
                                    name="account"
                                    value={newTransaction.accountId}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, accountId: e.target.value })}
                                    required
                                    className="w-full h-12 px-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">Selecione uma conta</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.$id} value={acc.$id}>
                                            {acc.name} - {acc.balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <CategorySelect
                                label="Categoria"
                                id="category"
                                value={newTransaction.category}
                                onChange={(categoryId) => setNewTransaction({ ...newTransaction, category: categoryId })}
                                type={newTransaction.flow === 'expense' ? 'expense' : 'income'}
                                required
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-surface-variant/20 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                title="Confirmar Exclusão"
            >
                <div className="p-6">
                    <p className="text-on-surface mb-4">
                        Tem certeza que deseja excluir esta transação?
                    </p>
                    {transactionToDelete && (
                        <div className="bg-surface-variant/20 p-4 rounded-lg mb-6">
                            <p className="font-medium text-on-surface">{transactionToDelete.description}</p>
                            <p className="text-2xl font-light text-on-surface mt-1">
                                {transactionToDelete.amount.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </p>
                            <p className="text-sm text-on-surface-variant mt-1">
                                {formatDateForDetails(transactionToDelete.date)}
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-error mb-6">
                        Esta ação não pode ser desfeita e o saldo da conta será recalculado.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleConfirmDelete}
                            className="bg-error text-on-error hover:bg-error/90"
                        >
                            Excluir Transação
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <Modal
                    isOpen={!!selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    title="Detalhes da Transação"
                >
                    <div className="p-6">
                        <header className="text-center pb-4 border-b border-outline">
                            <p className="text-3xl font-light text-on-surface">{selectedTransaction.description}</p>
                            <p
                                className={`text-4xl font-light mt-1 ${
                                    selectedTransaction.direction === 'in' ? "text-secondary" : "text-on-surface"
                                }`}
                            >
                                {Math.abs(selectedTransaction.amount).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </p>
                            {selectedTransaction.source !== 'manual' && (
                                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-primary-container text-on-primary-container rounded-full">
                                    Importada
                                </span>
                            )}
                        </header>
                        <dl className="mt-4 space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-on-surface-variant">Data</dt>
                                <dd className="font-medium text-on-surface">
                                    {formatDateForDetails(selectedTransaction.date)}
                                </dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-on-surface-variant">Categoria</dt>
                                <dd><TransactionCategoryBadge categoryId={selectedTransaction.category} /></dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-on-surface-variant">Conta</dt>
                                <dd className="font-medium text-on-surface">{selectedTransaction.bankName}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-on-surface-variant">Tipo</dt>
                                <dd className="font-medium text-on-surface">
                                    <TransactionTypeBadge type={selectedTransaction.type} />
                                </dd>
                            </div>
                            {selectedTransaction.notes && (
                                <div className="pt-3 border-t border-outline">
                                    <dt className="text-on-surface-variant mb-1">Observações</dt>
                                    <dd className="text-on-surface text-sm bg-surface-variant/20 p-2 rounded-m whitespace-pre-wrap">
                                        {selectedTransaction.notes}
                                    </dd>
                                </div>
                            )}
                        </dl>
                        <div className="mt-6 flex justify-between gap-3">
                            <div className="flex gap-3">
                                {/* Only show edit/delete for manual transactions owned by current user */}
                                {selectedTransaction.source === 'manual' && (selectedTransaction as any).user_id === userId && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => {
                                                handleEditTransaction(selectedTransaction);
                                                setSelectedTransaction(null);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleDeleteClick(selectedTransaction)}
                                            className="text-error border-error hover:bg-error/10"
                                        >
                                            Excluir
                                        </Button>
                                    </>
                                )}
                                {/* Show read-only indicator for shared transactions */}
                                {(selectedTransaction as any).user_id !== userId && (
                                    <span className="text-sm text-gray-500 px-3 py-2 bg-gray-100 rounded-md">
                                        Somente Leitura - Transação compartilhada
                                    </span>
                                )}
                            </div>
                            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Import Transactions Modal */}
            <ImportTransactionsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={handleImportComplete}
                accounts={accounts}
            />
        </>
    );
}

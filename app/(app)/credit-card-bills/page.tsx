'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCardIcon, CalendarIcon, DollarSignIcon, PlusIcon, EditIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/assets/Icons';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { useAllCreditCards } from '@/hooks/useAllCreditCards';
import { useCreditCardTransactions } from '@/hooks/useCreditCardTransactions';
import { getCategoryById } from '@/lib/constants/categories';
import CreateTransactionModal from './CreateTransactionModal';
import EditTransactionModal from './EditTransactionModal';
import PayBillModal from './PayBillModal';
import { Transaction } from '@/lib/types';

interface Bill {
  month: string;
  year: number;
  closingDate: Date;
  dueDate: Date;
  transactions: Transaction[];
  totalAmount: number;
  isPaid: boolean;
  isOpen: boolean;
  isClosed?: boolean;
}

const TransactionCategoryBadge: React.FC<{ categoryId?: string }> = ({ categoryId }) => {
  if (!categoryId) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Sem Categoria</span>;
  const category = getCategoryById(categoryId);
  if (!category) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Sem Categoria</span>;
  
  const categoryStyles: Record<string, string> = {
    food: "bg-orange-100 text-orange-800",
    groceries: "bg-green-100 text-green-800",
    transport: "bg-blue-100 text-blue-800",
    housing: "bg-purple-100 text-purple-800",
    utilities: "bg-yellow-100 text-yellow-800",
    internet: "bg-cyan-100 text-cyan-800",
    phone: "bg-indigo-100 text-indigo-800",
    health: "bg-red-100 text-red-800",
    education: "bg-blue-100 text-blue-800",
    entertainment: "bg-pink-100 text-pink-800",
    shopping: "bg-purple-100 text-purple-800",
    travel: "bg-teal-100 text-teal-800",
    gifts: "bg-rose-100 text-rose-800",
    coffee: "bg-amber-100 text-amber-800",
    credit_card: "bg-gray-100 text-gray-800",
    credit_card_bill: "bg-slate-100 text-slate-800",
    taxes: "bg-red-100 text-red-800",
    other_expense: "bg-gray-100 text-gray-800",
    salary: "bg-emerald-100 text-emerald-800",
    freelance: "bg-green-100 text-green-800",
    investment: "bg-blue-100 text-blue-800",
    bonus: "bg-yellow-100 text-yellow-800",
    refund: "bg-cyan-100 text-cyan-800",
    other_income: "bg-green-100 text-green-800",
    balance: "bg-indigo-100 text-indigo-800",
    transfer: "bg-gray-100 text-gray-800",
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryStyles[categoryId] || "bg-gray-100 text-gray-800"}`}>
      {category.name}
    </span>
  );
};

const CreditCardBillsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const { creditCards, loading } = useAllCreditCards();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedBillMonth, setSelectedBillMonth] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  
  // Estados para expandir/recolher seções
  const [expandedSections, setExpandedSections] = useState({
    subscriptions: true,
    installments: true,
    singlePurchases: true,
  });

  const toggleSection = (section: 'subscriptions' | 'installments' | 'singlePurchases') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Use o hook otimizado de transações
  const startDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // Últimos 6 meses
    return date;
  }, []);

  useEffect(() => console.log("selectedCardId:", selectedCardId), [selectedCardId]);

  const {
    transactions: rawTransactions,
    loading: loadingTransactions,
  } = useCreditCardTransactions({
    creditCardId: selectedCardId || undefined,
    startDate,
    enableRealtime: true,
  });

  // Mapeia as transações para o formato esperado
  const transactions = useMemo(() => {
    if (!selectedCardId) {
      return [];
    }
    return rawTransactions.filter((t) => t.credit_card_id === selectedCardId);
  }, [rawTransactions, selectedCardId]);

  // Check URL params for cardId and select it
  useEffect(() => {
    const cardIdFromUrl = searchParams.get('cardId');
    
    if (cardIdFromUrl && creditCards.length > 0) {
      const cardExists = creditCards.some(card => card.$id === cardIdFromUrl);
      if (cardExists) {
        setSelectedCardId(cardIdFromUrl);
      }
    } else if (creditCards.length > 0 && !selectedCardId) {
      // Auto-select first card if no URL param
      setSelectedCardId(creditCards[0].$id);
    }
  }, [creditCards, searchParams, selectedCardId]);

  const selectedCard = useMemo(() => {
    const card = creditCards.find((card) => card.$id === selectedCardId);
    return card;
  }, [creditCards, selectedCardId]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}`;
  };

  const formatMonthYear = (month: string, year: number) => {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Parse card settings
  const getCardSettings = (card: any) => {
    try {
      const data = card.data ? JSON.parse(card.data) : {};
      return {
        closingDay: card.closing_day || data.closing_day || 10,
        dueDay: card.due_day || data.due_day || 15,
        limit: card.credit_limit || data.limit || 0,
      };
    } catch {
      return {
        closingDay: card.closing_day || 10,
        dueDay: card.due_day || 15,
        limit: card.credit_limit || 0,
      };
    }
  };

  // Calculate bills based on transactions and card settings
  // TODO: Migrar para usar apenas dbBills (bills do banco de dados)
  // Por enquanto mantemos o cálculo manual para compatibilidade
  const bills = useMemo(() => {
    if (!selectedCard || transactions.length === 0) {
      return [];
    }

    const settings = getCardSettings(selectedCard);
    const billsMap = new Map<string, Bill>();
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Reset time for accurate date comparison

    transactions.forEach((transaction) => {
      // Parse the date string to avoid timezone issues
      const transactionDate = new Date(transaction.date);
      const transactionDay = transactionDate.getUTCDate();
      const transactionMonth = transactionDate.getUTCMonth();
      const transactionYear = transactionDate.getUTCFullYear();

      // Simple logic: transaction goes to the bill of its month
      // unless it's on or after the closing day, then it goes to next month
      // Example with closing day 30:
      // - Transaction on 20/08 (day 20 < 30) -> August bill
      // - Transaction on 30/08 (day 30 >= 30) -> September bill

      let billMonth = transactionMonth;
      let billYear = transactionYear;

      // If transaction is on or after closing day, it goes to next month's bill
      if (transactionDay >= settings.closingDay) {
        billMonth += 1;
        if (billMonth > 11) {
          billMonth = 0;
          billYear += 1;
        }
      }

      // Calculate closing date for this bill (the day when bill closes)
      const closingDate = new Date(billYear, billMonth, settings.closingDay);
      closingDate.setHours(0, 0, 0, 0);

      // Calculate due date for this bill
      let dueMonth = billMonth;
      let dueYear = billYear;
      
      // If due day is before or equal to closing day, due date is in next month
      if (settings.dueDay <= settings.closingDay) {
        dueMonth += 1;
        if (dueMonth > 11) {
          dueMonth = 0;
          dueYear += 1;
        }
      }
      
      const dueDate = new Date(dueYear, dueMonth, settings.dueDay);
      dueDate.setHours(23, 59, 59, 999);

      // Bill name is based on the due date month (not closing month)
      const billKey = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}`;

      // Bill is visible until the day after due date
      const isOpen = today <= dueDate;

      // Bill is closed if today is after closing date
      const isClosed = today > closingDate;

      if (!billsMap.has(billKey)) {
        billsMap.set(billKey, {
          month: String(dueMonth + 1).padStart(2, '0'),
          year: dueYear,
          closingDate,
          dueDate,
          transactions: [],
          totalAmount: 0,
          isPaid: false,
          isOpen,
          isClosed,
        });
      }

      const bill = billsMap.get(billKey)!;
      bill.transactions.push(transaction);
      bill.totalAmount += transaction.amount;
    });

    // Convert to array and sort by date (newest first)
    return Array.from(billsMap.values()).sort((a, b) => {
      return b.year - a.year || parseInt(b.month) - parseInt(a.month);
    });
  }, [selectedCard, transactions]);

  // Filter only open bills (before due date)
  const openBills = useMemo(() => {
    const filteredBills = bills.filter((bill) => bill.isOpen);
    filteredBills.sort((a, b) => {
      const dateA = new Date(a.year, parseInt(a.month) - 1);
      const dateB = new Date(b.year, parseInt(b.month) - 1);
      return dateA.getTime() - dateB.getTime();
    })
    return filteredBills;
  }, [bills]);

  // Calculate current bill total (only the first open bill)
  const currentBillTotal = useMemo(() => {
    if (openBills.length === 0) return 0;
    // Show only the first open bill (the one that will be paid next)
    return openBills[0].totalAmount;
  }, [openBills]);

  // Calculate total used limit (all open bills that are not closed yet)
  const totalUsedLimit = useMemo(() => {
    if (openBills.length === 0) return 0;
    // Sum all bills that are not closed yet
    return openBills
      .filter((bill) => !bill.isClosed)
      .reduce((acc, bill) => acc + bill.totalAmount, 0);
  }, [openBills]);

  const availableLimit = useMemo(() => {
    if (!selectedCard) return 0;
    const settings = getCardSettings(selectedCard);
    return settings.limit - totalUsedLimit;
  }, [selectedCard, totalUsedLimit]);

  // Auto-select first open bill
  useEffect(() => {
    if (openBills.length > 0 && !selectedBillMonth) {
      setSelectedBillMonth(`${openBills[0].year}-${openBills[0].month}`);
    }
  }, [openBills, selectedBillMonth]);

  const selectedBill = useMemo(() => {
    return openBills.find((bill) => `${bill.year}-${bill.month}` === selectedBillMonth);
  }, [openBills, selectedBillMonth]);

  const handleTransactionCreated = () => {
    // Invalida o cache e recarrega as transações
    // invalidateTransactionsCache();
  };

  if (loading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='mb-6'>
          <Skeleton className='h-9 w-80 mb-2' />
          <Skeleton className='h-5 w-64' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
        </div>
        <Skeleton className='h-96' />
      </div>
    );
  }

  if (creditCards.length === 0) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-3xl font-normal text-on-surface'>Faturas do Cartão de Crédito</h1>
          <p className='text-on-surface-variant mt-1'>Gerencie suas faturas e parcelamentos</p>
        </div>

        <Card>
          <div className='p-12 text-center'>
            <CreditCardIcon className='w-16 h-16 text-on-surface-variant/30 mx-auto mb-4' />
            <p className='text-on-surface-variant text-lg mb-2'>Nenhum cartão de crédito cadastrado</p>
            <p className='text-on-surface-variant/70 text-sm'>
              Cadastre um cartão de crédito na página de Contas para começar a gerenciar suas faturas.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const settings = selectedCard ? getCardSettings(selectedCard) : null;

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-normal text-on-surface'>Faturas do Cartão de Crédito</h1>
          <p className='text-on-surface-variant mt-1'>Gerencie suas faturas e parcelamentos</p>
        </div>
        {selectedCard && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors'
          >
            <PlusIcon className='w-5 h-5' />
            Nova Transação
          </button>
        )}
      </div>

      {/* Tabs for Credit Cards */}
      <div className='mb-6 border-b border-outline'>
        <div className='flex justify-between items-center'>
          <div className='flex gap-2 overflow-x-auto'>
            {creditCards.map((card) => (
              <button
                key={card.$id}
                onClick={() => {
                  setSelectedCardId(card.$id);
                  // Remove cardId from URL when manually switching tabs
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('cardId');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  selectedCardId === card.$id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <CreditCardIcon className='w-4 h-4' />
                  {card.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedCard && settings && (
        <>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant font-medium'>Fatura Atual</p>
                  <p className='text-2xl font-semibold text-on-surface mt-1'>{formatCurrency(currentBillTotal)}</p>
                  <p className='text-xs text-on-surface-variant mt-1'>
                    {openBills.length > 0 && openBills[0].transactions.length > 0
                      ? `${openBills[0].transactions.length} transação(ões)`
                      : 'Nenhuma transação'}
                  </p>
                </div>
                <CreditCardIcon className='w-8 h-8 text-primary' />
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant font-medium'>Próximo Vencimento</p>
                  <p className='text-2xl font-semibold text-on-surface mt-1'>
                    {openBills.length > 0 ? formatDate(openBills[0].dueDate.toISOString()) : `Dia ${settings.dueDay}`}
                  </p>
                  <p className='text-xs text-on-surface-variant mt-1'>
                    Fechamento: {openBills.length > 0 ? formatDate(openBills[0].closingDate.toISOString()) : `Dia ${settings.closingDay}`}
                  </p>
                </div>
                <CalendarIcon className='w-8 h-8 text-secondary' />
              </div>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-on-surface-variant font-medium'>Limite Disponível</p>
                  <p className='text-2xl font-semibold text-on-surface mt-1'>{formatCurrency(availableLimit)}</p>
                  <p className='text-xs text-on-surface-variant mt-1'>Limite total: {formatCurrency(settings.limit)}</p>
                </div>
                <DollarSignIcon className='w-8 h-8 text-tertiary' />
              </div>
            </Card>
          </div>

          {/* Bills Tabs */}
          {openBills.length > 0 && (
            <div className='mb-6 border-b border-outline'>
              <div className='flex gap-2 overflow-x-auto'>
                {openBills.map((bill) => {
                  const billKey = `${bill.year}-${bill.month}`;
                  return (
                    <button
                      key={billKey}
                      onClick={() => setSelectedBillMonth(billKey)}
                      className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                        selectedBillMonth === billKey
                          ? 'border-primary text-primary'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
                      }`}
                    >
                      <div className='flex flex-col items-start'>
                        <span>{formatMonthYear(bill.month, bill.year)}</span>
                        <span className='text-xs'>{formatCurrency(bill.totalAmount)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bills List */}
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <div className='flex items-center gap-3'>
                    <h2 className='text-xl font-semibold text-on-surface'>
                      {selectedBill ? `Fatura de ${formatMonthYear(selectedBill.month, selectedBill.year)}` : `Faturas de ${selectedCard.name}`}
                    </h2>
                    {selectedBill && selectedBill.isClosed && (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error/10 text-error'>
                        Fechada
                      </span>
                    )}
                    {selectedBill && !selectedBill.isClosed && (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success'>
                        Aberta
                      </span>
                    )}
                  </div>
                  {selectedBill && (
                    <p className='text-sm text-on-surface-variant mt-1'>
                      Fechamento: {formatDate(selectedBill.closingDate.toISOString())} • Vencimento: {formatDate(selectedBill.dueDate.toISOString())}
                    </p>
                  )}
                </div>
                {selectedBill && (
                  <div className='text-right'>
                    <p className='text-sm text-on-surface-variant mb-1'>Valor Total</p>
                    <p className='text-2xl font-bold text-primary'>{formatCurrency(selectedBill.totalAmount)}</p>
                  </div>
                )}
              </div>

              {selectedBill && !selectedBill.isPaid && (
                <div className="mb-4">
                  <Button
                    onClick={() => setPayingBill(selectedBill)}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    Pagar Fatura - {formatCurrency(selectedBill.totalAmount)}
                  </Button>
                </div>
              )}

              {loadingTransactions ? (
                <div className='space-y-3'>
                  <Skeleton className='h-16' />
                  <Skeleton className='h-16' />
                  <Skeleton className='h-16' />
                </div>
              ) : openBills.length === 0 ? (
                <div className='text-center py-12'>
                  <CreditCardIcon className='w-16 h-16 text-on-surface-variant/30 mx-auto mb-4' />
                  <p className='text-on-surface-variant text-lg mb-2'>Nenhuma fatura aberta</p>
                  <p className='text-on-surface-variant/70 text-sm mb-4'>
                    As faturas serão geradas automaticamente quando você adicionar transações no cartão.
                  </p>
                  <div className='max-w-md mx-auto text-left bg-surface-variant/20 rounded-lg p-4 mt-6'>
                    <p className='text-sm font-medium text-on-surface mb-2'>Configurações do Cartão:</p>
                    <ul className='text-sm text-on-surface-variant space-y-1'>
                      <li>• Dia de fechamento: {settings.closingDay}</li>
                      <li>• Dia de vencimento: {settings.dueDay}</li>
                      <li>• Limite: {formatCurrency(settings.limit)}</li>
                    </ul>
                  </div>
                </div>
              ) : selectedBill ? (
                (() => {
                  // Função de ordenação: primeiro por data (mais recente), depois por valor (maior)
                  const sortTransactions = (transactions: Transaction[]) => {
                    return [...transactions].sort((a, b) => {
                      const dateA = new Date(a.credit_card_transaction_created_at || a.date).getTime();
                      const dateB = new Date(b.credit_card_transaction_created_at || b.date).getTime();
                      
                      // Ordenar por data (mais recente primeiro)
                      if (dateB !== dateA) {
                        return dateB - dateA;
                      }
                      
                      // Se as datas forem iguais, ordenar por valor (maior primeiro)
                      return b.amount - a.amount;
                    });
                  };
                  
                  // Separate transactions into categories
                  const subscriptions = sortTransactions(selectedBill.transactions.filter(t => t.is_recurring));
                  const installments = sortTransactions(selectedBill.transactions.filter(t => !t.is_recurring && t.installments && t.installments > 1));
                  const singlePurchases = sortTransactions(selectedBill.transactions.filter(t => !t.is_recurring && (!t.installments || t.installments === 1)));
                  
                  const subscriptionsTotal = subscriptions.reduce((sum, t) => sum + t.amount, 0);
                  const installmentsTotal = installments.reduce((sum, t) => sum + t.amount, 0);
                  const singlePurchasesTotal = singlePurchases.reduce((sum, t) => sum + t.amount, 0);
                  
                  const renderTransactionRow = (transaction: Transaction) => {
                    const cleanDescription = transaction.description || transaction.merchant || 'Transação';
                    
                    return (
                      <tr
                        key={transaction.$id}
                        className='border-b border-outline/50 hover:bg-surface-variant/20 transition-colors group'
                      >
                        <td className='py-3 px-4'>
                          <p className='font-medium text-on-surface'>{cleanDescription}</p>
                          {transaction.merchant && transaction.merchant !== cleanDescription && (
                            <p className='text-xs text-on-surface-variant mt-0.5'>{transaction.merchant}</p>
                          )}
                        </td>
                        <td className='py-3 px-4'>
                          <p className='text-sm text-on-surface-variant'>{formatDate(transaction.credit_card_transaction_created_at || transaction.date)}</p>
                        </td>
                        <td className='py-3 px-4'>
                          <TransactionCategoryBadge categoryId={transaction.category} />
                        </td>
                        <td className='py-3 px-4 text-center'>
                          {transaction.is_recurring ? (
                            <span className='inline-block text-xs px-2 py-1 rounded font-medium bg-tertiary/10 text-tertiary'>
                              Recorrente
                            </span>
                          ) : transaction.installments && transaction.installments > 1 ? (
                            <span className='inline-block text-xs px-2 py-1 rounded font-medium bg-secondary/10 text-secondary'>
                              {transaction.installment} de {transaction.installments}
                            </span>
                          ) : (
                            <span className='inline-block text-xs px-2 py-1 rounded font-medium bg-surface-variant/50 text-on-surface-variant'>
                              À vista
                            </span>
                          )}
                        </td>
                        <td className='py-3 px-4 text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <p className='font-semibold text-on-surface'>{formatCurrency(transaction.amount)}</p>
                            <button
                              onClick={() => setEditingTransaction(transaction)}
                              className='opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 rounded-lg transition-all'
                              title='Editar transação'
                            >
                              <EditIcon className='w-4 h-4 text-primary' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  };
                  
                  return (
                    <div className='space-y-8'>
                      {/* Subscriptions Section */}
                      {subscriptions.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSection('subscriptions')}
                            className='w-full flex items-center justify-between mb-4 hover:bg-surface-variant/20 p-3 rounded-lg transition-colors'
                          >
                            <h3 className='text-lg font-semibold text-on-surface flex items-center gap-2'>
                              <span className='w-1 h-6 bg-tertiary rounded'></span>
                              Assinaturas Recorrentes
                              <span className='text-sm font-normal text-on-surface-variant'>
                                ({subscriptions.length} {subscriptions.length === 1 ? 'transação' : 'transações'})
                              </span>
                            </h3>
                            <div className='flex items-center gap-3'>
                              <span className='text-lg font-bold text-tertiary'>{formatCurrency(subscriptionsTotal)}</span>
                              {expandedSections.subscriptions ? (
                                <ChevronUpIcon className='w-5 h-5 text-on-surface-variant' />
                              ) : (
                                <ChevronDownIcon className='w-5 h-5 text-on-surface-variant' />
                              )}
                            </div>
                          </button>
                          {expandedSections.subscriptions && (
                            <div className='overflow-x-auto'>
                              <table className='w-full'>
                                <thead>
                                  <tr className='border-b border-outline'>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Descrição</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Data da Compra</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Categoria</th>
                                    <th className='text-center py-3 px-4 text-sm font-semibold text-on-surface'>Tipo</th>
                                    <th className='text-right py-3 px-4 text-sm font-semibold text-on-surface'>Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subscriptions.map(renderTransactionRow)}
                                </tbody>
                                <tfoot>
                                  <tr className='border-t border-outline'>
                                    <td colSpan={4} className='py-3 px-4'>
                                      <p className='font-semibold text-on-surface'>Subtotal Assinaturas</p>
                                    </td>
                                    <td className='py-3 px-4 text-right'>
                                      <p className='font-bold text-tertiary'>{formatCurrency(subscriptionsTotal)}</p>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Installments Section */}
                      {installments.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSection('installments')}
                            className='w-full flex items-center justify-between mb-4 hover:bg-surface-variant/20 p-3 rounded-lg transition-colors'
                          >
                            <h3 className='text-lg font-semibold text-on-surface flex items-center gap-2'>
                              <span className='w-1 h-6 bg-secondary rounded'></span>
                              Compras Parceladas
                              <span className='text-sm font-normal text-on-surface-variant'>
                                ({installments.length} {installments.length === 1 ? 'parcela' : 'parcelas'})
                              </span>
                            </h3>
                            <div className='flex items-center gap-3'>
                              <span className='text-lg font-bold text-secondary'>{formatCurrency(installmentsTotal)}</span>
                              {expandedSections.installments ? (
                                <ChevronUpIcon className='w-5 h-5 text-on-surface-variant' />
                              ) : (
                                <ChevronDownIcon className='w-5 h-5 text-on-surface-variant' />
                              )}
                            </div>
                          </button>
                          {expandedSections.installments && (
                            <div className='overflow-x-auto'>
                              <table className='w-full'>
                                <thead>
                                  <tr className='border-b border-outline'>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Descrição</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Data da Compra</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Categoria</th>
                                    <th className='text-center py-3 px-4 text-sm font-semibold text-on-surface'>Parcela</th>
                                    <th className='text-right py-3 px-4 text-sm font-semibold text-on-surface'>Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installments.map(renderTransactionRow)}
                                </tbody>
                                <tfoot>
                                  <tr className='border-t border-outline'>
                                    <td colSpan={4} className='py-3 px-4'>
                                      <p className='font-semibold text-on-surface'>Subtotal Parceladas</p>
                                    </td>
                                    <td className='py-3 px-4 text-right'>
                                      <p className='font-bold text-secondary'>{formatCurrency(installmentsTotal)}</p>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Single Purchases Section */}
                      {singlePurchases.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleSection('singlePurchases')}
                            className='w-full flex items-center justify-between mb-4 hover:bg-surface-variant/20 p-3 rounded-lg transition-colors'
                          >
                            <h3 className='text-lg font-semibold text-on-surface flex items-center gap-2'>
                              <span className='w-1 h-6 bg-primary rounded'></span>
                              Compras à Vista
                              <span className='text-sm font-normal text-on-surface-variant'>
                                ({singlePurchases.length} {singlePurchases.length === 1 ? 'compra' : 'compras'})
                              </span>
                            </h3>
                            <div className='flex items-center gap-3'>
                              <span className='text-lg font-bold text-primary'>{formatCurrency(singlePurchasesTotal)}</span>
                              {expandedSections.singlePurchases ? (
                                <ChevronUpIcon className='w-5 h-5 text-on-surface-variant' />
                              ) : (
                                <ChevronDownIcon className='w-5 h-5 text-on-surface-variant' />
                              )}
                            </div>
                          </button>
                          {expandedSections.singlePurchases && (
                            <div className='overflow-x-auto'>
                              <table className='w-full'>
                                <thead>
                                  <tr className='border-b border-outline'>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Descrição</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Data da Compra</th>
                                    <th className='text-left py-3 px-4 text-sm font-semibold text-on-surface'>Categoria</th>
                                    <th className='text-center py-3 px-4 text-sm font-semibold text-on-surface'>Tipo</th>
                                    <th className='text-right py-3 px-4 text-sm font-semibold text-on-surface'>Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {singlePurchases.map(renderTransactionRow)}
                                </tbody>
                                <tfoot>
                                  <tr className='border-t border-outline'>
                                    <td colSpan={4} className='py-3 px-4'>
                                      <p className='font-semibold text-on-surface'>Subtotal à Vista</p>
                                    </td>
                                    <td className='py-3 px-4 text-right'>
                                      <p className='font-bold text-primary'>{formatCurrency(singlePurchasesTotal)}</p>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : null}
            </div>
          </Card>
        </>
      )}

      {/* Create Transaction Modal */}
      {isCreateModalOpen && selectedCard && (
        <CreateTransactionModal
          creditCard={selectedCard}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleTransactionCreated}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && selectedCard && (
        <EditTransactionModal
          transaction={editingTransaction}
          creditCard={selectedCard}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleTransactionCreated}
        />
      )}

      {/* Pay Bill Modal */}
      {payingBill && selectedCard && (
        <PayBillModal
          bill={payingBill}
          creditCard={selectedCard}
          onClose={() => setPayingBill(null)}
          onSuccess={() => {
            handleTransactionCreated();
            setPayingBill(null);
          }}
        />
      )}
    </div>
  );
};

export default CreditCardBillsPage;

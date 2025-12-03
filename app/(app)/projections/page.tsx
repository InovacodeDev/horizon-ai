'use client';

import React, { useState, useEffect } from "react";
import { 
    ShoppingCartIcon, UtensilsIcon, CarIcon, HeartIcon, PlaneIcon, 
    BriefcaseIcon, HomeIcon, GiftIcon, ReceiptIcon, TrendingUpIcon, 
    TrendingDownIcon, UsersIcon, HelpCircleIcon, WalletIcon, DollarSignIcon, 
    FileTextIcon, RefreshCwIcon, LandmarkIcon, SparklesIcon, SettingsIcon 
} from "@/components/assets/Icons";
import type { Category } from "@/lib/types";
import CategoryHistoryModal from "@/components/modals/CategoryHistoryModal";
import { getCategoryProjectionsAction } from "@/actions/projection.actions";

// Map category names to icons
const getCategoryIcon = (name: string) => {
    const normalized = name.toLowerCase();
    // Income
    if (normalized.includes('salário') || normalized.includes('salary') || normalized.includes('paycheck')) return WalletIcon;
    if (normalized.includes('renda') || normalized.includes('income')) return DollarSignIcon;
    if (normalized.includes('freelance') || normalized.includes('extra')) return BriefcaseIcon;
    if (normalized.includes('dividend') || normalized.includes('investimento') || normalized.includes('vendas')) return TrendingUpIcon;
    if (normalized.includes('reembolso') || normalized.includes('refund')) return RefreshCwIcon;
    if (normalized.includes('bônus') || normalized.includes('bonus')) return GiftIcon;
    if (normalized.includes('saldo') || normalized.includes('balance') || normalized.includes('ajuste')) return LandmarkIcon;

    // Expenses
    if (normalized.includes('shopping') || normalized.includes('compras') || normalized.includes('mercado') || normalized.includes('roupas') || normalized.includes('eletrônicos')) return ShoppingCartIcon;
    if (normalized.includes('food') || normalized.includes('restaurante') || normalized.includes('alimentação') || normalized.includes('ifood')) return UtensilsIcon;
    if (normalized.includes('transport') || normalized.includes('uber') || normalized.includes('combustível') || normalized.includes('transporte')) return CarIcon;
    if (normalized.includes('health') || normalized.includes('saúde') || normalized.includes('farmácia') || normalized.includes('médico')) return HeartIcon;
    if (normalized.includes('travel') || normalized.includes('viagem') || normalized.includes('passagem')) return PlaneIcon;
    if (normalized.includes('work') || normalized.includes('trabalho') || normalized.includes('escritório')) return BriefcaseIcon;
    if (normalized.includes('home') || normalized.includes('casa') || normalized.includes('aluguel') || normalized.includes('condomínio') || normalized.includes('luz') || normalized.includes('internet')) return HomeIcon;
    if (normalized.includes('gift') || normalized.includes('presente')) return GiftIcon;
    if (normalized.includes('bill') || normalized.includes('conta') || normalized.includes('boleto') || normalized.includes('assinaturas')) return ReceiptIcon;
    if (normalized.includes('family') || normalized.includes('família') || normalized.includes('escola') || normalized.includes('educação')) return UsersIcon;
    if (normalized.includes('lazer') || normalized.includes('entertainment') || normalized.includes('diversão')) return SparklesIcon;
    if (normalized.includes('serviços') || normalized.includes('services')) return SettingsIcon;
    if (normalized.includes('telefone') || normalized.includes('celular') || normalized.includes('internet')) return SmartphoneIcon; // Assuming SmartphoneIcon exists or use generic
    if (normalized.includes('imposto') || normalized.includes('tax')) return FileTextIcon;

    return HelpCircleIcon;
};

// Fallback for missing icon
const SmartphoneIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
);

interface CategoryProjectionItem extends Category {
    type: 'income' | 'expense';
    currentMonthSpend: number;
    projectionNextMonth: number;
    projectionMonthAfter: number;
    reasoningNextMonth?: string;
    reasoningMonthAfter?: string;
    detectedPatterns?: string[];
    history: { month: string; amount: number }[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryProjectionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryProjectionItem | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await getCategoryProjectionsAction();
                if (result.success) {
                    const mappedCategories: CategoryProjectionItem[] = result.projections.map((p, index) => ({
                        $id: `cat-${index}`,
                        name: p.category,
                        type: p.type,
                        icon: getCategoryIcon(p.category),
                        currentMonthSpend: p.currentMonth,
                        projectionNextMonth: p.projectionNextMonth,
                        projectionMonthAfter: p.projectionMonthAfter,
                        reasoningNextMonth: p.reasoningNextMonth,
                        reasoningMonthAfter: p.reasoningMonthAfter,
                        detectedPatterns: p.detectedPatterns,
                        history: p.history,
                    }));
                    setCategories(mappedCategories);
                }
            } catch (error) {
                console.error("Failed to fetch category projections", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCategoryClick = (category: CategoryProjectionItem) => {
        setSelectedCategory(category);
        setIsHistoryModalOpen(true);
    };

    // Get current month name
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const getMonthName = (date: Date) => date.toLocaleString('pt-BR', { month: 'short' });

    return (
        <>
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-normal text-on-surface">Projeções</h1>
                    <p className="text-base text-on-surface-variant mt-1">
                        Consumo atual e projeções inteligentes com IA.
                    </p>
                </div>
            </header>
            <main className="space-y-10">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : categories.length > 0 ? (
                    <>
                        {/* Income Section */}
                        {categories.some(c => c.type === 'income') && (
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                        <TrendingUpIcon className="w-5 h-5" />
                                    </div>
                                    Receitas
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categories.filter(c => c.type === 'income').map((category) => {
                                        const Icon = category.icon;
                                        const cardBgClass = "bg-green-500/10 dark:bg-green-500/10 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700";
                                        const iconBgClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";

                                        return (
                                            <div 
                                                key={category.$id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group ${cardBgClass}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-3 rounded-xl transition-colors ${iconBgClass}`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{category.name}</h3>
                                                    </div>
                                                    {category.detectedPatterns && category.detectedPatterns.length > 0 && (
                                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Padrão detectado pela IA" />
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                            Receita Atual ({getMonthName(now)})
                                                        </p>
                                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(category.currentMonthSpend)}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projeção {getMonthName(nextMonth)}</p>
                                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                                {formatCurrency(category.projectionNextMonth)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projeção {getMonthName(monthAfter)}</p>
                                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                                {formatCurrency(category.projectionMonthAfter)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Expense Section */}
                        {categories.some(c => c.type === 'expense') && (
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                        <TrendingDownIcon className="w-5 h-5" />
                                    </div>
                                    Despesas
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categories.filter(c => c.type === 'expense').map((category) => {
                                        const Icon = category.icon;
                                        const cardBgClass = "bg-red-500/10 dark:bg-red-500/10 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700";
                                        const iconBgClass = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";

                                        return (
                                            <div 
                                                key={category.$id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group ${cardBgClass}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-3 rounded-xl transition-colors ${iconBgClass}`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{category.name}</h3>
                                                    </div>
                                                    {category.detectedPatterns && category.detectedPatterns.length > 0 && (
                                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Padrão detectado pela IA" />
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                            Gasto Atual ({getMonthName(now)})
                                                        </p>
                                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(category.currentMonthSpend)}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projeção {getMonthName(nextMonth)}</p>
                                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                                {formatCurrency(category.projectionNextMonth)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projeção {getMonthName(monthAfter)}</p>
                                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                                {formatCurrency(category.projectionMonthAfter)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-lg">Nenhuma transação encontrada nos últimos meses.</p>
                        <p className="text-sm mt-2">Comece a adicionar transações para ver suas projeções.</p>
                    </div>
                )}
            </main>
            
            {selectedCategory && (
                <CategoryHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    data={{
                        category: selectedCategory.name,
                        currentMonth: selectedCategory.currentMonthSpend,
                        projectionNextMonth: selectedCategory.projectionNextMonth,
                        projectionMonthAfter: selectedCategory.projectionMonthAfter,
                        reasoningNextMonth: selectedCategory.reasoningNextMonth,
                        reasoningMonthAfter: selectedCategory.reasoningMonthAfter,
                        detectedPatterns: selectedCategory.detectedPatterns,
                        history: selectedCategory.history,
                    }}
                />
            )}
        </>
    );
}

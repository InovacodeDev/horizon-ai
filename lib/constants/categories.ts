import {
  BriefcaseIcon,
  CarIcon,
  CreditCardIcon,
  DollarSignIcon,
  GiftIcon,
  HeartIcon,
  HomeIcon,
  LandmarkIcon,
  PlaneIcon,
  ReceiptIcon,
  RepeatIcon,
  ShoppingCartIcon,
  SparklesIcon,
  SwapIcon,
  TargetIcon,
  TrendingUpIcon,
  UtensilsIcon,
  WalletIcon,
  ZapIcon,
} from '@/components/assets/Icons';

export interface TransactionCategory {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  type: 'expense' | 'income' | 'both';
  color: string;
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  // Expense Categories
  {
    id: 'food',
    name: 'Alimentação',
    icon: UtensilsIcon,
    type: 'expense',
    color: 'text-orange-500',
  },
  {
    id: 'groceries',
    name: 'Supermercado',
    icon: ShoppingCartIcon,
    type: 'expense',
    color: 'text-green-500',
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: CarIcon,
    type: 'expense',
    color: 'text-blue-500',
  },
  {
    id: 'housing',
    name: 'Moradia',
    icon: HomeIcon,
    type: 'expense',
    color: 'text-purple-500',
  },
  {
    id: 'utilities',
    name: 'Contas',
    icon: ZapIcon,
    type: 'expense',
    color: 'text-yellow-500',
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: ZapIcon,
    type: 'expense',
    color: 'text-cyan-500',
  },
  {
    id: 'phone',
    name: 'Telefone',
    icon: ZapIcon,
    type: 'expense',
    color: 'text-indigo-500',
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: HeartIcon,
    type: 'expense',
    color: 'text-red-500',
  },
  {
    id: 'education',
    name: 'Educação',
    icon: TargetIcon,
    type: 'expense',
    color: 'text-blue-600',
  },
  {
    id: 'entertainment',
    name: 'Entretenimento',
    icon: SparklesIcon,
    type: 'expense',
    color: 'text-pink-500',
  },
  {
    id: 'shopping',
    name: 'Compras',
    icon: ShoppingCartIcon,
    type: 'expense',
    color: 'text-purple-600',
  },
  {
    id: 'travel',
    name: 'Viagens',
    icon: PlaneIcon,
    type: 'expense',
    color: 'text-teal-500',
  },
  {
    id: 'gifts',
    name: 'Presentes',
    icon: GiftIcon,
    type: 'expense',
    color: 'text-rose-500',
  },
  {
    id: 'coffee',
    name: 'Café & Lanches',
    icon: UtensilsIcon,
    type: 'expense',
    color: 'text-amber-600',
  },
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    icon: CreditCardIcon,
    type: 'expense',
    color: 'text-gray-600',
  },
  {
    id: 'credit_card_bill',
    name: 'Fatura de Cartão',
    icon: CreditCardIcon,
    type: 'expense',
    color: 'text-slate-600',
  },
  {
    id: 'taxes',
    name: 'Impostos',
    icon: LandmarkIcon,
    type: 'expense',
    color: 'text-red-600',
  },
  {
    id: 'other_expense',
    name: 'Outras Despesas',
    icon: SwapIcon,
    type: 'expense',
    color: 'text-gray-500',
  },

  // Income Categories
  {
    id: 'salary',
    name: 'Salário',
    icon: BriefcaseIcon,
    type: 'income',
    color: 'text-green-600',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: DollarSignIcon,
    type: 'income',
    color: 'text-emerald-500',
  },
  {
    id: 'investment',
    name: 'Investimentos',
    icon: TrendingUpIcon,
    type: 'income',
    color: 'text-blue-600',
  },
  {
    id: 'bonus',
    name: 'Bônus',
    icon: GiftIcon,
    type: 'income',
    color: 'text-yellow-600',
  },
  {
    id: 'refund',
    name: 'Reembolso',
    icon: ReceiptIcon,
    type: 'income',
    color: 'text-cyan-600',
  },
  {
    id: 'other_income',
    name: 'Outras Receitas',
    icon: DollarSignIcon,
    type: 'income',
    color: 'text-green-500',
  },

  // Both
  {
    id: 'balance',
    name: 'Saldo Inicial',
    icon: WalletIcon,
    type: 'both',
    color: 'text-indigo-600',
  },
  {
    id: 'transfer',
    name: 'Transferência',
    icon: RepeatIcon,
    type: 'both',
    color: 'text-gray-600',
  },
];

// Helper functions
export const getCategoryById = (id: string): TransactionCategory | undefined => {
  return TRANSACTION_CATEGORIES.find((cat) => cat.id === id);
};

export const getCategoryByName = (name: string): TransactionCategory | undefined => {
  return TRANSACTION_CATEGORIES.find((cat) => cat.name.toLowerCase() === name.toLowerCase());
};

export const getExpenseCategories = (): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES.filter((cat) => cat.type === 'expense' || cat.type === 'both');
};

export const getIncomeCategories = (): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES.filter((cat) => cat.type === 'income' || cat.type === 'both');
};

export const getAllCategories = (): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES;
};

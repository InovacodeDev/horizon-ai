/**
 * Investment Types
 * Sistema de gerenciamento de investimentos
 */

export type InvestmentType =
  | 'stocks' // Ações
  | 'fiis' // Fundos Imobiliários
  | 'fixed_income' // Renda Fixa (CDB, LCI, LCA, Tesouro)
  | 'crypto' // Criptomoedas
  | 'funds' // Fundos de Investimento
  | 'etf' // ETFs
  | 'pension' // Previdência Privada
  | 'other'; // Outros

export type InvestmentStatus = 'active' | 'sold' | 'matured';

export interface Investment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  account_id: string;
  name: string;
  type: InvestmentType;
  ticker?: string; // Código do ativo (ex: PETR4, BTCUSD)
  quantity: number;
  purchase_price: number; // Preço de compra unitário
  purchase_date: string;
  current_price: number; // Preço atual unitário
  status: InvestmentStatus;
  data?: string; // JSON com dados adicionais
  created_at: string;
  updated_at: string;
}

export interface InvestmentData {
  broker?: string; // Corretora
  notes?: string;
  maturity_date?: string; // Data de vencimento (renda fixa)
  yield_rate?: number; // Taxa de rendimento (%)
  indexer?: string; // Indexador (CDI, IPCA, etc)
  category?: string; // Categoria específica
}

export interface CreateInvestmentDto {
  account_id: string;
  name: string;
  type: InvestmentType;
  ticker?: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  current_price?: number;
  broker?: string;
  notes?: string;
  maturity_date?: string;
  yield_rate?: number;
  indexer?: string;
}

export interface UpdateInvestmentDto {
  name?: string;
  quantity?: number;
  current_price?: number;
  status?: InvestmentStatus;
  broker?: string;
  notes?: string;
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalGain: number;
  totalGainPercentage: number;
  byType: Record<
    InvestmentType,
    {
      invested: number;
      current: number;
      gain: number;
      gainPercentage: number;
    }
  >;
}

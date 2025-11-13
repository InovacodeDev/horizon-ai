// ============================================
// Import System Types
// ============================================

/**
 * Error codes for import operations
 */
export enum ImportErrorCode {
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NO_TRANSACTIONS_FOUND = 'NO_TRANSACTIONS_FOUND',
  DUPLICATE_IMPORT = 'DUPLICATE_IMPORT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  MISSING_REQUIRED_COLUMNS = 'MISSING_REQUIRED_COLUMNS',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT_FORMAT = 'INVALID_AMOUNT_FORMAT',
  MALFORMED_FILE = 'MALFORMED_FILE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
}

/**
 * Custom error class for import operations
 */
export class ImportError extends Error {
  constructor(
    message: string,
    public code: ImportErrorCode,
    public details?: any,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

/**
 * Supported file formats for import
 */
export type ImportFileFormat = 'ofx' | 'csv';

/**
 * Import status
 */
export type ImportStatus = 'completed' | 'failed' | 'partial';

/**
 * Parsed transaction from file (before mapping to DTO)
 */
export interface ParsedTransaction {
  id: string; // Temporary ID for preview
  date: string; // ISO 8601 format
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category?: string;
  externalId?: string; // FITID, Identificador, etc.
  metadata?: Record<string, any>;
}

/**
 * Import record entity (stored in database)
 */
export interface ImportRecord {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  account_id: string;
  file_name: string;
  file_format: ImportFileFormat;
  transaction_count: number;
  import_date: string;
  status: ImportStatus;
  error_message?: string;
  metadata?: string; // JSON string
}

/**
 * Import metadata stored in ImportRecord.metadata
 */
export interface ImportMetadata {
  duplicateCount?: number;
  failedCount?: number;
  successCount?: number;
  processingTimeMs?: number;
  fileSize?: number;
  parsedCount?: number;
}

/**
 * Transaction metadata for imported transactions
 */
export interface ImportTransactionMetadata {
  source: 'import';
  externalId?: string; // FITID, Identificador
  importId?: string; // Reference to import record
  importDate: string;
  originalDescription?: string;
  fileFormat?: ImportFileFormat;
}

/**
 * Result of preview import operation
 */
export interface ImportPreviewResult {
  transactions: ParsedTransaction[];
  duplicates: Set<string>; // IDs of potential duplicates
  summary: {
    total: number;
    income: number;
    expense: number;
    duplicateCount: number;
    totalAmount: number;
  };
  matchedAccountId?: string; // ID of matched account from OFX file
  accountInfo?: OFXAccountInfo; // Account info from OFX file
}

/**
 * Result of process import operation
 */
export interface ImportResult {
  imported: number;
  failed: number;
  importId: string;
  errors?: Array<{
    transaction: ParsedTransaction;
    error: string;
  }>;
}

/**
 * Column mapping for CSV files
 */
export interface ColumnMapping {
  date?: number; // Column index
  amount?: number;
  description?: number;
  type?: number;
  category?: number;
  externalId?: number;
}

/**
 * OFX transaction data structure
 */
export interface OFXTransaction {
  TRNTYPE: string; // CREDIT, DEBIT, etc.
  DTPOSTED: string; // Date posted
  TRNAMT: string; // Transaction amount
  FITID: string; // Financial institution transaction ID
  NAME?: string; // Payee name
  MEMO?: string; // Memo
  CHECKNUM?: string; // Check number
}

/**
 * OFX account information
 */
export interface OFXAccountInfo {
  BANKID?: string; // Bank ID
  BRANCHID?: string; // Branch ID
  ACCTID?: string; // Account ID
  ACCTTYPE?: string; // Account type
}

/**
 * OFX file structure
 */
export interface OFXData {
  version: '1' | '2'; // OFX version
  accountInfo?: OFXAccountInfo;
  transactions: OFXTransaction[];
}

/**
 * CSV row data
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Parser interface that all parsers must implement
 */
export interface Parser {
  /**
   * Check if this parser can handle the file
   */
  canParse(file: File): boolean;

  /**
   * Parse file and extract transactions
   */
  parse(fileContent: string): Promise<ParsedTransaction[]>;
}

/**
 * API request for preview import
 */
export interface ImportPreviewRequest {
  file: File;
  accountId: string;
}

/**
 * API response for preview import
 */
export interface ImportPreviewResponse {
  success: boolean;
  data?: {
    transactions: ParsedTransaction[];
    duplicates: string[]; // IDs of potential duplicates
    summary: {
      total: number;
      income: number;
      expense: number;
      duplicateCount: number;
      totalAmount: number;
    };
    matchedAccountId?: string; // ID of matched account from OFX file
    accountInfo?: OFXAccountInfo; // Account info from OFX file
  };
  error?: string;
}

/**
 * API request for process import
 */
export interface ImportProcessRequest {
  accountId: string;
  transactions: ParsedTransaction[];
  fileName: string;
}

/**
 * API response for process import
 */
export interface ImportProcessResponse {
  success: boolean;
  data?: {
    imported: number;
    failed: number;
    importId: string;
  };
  error?: string;
}

/**
 * API response for import history
 */
export interface ImportHistoryResponse {
  success: boolean;
  data?: ImportRecord[];
  error?: string;
}

/**
 * Error message with suggestion for fixing
 */
export interface ErrorMessageWithSuggestion {
  message: string;
  suggestion?: string;
}

/**
 * User-friendly error messages in Portuguese with suggestions
 */
export const ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  [ImportErrorCode.INVALID_FILE_FORMAT]: 'Formato de arquivo não suportado. Use .ofx ou .csv',
  [ImportErrorCode.FILE_TOO_LARGE]: 'Arquivo muito grande. O tamanho máximo é 10MB',
  [ImportErrorCode.PARSE_ERROR]: 'Erro ao processar o arquivo. Verifique se o formato está correto',
  [ImportErrorCode.VALIDATION_ERROR]: 'Dados inválidos encontrados no arquivo',
  [ImportErrorCode.NO_TRANSACTIONS_FOUND]: 'Nenhuma transação encontrada no arquivo',
  [ImportErrorCode.DUPLICATE_IMPORT]: 'Este arquivo já foi importado anteriormente',
  [ImportErrorCode.DATABASE_ERROR]: 'Erro ao salvar as transações. Tente novamente',
  [ImportErrorCode.AI_SERVICE_ERROR]: 'Erro ao processar arquivo. Tente novamente mais tarde',
  [ImportErrorCode.MISSING_REQUIRED_COLUMNS]:
    'Colunas obrigatórias não encontradas. Verifique se o arquivo contém Data, Valor e Descrição',
  [ImportErrorCode.INVALID_DATE_FORMAT]: 'Formato de data inválido. Use DD/MM/YYYY, YYYY-MM-DD ou DD-MM-YYYY',
  [ImportErrorCode.INVALID_AMOUNT_FORMAT]: 'Formato de valor inválido. Use números com vírgula ou ponto decimal',
  [ImportErrorCode.MALFORMED_FILE]: 'Arquivo corrompido ou mal formatado',
  [ImportErrorCode.UNAUTHORIZED]: 'Você não tem permissão para importar para esta conta',
  [ImportErrorCode.ACCOUNT_NOT_FOUND]: 'Conta não encontrada',
};

/**
 * Detailed error messages with suggestions for fixing common errors
 */
export const ERROR_MESSAGES_WITH_SUGGESTIONS: Record<ImportErrorCode, ErrorMessageWithSuggestion> = {
  [ImportErrorCode.INVALID_FILE_FORMAT]: {
    message: 'Formato de arquivo não suportado',
    suggestion:
      'Certifique-se de que o arquivo tem extensão .ofx ou .csv. Baixe o extrato diretamente do site do seu banco.',
  },
  [ImportErrorCode.FILE_TOO_LARGE]: {
    message: 'Arquivo muito grande',
    suggestion:
      'O tamanho máximo permitido é 10MB. Tente importar um período menor ou divida o arquivo em partes menores.',
  },
  [ImportErrorCode.PARSE_ERROR]: {
    message: 'Erro ao processar o arquivo',
    suggestion:
      'Verifique se o arquivo não está corrompido. Tente baixar o extrato novamente do site do seu banco ou use um formato diferente (OFX ou CSV).',
  },
  [ImportErrorCode.VALIDATION_ERROR]: {
    message: 'Dados inválidos encontrados no arquivo',
    suggestion:
      'Algumas transações contêm dados inválidos. Verifique se as datas estão no formato correto e os valores são numéricos.',
  },
  [ImportErrorCode.NO_TRANSACTIONS_FOUND]: {
    message: 'Nenhuma transação encontrada no arquivo',
    suggestion:
      'O arquivo parece estar vazio ou não contém transações. Verifique se você baixou o extrato correto do seu banco.',
  },
  [ImportErrorCode.DUPLICATE_IMPORT]: {
    message: 'Este arquivo já foi importado anteriormente',
    suggestion:
      'As transações deste arquivo já existem no sistema. Verifique o histórico de importações ou selecione um período diferente.',
  },
  [ImportErrorCode.DATABASE_ERROR]: {
    message: 'Erro ao salvar as transações',
    suggestion:
      'Ocorreu um erro ao salvar no banco de dados. Verifique sua conexão com a internet e tente novamente em alguns instantes.',
  },
  [ImportErrorCode.AI_SERVICE_ERROR]: {
    message: 'Erro ao processar arquivo',
    suggestion: 'Ocorreu um erro ao processar o arquivo. Tente novamente mais tarde ou use um arquivo OFX ou CSV.',
  },
  [ImportErrorCode.MISSING_REQUIRED_COLUMNS]: {
    message: 'Colunas obrigatórias não encontradas',
    suggestion:
      'O arquivo CSV deve conter as colunas: Data, Valor e Descrição. Verifique se o cabeçalho do arquivo está correto ou baixe o extrato em formato OFX.',
  },
  [ImportErrorCode.INVALID_DATE_FORMAT]: {
    message: 'Formato de data inválido',
    suggestion:
      'As datas devem estar no formato DD/MM/YYYY, YYYY-MM-DD ou DD-MM-YYYY. Verifique o formato das datas no arquivo.',
  },
  [ImportErrorCode.INVALID_AMOUNT_FORMAT]: {
    message: 'Formato de valor inválido',
    suggestion:
      'Os valores devem ser números com vírgula ou ponto decimal (ex: 100,50 ou 100.50). Remova símbolos de moeda e espaços.',
  },
  [ImportErrorCode.MALFORMED_FILE]: {
    message: 'Arquivo corrompido ou mal formatado',
    suggestion:
      'O arquivo parece estar corrompido. Tente baixar o extrato novamente do site do seu banco ou abra o arquivo para verificar se está legível.',
  },
  [ImportErrorCode.UNAUTHORIZED]: {
    message: 'Você não tem permissão para importar para esta conta',
    suggestion: 'Verifique se você selecionou a conta correta ou se tem permissão para acessá-la.',
  },
  [ImportErrorCode.ACCOUNT_NOT_FOUND]: {
    message: 'Conta não encontrada',
    suggestion: 'A conta selecionada não existe ou foi removida. Selecione outra conta ou crie uma nova.',
  },
};

/**
 * Get error message with suggestion
 */
export function getErrorMessage(code: ImportErrorCode, includesSuggestion: boolean = true): string {
  if (includesSuggestion) {
    const errorInfo = ERROR_MESSAGES_WITH_SUGGESTIONS[code];
    return errorInfo.suggestion ? `${errorInfo.message}. ${errorInfo.suggestion}` : errorInfo.message;
  }
  return ERROR_MESSAGES[code];
}

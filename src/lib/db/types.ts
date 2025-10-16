export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "FREE" | "PREMIUM";
export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
export type TransactionType = "DEBIT" | "CREDIT";
export type ConnectionStatus = "ACTIVE" | "EXPIRED" | "ERROR" | "DISCONNECTED";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string | null;
          last_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          password_hash: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      refresh_tokens: {
        Row: {
          id: string;
          hashed_token: string;
          user_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          hashed_token: string;
          user_id: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hashed_token?: string;
          user_id?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          institution_id: string;
          institution_name: string;
          encrypted_access_token: string;
          encrypted_refresh_token: string | null;
          token_expires_at: string | null;
          status: ConnectionStatus;
          last_sync_at: string | null;
          consent_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          institution_id: string;
          institution_name: string;
          encrypted_access_token: string;
          encrypted_refresh_token?: string | null;
          token_expires_at?: string | null;
          status?: ConnectionStatus;
          last_sync_at?: string | null;
          consent_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          institution_id?: string;
          institution_name?: string;
          encrypted_access_token?: string;
          encrypted_refresh_token?: string | null;
          token_expires_at?: string | null;
          status?: ConnectionStatus;
          last_sync_at?: string | null;
          consent_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          connection_id: string;
          user_id: string;
          external_id: string;
          account_type: AccountType;
          account_number: string | null;
          balance: string;
          currency: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          connection_id: string;
          user_id: string;
          external_id: string;
          account_type: AccountType;
          account_number?: string | null;
          balance: string;
          currency?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          connection_id?: string;
          user_id?: string;
          external_id?: string;
          account_type?: AccountType;
          account_number?: string | null;
          balance?: string;
          currency?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          external_id: string;
          type: TransactionType;
          amount: string;
          description: string;
          category: string | null;
          transaction_date: string;
          created_at: string;
        };
        Insert: {
          id: string;
          account_id: string;
          user_id: string;
          external_id: string;
          type: TransactionType;
          amount: string;
          description: string;
          category?: string | null;
          transaction_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          external_id?: string;
          type?: TransactionType;
          amount?: string;
          description?: string;
          category?: string | null;
          transaction_date?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      account_type: AccountType;
      transaction_type: TransactionType;
      connection_status: ConnectionStatus;
    };
  };
}

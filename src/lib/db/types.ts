export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null;
          account_type: Database["public"]["Enums"]["account_type"];
          balance: number;
          connection_id: string;
          created_at: string;
          currency: string;
          external_id: string;
          id: string;
          name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_number?: string | null;
          account_type: Database["public"]["Enums"]["account_type"];
          balance: number;
          connection_id: string;
          created_at?: string;
          currency?: string;
          external_id: string;
          id: string;
          name?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_number?: string | null;
          account_type?: Database["public"]["Enums"]["account_type"];
          balance?: number;
          connection_id?: string;
          created_at?: string;
          currency?: string;
          external_id?: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_connection_id_fkey";
            columns: ["connection_id"];
            isOneToOne: false;
            referencedRelation: "connections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      connections: {
        Row: {
          consent_expires_at: string | null;
          created_at: string;
          encrypted_access_token: string;
          encrypted_refresh_token: string | null;
          id: string;
          institution_id: string;
          institution_name: string;
          last_sync_at: string | null;
          status: Database["public"]["Enums"]["connection_status"];
          token_expires_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          consent_expires_at?: string | null;
          created_at?: string;
          encrypted_access_token: string;
          encrypted_refresh_token?: string | null;
          id: string;
          institution_id: string;
          institution_name: string;
          last_sync_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
          token_expires_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          consent_expires_at?: string | null;
          created_at?: string;
          encrypted_access_token?: string;
          encrypted_refresh_token?: string | null;
          id?: string;
          institution_id?: string;
          institution_name?: string;
          last_sync_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
          token_expires_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      refresh_tokens: {
        Row: {
          created_at: string;
          expires_at: string;
          hashed_token: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          hashed_token: string;
          id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          hashed_token?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          category: string | null;
          created_at: string;
          description: string;
          external_id: string;
          id: string;
          transaction_date: string;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category?: string | null;
          created_at?: string;
          description: string;
          external_id: string;
          id: string;
          transaction_date: string;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category?: string | null;
          created_at?: string;
          description?: string;
          external_id?: string;
          id?: string;
          transaction_date?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          password_hash: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          password_hash: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          password_hash?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
      connection_status: "ACTIVE" | "EXPIRED" | "ERROR" | "DISCONNECTED";
      transaction_type: "DEBIT" | "CREDIT";
      user_role: "FREE" | "PREMIUM";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_type: ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT"],
      connection_status: ["ACTIVE", "EXPIRED", "ERROR", "DISCONNECTED"],
      transaction_type: ["DEBIT", "CREDIT"],
      user_role: ["FREE", "PREMIUM"],
    },
  },
} as const;

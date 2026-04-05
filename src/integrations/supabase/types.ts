export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          type: "cash" | "credit_card" | "bank";
          created_at: string;
        }
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          type: "cash" | "credit_card" | "bank";
          created_at?: string;
        }
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          type?: "cash" | "credit_card" | "bank";
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          type: "income" | "expense";
          created_at: string;
        }
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          type: "income" | "expense";
          created_at?: string;
        }
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          type?: "income" | "expense";
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          prazo: string
          updated_at: string | null
          user_id: string
          valor_alvo: number
          valor_atual: number | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          prazo: string
          updated_at?: string | null
          user_id: string
          valor_alvo: number
          valor_atual?: number | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          prazo?: string
          updated_at?: string | null
          user_id?: string
          valor_alvo?: number
          valor_atual?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          onboarding_complete: boolean | null
          pj_ativo: boolean | null
          regime_tributario: string | null
          renda_principal: number | null
          saldo_inicial: number | null
          tipo_pessoa: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome?: string | null
          onboarding_complete?: boolean | null
          pj_ativo?: boolean | null
          regime_tributario?: string | null
          renda_principal?: number | null
          saldo_inicial?: number | null
          tipo_pessoa?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          onboarding_complete?: boolean | null
          pj_ativo?: boolean | null
          regime_tributario?: string | null
          renda_principal?: number | null
          saldo_inicial?: number | null
          tipo_pessoa?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          workspace_id: string
          created_by_user_id: string
          category_id: string | null
          account_id: string | null
          type: "income" | "expense"
          amount: number
          description: string | null
          date: string | null
          paid_by_user_id: string | null
          assigned_to_user_id: string | null
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          created_by_user_id: string
          category_id?: string | null
          account_id?: string | null
          type: "income" | "expense"
          amount: number
          description?: string | null
          date?: string | null
          paid_by_user_id?: string | null
          assigned_to_user_id?: string | null
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          created_by_user_id?: string
          category_id?: string | null
          account_id?: string | null
          type?: "income" | "expense"
          amount?: number
          description?: string | null
          date?: string | null
          paid_by_user_id?: string | null
          assigned_to_user_id?: string | null
          is_shared?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          role: "owner" | "editor" | "viewer"
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: "owner" | "editor" | "viewer"
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: "owner" | "editor" | "viewer"
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          created_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          created_by: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          created_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_workspace_write_role: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: { Args: { _workspace_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

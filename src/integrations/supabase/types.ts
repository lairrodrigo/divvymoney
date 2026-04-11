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
      credit_cards: {
        Row: {
          created_at: string | null
          fechamento_dia: number
          id: string
          limite: number
          nome: string
          updated_at: string | null
          user_id: string
          vencimento_dia: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          fechamento_dia: number
          id?: string
          limite?: number
          nome: string
          updated_at?: string | null
          user_id: string
          vencimento_dia: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          fechamento_dia?: number
          id?: string
          limite?: number
          nome?: string
          updated_at?: string | null
          user_id?: string
          vencimento_dia?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          created_at: string | null
          id: string
          percentual: number | null
          reference_month: string
          renda_declarada: number | null
          updated_at: string | null
          user_id: string
          valor_devido: number | null
          valor_pago: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          percentual?: number | null
          reference_month: string
          renda_declarada?: number | null
          updated_at?: string | null
          user_id: string
          valor_devido?: number | null
          valor_pago?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          percentual?: number | null
          reference_month?: string
          renda_declarada?: number | null
          updated_at?: string | null
          user_id?: string
          valor_devido?: number | null
          valor_pago?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
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
          },
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
      shopping_items: {
        Row: {
          comprado: boolean | null
          created_at: string | null
          foto_url: string | null
          id: string
          list_id: string
          nome: string
          observacao: string | null
          preco_estimado: number | null
          preco_real: number | null
          quantidade: number
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          comprado?: boolean | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          list_id: string
          nome: string
          observacao?: string | null
          preco_estimado?: number | null
          preco_real?: number | null
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          comprado?: boolean | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          list_id?: string
          nome?: string
          observacao?: string | null
          preco_estimado?: number | null
          preco_real?: number | null
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          status: string
          updated_at: string | null
          user_id: string
          valor_estimado: number | null
          valor_real: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string | null
          user_id: string
          valor_estimado?: number | null
          valor_real?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          valor_estimado?: number | null
          valor_real?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cartao_id: string | null
          categoria: string
          created_at: string | null
          created_by: string | null
          descricao: string
          id: string
          origem: string | null
          parcela_atual: number | null
          parcelado: boolean | null
          reference_month: string
          reference_year: number
          subtipo: string
          tipo: string
          total_parcelas: number | null
          transaction_date: string
          updated_at: string | null
          user_id: string
          valor: number
          workspace_id: string | null
        }
        Insert: {
          cartao_id?: string | null
          categoria: string
          created_at?: string | null
          created_by?: string | null
          descricao: string
          id?: string
          origem?: string | null
          parcela_atual?: number | null
          parcelado?: boolean | null
          reference_month: string
          reference_year: number
          subtipo: string
          tipo: string
          total_parcelas?: number | null
          transaction_date: string
          updated_at?: string | null
          user_id: string
          valor: number
          workspace_id?: string | null
        }
        Update: {
          cartao_id?: string | null
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          id?: string
          origem?: string | null
          parcela_atual?: number | null
          parcelado?: boolean | null
          reference_month?: string
          reference_year?: number
          subtipo?: string
          tipo?: string
          total_parcelas?: number | null
          transaction_date?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
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
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_workspace_with_owner: {
        Args: { workspace_name: string }
        Returns: {
          ws_created_at: string
          ws_created_by: string
          ws_id: string
          ws_name: string
        }[]
      }
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

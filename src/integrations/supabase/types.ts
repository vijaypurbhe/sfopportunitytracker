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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          opportunity_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          opportunity_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          opportunity_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_approvals: {
        Row: {
          approved_by: string | null
          assigned_resources: Json | null
          checklist: Json | null
          comments: string | null
          created_at: string
          gate_type: Database["public"]["Enums"]["gate_type"]
          id: string
          opportunity_id: string
          requested_by: string
          status: Database["public"]["Enums"]["gate_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          assigned_resources?: Json | null
          checklist?: Json | null
          comments?: string | null
          created_at?: string
          gate_type: Database["public"]["Enums"]["gate_type"]
          id?: string
          opportunity_id: string
          requested_by: string
          status?: Database["public"]["Enums"]["gate_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          assigned_resources?: Json | null
          checklist?: Json | null
          comments?: string | null
          created_at?: string
          gate_type?: Database["public"]["Enums"]["gate_type"]
          id?: string
          opportunity_id?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["gate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_approvals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_gate_id: string | null
          related_opportunity_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_gate_id?: string | null
          related_opportunity_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_gate_id?: string | null
          related_opportunity_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_gate_id_fkey"
            columns: ["related_gate_id"]
            isOneToOne: false
            referencedRelation: "gate_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          abort_reason: string | null
          account_category: string | null
          account_details: Json | null
          account_ibg: string | null
          account_ibu: string | null
          account_id: string | null
          account_name: string | null
          account_owner: string | null
          account_sbu: string | null
          acv_fy_23_24: number | null
          acv_fy_24_25: number | null
          acv_fy_25_26: number | null
          acv_fy_26_27: number | null
          acv_fy_27_28: number | null
          alliance_details: Json | null
          assigned_presales_id: string | null
          bid_manager: string | null
          bid_submission_date: string | null
          billing_end_date: string | null
          billing_start_date: string | null
          booked_month: string | null
          city: string | null
          competitor_name: string | null
          contract_tenure_months: number | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_line: string | null
          duns_details: Json | null
          ebitda_percent: number | null
          expected_close_date: string | null
          financial_details: Json | null
          hibernated_by_system: string | null
          ibu: string | null
          id: string
          manager_alias: string | null
          metadata: Json | null
          opportunity_category: string | null
          opportunity_created_date: string | null
          opportunity_id: string | null
          opportunity_modified_date: string | null
          opportunity_name: string
          opportunity_owner: string | null
          opportunity_owner_gid: string | null
          overall_booking_value_tcv: number | null
          overall_tcv: number | null
          parent_opportunity_id: string | null
          pricing_model: string | null
          primary_industry: string | null
          prime_status: string | null
          quarter: string | null
          reason_for_loss: string | null
          reason_for_win: string | null
          remaining_years_projection: number | null
          sales_channel: string | null
          sales_specialist_name: string | null
          sales_stage: string | null
          secondary_industry: string | null
          stage: string | null
          total_resources: number | null
          type_of_business: string | null
          updated_at: string
          user_ibg: string | null
          user_ibu: string | null
          user_sbu: string | null
          win_probability: number | null
        }
        Insert: {
          abort_reason?: string | null
          account_category?: string | null
          account_details?: Json | null
          account_ibg?: string | null
          account_ibu?: string | null
          account_id?: string | null
          account_name?: string | null
          account_owner?: string | null
          account_sbu?: string | null
          acv_fy_23_24?: number | null
          acv_fy_24_25?: number | null
          acv_fy_25_26?: number | null
          acv_fy_26_27?: number | null
          acv_fy_27_28?: number | null
          alliance_details?: Json | null
          assigned_presales_id?: string | null
          bid_manager?: string | null
          bid_submission_date?: string | null
          billing_end_date?: string | null
          billing_start_date?: string | null
          booked_month?: string | null
          city?: string | null
          competitor_name?: string | null
          contract_tenure_months?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_line?: string | null
          duns_details?: Json | null
          ebitda_percent?: number | null
          expected_close_date?: string | null
          financial_details?: Json | null
          hibernated_by_system?: string | null
          ibu?: string | null
          id?: string
          manager_alias?: string | null
          metadata?: Json | null
          opportunity_category?: string | null
          opportunity_created_date?: string | null
          opportunity_id?: string | null
          opportunity_modified_date?: string | null
          opportunity_name: string
          opportunity_owner?: string | null
          opportunity_owner_gid?: string | null
          overall_booking_value_tcv?: number | null
          overall_tcv?: number | null
          parent_opportunity_id?: string | null
          pricing_model?: string | null
          primary_industry?: string | null
          prime_status?: string | null
          quarter?: string | null
          reason_for_loss?: string | null
          reason_for_win?: string | null
          remaining_years_projection?: number | null
          sales_channel?: string | null
          sales_specialist_name?: string | null
          sales_stage?: string | null
          secondary_industry?: string | null
          stage?: string | null
          total_resources?: number | null
          type_of_business?: string | null
          updated_at?: string
          user_ibg?: string | null
          user_ibu?: string | null
          user_sbu?: string | null
          win_probability?: number | null
        }
        Update: {
          abort_reason?: string | null
          account_category?: string | null
          account_details?: Json | null
          account_ibg?: string | null
          account_ibu?: string | null
          account_id?: string | null
          account_name?: string | null
          account_owner?: string | null
          account_sbu?: string | null
          acv_fy_23_24?: number | null
          acv_fy_24_25?: number | null
          acv_fy_25_26?: number | null
          acv_fy_26_27?: number | null
          acv_fy_27_28?: number | null
          alliance_details?: Json | null
          assigned_presales_id?: string | null
          bid_manager?: string | null
          bid_submission_date?: string | null
          billing_end_date?: string | null
          billing_start_date?: string | null
          booked_month?: string | null
          city?: string | null
          competitor_name?: string | null
          contract_tenure_months?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_line?: string | null
          duns_details?: Json | null
          ebitda_percent?: number | null
          expected_close_date?: string | null
          financial_details?: Json | null
          hibernated_by_system?: string | null
          ibu?: string | null
          id?: string
          manager_alias?: string | null
          metadata?: Json | null
          opportunity_category?: string | null
          opportunity_created_date?: string | null
          opportunity_id?: string | null
          opportunity_modified_date?: string | null
          opportunity_name?: string
          opportunity_owner?: string | null
          opportunity_owner_gid?: string | null
          overall_booking_value_tcv?: number | null
          overall_tcv?: number | null
          parent_opportunity_id?: string | null
          pricing_model?: string | null
          primary_industry?: string | null
          prime_status?: string | null
          quarter?: string | null
          reason_for_loss?: string | null
          reason_for_win?: string | null
          remaining_years_projection?: number | null
          sales_channel?: string | null
          sales_specialist_name?: string | null
          sales_stage?: string | null
          secondary_industry?: string | null
          stage?: string | null
          total_resources?: number | null
          type_of_business?: string | null
          updated_at?: string
          user_ibg?: string | null
          user_ibu?: string | null
          user_sbu?: string | null
          win_probability?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "sales_owner"
        | "presales"
        | "bid_manager"
        | "reviewer"
      gate_status: "pending" | "approved" | "rejected"
      gate_type:
        | "deal_qualification"
        | "presales_assignment"
        | "proposal_review"
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
    Enums: {
      app_role: ["admin", "sales_owner", "presales", "bid_manager", "reviewer"],
      gate_status: ["pending", "approved", "rejected"],
      gate_type: [
        "deal_qualification",
        "presales_assignment",
        "proposal_review",
      ],
    },
  },
} as const

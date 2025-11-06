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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      locations: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_redemptions: {
        Row: {
          created_at: string
          id: string
          location_id: string
          offer_id: string
          redeemed_at: string
          redemption_code: string
          referring_store: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          offer_id: string
          redeemed_at?: string
          redemption_code: string
          referring_store?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          offer_id?: string
          redeemed_at?: string
          redemption_code?: string
          referring_store?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_redemptions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offerai_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          partnership_charge_per_request: number
          subscription_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          partnership_charge_per_request?: number
          subscription_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          partnership_charge_per_request?: number
          subscription_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          brand_logo_url: string | null
          call_to_action: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          offer_image_url: string | null
          redemption_code_prefix: string | null
          redemption_end_date: string | null
          redemption_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_logo_url?: string | null
          call_to_action: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          offer_image_url?: string | null
          redemption_code_prefix?: string | null
          redemption_end_date?: string | null
          redemption_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_logo_url?: string | null
          call_to_action?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          offer_image_url?: string | null
          redemption_code_prefix?: string | null
          redemption_end_date?: string | null
          redemption_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      offerx_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          created_at: string
          id: string
          impressions_partner1: number | null
          impressions_partner2: number | null
          partner_request_id: string | null
          partner1_id: string
          partner2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          impressions_partner1?: number | null
          impressions_partner2?: number | null
          partner_request_id?: string | null
          partner1_id: string
          partner2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          impressions_partner1?: number | null
          impressions_partner2?: number | null
          partner_request_id?: string | null
          partner1_id?: string
          partner2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnerships_partner_request_id_fkey"
            columns: ["partner_request_id"]
            isOneToOne: false
            referencedRelation: "partner_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          referral_code: string | null
          referral_store: string | null
          retail_address: string | null
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_store?: string | null
          retail_address?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_store?: string | null
          retail_address?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          created_at: string
          id: string
          points: number
          redemptions_made: number
          redemptions_referred: number
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          redemptions_made?: number
          redemptions_referred?: number
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          redemptions_made?: number
          redemptions_referred?: number
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_send_partnership_request: {
        Args: { recipient_user_id: string; sender_user_id: string }
        Returns: string
      }
      award_redemption_points: {
        Args: {
          redeeming_user_id: string
          redemption_id: string
          referring_store_name: string
        }
        Returns: undefined
      }
      award_referral_points: {
        Args: { referrer_code: string }
        Returns: undefined
      }
      generate_referral_code: {
        Args: { first_name: string; last_name: string }
        Returns: string
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          first_name: string
          last_name: string
          location_count: number
          partnership_count: number
          store_name: string
          total_impressions: number
          user_email: string
          user_id: string
        }[]
      }
      get_current_week_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          points: number
          rank: number
          redemptions_made: number
          redemptions_referred: number
          store_name: string
          user_id: string
        }[]
      }
      get_offerai_subscribers: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_partnerships: number
          available_partnerships: number
          earliest_subscription_date: string
          first_name: string
          last_name: string
          location_count: number
          locations: Json
          partnership_charge_per_request: number
          store_name: string
          user_email: string
          user_id: string
        }[]
      }
      get_offerx_subscribers: {
        Args: Record<PropertyKey, never>
        Returns: {
          first_name: string
          is_active: boolean
          last_name: string
          location_count: number
          monthly_charge: number
          store_name: string
          subscription_started_at: string
          user_email: string
          user_id: string
        }[]
      }
      get_store_names_for_autocomplete: {
        Args: { search_term?: string }
        Returns: {
          store_name: string
        }[]
      }
      get_store_names_for_referrals: {
        Args: { search_term?: string }
        Returns: {
          store_name: string
        }[]
      }
      use_promo_code: {
        Args: { promo_code_text: string }
        Returns: boolean
      }
      validate_promo_code: {
        Args: { promo_code_text: string }
        Returns: {
          code: string
          description: string
          is_valid: boolean
        }[]
      }
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

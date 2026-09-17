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
      categories: {
        Row: {
          icon: string | null
          id: number
          name: string
          parent_id: number | null
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: number
          name: string
          parent_id?: number | null
          slug: string
        }
        Update: {
          icon?: string | null
          id?: number
          name?: string
          parent_id?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          code: number
          id: number
          name: string
        }
        Insert: {
          code: number
          id: number
          name: string
        }
        Update: {
          code?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          ad_expires_at: string | null
          ad_fee_ksh: number
          ad_paid: boolean
          category_id: number | null
          contact_phone: string | null
          county_id: number | null
          created_at: string
          description: string | null
          distance_km: number
          donation_recipient: string | null
          duration_days: number
          education_level: Database["public"]["Enums"]["education_level"] | null
          experience_years: number | null
          id: string
          image_url: string | null
          job_title: string | null
          landmark: string | null
          languages: string[]
          listing_type: Database["public"]["Enums"]["listing_type"]
          offers_delivery: boolean
          payment_methods: string[]
          price: number
          risk: Database["public"]["Enums"]["risk_level"]
          self_description: string | null
          seller_id: string
          specialties: string[]
          status: Database["public"]["Enums"]["listing_status"]
          subcounty_id: number | null
          title: string
          town: string | null
          transport_means: string | null
          updated_at: string
          ward_id: number | null
          work_rate_type: string | null
          images: string[]
          specs: Json
          promotion_tier: string
          promoted_until: string | null
          views_count: number
          contact_clicks_count: number
        }
        Insert: {
          ad_expires_at?: string | null
          ad_fee_ksh?: number
          ad_paid?: boolean
          category_id?: number | null
          contact_phone?: string | null
          contact_clicks_count?: number
          county_id?: number | null
          created_at?: string
          description?: string | null
          distance_km?: number
          donation_recipient?: string | null
          duration_days?: number
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          job_title?: string | null
          landmark?: string | null
          languages?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          offers_delivery?: boolean
          payment_methods?: string[]
          price: number
          risk?: Database["public"]["Enums"]["risk_level"]
          self_description?: string | null
          seller_id: string
          specialties?: string[]
          status?: Database["public"]["Enums"]["listing_status"]
          subcounty_id?: number | null
          title: string
          town?: string | null
          transport_means?: string | null
          updated_at?: string
          ward_id?: number | null
          work_rate_type?: string | null
          images?: string[]
          specs?: Json
          promotion_tier?: string
          promoted_until?: string | null
          views_count?: number
        }
        Update: {
          ad_expires_at?: string | null
          ad_fee_ksh?: number
          ad_paid?: boolean
          category_id?: number | null
          contact_phone?: string | null
          county_id?: number | null
          created_at?: string
          description?: string | null
          distance_km?: number
          donation_recipient?: string | null
          duration_days?: number
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          job_title?: string | null
          landmark?: string | null
          languages?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          offers_delivery?: boolean
          payment_methods?: string[]
          price?: number
          risk?: Database["public"]["Enums"]["risk_level"]
          self_description?: string | null
          seller_id?: string
          specialties?: string[]
          status?: Database["public"]["Enums"]["listing_status"]
          subcounty_id?: number | null
          title?: string
          town?: string | null
          transport_means?: string | null
          updated_at?: string
          ward_id?: number | null
          work_rate_type?: string | null
          images?: string[]
          specs?: Json
          promotion_tier?: string
          promoted_until?: string | null
          views_count?: number
          contact_clicks_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcounty_id_fkey"
            columns: ["subcounty_id"]
            isOneToOne: false
            referencedRelation: "subcounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          listing_id: string | null
          method: string
          mpesa_ref: string | null
          purpose: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          listing_id?: string | null
          method?: string
          mpesa_ref?: string | null
          purpose?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          listing_id?: string | null
          method?: string
          mpesa_ref?: string | null
          purpose?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          building: string | null
          county_id: number | null
          created_at: string
          email: string
          full_name: string
          id: string
          market_share: number
          phone: string
          town: string | null
          updated_at: string
          ward_id: number | null
          is_phone_verified: boolean
          verification_status: string
          id_document_url: string | null
          kra_pin: string | null
          wallet_balance: number
          subscription_tier: string
          subscription_expires_at: string | null
          shop_banner_url: string | null
          shop_bio: string | null
          business_hours: string | null
          referral_code: string | null
          referred_by: string | null
          total_referrals_count: number
        }
        Insert: {
          avatar_url?: string | null
          building?: string | null
          county_id?: number | null
          created_at?: string
          email: string
          full_name: string
          id: string
          market_share?: number
          phone?: string
          town?: string | null
          updated_at?: string
          ward_id?: number | null
          is_phone_verified?: boolean
          verification_status?: string
          id_document_url?: string | null
          kra_pin?: string | null
          wallet_balance?: number
          subscription_tier?: string
          subscription_expires_at?: string | null
          shop_banner_url?: string | null
          shop_bio?: string | null
          business_hours?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals_count?: number
        }
        Update: {
          avatar_url?: string | null
          building?: string | null
          county_id?: number | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          market_share?: number
          phone?: string
          town?: string | null
          updated_at?: string
          ward_id?: number | null
          is_phone_verified?: boolean
          verification_status?: string
          id_document_url?: string | null
          kra_pin?: string | null
          wallet_balance?: number
          subscription_tier?: string
          subscription_expires_at?: string | null
          shop_banner_url?: string | null
          shop_bio?: string | null
          business_hours?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      subcounties: {
        Row: {
          county_id: number
          id: number
          name: string
        }
        Insert: {
          county_id: number
          id?: number
          name: string
        }
        Update: {
          county_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcounties_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
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
      wards: {
        Row: {
          county_id: number
          id: number
          name: string
          subcounty_id: number | null
        }
        Insert: {
          county_id: number
          id?: number
          name: string
          subcounty_id?: number | null
        }
        Update: {
          county_id?: number
          id?: number
          name?: string
          subcounty_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wards_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wards_subcounty_id_fkey"
            columns: ["subcounty_id"]
            isOneToOne: false
            referencedRelation: "subcounties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          seller_id: string
          reviewer_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          seller_id: string
          reviewer_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          seller_id?: string
          reviewer_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          listing_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reason: string
          details: string | null
          status: string
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reason: string
          details?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reason?: string
          details?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          query_params: Json
          notify_email: boolean
          notify_in_app: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          query_params?: Json
          notify_email?: boolean
          notify_in_app?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          query_params?: Json
          notify_email?: boolean
          notify_in_app?: boolean
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          last_message?: string | null
          last_message_at?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string
          mpesa_ref: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          description: string
          mpesa_ref?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          description?: string
          mpesa_ref?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          amount: number
          delivery_fee: number
          total_amount: number
          payment_method: string
          payment_ref: string | null
          courier_partner: string | null
          tracking_number: string | null
          delivery_address: string | null
          delivery_status: string
          escrow_status: string
          released_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          amount: number
          delivery_fee?: number
          total_amount: number
          payment_method?: string
          payment_ref?: string | null
          courier_partner?: string | null
          tracking_number?: string | null
          delivery_address?: string | null
          delivery_status?: string
          escrow_status?: string
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          amount?: number
          delivery_fee?: number
          total_amount?: number
          payment_method?: string
          payment_ref?: string | null
          courier_partner?: string | null
          tracking_number?: string | null
          delivery_address?: string | null
          delivery_status?: string
          escrow_status?: string
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          id: string
          order_id: string
          raised_by: string
          against_user_id: string
          reason: string
          evidence_url: string | null
          status: string
          admin_notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          raised_by: string
          against_user_id: string
          reason: string
          evidence_url?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          raised_by?: string
          against_user_id?: string
          reason?: string
          evidence_url?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          seller_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          seller_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          seller_id?: string
          created_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string
          reward_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id: string
          reward_amount?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string
          reward_amount?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calc_ad_fee: {
        Args: {
          _county_id: number
          _distance_km: number
          _duration_days: number
          _market_share: number
          _price: number
          _risk: Database["public"]["Enums"]["risk_level"]
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: {
        Args: {
          _listing_id: string
        }
        Returns: void
      }
      increment_contact_clicks: {
        Args: {
          p_listing_id: string
        }
        Returns: void
      }
    }
    Enums: {
      app_role: "admin" | "user"
      education_level:
        | "none"
        | "kcpe"
        | "kcse"
        | "certificate"
        | "diploma"
        | "degree"
      listing_status: "active" | "sold" | "deleted"
      listing_type: "sale" | "hire" | "service" | "donation"
      offer_status: "pending" | "accepted" | "rejected"
      risk_level: "low" | "medium" | "high"
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
      app_role: ["admin", "user"],
      education_level: [
        "none",
        "kcpe",
        "kcse",
        "certificate",
        "diploma",
        "degree",
      ],
      listing_status: ["active", "sold", "deleted"],
      listing_type: ["sale", "hire", "service", "donation"],
      offer_status: ["pending", "accepted", "rejected"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const

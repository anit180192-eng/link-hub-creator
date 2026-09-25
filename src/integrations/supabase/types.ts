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
      account_entitlements: {
        Row: {
          created_at: string
          current_period_end: string | null
          last_event_at: string | null
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          last_event_at?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          last_event_at?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_security: {
        Row: {
          created_at: string
          pin_hash: string
          pin_salt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pin_hash: string
          pin_salt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          pin_hash?: string
          pin_salt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          label: string
          last_used_at: string
          page_id: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          last_used_at?: string
          page_id?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          label?: string
          last_used_at?: string
          page_id?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          favourite: boolean
          group_name: string
          icon_only: boolean
          id: string
          label: string
          page_id: string
          platform: string
          position: number
          tab_id: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favourite?: boolean
          group_name?: string
          icon_only?: boolean
          id?: string
          label?: string
          page_id: string
          platform?: string
          position?: number
          tab_id?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          favourite?: boolean
          group_name?: string
          icon_only?: boolean
          id?: string
          label?: string
          page_id?: string
          platform?: string
          position?: number
          tab_id?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "page_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      paddle_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          occurred_at: string | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          occurred_at?: string | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          occurred_at?: string | null
          processed_at?: string
        }
        Relationships: []
      }
      page_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          page_id: string
          position: number
          tab_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          page_id: string
          position?: number
          tab_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          page_id?: string
          position?: number
          tab_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_folders_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_folders_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "page_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      page_security: {
        Row: {
          created_at: string
          page_id: string
          pin_hash: string
          pin_salt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          page_id: string
          pin_hash: string
          pin_salt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          page_id?: string
          pin_hash?: string
          pin_salt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_security_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_tabs: {
        Row: {
          created_at: string
          id: string
          name: string
          page_id: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          page_id: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          page_id?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_tabs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_url: string | null
          clocks: Json
          created_at: string
          dark_mode: boolean
          display_name: string
          id: string
          name: string
          pin_protected: boolean
          published: boolean
          slug: string
          tagline: string
          theme: string
          updated_at: string
          user_id: string
          weather_city: string
        }
        Insert: {
          avatar_url?: string | null
          clocks?: Json
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          id?: string
          name?: string
          pin_protected?: boolean
          published?: boolean
          slug: string
          tagline?: string
          theme?: string
          updated_at?: string
          user_id: string
          weather_city?: string
        }
        Update: {
          avatar_url?: string | null
          clocks?: Json
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          id?: string
          name?: string
          pin_protected?: boolean
          published?: boolean
          slug?: string
          tagline?: string
          theme?: string
          updated_at?: string
          user_id?: string
          weather_city?: string
        }
        Relationships: []
      }
      pin_attempts: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clocks: Json
          created_at: string
          dark_mode: boolean
          display_name: string
          id: string
          published: boolean
          slug: string
          tagline: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          clocks?: Json
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          id: string
          published?: boolean
          slug: string
          tagline?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          clocks?: Json
          created_at?: string
          dark_mode?: boolean
          display_name?: string
          id?: string
          published?: boolean
          slug?: string
          tagline?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      effective_plan: { Args: { _user_id: string }; Returns: string }
      reserve_pin_attempt: {
        Args: { p_ip_hash: string; p_owner_id: string }
        Returns: {
          allowed: boolean
          attempt_id: string
          remaining: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

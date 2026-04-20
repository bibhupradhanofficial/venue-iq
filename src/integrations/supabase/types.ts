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
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          seat_code: string | null
          sender_handle: string
          sender_role: string
          zone_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          seat_code?: string | null
          sender_handle: string
          sender_role: string
          zone_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          seat_code?: string | null
          sender_handle?: string
          sender_role?: string
          zone_id?: string | null
        }
        Relationships: []
      }
      dispatch_assignments: {
        Row: {
          created_at: string
          id: string
          incident_id: string | null
          staff_id: string
          status: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id?: string | null
          staff_id: string
          status?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string | null
          staff_id?: string
          status?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string
          id: string
          is_open: boolean
          kind: string
          name: string
          servers: number
          service_rate: number
          svg_x: number
          svg_y: number
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_open?: boolean
          kind: string
          name: string
          servers?: number
          service_rate?: number
          svg_x: number
          svg_y: number
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_open?: boolean
          kind?: string
          name?: string
          servers?: number
          service_rate?: number
          svg_x?: number
          svg_y?: number
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          minute: number
          payload: Json | null
          team: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          minute?: number
          payload?: Json | null
          team?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          minute?: number
          payload?: Json | null
          team?: string | null
        }
        Relationships: []
      }
      match_state: {
        Row: {
          away_score: number
          away_team: string
          home_score: number
          home_team: string
          id: number
          minute: number
          phase: string
          updated_at: string
        }
        Insert: {
          away_score?: number
          away_team?: string
          home_score?: number
          home_team?: string
          id?: number
          minute?: number
          phase?: string
          updated_at?: string
        }
        Update: {
          away_score?: number
          away_team?: string
          home_score?: number
          home_team?: string
          id?: number
          minute?: number
          phase?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          facility_id: string
          id: string
          is_available: boolean
          name: string
          price_cents: number
        }
        Insert: {
          category?: string
          facility_id: string
          id?: string
          is_available?: boolean
          name: string
          price_cents: number
        }
        Update: {
          category?: string
          facility_id?: string
          id?: string
          is_available?: boolean
          name?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_actions_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          forecast_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          forecast_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          forecast_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_actions_log_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "surge_forecasts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string
          order_id: string
          price_cents: number
          qty: number
        }
        Insert: {
          id?: string
          menu_item_id: string
          order_id: string
          price_cents: number
          qty?: number
        }
        Update: {
          id?: string
          menu_item_id?: string
          order_id?: string
          price_cents?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          facility_id: string
          fan_handle: string | null
          id: string
          pickup_slot: string | null
          seat_code: string | null
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          fan_handle?: string | null
          id?: string
          pickup_slot?: string | null
          seat_code?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          fan_handle?: string | null
          id?: string
          pickup_slot?: string | null
          seat_code?: string | null
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_states: {
        Row: {
          arrivals_per_min: number
          facility_id: string
          queue_length: number
          updated_at: string
          wait_minutes: number
        }
        Insert: {
          arrivals_per_min?: number
          facility_id: string
          queue_length?: number
          updated_at?: string
          wait_minutes?: number
        }
        Update: {
          arrivals_per_min?: number
          facility_id?: string
          queue_length?: number
          updated_at?: string
          wait_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_states_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: true
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_upgrade_bids: {
        Row: {
          bid_cents: number
          created_at: string
          decided_at: string | null
          fan_handle: string | null
          id: string
          offer_id: string
          seat_code: string | null
          status: string
        }
        Insert: {
          bid_cents: number
          created_at?: string
          decided_at?: string | null
          fan_handle?: string | null
          id?: string
          offer_id: string
          seat_code?: string | null
          status?: string
        }
        Update: {
          bid_cents?: number
          created_at?: string
          decided_at?: string | null
          fan_handle?: string | null
          id?: string
          offer_id?: string
          seat_code?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_upgrade_bids_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "seat_upgrade_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_upgrade_offers: {
        Row: {
          base_price_cents: number
          created_at: string
          id: string
          is_active: boolean
          seat_code: string
          zone_id: string
        }
        Insert: {
          base_price_cents: number
          created_at?: string
          id?: string
          is_active?: boolean
          seat_code: string
          zone_id: string
        }
        Update: {
          base_price_cents?: number
          created_at?: string
          id?: string
          is_active?: boolean
          seat_code?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_upgrade_offers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          status: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string
          status?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          status?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      surge_forecasts: {
        Row: {
          confidence: number
          created_at: string
          horizon_minutes: number
          id: string
          predicted_density: number
          recommendation: string | null
          zone_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          horizon_minutes: number
          id?: string
          predicted_density: number
          recommendation?: string | null
          zone_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          horizon_minutes?: number
          id?: string
          predicted_density?: number
          recommendation?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surge_forecasts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zone_density: {
        Row: {
          density: number
          head_count: number
          manual_override: number | null
          trend: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          density?: number
          head_count?: number
          manual_override?: number | null
          trend?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          density?: number
          head_count?: number
          manual_override?: number | null
          trend?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_density_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          capacity: number
          created_at: string
          id: string
          kind: string
          name: string
          stand: string | null
          svg_h: number
          svg_w: number
          svg_x: number
          svg_y: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          id: string
          kind: string
          name: string
          stand?: string | null
          svg_h: number
          svg_w: number
          svg_x: number
          svg_y: number
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
          stand?: string | null
          svg_h?: number
          svg_w?: number
          svg_x?: number
          svg_y?: number
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
      app_role: "ops_staff"
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
      app_role: ["ops_staff"],
    },
  },
} as const

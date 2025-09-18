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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      member_training_sessions: {
        Row: {
          created_at: string | null
          discipline: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          location_id: string
          manual_entry: boolean | null
          member_id: string
          notes: string | null
          organization_id: string
          start_time: string | null
          updated_at: string | null
          verification_time: string | null
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          discipline?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          location_id: string
          manual_entry?: boolean | null
          member_id: string
          notes?: string | null
          organization_id: string
          start_time?: string | null
          updated_at?: string | null
          verification_time?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          location_id?: string
          manual_entry?: boolean | null
          member_id?: string
          notes?: string | null
          organization_id?: string
          start_time?: string | null
          updated_at?: string | null
          verification_time?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_training_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_training_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_training_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          organization_id: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          organization_id: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          active: boolean | null
          approved: boolean | null
          avatar_url: string | null
          created_at: string | null
          diploma_file_name: string | null
          diploma_url: string | null
          email: string
          full_name: string
          id: string
          member_number: string | null
          organization_id: string
          other_files: Json | null
          password_hash: string | null
          role: string | null
          startkort_file_name: string | null
          startkort_url: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          approved?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          diploma_file_name?: string | null
          diploma_url?: string | null
          email: string
          full_name: string
          id?: string
          member_number?: string | null
          organization_id: string
          other_files?: Json | null
          password_hash?: string | null
          role?: string | null
          startkort_file_name?: string | null
          startkort_url?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          approved?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          diploma_file_name?: string | null
          diploma_url?: string | null
          email?: string
          full_name?: string
          id?: string
          member_number?: string | null
          organization_id?: string
          other_files?: Json | null
          password_hash?: string | null
          role?: string | null
          startkort_file_name?: string | null
          startkort_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean | null
          activity_types: Json | null
          address: string | null
          background_color: string | null
          created_at: string | null
          description: string | null
          dfs_enabled: boolean | null
          dssn_enabled: boolean | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          nsf_enabled: boolean | null
          phone: string | null
          primary_color: string | null
          registration_code: string | null
          secondary_color: string | null
          slug: string
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          activity_types?: Json | null
          address?: string | null
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          dfs_enabled?: boolean | null
          dssn_enabled?: boolean | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          nsf_enabled?: boolean | null
          phone?: string | null
          primary_color?: string | null
          registration_code?: string | null
          secondary_color?: string | null
          slug: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          activity_types?: Json | null
          address?: string | null
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          dfs_enabled?: boolean | null
          dssn_enabled?: boolean | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          nsf_enabled?: boolean | null
          phone?: string | null
          primary_color?: string | null
          registration_code?: string | null
          secondary_color?: string | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          diploma_file_name: string | null
          diploma_url: string | null
          email: string
          full_name: string
          id: string
          member_number: string | null
          other_files: Json | null
          role: string | null
          startkort_file_name: string | null
          startkort_url: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          diploma_file_name?: string | null
          diploma_url?: string | null
          email: string
          full_name: string
          id: string
          member_number?: string | null
          other_files?: Json | null
          role?: string | null
          startkort_file_name?: string | null
          startkort_url?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          diploma_file_name?: string | null
          diploma_url?: string | null
          email?: string
          full_name?: string
          id?: string
          member_number?: string | null
          other_files?: Json | null
          role?: string | null
          startkort_file_name?: string | null
          startkort_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      range_locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          qr_code_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          qr_code_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          qr_code_id?: string
        }
        Relationships: []
      }
      session_target_images: {
        Row: {
          created_at: string | null
          filename: string | null
          id: string
          image_url: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          id?: string
          image_url: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          id?: string
          image_url?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_target_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "member_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      super_users: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      target_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          training_session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          training_session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_images_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_details: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          results: string | null
          training_session_id: string
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          results?: string | null
          training_session_id: string
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          results?: string | null
          training_session_id?: string
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_details_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_locations: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          dfs_enabled: boolean | null
          dssn_enabled: boolean | null
          id: string
          name: string
          nsf_enabled: boolean | null
          organization_id: string
          qr_code_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          dfs_enabled?: boolean | null
          dssn_enabled?: boolean | null
          id?: string
          name: string
          nsf_enabled?: boolean | null
          organization_id: string
          qr_code_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          dfs_enabled?: boolean | null
          dssn_enabled?: boolean | null
          id?: string
          name?: string
          nsf_enabled?: boolean | null
          organization_id?: string
          qr_code_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_details: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          results: string | null
          session_id: string
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          results?: string | null
          session_id: string
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          results?: string | null
          session_id?: string
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_details_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "member_training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          range_location_id: string
          start_time: string
          updated_at: string | null
          user_id: string
          verification_time: string | null
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          range_location_id: string
          start_time?: string
          updated_at?: string | null
          user_id: string
          verification_time?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          range_location_id?: string
          start_time?: string
          updated_at?: string | null
          user_id?: string
          verification_time?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_range_location_id_fkey"
            columns: ["range_location_id"]
            isOneToOne: false
            referencedRelation: "range_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_organization_admins: {
        Args: { org_id: string }
        Returns: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          member_id: string
          permissions: Json
        }[]
      }
      get_user_member_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_organization_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_config: {
        Args: {
          is_local?: boolean
          setting_name: string
          setting_value: string
        }
        Returns: string
      }
      set_user_context: {
        Args: { user_email: string }
        Returns: undefined
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
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

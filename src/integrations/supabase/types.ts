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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attendance_events: {
        Row: {
          created_at: string
          doctor_id: string
          event_type: string
          flag_reason: string | null
          gps_accuracy_m: number | null
          id: string
          occurred_at: string
          phc_id: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          event_type: string
          flag_reason?: string | null
          gps_accuracy_m?: number | null
          id?: string
          occurred_at?: string
          phc_id: string
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          event_type?: string
          flag_reason?: string | null
          gps_accuracy_m?: number | null
          id?: string
          occurred_at?: string
          phc_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_phc_id_fkey"
            columns: ["phc_id"]
            isOneToOne: false
            referencedRelation: "phcs"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean
          created_at: string
          designation: string
          employee_code: string | null
          full_name: string
          id: string
          phc_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          designation?: string
          employee_code?: string | null
          full_name: string
          id?: string
          phc_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          designation?: string
          employee_code?: string | null
          full_name?: string
          id?: string
          phc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_phc_id_fkey"
            columns: ["phc_id"]
            isOneToOne: false
            referencedRelation: "phcs"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          brand_names: string[]
          composition: string | null
          created_at: string
          dosage: string | null
          form: string | null
          generic_name: string | null
          how_it_works: string | null
          id: string
          interactions: string[]
          name: string
          prescription_required: boolean
          price_range: string | null
          side_effects: string[]
          slug: string
          storage: string | null
          strength: string | null
          uses: string[]
          warnings: string[]
        }
        Insert: {
          brand_names?: string[]
          composition?: string | null
          created_at?: string
          dosage?: string | null
          form?: string | null
          generic_name?: string | null
          how_it_works?: string | null
          id?: string
          interactions?: string[]
          name: string
          prescription_required?: boolean
          price_range?: string | null
          side_effects?: string[]
          slug: string
          storage?: string | null
          strength?: string | null
          uses?: string[]
          warnings?: string[]
        }
        Update: {
          brand_names?: string[]
          composition?: string | null
          created_at?: string
          dosage?: string | null
          form?: string | null
          generic_name?: string | null
          how_it_works?: string | null
          id?: string
          interactions?: string[]
          name?: string
          prescription_required?: boolean
          price_range?: string | null
          side_effects?: string[]
          slug?: string
          storage?: string | null
          strength?: string | null
          uses?: string[]
          warnings?: string[]
        }
        Relationships: []
      }
      phcs: {
        Row: {
          block: string
          created_at: string
          district: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          block: string
          created_at?: string
          district: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          block?: string
          created_at?: string
          district?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      recent_searches: {
        Row: {
          created_at: string
          id: string
          medicine_id: string | null
          mode: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          mode?: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string | null
          mode?: string
          query?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_searches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_medicines: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_medicines_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
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
      app_role: "ddhs" | "dho" | "bmo" | "doctor"
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
    Enums: {
      app_role: ["ddhs", "dho", "bmo", "doctor"],
    },
  },
} as const

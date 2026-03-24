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
      applications: {
        Row: {
          applicant_name: string
          application_pdf: string | null
          average_score: number
          class: string
          created_at: string
          gender: string
          id: string
          profile_pic: string | null
          status: string
          stream: string | null
        }
        Insert: {
          applicant_name: string
          application_pdf?: string | null
          average_score: number
          class: string
          created_at?: string
          gender?: string
          id?: string
          profile_pic?: string | null
          status?: string
          stream?: string | null
        }
        Update: {
          applicant_name?: string
          application_pdf?: string | null
          average_score?: number
          class?: string
          created_at?: string
          gender?: string
          id?: string
          profile_pic?: string | null
          status?: string
          stream?: string | null
        }
        Relationships: []
      }
      ballots: {
        Row: {
          candidates_json: Json
          created_at: string
          created_by: string
          editable: boolean
          election_title: string
          id: string
          pdf_url: string | null
          updated_at: string
        }
        Insert: {
          candidates_json?: Json
          created_at?: string
          created_by: string
          editable?: boolean
          election_title: string
          id?: string
          pdf_url?: string | null
          updated_at?: string
        }
        Update: {
          candidates_json?: Json
          created_at?: string
          created_by?: string
          editable?: boolean
          election_title?: string
          id?: string
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_url: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_url: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          created_at: string
          description: string
          id: string
          raised_by: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          raised_by: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          raised_by?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class: string | null
          created_at: string
          full_name: string
          id: string
          profile_pic_url: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class?: string | null
          created_at?: string
          full_name: string
          id?: string
          profile_pic_url?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class?: string | null
          created_at?: string
          full_name?: string
          id?: string
          profile_pic_url?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      requisitions: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          id: string
          item: string
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          id?: string
          item: string
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          item?: string
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rotas: {
        Row: {
          created_at: string
          created_by: string
          duties: Json
          id: string
          updated_at: string
          week: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duties?: Json
          id?: string
          updated_at?: string
          week: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duties?: Json
          id?: string
          updated_at?: string
          week?: string
        }
        Relationships: []
      }
      student_voices: {
        Row: {
          category: string
          comments: string | null
          created_at: string
          description: string
          evaluated_by: string | null
          file_url: string | null
          id: string
          status: string
          submitted_by: string | null
          submitted_class: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          comments?: string | null
          created_at?: string
          description: string
          evaluated_by?: string | null
          file_url?: string | null
          id?: string
          status?: string
          submitted_by?: string | null
          submitted_class?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          comments?: string | null
          created_at?: string
          description?: string
          evaluated_by?: string | null
          file_url?: string | null
          id?: string
          status?: string
          submitted_by?: string | null
          submitted_class?: string | null
          title?: string
          updated_at?: string
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
      is_councillor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "patron"
        | "chairperson"
        | "vice_chairperson"
        | "speaker"
        | "deputy_speaker"
        | "general_secretary"
        | "assistant_general_secretary"
        | "secretary_finance"
        | "secretary_welfare"
        | "secretary_health"
        | "secretary_women_affairs"
        | "secretary_publicity"
        | "secretary_pwd"
        | "electoral_commission"
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
      app_role: [
        "patron",
        "chairperson",
        "vice_chairperson",
        "speaker",
        "deputy_speaker",
        "general_secretary",
        "assistant_general_secretary",
        "secretary_finance",
        "secretary_welfare",
        "secretary_health",
        "secretary_women_affairs",
        "secretary_publicity",
        "secretary_pwd",
        "electoral_commission",
      ],
    },
  },
} as const

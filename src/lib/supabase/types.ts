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
      achievements: {
        Row: {
          created_at: string
          description: string | null
          display_duration_days: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points_awarded: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_awarded?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_awarded?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_auto_points_settings: {
        Row: {
          id: string
          is_enabled: boolean
          points_absent: number
          points_excused: number
          points_late: number
          points_present: number
          season_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          points_absent?: number
          points_excused?: number
          points_late?: number
          points_present?: number
          season_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_enabled?: boolean
          points_absent?: number
          points_excused?: number
          points_late?: number
          points_present?: number
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_auto_points_settings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: true
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          id: string
          note: string | null
          program_day_id: string
          recorded_at: string
          recorded_by: string | null
          season_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          program_day_id: string
          recorded_at?: string
          recorded_by?: string | null
          season_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          id?: string
          note?: string | null
          program_day_id?: string
          recorded_at?: string
          recorded_by?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          color_token: string
          created_at: string
          description: string | null
          display_duration_days: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color_token?: string
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color_token?: string
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      circles: {
        Row: {
          color_token: string
          created_at: string
          id: string
          is_active: boolean
          leader_name: string | null
          leader_phone: string | null
          name: string
          season_id: string | null
          teacher_name: string | null
          teacher_phone: string | null
          updated_at: string
        }
        Insert: {
          color_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          leader_name?: string | null
          leader_phone?: string | null
          name: string
          season_id?: string | null
          teacher_name?: string | null
          teacher_phone?: string | null
          updated_at?: string
        }
        Update: {
          color_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          leader_name?: string | null
          leader_phone?: string | null
          name?: string
          season_id?: string | null
          teacher_name?: string | null
          teacher_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      dropout_periods: {
        Row: {
          dropped_at: string
          id: string
          reason: string | null
          recorded_by: string | null
          returned_at: string | null
          season_id: string | null
          student_id: string
        }
        Insert: {
          dropped_at?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          returned_at?: string | null
          season_id?: string | null
          student_id: string
        }
        Update: {
          dropped_at?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          returned_at?: string | null
          season_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropout_periods_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropout_periods_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropout_periods_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          description: string | null
          display_duration_days: number | null
          id: string
          is_active: boolean
          name: string
          requires_action: boolean
          severity: Database["public"]["Enums"]["flag_severity"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          requires_action?: boolean
          severity?: Database["public"]["Enums"]["flag_severity"]
        }
        Update: {
          created_at?: string
          description?: string | null
          display_duration_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          requires_action?: boolean
          severity?: Database["public"]["Enums"]["flag_severity"]
        }
        Relationships: []
      }
      groups: {
        Row: {
          circle_id: string | null
          color_token: string
          created_at: string
          id: string
          leader_name: string | null
          leader_phone: string | null
          name: string
          updated_at: string
        }
        Insert: {
          circle_id?: string | null
          color_token?: string
          created_at?: string
          id?: string
          leader_name?: string | null
          leader_phone?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          circle_id?: string | null
          color_token?: string
          created_at?: string
          id?: string
          leader_name?: string | null
          leader_phone?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_results: {
        Row: {
          exam_date: string | null
          id: string
          is_published: boolean
          percentage: number
          period_label: string
          season_id: string
          student_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          exam_date?: string | null
          id?: string
          is_published?: boolean
          percentage: number
          period_label: string
          season_id: string
          student_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          exam_date?: string | null
          id?: string
          is_published?: boolean
          percentage?: number
          period_label?: string
          season_id?: string
          student_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_results_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notes: {
        Row: {
          created_at: string
          id: string
          is_read_by_admin: boolean
          is_read_by_parent: boolean
          message: string
          sender: string
          sender_profile_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read_by_admin?: boolean
          is_read_by_parent?: boolean
          message: string
          sender: string
          sender_profile_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read_by_admin?: boolean
          is_read_by_parent?: boolean
          message?: string
          sender?: string
          sender_profile_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_notes_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          achievement_id: string | null
          attendance_record_id: string | null
          created_at: string
          created_by: string | null
          id: string
          points: number
          reason: string | null
          season_id: string
          source: Database["public"]["Enums"]["point_source"]
          student_id: string
        }
        Insert: {
          achievement_id?: string | null
          attendance_record_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          points: number
          reason?: string | null
          season_id: string
          source?: Database["public"]["Enums"]["point_source"]
          student_id: string
        }
        Update: {
          achievement_id?: string | null
          attendance_record_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          points?: number
          reason?: string | null
          season_id?: string
          source?: Database["public"]["Enums"]["point_source"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_achievement_fk"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          created_at: string
          day_date: string
          id: string
          is_holiday: boolean
          note: string | null
          season_id: string
        }
        Insert: {
          created_at?: string
          day_date: string
          id?: string
          is_holiday?: boolean
          note?: string | null
          season_id: string
        }
        Update: {
          created_at?: string
          day_date?: string
          id?: string
          is_holiday?: boolean
          note?: string | null
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_days_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          carry_over_points: boolean
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["season_status"]
          updated_at: string
          weekly_off_days: number[]
        }
        Insert: {
          carry_over_points?: boolean
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
          weekly_off_days?: number[]
        }
        Update: {
          carry_over_points?: boolean
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["season_status"]
          updated_at?: string
          weekly_off_days?: number[]
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          awarded_at: string
          awarded_by: string | null
          id: string
          note: string | null
          season_id: string
          student_id: string
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          note?: string | null
          season_id: string
          student_id: string
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          awarded_by?: string | null
          id?: string
          note?: string | null
          season_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          note: string | null
          season_id: string
          student_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          note?: string | null
          season_id: string
          student_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          note?: string | null
          season_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_flags: {
        Row: {
          flag_id: string
          id: string
          is_resolved: boolean
          note: string | null
          resolved_at: string | null
          resolved_by: string | null
          season_id: string | null
          set_at: string
          set_by: string | null
          student_id: string
        }
        Insert: {
          flag_id: string
          id?: string
          is_resolved?: boolean
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          season_id?: string | null
          set_at?: string
          set_by?: string | null
          student_id: string
        }
        Update: {
          flag_id?: string
          id?: string
          is_resolved?: boolean
          note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          season_id?: string | null
          set_at?: string
          set_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_flags_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_flags_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_flags_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_flags_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_season_enrollments: {
        Row: {
          circle_id: string | null
          created_at: string
          enrolled_at: string
          group_id: string | null
          id: string
          season_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          circle_id?: string | null
          created_at?: string
          enrolled_at?: string
          group_id?: string | null
          id?: string
          season_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          circle_id?: string | null
          created_at?: string
          enrolled_at?: string
          group_id?: string | null
          id?: string
          season_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_season_enrollments_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_season_enrollments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_season_enrollments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_season_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          code: string
          created_at: string
          full_name: string
          guardian_name: string | null
          guardian_phone: string
          guardian_relation: string | null
          id: string
          id_type: Database["public"]["Enums"]["id_document_type"]
          national_id: string | null
          nationality: string | null
          notes: string | null
          personal_number: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          code: string
          created_at?: string
          full_name: string
          guardian_name?: string | null
          guardian_phone: string
          guardian_relation?: string | null
          id?: string
          id_type?: Database["public"]["Enums"]["id_document_type"]
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          personal_number?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          code?: string
          created_at?: string
          full_name?: string
          guardian_name?: string | null
          guardian_phone?: string
          guardian_relation?: string | null
          id?: string
          id_type?: Database["public"]["Enums"]["id_document_type"]
          national_id?: string | null
          nationality?: string | null
          notes?: string | null
          personal_number?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body: string
          context: Database["public"]["Enums"]["whatsapp_context"]
          id: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          context: Database["public"]["Enums"]["whatsapp_context"]
          id?: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          context?: Database["public"]["Enums"]["whatsapp_context"]
          id?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_updated_by_fkey"
            columns: ["updated_by"]
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
      add_manual_points: {
        Args: {
          p_points: number
          p_reason?: string
          p_season_id: string
          p_student_id: string
        }
        Returns: string
      }
      archive_season: { Args: { p_season_id: string }; Returns: undefined }
      create_season: {
        Args: {
          p_carry_over_points: boolean
          p_end_date: string
          p_name: string
          p_set_as_current: boolean
          p_start_date: string
          p_weekly_off_days: number[]
        }
        Returns: string
      }
      delete_season_permanently: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      delete_student_permanently: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_attendance: {
        Args: {
          p_note?: string
          p_program_day_id: string
          p_status: Database["public"]["Enums"]["attendance_status"]
          p_student_id: string
        }
        Returns: string
      }
      mark_student_dropped_out: {
        Args: { p_reason: string; p_student_id: string }
        Returns: undefined
      }
      mark_student_returned: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      next_student_code: { Args: never; Returns: string }
      public_homepage_content: { Args: never; Returns: Json }
      public_leaderboard: { Args: never; Returns: Json }
      public_stats: { Args: never; Returns: Json }
      set_current_season: { Args: { p_season_id: string }; Returns: undefined }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      enrollment_status: "active" | "dropped_out" | "transferred"
      flag_severity: "info" | "warning" | "critical"
      id_document_type: "national_id" | "iqama" | "passport"
      point_source: "manual" | "auto_attendance" | "achievement" | "adjustment"
      season_status: "current" | "archived"
      student_status: "active" | "dropped_out"
      user_role: "admin" | "supervisor" | "data_entry"
      whatsapp_context:
        | "attendance_absent"
        | "attendance_late"
        | "students_list_contact"
        | "quick_ops_contact"
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
      attendance_status: ["present", "absent", "late", "excused"],
      enrollment_status: ["active", "dropped_out", "transferred"],
      flag_severity: ["info", "warning", "critical"],
      id_document_type: ["national_id", "iqama", "passport"],
      point_source: ["manual", "auto_attendance", "achievement", "adjustment"],
      season_status: ["current", "archived"],
      student_status: ["active", "dropped_out"],
      user_role: ["admin", "supervisor", "data_entry"],
      whatsapp_context: [
        "attendance_absent",
        "attendance_late",
        "students_list_contact",
        "quick_ops_contact",
      ],
    },
  },
} as const

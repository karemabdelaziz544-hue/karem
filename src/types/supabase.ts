export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_secrets: {
        Row: {
          created_at: string | null
          id: string
          key_name: string
          key_value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_name: string
          key_value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_name?: string
          key_value?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender: string
          user_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender: string
          user_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      client_documents: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_habits: {
        Row: {
          created_at: string
          id: string
          record_date: string
          steps_count: number | null
          user_id: string
          water_cups: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          record_date?: string
          steps_count?: number | null
          user_id: string
          water_cups?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          record_date?: string
          steps_count?: number | null
          user_id?: string
          water_cups?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_logs: {
        Row: {
          calories_consumed: number | null
          completed_tasks: Json | null
          date: string | null
          id: string
          updated_at: string | null
          user_id: string
          water_intake: number | null
        }
        Insert: {
          calories_consumed?: number | null
          completed_tasks?: Json | null
          date?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          water_intake?: number | null
        }
        Update: {
          calories_consumed?: number | null
          completed_tasks?: Json | null
          date?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          water_intake?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_task_logs: {
        Row: {
          id: string
          user_id: string
          task_id: string
          log_date: string
          is_completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          log_date?: string
          is_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          log_date?: string
          is_completed?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "plan_tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_smart_plans: {
        Row: {
          created_at: string | null
          date: string | null
          focus_mode: string | null
          generated_tasks: Json | null
          id: string
          morning_message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          focus_mode?: string | null
          generated_tasks?: Json | null
          id?: string
          morning_message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          focus_mode?: string | null
          generated_tasks?: Json | null
          id?: string
          morning_message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_smart_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_smart_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      event_bookings: {
        Row: {
          attended: boolean | null
          created_at: string
          event_id: string
          id: string
          payment_proof: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          event_id: string
          id?: string
          payment_proof?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          event_id?: string
          id?: string
          payment_proof?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          event_date: string
          id: string
          image_url: string | null
          is_visible: boolean | null
          location: string | null
          max_capacity: number | null
          price: number | null
          registration_deadline: string | null
          speakers: Json | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          location?: string | null
          max_capacity?: number | null
          price?: number | null
          registration_deadline?: string | null
          speakers?: Json | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          location?: string | null
          max_capacity?: number | null
          price?: number | null
          registration_deadline?: string | null
          speakers?: Json | null
          title?: string
        }
        Relationships: []
      }
      
      /* 👇 الجداول الجديدة الخاصة بالملف الطبي ونمط الحياة 👇 */
      health_profile: {
        Row: {
          id: string
          user_id: string
          diseases: Json | null
          has_allergies: boolean | null
          allergies_details: Json | null | string
          diet_type: string | null
          family_history: Json | null
          medications: Json | null | string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          diseases?: Json | null
          has_allergies?: boolean | null
          allergies_details?: Json | null | string
          diet_type?: string | null
          family_history?: Json | null
          medications?: Json | null | string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          diseases?: Json | null
          has_allergies?: boolean | null
          allergies_details?: Json | null | string
          diet_type?: string | null
          family_history?: Json | null
          medications?: Json | null | string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lifestyle_profile: {
        Row: {
          id: string
          user_id: string
          goal: string | null
          meals_per_day: number | null
          has_breakfast: boolean | null
          has_snacks: boolean | null
          late_night_eating: boolean | null
          favorite_foods: string | null
          disliked_foods: string | null
          water_liters: number | null
          beverages: Json | null
          activity_level: string | null
          does_exercise: boolean | null
          exercise_details: Json | null
          sleep_hours: number | null
          sleep_quality: string | null
          smoker: boolean | null
          stress_level: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          goal?: string | null
          meals_per_day?: number | null
          has_breakfast?: boolean | null
          has_snacks?: boolean | null
          late_night_eating?: boolean | null
          favorite_foods?: string | null
          disliked_foods?: string | null
          water_liters?: number | null
          beverages?: Json | null
          activity_level?: string | null
          does_exercise?: boolean | null
          exercise_details?: Json | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          smoker?: boolean | null
          stress_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          goal?: string | null
          meals_per_day?: number | null
          has_breakfast?: boolean | null
          has_snacks?: boolean | null
          late_night_eating?: boolean | null
          favorite_foods?: string | null
          disliked_foods?: string | null
          water_liters?: number | null
          beverages?: Json | null
          activity_level?: string | null
          does_exercise?: boolean | null
          exercise_details?: Json | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          smoker?: boolean | null
          stress_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lifestyle_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      /* 👆 نهاية الجداول الجديدة 👆 */

      inbody_records: {
        Row: {
          ai_summary: string | null
          created_at: string
          fat_percent: number | null
          file_url: string | null
          id: string
          image_url: string | null
          muscle_mass: number | null
          record_date: string
          user_id: string
          weight: number
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          fat_percent?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          muscle_mass?: number | null
          record_date?: string
          user_id: string
          weight: number
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          fat_percent?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          muscle_mass?: number | null
          record_date?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "inbody_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbody_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      landing_page_settings: {
        Row: {
          about_section: Json | null
          faq_section: Json | null
          hero_section: Json | null
          id: string
          steps_section: Json | null
          updated_at: string | null
        }
        Insert: {
          about_section?: Json | null
          faq_section?: Json | null
          hero_section?: Json | null
          id?: string
          steps_section?: Json | null
          updated_at?: string | null
        }
        Update: {
          about_section?: Json | null
          faq_section?: Json | null
          hero_section?: Json | null
          id?: string
          steps_section?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          inquiry_id: string | null
          is_read: boolean | null
          receiver_id: string
          recipient_type: string | null
          related_doctor_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          is_read?: boolean | null
          receiver_id: string
          recipient_type?: string | null
          related_doctor_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          is_read?: boolean | null
          receiver_id?: string
          recipient_type?: string | null
          related_doctor_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_doctor_id_fkey"
            columns: ["related_doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_doctor_id_fkey"
            columns: ["related_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_admin_notification: boolean | null
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_notification?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_notification?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          plan_type: string
          receipt_url: string | null
          renewal_metadata: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          plan_type: string
          receipt_url?: string | null
          renewal_metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          plan_type?: string
          receipt_url?: string | null
          renewal_metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_tasks: {
        Row: {
          content: string
          created_at: string
          day_name: string | null
          day_number: number | null
          id: string
          is_completed: boolean | null
          metadata: any | null
          order_index: number | null
          plan_id: string
          task_type: string | null
        }
        Insert: {
          content: string
          created_at?: string
          day_name?: string | null
          day_number?: number | null
          id?: string
          is_completed?: boolean | null
          metadata?: any | null
          order_index?: number | null
          plan_id: string
          task_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          day_name?: string | null
          day_number?: number | null
          id?: string
          is_completed?: boolean | null
          metadata?: any | null
          order_index?: number | null
          plan_id?: string
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          plan_type: string
          start_date: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_type?: string
          start_date?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_type?: string
          start_date?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          id: number
          image_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string
          cta_text: string | null
          extra_member_price: string | null
          family_note: string | null
          features: string[]
          id: string
          is_active: boolean | null
          period: string
          price: string
          title: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          extra_member_price?: string | null
          family_note?: string | null
          features: string[]
          id?: string
          is_active?: boolean | null
          period: string
          price: string
          title: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          extra_member_price?: string | null
          family_note?: string | null
          features?: string[]
          id?: string
          is_active?: boolean | null
          period?: string
          price?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          assigned_doctor_id: string | null
          avatar_url: string | null
          birth_date: string | null
          chat_status_with_doctor: string | null
          created_at: string
          email: string | null
          fcm_token: string | null
          full_name: string | null
          gender: string | null
          has_uploaded_docs: boolean | null
          height: number | null
          id: string
          is_locked: boolean | null
          manager_id: string | null
          max_members: number | null
          max_sub_members: number | null
          phone: string | null
          plan_tier: string | null
          relation: string | null
          role: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          assigned_doctor_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          chat_status_with_doctor?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          full_name?: string | null
          gender?: string | null
          has_uploaded_docs?: boolean | null
          height?: number | null
          id?: string
          is_locked?: boolean | null
          manager_id?: string | null
          max_members?: number | null
          max_sub_members?: number | null
          phone?: string | null
          plan_tier?: string | null
          relation?: string | null
          role?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          assigned_doctor_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          chat_status_with_doctor?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          full_name?: string | null
          gender?: string | null
          has_uploaded_docs?: boolean | null
          height?: number | null
          id?: string
          is_locked?: boolean | null
          manager_id?: string | null
          max_members?: number | null
          max_sub_members?: number | null
          phone?: string | null
          plan_tier?: string | null
          relation?: string | null
          role?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean | null
          usage_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent: number
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          usage_count?: number | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          id: string
          user_id: string
          title: string
          category: "nutrition" | "meals" | "weight" | "symptoms" | "exercises" | "other"
          status: "open" | "under_review" | "replied" | "closed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: "nutrition" | "meals" | "weight" | "symptoms" | "exercises" | "other"
          status?: "open" | "under_review" | "replied" | "closed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: "nutrition" | "meals" | "weight" | "symptoms" | "exercises" | "other"
          status?: "open" | "under_review" | "replied" | "closed"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_visible: boolean | null
          name: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          name: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          name?: string
          role?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          extra_members_count: number | null
          id: string
          payment_method: string
          plan_tier: string
          promo_code: string | null
          proof_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          extra_members_count?: number | null
          id?: string
          payment_method: string
          plan_tier: string
          promo_code?: string | null
          proof_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          extra_members_count?: number | null
          id?: string
          payment_method?: string
          plan_tier?: string
          promo_code?: string | null
          proof_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      admin_clients_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          manager_id: string | null
          manager_name: string | null
          phone: string | null
          role: string | null
          subscription_end_date: string | null
          subscription_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      create_sub_member: {
        Args: {
          member_birth: string
          member_gender: string
          member_height: number
          member_name: string
          member_relation: string
          member_weight: number
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      renew_subscription: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_update_client_subscription: {
        Args: {
          p_client_id: string
          p_new_end_date: string
          p_new_status: string
          p_new_quota?: number
        }
        Returns: undefined
      }
      admin_approve_payment_request: {
        Args: {
          p_request_id: string
          p_confirmed_amount?: number
          p_admin_notes?: string
        }
        Returns: unknown
      }
      admin_reject_payment_request: {
        Args: {
          p_request_id: string
          p_reason: string
          p_admin_notes?: string
        }
        Returns: unknown
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
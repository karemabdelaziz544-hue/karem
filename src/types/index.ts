/**
 * ملف الأنواع المركزي - يُصدّر كل الأنواع الشائعة من Supabase
 * بدلاً من كتابة Database['public']['Tables']['x']['Row'] في كل ملف
 */
import { Tables, TablesInsert } from './supabase';

// ─── الأنواع الأساسية (Row Types) ────────────────────────
export type Profile = Omit<Tables<'profiles'>, 'role' | 'is_onboarded'> & {
  role: 'admin' | 'doctor' | 'client' | string | null;
  assigned_doctor_id: string | null;
  is_onboarded?: boolean | null;
};

export type Plan = Tables<'plans'>;
export type PlanTask = Tables<'plan_tasks'>;
export type PaymentRequest = Tables<'payment_requests'>;
export type PricingPlan = Tables<'pricing_plans'>;
export type Article = Tables<'articles'>;
export type Post = Tables<'posts'>;
export type Event = Tables<'events'>;
export type EventBooking = Tables<'event_bookings'>;
export type InbodyRecord = Tables<'inbody_records'>;
export type ClientDocument = Tables<'client_documents'>;
export type DailyLog = Tables<'daily_logs'>;
export type DailyHabit = Tables<'daily_habits'>;
export type DailySmartPlan = Tables<'daily_smart_plans'>;
export type Notification = Tables<'notifications'>;
export type Message = Tables<'messages'>;
export type ChatMessage = Tables<'chat_messages'>;
export type LandingPageSettings = Tables<'landing_page_settings'>;
export type Testimonial = Tables<'testimonials'>;
export type Transaction = Tables<'transactions'>;
export type PromoCode = Tables<'promo_codes'>;

// 👇 الأنواع الطبية المعدلة لتشمل الحقول الجديدة 👇
export type HealthProfile = Omit<
  Tables<'health_profile'>,
  'surgeries' | 'injuries' | 'digestive_issues' | 'hormonal_status' | 'diseases' | 'family_history' | 'allergies_details' | 'medications' | 'has_allergies'
> & {
  surgeries: string;
  injuries: string;
  digestive_issues: string[];
  hormonal_status: string;
  diseases: string[];
  family_history: string[];
  allergies_details: string;
  medications: string;
  has_allergies: boolean;
};

export type LifestyleProfile = Omit<
  Tables<'lifestyle_profile'>,
  'work_nature' | 'emotional_eating' | 'diet_history' | 'supplements' | 'caffeine_intake' | 'appetite_level' | 'weight_plateau' | 'beverages'
> & {
  work_nature: string;
  emotional_eating: boolean;
  diet_history: string;
  supplements: string;
  caffeine_intake: string;
  appetite_level: string;
  weight_plateau: boolean;
  beverages: string[];
};

// ─── Inquiry (Ticket) System ──────────────────────────────
export type InquiryCategory = 'nutrition' | 'meals' | 'weight' | 'symptoms' | 'exercises' | 'other';
export type InquiryStatus = 'open' | 'under_review' | 'replied' | 'closed';

export interface Inquiry {
  id: string;
  user_id: string;
  title: string;
  category: InquiryCategory;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

/** Extended message with optional inquiry_id for threaded conversations */
export interface ThreadedMessage extends Message {
  inquiry_id: string | null;
}

// ─── أنواع الإدراج (Insert Types) ────────────────────────
export type PlanTaskInsert = TablesInsert<'plan_tasks'>;
export type MessageInsert = TablesInsert<'messages'>;
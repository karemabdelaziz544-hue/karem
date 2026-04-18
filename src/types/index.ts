/**
 * ملف الأنواع المركزي - يُصدّر كل الأنواع الشائعة من Supabase
 * بدلاً من كتابة Database['public']['Tables']['x']['Row'] في كل ملف
 */
import { Tables, TablesInsert } from './supabase';

// ─── الأنواع الأساسية (Row Types) ────────────────────────
export type Profile = Tables<'profiles'>;
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

// ─── أنواع الإدراج (Insert Types) ────────────────────────
export type PlanTaskInsert = TablesInsert<'plan_tasks'>;
export type MessageInsert = TablesInsert<'messages'>;

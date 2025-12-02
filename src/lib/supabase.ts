import { createClient } from '@supabase/supabase-js';

// هنا بنقرا المفاتيح من ملف .env اللي عملناه
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

// بننشئ الاتصال ونصدره عشان نستخدمه في أي مكان في الموقع
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
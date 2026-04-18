import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// أضف هذا السطر مؤقتاً للتأكد من أن المفتاح يظهر في الكونسول عند التحميل
// console.log("Key Length:", supabaseAnonKey?.length); 

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
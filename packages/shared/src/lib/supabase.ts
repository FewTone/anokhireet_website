import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isUrlValid = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');
const isKeyValid = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder') && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon');

export const isSupabaseConfigured = isUrlValid && isKeyValid;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase URL and Anon Key must be set in environment variables (.env.local)');
  console.warn('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
}

// Create Supabase client with Realtime enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});


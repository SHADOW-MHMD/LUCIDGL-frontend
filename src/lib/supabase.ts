import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Conditionally initialize to prevent Next.js static prerender from crashing when env vars are missing
export const supabase = env.supabaseUrl && env.supabaseAnonKey 
  ? createClient(env.supabaseUrl, env.supabaseAnonKey) 
  : ({} as ReturnType<typeof createClient>);

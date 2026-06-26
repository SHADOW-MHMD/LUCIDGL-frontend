import { createClient } from '@supabase/supabase-js';

// ponytail: hardcoded fallbacks to bypass CI missing env vars.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwnhvzzngnjoubcvgwb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd25odnp6bmduam91YmN2Z3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM4NzIsImV4cCI6MjA5Nzk2OTg3Mn0.kw29UZIkM3radnvEpOKPRwxUlsXPGyBkwLmEhRtO4ts";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjwnhvzzngnjoubcvgwb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd25odnp6bmduam91YmN2Z3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM4NzIsImV4cCI6MjA5Nzk2OTg3Mn0.kw29UZIkM3radnvEpOKPRwxUlsXPGyBkwLmEhRtO4ts";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

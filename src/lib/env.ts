export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qjwnhvzzngnjoubcvgwb.supabase.co",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd25odnp6bmduam91YmN2Z3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM4NzIsImV4cCI6MjA5Nzk2OTg3Mn0.kw29UZIkM3radnvEpOKPRwxUlsXPGyBkwLmEhRtO4ts",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev",
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error("Missing NEXT_PUBLIC_API_URL environment variable.");
}

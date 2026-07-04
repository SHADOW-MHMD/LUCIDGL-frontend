export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-fallback.supabase.co",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-fallback-key",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://build-fallback.api",
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

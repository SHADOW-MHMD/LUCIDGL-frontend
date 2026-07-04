export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
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

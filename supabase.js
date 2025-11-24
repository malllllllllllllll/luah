// supabase.js
// Public client for Luah (safe in browser if RLS is configured properly)

const SUPABASE_URL = "https://wsimanizfxdfasahgzvb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gVPiEz6gXOoKgM_bNF3xIA_-zmIbI5H";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

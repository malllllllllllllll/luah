// supabase.js
function readMeta(name) {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.content : null;
}

const injected = window.__SUPABASE_CONFIG__ || {};

const SUPABASE_URL =
  injected.url || readMeta("supabase-url") || "";
const SUPABASE_ANON_KEY =
  injected.anonKey || readMeta("supabase-anon-key") || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase config missing.");
}

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

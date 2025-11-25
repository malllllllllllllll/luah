// supabase.js
// Supabase client loader — do NOT hardcode keys in source control.
// Reads configuration from `window.__SUPABASE_CONFIG__` (local dev) or
// from meta tags named `supabase-url` and `supabase-anon-key`.

function _getMeta(name) {
  const m = document.querySelector(`meta[name="${name}"]`);
  return m ? m.getAttribute("content") : null;
}

const __cfg = window.__SUPABASE_CONFIG__ || {};
const SUPABASE_URL = __cfg.url || _getMeta("supabase-url");
const SUPABASE_ANON_KEY = __cfg.anonKey || _getMeta("supabase-anon-key");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Supabase configuration not found. Provide `window.__SUPABASE_CONFIG__` " +
      "or meta tags `supabase-url` and `supabase-anon-key`. Avoid committing keys to source control."
  );
}

/* global window */
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

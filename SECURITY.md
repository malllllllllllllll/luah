# Security notes for Luah

This repository contains a small static frontend that talks to Supabase. The changes applied here are quick hardening steps — they are not a substitute for a proper security review.

What I changed:
- Removed unsafe use of `innerHTML` in `app.js` and replaced it with DOM creation + `textContent` to prevent XSS when rendering user-supplied text.
- Reworked `supabase.js` so it no longer contains a hard-coded key; it reads from `window.__SUPABASE_CONFIG__` or from `meta` tags named `supabase-url` and `supabase-anon-key`.
- Added a Content Security Policy meta tag in `index.html` to restrict allowed script/style/connect sources.

Recommendations (next steps):
- Do NOT store Supabase keys (even anon keys) in source control. For public static sites consider using a server-side proxy or serverless functions that enforce authentication and rate limits.
- Use Row Level Security (RLS) in Supabase and strict policies that only allow necessary operations from the anon key.
- If you must expose an anon key in client code, make sure RLS policies prevent abuse and rotate keys regularly.
- Sanitize and validate input on the server side as well as the client side. The client-side fixes prevent DOM-based XSS, but backend must validate stored content.
- Add rate limiting or abuse protection for write operations (e.g., Cloudflare Workers, server middleware, or Supabase Edge Functions that perform checks).
- Use HTTPS and HSTS for production deployments.
- Audit third-party scripts and pin versions (the CSP limits sources but does not guarantee safety).
- Consider moving sensitive flows to a backend where secrets and stronger validation are possible.

How to provide configuration at deploy time:
- For static-hosting deployments, inject `supabase-url` and `supabase-anon-key` into `index.html` via your CI/CD pipeline, or set `window.__SUPABASE_CONFIG__` in a small runtime script that's injected during deploy (do not commit the values).
- For a more secure approach, keep all write operations behind a server API that uses a service role key (stored securely on the server) and enforce user anonymity and validation server-side.

If you want, I can:
- Implement a minimal serverless proxy that accepts writes and forwards them to Supabase after validation.
- Convert the site to require a minimal server to keep keys out of the client.
- Add unit tests or a small integration test to verify XSS is blocked.


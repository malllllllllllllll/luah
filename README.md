# Luah — Tiny anonymous vent

This is a small static front-end that stores anonymous entries in Supabase.

This repository includes security hardening and a deployment workflow for GitHub Pages that injects Supabase configuration at deploy time (so you don't commit secrets to the repo).

Quick setup (deploy to GitHub Pages)

- In your GitHub repository, go to Settings → Secrets and variables → Actions → Repository secrets and add two secrets:
  - `SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)
  - `SUPABASE_ANON_KEY` — the anon (publishable) key for your project (only if absolutely required; prefer RLS)

- Push your code to the `main` branch. The workflow `.github/workflows/deploy.yml` will:
  1. Validate that the two secrets exist.
 2. Replace the placeholder meta tags in `index.html` with the secret values during the workflow run (these values will not be stored in your `main` branch).
 3. Publish the repository root to GitHub Pages.

Security recommendations (must-do for a public demo):

- Enforce strict Row Level Security (RLS) policies in Supabase so that the anon key cannot perform privileged operations. Audit the `vents` and `vent_comments` policies and only allow the minimal operations you need (INSERT for anonymous writes, SELECT for reads, etc.).
- Consider using a server-side proxy (serverless function) to perform writes when you need stronger protection, rate limiting, or validation.
- Rotate keys regularly and enable monitoring/alerts in Supabase.
- Use the provided `SECURITY.md` for more details and next steps.

Local testing (do not commit secrets)

- To run locally, serve the project directory and, for temporary testing, inject `window.__SUPABASE_CONFIG__` in `index.html` before the `supabase.js` include. Example (dev only):

```html
<script>
  // Local dev only — do NOT commit this to source control
  window.__SUPABASE_CONFIG__ = {
    url: "https://your-project.supabase.co",
    anonKey: "sb_publishable_..."
  };
</script>
```

Then run a static server (PowerShell):

```powershell
python -m http.server 8080
# open http://localhost:8080
```

If you want, I can scaffold a serverless proxy for writes (Vercel/Netlify/Azure) so the client never needs the anon key — tell me which platform you'd prefer and I'll implement it.

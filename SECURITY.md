User content is rendered using textContent (no unsafe innerHTML), which helps prevent XSS in the browser.

Supabase keys are not hard-coded in the JS files; they are loaded from config at runtime.

A Content Security Policy (CSP) is set in index.html to limit where scripts, fonts, and network requests can load from.

For more details about security decisions and next steps, see SECURITY.md
.


---

### `SECURITY.md` (simple, security-focused)

```markdown
# Security for Luah

This document explains the main security decisions for Luah and what still needs work.

---

## What is already in place

### 1. Safer rendering of user input

- All user-generated text (vents and comments) is rendered with `textContent` or manual DOM nodes.
- We do **not** use `innerHTML` with untrusted data.
- This reduces the risk of stored / reflected XSS in the UI.

### 2. No hard-coded Supabase keys in source

- `supabase.js` does not contain project URL or anon key.
- The app reads config from:

  - `window.__SUPABASE_CONFIG__` **or**
  - `<meta name="supabase-url">` and `<meta name="supabase-anon-key">` in `index.html`.

- In production, these values should be injected at deploy time (for example via GitHub Actions secrets), not committed to Git.

### 3. Content Security Policy (CSP)

`index.html` includes a CSP similar to:

```html
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' https://cdn.jsdelivr.net;
    connect-src 'self' https://wsimanizfxdfasahgzvb.supabase.co https://*.supabase.co;
    style-src 'self' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data:;
    object-src 'none';
    base-uri 'self';
  ">


This limits:

where scripts can load from,

where the app can send HTTP requests (Supabase only),

where styles and fonts can be loaded from.

What you should configure in Supabase

These are not handled by the frontend and must be done in your Supabase project:

Enable Row Level Security (RLS) on:

public.vents

public.vent_comments

Create minimal policies, for example:

allow SELECT for everyone,

allow INSERT only if:

text length is within a safe limit (e.g. <= 600 for vents, <= 300 for comments),

mood is in a fixed list ('Uncategorized','Calm','Heavy','Hopeful','Tired','Anxious'),

deny UPDATE and DELETE for the anon key.

This ensures that even if someone calls the Supabase API directly, the database enforces basic rules.

Recommended improvements (if you use this seriously)

These are not required for a small demo, but are good practice:

Put a serverless proxy or backend in front of Supabase writes:

validate and normalise input,

apply rate limiting per IP or per session,

keep the service key on the server only.

Add rate limiting or spam protection using Cloudflare or similar.

Rotate Supabase keys regularly and revoke them if they leak.

Keep the site on HTTPS only (GitHub Pages already does this).

Review third-party dependencies (CDN scripts, fonts) and pin versions where possible.

Reporting issues

If you spot a security problem or have ideas to improve the setup:

open an issue in the GitHub repo (without posting secrets), or

contact the maintainer directly.

This app is intentionally simple and meant for learning, so security suggestions are welcome.
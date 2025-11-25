Supabase RLS & GitHub security (quick guide)

This doc collects concrete steps to harden your Supabase database and GitHub repository for the Luah demo.

1) Apply RLS policies (Supabase)

- Go to Supabase → Database → Tables → `vents` (or create it) → Settings → Row Level Security → enable.
- Repeat for `vent_comments`.
- Open Database → SQL Editor and run the statements in `supabase/policies.sql` (already included in this repo).

Notes on the example policies:
- They allow public SELECT (reads) and restricted INSERTs for anonymous users.
- They validate text length and constrain moods to known values.
- They do not implement rate-limiting; consider an edge function or proxy to perform rate-limiting.

2) GitHub: secret scanning & branch protection

- Secrets
  - In your GitHub repo: Settings → Secrets and variables → Actions → Repository secrets → add `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
  - These secrets are used by the deploy workflow and are never committed to `main` by the workflow.
  - We also added a `gitleaks` workflow (`.github/workflows/secret-scan.yml`) which will scan pushes and PRs to prevent accidental secret commits.

- Branch protection (recommended)
  - Settings → Branches → Add rule for `main`.
  - Require pull requests before merging.
  - Require status checks to pass (this ensures workflows, including secret scans, run before merges).

3) Deployment model & why anon keys remain sensitive

- When you host on GitHub Pages, the site runs purely client-side. Any key embedded in the page (or injected at deploy time) is visible to users and researchers via browser devtools.
- If you need to avoid exposing a key entirely, host a serverless function (Vercel/Netlify/Cloudflare Worker) and place server-side operations behind it. The client calls the function, the function uses a server-side key stored in platform secrets.

4) Quick checklist

- [ ] Enable RLS on `vents` and `vent_comments`.
- [ ] Run SQL statements in `supabase/policies.sql`.
- [ ] Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to GitHub repository secrets.
- [ ] Enable GitHub secret scanning and add branch protection for `main`.
- [ ] Consider adding a serverless proxy if you need to prevent public keys.

If you want, I can scaffold a minimal serverless function (Vercel/Netlify/Cloudflare Worker) and update the frontend to call it for write operations. Tell me which free host you prefer and I will implement it and wire up CI instructions to store the service key in platform secrets.

# Luah — Anonymous Venting Space

Luah is a tiny web app where people can write anonymous “vents” about how they feel.  
No accounts, no usernames shown on the page — just text and mood tags.

Live demo (GitHub Pages):  
`https://malllllllllllllll.github.io/luah/`  
*(Replace this with your own Pages URL if you fork the project.)*

---

## What you can do

- Write short anonymous entries (max 600 characters).
- Tag them with moods like **Calm**, **Heavy**, **Hopeful**, **Tired**, **Anxious**, or **Uncategorized**.
- Scroll through past entries in a list view.
- Leave tiny anonymous replies on a specific entry.

All data is stored in Supabase tables:

- `public.vents`
- `public.vent_comments`

---

## Tech stack

- **Frontend:** plain HTML, CSS, vanilla JavaScript
- **Backend-as-a-service:** Supabase (PostgreSQL + auth + API)
- **Hosting:** GitHub Pages (static)

Files:

- `index.html` — main page
- `styles.css` — dark VCR-style UI
- `app.js` — UI logic and Supabase calls
- `supabase.js` — Supabase client config loader
- `local-dev.js` — simple local mock for testing without real keys

---

## Running locally

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-username>/luah.git
   cd luah
For quick testing, inject your Supabase config in index.html before supabase.js:

html
Copy code
<script>
  // Local dev only — do NOT commit real keys
  window.__SUPABASE_CONFIG__ = {
    url: "https://your-project.supabase.co",
    anonKey: "sb_publishable_..."
  };
</script>
Start a simple local server:

bash
Copy code
python -m http.server 8080
# then open http://localhost:8080 in your browser
If you only want to test the UI with fake data, local-dev.js can be used to mock Supabase on localhost without any keys.

Deploying on GitHub Pages
Push code to your GitHub repo.

Add these repository secrets in GitHub:

SUPABASE_URL

SUPABASE_ANON_KEY

Use a GitHub Actions workflow (for example, .github/workflows/deploy.yml) to:

inject those secrets into index.html meta tags or window.__SUPABASE_CONFIG__,

publish the site using GitHub Pages.

This keeps keys out of the repo and only injects them at deploy time.
# SOVRYN Setup Walkthrough — Step by Step

This guide walks you through (1) adding OSINT keys so the Companion can "scan the digital archives," and (2) re-indexing the repo in Cursor so @codebase works well.

---

## Part A: Add your OSINT key(s)

The Sovereign Companion uses a search API when a user types their name. With a key set, it calls Serper (or another provider) for real public results. Without a key, it still works using a built-in mock.

### Option 1 — Local development (e.g. on your PC)

**Step 1.** Get a Serper API key (e.g. 2,500 free searches/month).

- Go to **[serper.dev](https://serper.dev)**.
- Sign up (no credit card for free tier).
- Open the dashboard and copy your **API key**.

**Step 2.** Create or open the env file for the **web** app.

- In your project, go to the **`web`** folder.
- If you see **`.env.local`**, open it. If not, create a new file named **`.env.local`** inside **`web`** (same folder as **`.env.example`**).

**Step 3.** Add the key in **`web/.env.local`**.

Add this line (replace the placeholder with your real key):

```env
SERPER_API_KEY=paste-your-serper-api-key-here
```

Save the file. **Do not** commit this file to git (it should already be in `.gitignore`).

**Step 4.** Restart the dev server.

- Stop the Next.js dev server (Ctrl+C in the terminal).
- Start it again: e.g. `npm run dev` from the **`web`** folder.
- The recognition API will now use Serper when a user types their name in the Companion.

---

### Option 2 — Netlify (production)

**Step 1.** Get your API key (same as above — e.g. from serper.dev).

**Step 2.** Open your Netlify site.

- Go to **[app.netlify.com](https://app.netlify.com)** and sign in.
- Click the site that hosts your PFF web app.

**Step 3.** Open Environment variables.

- In the top nav: **Site configuration** → **Environment variables** (or **Build & deploy** → **Environment** → **Environment variables**).

**Step 4.** Add a variable.

- Click **Add a variable** or **Add another**.
- **Key:** `SERPER_API_KEY`
- **Value:** paste your Serper API key.
- Choose **All scopes** (or at least “Builds” and “Functions” if you use serverless).
- Save.

**Step 5.** Redeploy.

- Trigger a new deploy (e.g. **Deploys** → **Trigger deploy** → **Deploy site**) so the new variable is picked up.

After deploy, the production Companion will use Serper for name lookups when users open the Manifesto/Companion.

---

### Optional: TAVILY or GOOGLE keys

- **TAVILY:** Get a key from [tavily.com](https://tavily.com). In **`web/.env.local`** or Netlify env add:  
  `TAVILY_API_KEY=your-key`  
  (Used when we add Tavily as an alternative search backend.)

- **GOOGLE:** If you use Google Custom Search API, add:  
  `GOOGLE_SEARCH_API_KEY=your-key`  
  (Used when we add Google as an alternative.)

You only need **one** of SERPER, TAVILY, or GOOGLE for “Internet Sight.” Serper is the one currently wired in the code.

---

## Part B: Full semantic re-index in Cursor (@codebase)

The app’s **indexed paths** (what SOVRYN is allowed to “read” for code answers) are set in code: **`SOVRYN_INDEXED_PATHS`** in **`web/lib/manifestoCompanionKnowledge.ts`**. They already include `backend/src/economic`, `core`, `web/lib`, `web/components/manifesto`, `docs`, etc.

For **Cursor’s own** semantic search and **@codebase** to work well across the repo, Cursor needs to index the project. You don’t change any app code for this — it’s an editor step.

**Step 1.** Open the project in Cursor.

- Open the **root folder** of the repo (the folder that contains **`web`**, **`backend`**, **`core`**, **`docs`**).

**Step 2.** Trigger a re-index (so @codebase and search are up to date).

- **Command Palette:**  
  - Windows/Linux: `Ctrl+Shift+P`  
  - Mac: `Cmd+Shift+P`  
- Type: **“Cursor: Re-index”** or **“Index”**.
- Run the command that re-indexes the codebase / workspace (exact name can vary by Cursor version).

If you don’t see “Re-index”:

- Try **“Developer: Reload Window”** to refresh the index.
- Or use **“Cursor: Refresh Codebase Index”** (or similar) if your Cursor version shows it.

**Step 3.** Use @codebase in chat.

- In Cursor’s AI chat, type **@codebase** and then your question (e.g. “Where is mintOnVitalization defined?” or “How does the 9-day ritual work?”).
- Cursor will use the indexed code to answer; that matches the same areas SOVRYN uses (**`SOVRYN_INDEXED_PATHS`**).

**Step 4.** Optional: narrow to key folders.

- You can reference **@web**, **@backend**, **@core**, or **@docs** if Cursor supports folder-level @ mentions, so answers focus on those areas (contracts, logic, manifesto-related code).

---

## Quick checklist

- [ ] Serper (or other) key added to **`web/.env.local`** for local dev.
- [ ] Key added in **Netlify** → **Site configuration** → **Environment variables** for production.
- [ ] Dev server restarted after changing `.env.local`.
- [ ] Netlify site redeployed after adding the env var.
- [ ] Cursor re-index run from the repo root (Command Palette → “Re-index” or similar).
- [ ] Test: open the Manifesto, open the Companion, type your name and see the “digital archives” style response (or the sovereign pivot if the API is down).

For more on keys and security, see **`docs/SOVRYN-INTERNET-SIGHT.md`**.

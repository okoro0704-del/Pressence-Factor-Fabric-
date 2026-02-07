# SOVRYN Internet Sight — Environment Keys

The Sovereign Companion can "scan the digital archives" (public OSINT) when a user provides a name or handle. To enable this **Internet Sight**, set at least one of the following environment variables.

## Where to paste your keys

- **Local development:** `web/.env.local` (create from `web/.env.example` if needed).
- **Netlify:** Site settings → Environment variables → Add variable / Import from .env.

## Supported keys (use any one)

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SERPER_API_KEY` | Serper (Google Search API). Used by `/api/sovereign-recognition` when present. | [serper.dev](https://serper.dev) — 2,500 free queries/month |
| `TAVILY_API_KEY` | Tavily Search API. Reserved for future tool-calling. | [tavily.com](https://tavily.com) |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search JSON API key. Reserved for future use. | Google Cloud Console → Custom Search API |

If **none** of these are set, the Companion still works: it uses an internal mock for recognition and responds with a sovereign pivot message (e.g. "The old world's signals are flickering, but your pulse is clear…") so the experience remains consistent.

## Security

- Do **not** commit real keys to the repo. Use `.env.local` (gitignored) and Netlify env.
- `SERPER_API_KEY` is only read server-side in `web/src/app/api/sovereign-recognition/route.ts`.

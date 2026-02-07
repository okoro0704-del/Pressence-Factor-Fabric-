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

If **none** of these are set (or both Serper and Tavily fail), the recognition API returns 503 and the Companion tells the user that the old world's firewall is blocking sight and to check API connections in the console. No internal mock or sovereign pivot—we do not steer away when a search is requested.

## Security

- Do **not** commit real keys to the repo. Use `.env.local` (gitignored) and Netlify env.
- `SERPER_API_KEY` is only read server-side in `web/src/app/api/sovereign-recognition/route.ts`.

# Pythia

Pythia is a mythology-themed book discovery app. Named after the oracle of Delphi, it turns a book title, genre, or reading vibe into five recommendations and offers focused paths for readers who already know what kind of story they want.

The main recommender uses a Cloudflare Worker API with an Azure AI Foundry Azure OpenAI deployment. AI plans live catalog searches and selects five real catalog books with personalized reasons. The React frontend is hosted on GitHub Pages. The four themed experiences retain their curated, client-side collections.

## Experiences

- **Pythia** (`/`) is the AI-powered main recommender. Search by title, genre, or free-form vibes.
- **Medusa** (`/medusa`) explores weird-girl, body-horror, and monstrous-feminine fiction through reflections and subgenres.
- **Nyx** (`/nyx`) maps fears such as ghosts, isolation, curses, and the unknown to horror reading paths.
- **Ariadne** (`/ariadne`) uses a flower garden of romance tropes to reveal curated recommendations.
- **Janus** (`/janus`) combines a future-world archetype with a human question to rank speculative fiction.

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 19, React DOM |
| Language | TypeScript 6 |
| Routing | React Router 7 |
| Build tooling | Vite 8, `@vitejs/plugin-react` |
| Styling | Plain CSS organized by app and page |
| Linting | Oxlint |
| Frontend hosting | GitHub Pages |
| Recommendation API | Cloudflare Workers |
| CI/CD | GitHub Actions |

The main recommender requires a separately deployed Cloudflare Worker and a structured-output-capable Azure OpenAI model deployed through Foundry. The Worker free plan can host the API within its published limits; Azure model inference may still incur charges. No database is required.

## Recommendation Sources

1. All input modes call `POST /api/recommendations` on the deployed Cloudflare Worker (`worker/`).
2. Title requests first retrieve live seed metadata.
3. Open Library supplies candidates; optional server-side Google Books adds another catalog.
4. Foundry selects exactly five candidate IDs using strict JSON-schema structured output and personalized reasons. The server resolves IDs to catalog titles, authors, and source URLs, rejecting unknown IDs, duplicates, invalid reasons, incomplete responses, and insufficient candidate pools.

There are **no hardcoded final picks, browser ranking, SimilarBookFinder override, or silent success fallbacks** in the main recommender. Partial catalog failures are displayed as warnings; configuration, catalog, AI, and timeout failures are explicit errors. Catalog-backed existence does not guarantee the AI's thematic interpretation is accurate; reasons are AI-generated, not verified plot summaries.

Open Library title autocomplete stays client-side. Medusa, Nyx, Ariadne, and Janus still use `src/seeds` without requiring the backend.

## Development Architecture

```text
BrowserRouter (src/main.tsx)
├── Pythia recommender (src/App.tsx)
│   ├── input and UI state
│   ├── Open Library title autocomplete (src/titleAutocomplete.ts)
│   └── backend client (src/recommendations.ts)
│       └── Cloudflare Worker (worker/): live retrieval + Foundry planning/selection
│           └── shared recommendation engine (api/src)
└── Themed oracle pages (src/pages)
	├── page-specific interaction and selection state
	├── curated recommendation seeds (src/seeds)
	└── page-specific presentation (src/styles/pages)
```

### Project Structure

```text
.
├── .github/workflows/       GitHub Pages deployment workflow
├── public/                  Static media served without bundling
├── src/
│   ├── App.tsx              Main recommender UI
│   ├── recommendations.ts   Public backend client
│   ├── titleAutocomplete.ts Retained client-side autocomplete
│   ├── main.tsx             React entry point and route definitions
│   ├── pages/               Medusa, Nyx, Ariadne, and Janus experiences
│   ├── seeds/               Curated books, prompts, tropes, and mappings
│   └── styles/              Shared and page-specific CSS
├── api/                     Shared recommendation engine, Azure adapter, and tests
├── worker/                  Cloudflare Worker adapter and tests
├── wrangler.jsonc           Cloudflare Worker settings and IP rate limit
├── vite.config.ts           Vite plugins and GitHub Pages base path
└── tsconfig*.json           TypeScript project configuration
```

State is local to each route and managed with React hooks. Native `fetch` is used with bounded timeouts. Credentials never belong in the browser bundle.

## Development

Use Node.js 22 or newer and npm. Install dependencies with `npm ci`. The React app remains a static GitHub Pages site; the deployed Cloudflare Worker serves its recommendation API. No Azure Functions runtime or Azure CLI is needed for the Cloudflare deployment.

All `VITE_*` values are public build-time data. Never put API keys in `.env.local`, frontend code, or GitHub Pages variables. Set only the public Worker URL as `VITE_RECOMMENDATIONS_API_URL`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check the project and create `dist/` |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Serve the production build locally |
| `npm run worker:test` | Run Cloudflare Worker boundary and mocked recommendation tests |
| `npm --prefix api test` | Run shared recommendation engine and Azure adapter tests |
| `npm run worker:deploy` | Deploy the Cloudflare Worker (Wrangler login required) |
| `npm run worker:tail` | Stream Cloudflare Worker logs |

Run the main quality checks before opening a pull request:

```bash
npm run lint
npm run build
npm run worker:test
npm --prefix api test
npx wrangler deploy --dry-run
```

## Deployment

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site on every push to `main`. It can also be started manually through GitHub Actions.

### Cloudflare Worker backend (deploy before Pages)

1. Create a Cloudflare account and install the repository dependencies with `npm ci` from the repository root. Sign Wrangler into Cloudflare with `npx wrangler login`. Register a free `workers.dev` subdomain in the Cloudflare dashboard; Wrangler requires this before deploying the public API URL.
2. Add the rotated Foundry key as a Worker secret.

   ```bash
   npx wrangler secret put FOUNDRY_API_KEY
   ```

3. Review `wrangler.jsonc`: it contains the non-secret Azure OpenAI endpoint, deployment name, Pages origin, and a per-IP limit of five requests per minute. Change `ALLOWED_ORIGIN` if the site uses a custom domain. The rate-limit `namespace_id` must be unique in your Cloudflare account; choose another integer if it conflicts.
4. Deploy the Worker from the repository root:

   ```bash
   npm run worker:deploy
   ```

   Wrangler prints its `https://pythia-recommendations.<your-subdomain>.workers.dev` URL. The API route is `/api/recommendations`. Optional `GOOGLE_BOOKS_API_KEY` can also be added with `npx wrangler secret put GOOGLE_BOOKS_API_KEY`.
5. In GitHub repository **Settings > Secrets and variables > Actions > Variables**, set `VITE_RECOMMENDATIONS_API_URL` to the full Worker API URL, then run **Deploy to GitHub Pages**. The build embeds this public URL; it contains no credentials.

The Worker uses Cloudflare's free-plan request allowance and a Cloudflare rate-limit binding. Rate limits are location-scoped and approximate, not a global spend guarantee. **CORS is not authentication**; non-browser callers can bypass it. Set Azure OpenAI quotas/budget alerts and monitor Worker and model usage. Requests use two model calls, up to three catalog searches, at most 60 candidates, and a 75-second backend deadline. Catalog or Foundry failures are explicit; there are no hardcoded recommendation fallbacks. The free Worker host does not make Azure model inference free.

The Foundry endpoint must be an Azure OpenAI resource endpoint (not a Foundry project URL), and its deployment must support strict structured outputs. Keep the API key in Wrangler's encrypted Worker secrets. The Worker logs only error codes, not prompts, upstream responses, or credentials. Reading preferences are sent to Azure OpenAI and catalog providers; avoid sending sensitive personal data.

The original Azure Functions adapter remains under `api/` for deployments that prefer Azure Functions, but it is not needed for the Cloudflare setup.

### GitHub Pages frontend

1. Open **Settings > Pages** and set **Source** to **GitHub Actions**.
2. Set repository Actions **variable** `VITE_RECOMMENDATIONS_API_URL` to the deployed Cloudflare Worker URL, including `/api/recommendations`. This URL is not a secret.
3. Push to `main` or run **Deploy to GitHub Pages**. Rebuild after changing this value because Vite embeds it at build time. A missing URL allows the site to build but explicitly disables main recommendations; themed pages remain usable.

The workflow installs dependencies, builds the Vite app, uploads `dist/`, and deploys it. The existing `/Pythia/` base path and Router basename preserve Pages routing. Cloudflare and Azure accounts, the Foundry key, and deployed Worker are operator-provided; no cloud resources are provisioned by this repository.

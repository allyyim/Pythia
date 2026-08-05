# Pythia

Pythia is a mythology-themed book discovery app. Named after the oracle of Delphi, it turns a book title, genre, or reading vibe into five recommendations and offers focused paths for readers who already know what kind of story they want.

The app is entirely client-side. It combines live catalog data with curated local collections, ranks candidates in the browser, and links readers to Goodreads or a source catalog to continue exploring.

## Experiences

- **Pythia** (`/`) is the main recommender. Search by title, genre, or free-form vibes.
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
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

No application server or database is required.

## Recommendation Sources

The main recommender uses a layered strategy so a temporary catalog failure does not leave the reader without results:

1. Title searches try SimilarBookFinder for close plot and theme matches.
2. Google Books is queried when `VITE_GOOGLE_BOOKS_KEY` is configured.
3. Open Library supplies autocomplete, search, and subject data.
4. A local fallback library guarantees a final set of recommendations when live sources are unavailable.

Results are normalized, deduplicated, scored, and limited in the browser. The Medusa, Nyx, Ariadne, and Janus pages use curated data from `src/seeds` and do not require live APIs for their core recommendation logic.

## Development Architecture

```text
BrowserRouter (src/main.tsx)
├── Pythia recommender (src/App.tsx)
│   ├── input and UI state
│   ├── external catalog requests
│   ├── normalization, scoring, and deduplication
│   └── guaranteed local fallback recommendations
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
│   ├── App.tsx              Main recommender and ranking pipeline
│   ├── main.tsx             React entry point and route definitions
│   ├── pages/               Medusa, Nyx, Ariadne, and Janus experiences
│   ├── seeds/               Curated books, prompts, tropes, and mappings
│   └── styles/              Shared and page-specific CSS
├── vite.config.ts           Vite plugins and GitHub Pages base path
└── tsconfig*.json           TypeScript project configuration
```

State is local to each route and managed with React hooks. There is no global state container. The app uses native `fetch` for external requests, including request timeouts and graceful fallback behavior.

## Local Development

### Prerequisites

- Node.js 20 or newer
- npm

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173/Pythia/` because the project uses `/Pythia/` as its base path.

### Optional Google Books API Key

Google Books enriches live recommendations but is not required. Create a `.env.local` file to enable it:

```dotenv
VITE_GOOGLE_BOOKS_KEY=your_api_key
```

Variables prefixed with `VITE_` are bundled into client code. Treat this key as a browser API key and restrict it by allowed website origin in Google Cloud; do not use an unrestricted secret.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check the project and create `dist/` |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Serve the production build locally |

Run the main quality checks before opening a pull request:

```bash
npm run lint
npm run build
```

## Deployment

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site on every push to `main`. It can also be started manually through GitHub Actions.

To enable deployment for the repository:

1. Open **Settings > Pages** in GitHub.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow.

The workflow installs dependencies with `npm ci`, builds the Vite app, uploads `dist/`, and deploys the artifact to GitHub Pages. The `/Pythia/` value in `vite.config.ts` and React Router's Vite-derived basename keep asset and route URLs aligned with the repository Pages URL.

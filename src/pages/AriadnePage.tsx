import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import "../styles/pages/AriadnePage.css";
import { ARIADNE_GARDEN_TROPES } from "../seeds/ariadneGardenTropesSeed";

const FLOWER_COLORS: Record<string, { petal: string; ink: string }> = {
  rose: { petal: "#ce4a6b", ink: "#fff7fb" },
  lily: { petal: "#f7f4ea", ink: "#2c3f36" },
  oleander: { petal: "#f39ab5", ink: "#3a1f2b" },
  ivy: { petal: "#4f8a52", ink: "#f3fff2" },
  orchid: { petal: "#b26fd6", ink: "#fff7ff" },
  moonflower: { petal: "#f3efde", ink: "#2c3f36" },
  wildflower: { petal: "#6f9fd6", ink: "#f4f9ff" },
  camellia: { petal: "#e87f8f", ink: "#3f2027" },
  briar: { petal: "#b9556a", ink: "#fff5f8" },
  violet: { petal: "#7c64c8", ink: "#f7f3ff" },
  dahlia: { petal: "#c84f8d", ink: "#fff6fb" },
  peony: { petal: "#f2a3b7", ink: "#3f1f2a" },
};

function getFlowerName(trope: string) {
  return trope.split(":")[0]?.trim().toLowerCase() ?? "";
}

function getFlowerStyle(trope: string): CSSProperties {
  const flower = getFlowerName(trope);
  const colors = FLOWER_COLORS[flower] ?? { petal: "#9fc5b9", ink: "#223b32" };

  return {
    "--flower-color": colors.petal,
    "--flower-ink": colors.ink,
  } as CSSProperties;
}

function toGoodreadsLink(title: string, author: string) {
  return `https://www.goodreads.com/search?q=${encodeURIComponent(`${title} ${author}`)}`;
}

function AriadnePage() {
  const [selectedTrope, setSelectedTrope] = useState(ARIADNE_GARDEN_TROPES[0]?.trope ?? "");
  const activeTrope =
    ARIADNE_GARDEN_TROPES.find((entry) => entry.trope === selectedTrope) ??
    ARIADNE_GARDEN_TROPES[0];
  const seedCount = activeTrope?.seeds?.length ?? 0;

  return (
    <div className="ariadne-page">
      <main className="ariadne-shell">
        <header className="ariadne-hero">
          <Link className="ariadne-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="ariadne-eyebrow">Ariadne</p>
          <h1>Walk Ariadne's garden. She'll name your next thorned romance.</h1>
          <p className="ariadne-subtitle">
            Ariadne unravels the labyrinth of love: golden threads, tangled hearts, and the search for a heart that feels like home.
          </p>
        </header>

        <section className="ariadne-card" aria-label="Ariadne intro">
          <p className="ariadne-trope-prompt">Pick a flower to reveal your recommendations.</p>
          <div className="ariadne-trope-chips" role="list" aria-label="Ariadne garden trope chips">
            {ARIADNE_GARDEN_TROPES.map((entry) => (
              <button
                key={entry.trope}
                type="button"
                role="listitem"
                className={`ariadne-trope-chip ariadne-flower-chip ${
                  entry.trope === selectedTrope ? "active" : ""
                }`}
                style={getFlowerStyle(entry.trope)}
                onClick={() => setSelectedTrope(entry.trope)}
              >
                {entry.trope}
              </button>
            ))}
          </div>

          {activeTrope ? (
            <section className="ariadne-trope-feature" aria-label="Selected Ariadne trope">
              <h3>{activeTrope.trope}</h3>
              <p>{activeTrope.note}</p>
              <div className="ariadne-seed-books" aria-live="polite">
                <p className="ariadne-seed-books-title">Ariadne recommendations</p>
                {seedCount > 0 ? (
                  <ul>
                    {(activeTrope.seeds ?? []).map((seed) => (
                      <li key={`${seed.title}-${seed.author}`}>
                        <a
                          href={seed.link ?? toGoodreadsLink(seed.title, seed.author)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {seed.title}
                        </a>{" "}
                        by {seed.author}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ariadne-seed-books-empty">
                    Pick a trope with seeds like Rose, Violet, Dahlia, or Peony.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default AriadnePage;

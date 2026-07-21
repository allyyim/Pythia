import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/pages/NyxPage.css";
import { NYX_FEAR_PATHS } from "../seeds/nyxFearSeed";

const NYX_FEAR_ICONS: Record<string, { symbol: string; className: string; label: string }> = {
  ghosts: { symbol: "👻", className: "nyx-icon-ghost", label: "Ghost" },
  monsters: { symbol: "👹", className: "nyx-icon-monster", label: "Monster" },
  woods: { symbol: "", className: "nyx-icon-woods", label: "Forest cluster" },
  unknown: { symbol: "🌀", className: "nyx-icon-unknown", label: "Unknown" },
  curses: { symbol: "🔮", className: "nyx-icon-curses", label: "Curses" },
  abandoned: { symbol: "🏚️", className: "nyx-icon-haunted-house", label: "Haunted house" },
  dead: { symbol: "🧟", className: "nyx-icon-zombie", label: "Zombie" },
  deep: { symbol: "🧜‍♀️", className: "nyx-icon-mermaid", label: "Mermaid" },
  watched: { symbol: "", className: "nyx-icon-eyes", label: "Eyes watching" },
  dark: { symbol: "🕳️", className: "nyx-icon-abyss", label: "Dark abyss" },
};

function NyxPage() {
  const [selectedPath, setSelectedPath] = useState(NYX_FEAR_PATHS[0]?.id ?? "");
  const activePath = NYX_FEAR_PATHS.find((path) => path.id === selectedPath) ?? NYX_FEAR_PATHS[0];

  return (
    <div className="nyx-page">
      <main className="nyx-shell">
        <header className="nyx-hero">
          <Link className="nyx-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="nyx-eyebrow">Nyx</p>
          <h1>Nyx</h1>
          <p className="nyx-subtitle">
           Nyx descends into the darkness beyond the known: cosmic dread, forbidden rituals, and the terrifying return of what should have remained buried.
          </p>
        </header>

        <section className="nyx-card" aria-label="Nyx intro">
          <h2>What are you afraid of?</h2>

          <p className="nyx-fear-prompt">Choose your fear.</p>
          <div className="nyx-path-grid" role="list" aria-label="Fear paths">
            {NYX_FEAR_PATHS.map((path) => {
                const icon = NYX_FEAR_ICONS[path.id] ?? {
                  symbol: "🌘",
                  className: "nyx-icon-default",
                  label: "Fear icon",
                };

                return (
              <button
                key={path.id}
                type="button"
                role="listitem"
                className={`nyx-path-chip ${selectedPath === path.id ? "active" : ""}`}
                onClick={() => setSelectedPath(path.id)}
              >
                {path.id === "watched" ? (
                  <span
                    className={`nyx-path-icon ${icon.className}`}
                    aria-label={icon.label}
                    role="img"
                  >
                    <span className="nyx-eye-pair" aria-hidden="true">
                      <span className="nyx-eye">
                        <span className="nyx-pupil" />
                      </span>
                      <span className="nyx-eye">
                        <span className="nyx-pupil" />
                      </span>
                    </span>
                  </span>
                ) : path.id === "curses" ? (
                  <span
                    className={`nyx-path-icon ${icon.className}`}
                    aria-label={icon.label}
                    role="img"
                  >
                    <span className="nyx-curses-wrap" aria-hidden="true">
                      <span className="nyx-curses-spark nyx-curses-spark-top">✦</span>
                      <span className="nyx-curses-spark nyx-curses-spark-right">✦</span>
                      <span className="nyx-curses-spark nyx-curses-spark-bottom">✦</span>
                      <span className="nyx-curses-spark nyx-curses-spark-left">✦</span>
                      <span className="nyx-curses-orb">{icon.symbol}</span>
                    </span>
                  </span>
                ) : path.id === "woods" ? (
                  <span
                    className={`nyx-path-icon ${icon.className}`}
                    aria-label={icon.label}
                    role="img"
                  >
                    <span className="nyx-woods-cluster" aria-hidden="true">
                      <span className="nyx-woods-tree">🌲</span>
                      <span className="nyx-woods-tree">🌲</span>
                      <span className="nyx-woods-tree">🌲</span>
                    </span>
                  </span>
                ) : (
                  <span
                    className={`nyx-path-icon ${icon.className}`}
                    aria-label={icon.label}
                    role="img"
                  >
                    {icon.symbol}
                  </span>
                )}
                <span>{path.fear}</span>
              </button>
                );
              })}
          </div>

          {activePath ? (
            <div className="nyx-seed-grid" aria-label="Nyx seeded fears">
              <section key={activePath.id} className="nyx-seed-block" aria-label={activePath.fear}>
                <h3>{activePath.fear}</h3>
                <p className="nyx-leads-label">Leads to</p>
                <p>{activePath.leadsTo}</p>
                {activePath.seedAuthors?.length ? (
                  <p className="nyx-seed-authors">
                    Seed authors: {activePath.seedAuthors.join(", ")}
                  </p>
                ) : null}
                {activePath.seedBooks?.length ? (
                  <>
                    <p className="nyx-seed-authors">Seed books</p>
                    <ul>
                      {activePath.seedBooks.map((book) => (
                        <li key={`${activePath.id}-${book.title}`}>
                          {book.link ? (
                            <a href={book.link} target="_blank" rel="noreferrer noopener">
                              {book.title}
                            </a>
                          ) : (
                            book.title
                          )}
                          {book.author ? ` by ${book.author}` : ""}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default NyxPage;

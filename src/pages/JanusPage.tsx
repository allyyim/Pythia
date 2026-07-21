import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/pages/JanusPage.css";
import {
  HUMAN_OPTIONS,
  JANUS_LIBRARY,
  WORLD_OPTIONS,
  type HumanQuestion,
  type WorldType,
} from "../seeds/janusRecommendationsSeed";

const toGoodreadsLink = (title: string, author: string) =>
  `https://www.goodreads.com/search?q=${encodeURIComponent(`${title} ${author}`)}`;

function JanusPage() {
  const [worldType, setWorldType] = useState<WorldType>("controlled");
  const [humanQuestion, setHumanQuestion] = useState<HumanQuestion>("truth");
  const [expandedTrack, setExpandedTrack] = useState<"world" | "human" | null>("world");
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true);

  const selectedWorld = WORLD_OPTIONS.find((option) => option.id === worldType);
  const selectedHuman = HUMAN_OPTIONS.find((option) => option.id === humanQuestion);

  const recommendations = useMemo(() => {
    const scored = JANUS_LIBRARY.map((book) => {
      let score = 0;
      if (book.worldTypes.includes(worldType)) {
        score += 3;
      }
      if (book.humanQuestions.includes(humanQuestion)) {
        score += 3;
      }
      if (book.worldTypes.includes(worldType) && book.humanQuestions.includes(humanQuestion)) {
        score += 2;
      }

      return { ...book, score };
    })
      .filter((book) => book.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const topFive = scored.slice(0, 5);
    const reasonCounts = new Map<string, number>();

    return topFive.map((book) => {
      const seen = reasonCounts.get(book.reason) ?? 0;
      reasonCounts.set(book.reason, seen + 1);

      if (seen === 0) {
        return book;
      }

      return {
        ...book,
        reason: `${book.reason} In ${book.title}, this unfolds through ${book.author}'s lens.`,
      };
    });
  }, [humanQuestion, worldType]);

  return (
    <div className="janus-page">
      <main className="janus-shell">
        <header className="janus-hero">
          <Link className="janus-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="janus-eyebrow">Janus</p>
          <h1>Face Janus's gate. He'll name your next speculative read.</h1>
          <p className="janus-subtitle">
            The magic of Janus is the threshold between future worlds and human consequences:
            imagined societies, emergent technology, and the fate that follows every choice.
          </p>
          <p className="janus-invocation">Janus, two-faced keeper of doors and hours...</p>
          <h2 className="janus-paths-heading">Choose your paths</h2>
        </header>

        <section className="janus-grid" aria-label="Janus recommendation paths">
          <article className="janus-card janus-track-card" aria-label="Path 1 World Engine">
            <button
              type="button"
              className="janus-track-toggle"
              onClick={() => setExpandedTrack(expandedTrack === "world" ? null : "world")}
              aria-expanded={expandedTrack === "world"}
              aria-controls="janus-world-options"
            >
              <span>Path 1: The World Engine</span>
              <strong>{expandedTrack === "world" ? "▾" : "▸"}</strong>
            </button>
            {expandedTrack === "world" ? (
              <>
                <p className="janus-track-prompt">What kind of future are you entering?</p>
                <div className="janus-chip-grid" id="janus-world-options" role="list" aria-label="World type options">
                  {WORLD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`janus-chip ${worldType === option.id ? "active" : ""}`}
                      onClick={() => {
                        setWorldType(option.id);
                        setExpandedTrack("human");
                      }}
                    >
                      <span>{option.label}</span>
                      <small>{option.subtitle}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </article>

          <article className="janus-card janus-track-card" aria-label="Path 2 Human Question">
            <button
              type="button"
              className="janus-track-toggle"
              onClick={() => setExpandedTrack(expandedTrack === "human" ? null : "human")}
              aria-expanded={expandedTrack === "human"}
              aria-controls="janus-human-options"
            >
              <span>Path 2: The Human Question</span>
              <strong>{expandedTrack === "human" ? "▾" : "▸"}</strong>
            </button>
            {expandedTrack === "human" ? (
              <>
                <p className="janus-track-prompt">What is this future actually asking?</p>
                <div className="janus-chip-grid" id="janus-human-options" role="list" aria-label="Human question options">
                  {HUMAN_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`janus-chip ${humanQuestion === option.id ? "active" : ""}`}
                      onClick={() => {
                        setHumanQuestion(option.id);
                        setExpandedTrack(null);
                      }}
                    >
                      <span>{option.label}</span>
                      <small>{option.subtitle}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </article>
        </section>

        <section className="janus-card janus-results" aria-live="polite" aria-label="Janus recommendations">
          <button
            type="button"
            className="janus-recommendations-toggle"
            aria-expanded={isRecommendationsOpen}
            onClick={() => setIsRecommendationsOpen((prev) => !prev)}
          >
            <h3>Janus Recommendations</h3>
            <span className="janus-recommendations-arrow" aria-hidden="true">
              {isRecommendationsOpen ? "▾" : "▸"}
            </span>
          </button>

          {isRecommendationsOpen ? (
            <>
              <p className="janus-result-context">
                Path selected: <strong>{selectedWorld?.label}</strong> +{" "}
                <strong>{selectedHuman?.label}</strong>
              </p>
              <ul>
                {recommendations.map((book) => (
                  <li key={book.title + book.author}>
                    <a href={toGoodreadsLink(book.title, book.author)} target="_blank" rel="noreferrer">
                      {book.title}
                    </a>{" "}
                    by {book.author}
                    <p>{book.reason}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default JanusPage;

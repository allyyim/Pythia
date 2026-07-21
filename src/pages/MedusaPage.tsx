import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/pages/MedusaPage.css";
import {
  getMedusaBookBlurb,
  MEDUSA_AUTHOR_BY_TITLE,
  MEDUSA_SUBGENRES,
  REFLECTION_PROMPTS,
  type MedusaSubgenre,
  type ReflectionCollection,
} from "../seeds/medusaSubgenresSeed";

type ParsedRecommendation = {
  title: string;
  author: string;
};


function normalizeTitleKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findSubgenreByTitleIncludes(fragment: string): MedusaSubgenre | undefined {
  const normalizedFragment = normalizeTitleKey(fragment);

  return MEDUSA_SUBGENRES.find((subgenre) =>
    normalizeTitleKey(subgenre.title).includes(normalizedFragment),
  );
}

function parseRecommendation(value: string): ParsedRecommendation {
  const trimmed = value.trim();
  const byMatch = trimmed.match(/^(.*?)\s+by\s+(.+)$/i);

  if (byMatch) {
    const title = byMatch[1].trim();
    const author = byMatch[2].trim();
    return { title, author };
  }

  const key = normalizeTitleKey(trimmed);
  const author = MEDUSA_AUTHOR_BY_TITLE[key];

  if (author) {
    return { title: trimmed, author };
  }

  return { title: trimmed, author: "Unknown Author" };
}

function getUniqueRecommendations(recommendations: string[]) {
  const seen = new Set<string>();
  const normalized: ParsedRecommendation[] = [];

  recommendations.forEach((book) => {
    const parsed = parseRecommendation(book);
    const key = normalizeTitleKey(parsed.title);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    normalized.push(parsed);
  });

  return normalized;
}

function getGoodreadsSearchUrl(book: string) {
  return `https://www.goodreads.com/search?q=${encodeURIComponent(book)}`;
}

function getCollectionRecommendations(collection: ReflectionCollection) {
  const gathered: string[] = [];

  collection.sourceSubgenres.forEach((fragment) => {
    const match = findSubgenreByTitleIncludes(fragment);
    if (match) {
      gathered.push(...match.recommendations);
    }
  });

  return getUniqueRecommendations(gathered).slice(0, 12);
}

function MedusaPage() {
  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(null);
  const [activeCollectionLabel, setActiveCollectionLabel] = useState<string | null>(null);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true);

  const activeReflection = useMemo(() => {
    if (!activeReflectionId) {
      return null;
    }

    return (
      REFLECTION_PROMPTS.find((prompt) => prompt.id === activeReflectionId) ??
      REFLECTION_PROMPTS[0]
    );
  }, [activeReflectionId]);

  useEffect(() => {
    if (activeReflection) {
      setActiveCollectionLabel(activeReflection.collections[0].label);
    }
  }, [activeReflection]);

  useEffect(() => {
    setIsRecommendationsOpen(true);
  }, [activeCollectionLabel]);

  const activeCollection = activeReflection
    ? activeReflection.collections.find((collection) => collection.label === activeCollectionLabel) ??
      activeReflection.collections[0]
    : null;

  const activeBooks = activeCollection
    ? getCollectionRecommendations(activeCollection)
    : [];

  return (
    <div className="medusa-page">
      <main className="medusa-shell">
        <header className="medusa-hero">
          <Link className="medusa-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="medusa-eyebrow">Medusa</p>
          <h1>Face Medusa's mirror. She'll name your next cursed obsession.</h1>
          <p className="medusa-subtitle">
            Medusa thrives on unhinged weird-girl chaos: tarnished glamour, mirror-split selves,
            and the delicious moment a girl stops performing and becomes the monster.
          </p>
        </header>

        <section className="medusa-consult" aria-label="Face the gaze">
          <div className="mirror-stage" key={activeReflectionId ?? "mirror-default"}>
            <p className="mirror-invocation">Mirror, mirror on the wall...</p>
            <p className="mirror-prompt">Choose your reflection</p>
            <ul className="mirror-options" aria-label="Reflections">
              {REFLECTION_PROMPTS.map((prompt) => (
                <li key={prompt.id}>
                  <button
                    type="button"
                    className={`reflection-mirror ${activeReflectionId === prompt.id ? "active" : ""}`}
                    onClick={() => setActiveReflectionId(prompt.id)}
                  >
                    <span className="reflection-mirror-label">{prompt.line}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {activeReflection && activeCollection && (
            <>
              <div className="collection-block">
                <p className="collection-label">Subgenres</p>
                <div className="collection-chooser" aria-label="Subgenres">
                  {activeReflection.collections.map((collection) => (
                    <button
                      key={collection.label}
                      type="button"
                      className={`collection-pill ${activeCollection.label === collection.label ? "active" : ""}`}
                      onClick={() => setActiveCollectionLabel(collection.label)}
                    >
                      {collection.label}
                    </button>
                  ))}
                </div>
              </div>

              <section className="collection-panel" aria-label={`${activeCollection.label} books`}>
                <button
                  type="button"
                  className="recommendations-toggle"
                  aria-expanded={isRecommendationsOpen}
                  onClick={() => setIsRecommendationsOpen((prev) => !prev)}
                >
                  <span>Medusa Recommendations</span>
                  <span className="recommendations-arrow" aria-hidden="true">
                    {isRecommendationsOpen ? "▾" : "▸"}
                  </span>
                </button>

                {isRecommendationsOpen && (
                  <>
                    <h3>{activeCollection.label}</h3>
                    <ul>
                      {activeBooks.map((book) => (
                        <li key={`${book.title}-${book.author}`}>
                          <a
                            className="book-title-link"
                            href={getGoodreadsSearchUrl(`${book.title} ${book.author}`)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {book.title}
                          </a>
                          <span className="book-author"> by {book.author}</span>
                          <p>{getMedusaBookBlurb(activeCollection.label, book.title)}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </>
          )}
        </section>

      </main>
    </div>
  );
}

export default MedusaPage;

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./MedusaPage.css";
import { MEDUSA_SUBGENRES, type MedusaSubgenre } from "./medusaSubgenresSeed";

type ParsedRecommendation = {
  display: string;
  title: string;
};

type ReflectionCollection = {
  label: string;
  sourceSubgenres: string[];
};

type ReflectionPrompt = {
  id: string;
  icon: string;
  line: string;
  keywords: string[];
  collections: ReflectionCollection[];
};

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "identity",
    icon: "🪞",
    line: "I don't recognize myself anymore.",
    keywords: ["identity", "myself", "recognize", "becoming", "double", "doppelganger"],
    collections: [
      {
        label: "Identity Crisis",
        sourceSubgenres: ["Mirror Girls", "Unreliable Women", "Outsider Women"],
      },
      {
        label: "Doppelgangers",
        sourceSubgenres: ["Mirror Girls"],
      },
      {
        label: "Becoming",
        sourceSubgenres: ["Villain Origins", "Mythic Women", "Medusa Mode"],
      },
    ],
  },
  {
    id: "beauty",
    icon: "💄",
    line: "Beauty feels like a performance.",
    keywords: ["beauty", "body", "femininity", "performance", "pretty", "appearance"],
    collections: [
      {
        label: "Beauty Horror",
        sourceSubgenres: ["Medusa Mode", "Glamour & Rot"],
      },
      {
        label: "Body Horror",
        sourceSubgenres: ["Body Betrayal"],
      },
      {
        label: "Femininity",
        sourceSubgenres: ["Forbidden Fruit", "Gothic Girls", "Obsessive Desire"],
      },
    ],
  },
  {
    id: "rage",
    icon: "🩸",
    line: "I'm angry in ways I can't explain.",
    keywords: ["angry", "rage", "furious", "femgore", "revenge", "violence"],
    collections: [
      {
        label: "Female Rage",
        sourceSubgenres: ["Female Rage"],
      },
      {
        label: "Femgore",
        sourceSubgenres: ["Female Rage", "Body Betrayal"],
      },
    ],
  },
  {
    id: "gaze",
    icon: "👁",
    line: "I feel like everyone is watching me.",
    keywords: ["watching", "gaze", "society", "seen", "judge", "performance", "satire"],
    collections: [
      {
        label: "Society's Gaze",
        sourceSubgenres: ["Disoriented Daughters", "Glamour & Rot", "Outsider Women"],
      },
      {
        label: "Performance",
        sourceSubgenres: ["Obsessed Artists", "Unreliable Women", "Girl Failure"],
      },
      {
        label: "Social Satire",
        sourceSubgenres: ["Disoriented Daughters", "Girl Failure", "Glamour & Rot"],
      },
    ],
  },
  {
    id: "weird",
    icon: "🐇",
    line: "Reality feels slightly... off.",
    keywords: ["surreal", "off", "dream", "weird", "unreal", "strange", "logic"],
    collections: [
      {
        label: "Surreal",
        sourceSubgenres: ["Surreal Feminine", "The Spiral"],
      },
      {
        label: "Dream Logic",
        sourceSubgenres: ["The Spiral", "Surreal Feminine", "Existential Horror"],
      },
      {
        label: "Weird Girl",
        sourceSubgenres: ["Girl Failure", "The Spiral", "Surreal Feminine"],
      },
    ],
  },
];

const AUTHOR_BY_TITLE: Record<string, string> = {
  "acts of desperation": "Megan Nolan",
  "alias grace": "Margaret Atwood",
  animal: "Lisa Taddeo",
  "big swiss": "Jen Beagin",
  "bunny": "Mona Awad",
  "boy parts": "Eliza Clark",
  "carmilla": "Sheridan Le Fanu",
  "chlorine": "Jade Song",
  circe: "Madeline Miller",
  "cult classic": "Sloane Crosley",
  "convenience store woman": "Sayaka Murata",
  disorientation: "Elaine Hsieh Chou",
  "earthlings": "Sayaka Murata",
  eileen: "Ottessa Moshfegh",
  "girl, serpent, thorn": "Melissa Bashardoust",
  "gone girl": "Gillian Flynn",
  "her body and other parties": "Carmen Maria Machado",
  "luster": "Raven Leilani",
  "life ceremony": "Sayaka Murata",
  "milk fed": "Melissa Broder",
  "my year of rest and relaxation": "Ottessa Moshfegh",
  "nightbitch": "Rachel Yoder",
  "our wives under the sea": "Julia Armfield",
  "paradais": "Fernanda Melchor",
  rebecca: "Daphne du Maurier",
  rouge: "Mona Awad",
  "stone blind": "Natalie Haynes",
  "sirens muses": "Antonia Angress",
  "the bell jar": "Sylvia Plath",
  "the bloody chamber": "Angela Carter",
  "the guest": "Emma Cline",
  "the pisces": "Melissa Broder",
  "the vegetarian": "Han Kang",
  "woman, eating": "Claire Kohda",
  yellowface: "R. F. Kuang",
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
    return { display: `${title} by ${author}`, title };
  }

  const key = normalizeTitleKey(trimmed);
  const author = AUTHOR_BY_TITLE[key];

  if (author) {
    return { display: `${trimmed} by ${author}`, title: trimmed };
  }

  return { display: `${trimmed} by Unknown Author`, title: trimmed };
}

function getUniqueRecommendations(recommendations: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  recommendations.forEach((book) => {
    const parsed = parseRecommendation(book);
    const key = normalizeTitleKey(parsed.title);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    normalized.push(parsed.display);
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
          <h1>Face Medusa's mirror. Choose your reflection, and she will name your next dark read.</h1>
          <p className="medusa-subtitle">A curated weird girl and dark feminine collection about beauty, identity, obsession, and becoming monstrous under society's gaze.</p>
        </header>

        <section className="medusa-consult" aria-label="Face the gaze">
          <div className="mirror-stage" key={activeReflectionId ?? "mirror-default"}>
            <p className="mirror-invocation">Mirror, mirror on the wall...</p>
            <div className="mirror-glass">
              <p className="mirror-prompt">Click below to reflect</p>
              <ul className="reflection-grid" aria-label="Reflections">
                {REFLECTION_PROMPTS.map((prompt) => (
                  <li key={prompt.id}>
                    <button
                      type="button"
                      className={`reflection-pill ${activeReflectionId === prompt.id ? "active" : ""}`}
                      onClick={() => setActiveReflectionId(prompt.id)}
                    >
                      <p className="reflection-pill-line">
                        <span>{prompt.line}</span>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
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
                  <span>Recommendations</span>
                  <span className="recommendations-arrow" aria-hidden="true">
                    {isRecommendationsOpen ? "▾" : "▸"}
                  </span>
                </button>

                {isRecommendationsOpen && (
                  <>
                    <h3>{activeCollection.label}</h3>
                    <ul>
                      {activeBooks.map((book) => (
                        <li key={book}>
                          <a
                            href={getGoodreadsSearchUrl(book)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {book}
                          </a>
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

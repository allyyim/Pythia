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
  collections: ReflectionCollection[];
};

const MIRROR_FACETS = [
  "Beauty",
  "Identity",
  "Desire",
  "Rage",
  "Obsession",
  "Transformation",
  "Performance",
  "Isolation",
];

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "identity",
    icon: "🪞",
    line: "I don't recognize myself anymore.",
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

  return getUniqueRecommendations(gathered);
}

function MedusaPage() {
  const [activeReflectionId, setActiveReflectionId] = useState(REFLECTION_PROMPTS[0].id);
  const [activeCollectionLabel, setActiveCollectionLabel] = useState(
    REFLECTION_PROMPTS[0].collections[0].label,
  );

  const activeReflection = useMemo(
    () => REFLECTION_PROMPTS.find((item) => item.id === activeReflectionId) ?? REFLECTION_PROMPTS[0],
    [activeReflectionId],
  );

  useEffect(() => {
    setActiveCollectionLabel(activeReflection.collections[0].label);
  }, [activeReflection]);

  const activeCollection =
    activeReflection.collections.find((collection) => collection.label === activeCollectionLabel) ??
    activeReflection.collections[0];

  const activeBooks = getCollectionRecommendations(activeCollection);

  return (
    <div className="medusa-page">
      <main className="medusa-shell">
        <header className="medusa-hero">
          <Link className="medusa-top-back-link" to="/" aria-label="Back to main page">
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </Link>
          <p className="medusa-eyebrow">Sister Site</p>
          <h1>Medusa</h1>
          <p className="medusa-subtitle">
            Face the gaze and let Medusa name what is shifting inside you. Choose a reflection,
            then step into the collection it summons.
          </p>
        </header>

        <section className="medusa-card" aria-label="Face the gaze">
          <h2>Face the Gaze</h2>
          <p className="medusa-instruction">Consult Medusa through reflections, not genres.</p>

          <div className="mirror-stage" key={activeReflection.id}>
            <p className="mirror-line">
              <span className="mirror-icon" aria-hidden="true">{activeReflection.icon}</span>
              <span>{activeReflection.line}</span>
            </p>
          </div>

          <h3 className="medusa-section-title">Reflections</h3>
          <ul className="reflection-grid" aria-label="Reflection prompts">
            {REFLECTION_PROMPTS.map((reflection) => (
              <li key={reflection.id}>
                <button
                  type="button"
                  className={`reflection-pill ${activeReflection.id === reflection.id ? "active" : ""}`}
                  onClick={() => setActiveReflectionId(reflection.id)}
                >
                  <span aria-hidden="true">{reflection.icon}</span>
                  <span>{reflection.line}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mirror-facets" aria-label="The Mirror facets">
            <h3 className="medusa-section-title">The Mirror</h3>
            <ul>
              {MIRROR_FACETS.map((facet) => (
                <li key={facet}>{facet}</li>
              ))}
            </ul>
          </div>

          <div className="collection-chooser" aria-label="Book collections">
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

          <section className="collection-panel" aria-label={`${activeCollection.label} books`}>
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
          </section>
        </section>

      </main>
    </div>
  );
}

export default MedusaPage;

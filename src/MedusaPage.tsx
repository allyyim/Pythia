import { useState } from "react";
import { Link } from "react-router-dom";
import "./MedusaPage.css";
import { MEDUSA_SUBGENRES, type MedusaSubgenre } from "./medusaSubgenresSeed";

type ParsedRecommendation = {
  display: string;
  title: string;
};

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

function getSubgenreBoxLabel(title: string) {
  return title
    .replace(/\band\s+beyond\b/gi, "")
    .split(/\s[-–—]\s/)[0]
    .trim();
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

function MedusaPage() {
  const [activePopup, setActivePopup] = useState<MedusaSubgenre | null>(null);
  const [isSubgenresCollapsed, setIsSubgenresCollapsed] = useState(false);
  const popupRecommendations = activePopup
    ? getUniqueRecommendations(activePopup.recommendations)
    : [];

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
            A focused subgenre map for dark feminine reads, literary unease, and thorny
            women at the center of the myth.
          </p>
        </header>

      <section className="medusa-card" aria-label="Medusa subgenres">
        <div className="medusa-subgenres-header">
          <h2>Subgenres</h2>
          <button
            type="button"
            className="subgenres-toggle"
            aria-expanded={!isSubgenresCollapsed}
            aria-controls="medusa-subgenres-content"
            aria-label={isSubgenresCollapsed ? "Expand subgenres" : "Collapse subgenres"}
            onClick={() => setIsSubgenresCollapsed((prev) => !prev)}
          >
            {isSubgenresCollapsed ? "▸" : "▾"}
          </button>
        </div>
        {!isSubgenresCollapsed && (
          <div id="medusa-subgenres-content">
            <p className="medusa-instruction">
              Click each one to see recommendations.
            </p>
            <ul className="medusa-subgenres-grid">
              {MEDUSA_SUBGENRES.map((subgenre) => (
                <li key={subgenre.title}>
                  <button
                    type="button"
                    className="subgenre-box"
                    onClick={() => setActivePopup(subgenre)}
                  >
                    {getSubgenreBoxLabel(subgenre.title)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {activePopup && (
        <div
          className="popup-backdrop"
          role="button"
          tabIndex={0}
          onClick={() => setActivePopup(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setActivePopup(null);
            }
          }}
        >
          <section
            className="popup-card"
            role="dialog"
            aria-modal="true"
            aria-label={`${activePopup.title} recommendations`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{activePopup.title}</h3>
            <p className="popup-focus">{activePopup.focus}</p>
            <ul>
              {popupRecommendations.map((book) => (
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
            <button
              type="button"
              className="close-popup"
              onClick={() => setActivePopup(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      </main>
    </div>
  );
}

export default MedusaPage;

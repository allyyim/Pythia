import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./App.css";

type InputMode = "title" | "genre";
type FieldTab = "title" | "genre" | "vibes";

type BookSuggestion = {
  title: string;
  author?: string;
  reason: string;
};

const buildGoodreadsLink = (title: string, author?: string) => {
  const query = author ? `${title} ${author}` : title;
  return `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
};

const HARDCODED_MATCHES: Array<{
  triggers: string[];
  dynamicAnyOf?: string[][];
  intentKeywords?: string[];
  recommendations: BookSuggestion[];
}> = [
  {
    triggers: [
      "sad",
      "make you cry",
      "cry",
      "books that are sad",
      "tuesdays for morrie",
      "flowers for algeron",
      "boy in the striped pajamas",
    ],
    recommendations: [
      {
        title: "Flowers for Algernon",
        author: "Daniel Keyes",
        reason: "Emotionally devastating character arc and loss.",
      },
      {
        title: "Tuesdays with Morrie",
        author: "Mitch Albom",
        reason: "Reflective memoir on mortality, love, and grief.",
      },
      {
        title: "The Boy in the Striped Pajamas",
        author: "John Boyne",
        reason: "Childhood innocence collides with historical tragedy.",
      },
      {
        title: "A Little Life",
        author: "Hanya Yanagihara",
        reason: "Unflinching portrayal of trauma and deep friendship.",
      },
      {
        title: "Never Let Me Go",
        author: "Kazuo Ishiguro",
        reason: "Quiet, haunting sadness that lingers long after reading.",
      },
    ],
  },
  {
    triggers: [
      "asian american",
      "asian american female",
      "asian american female experience",
      "model minority",
      "unhinged female",
      "unhinged female protagonist",
      "disorientation",
      "boring asian female",
      "yellowface",
      "yellow face",
    ],
    dynamicAnyOf: [
      ["asian", "american"],
      ["model", "minority"],
      ["unhinged", "female"],
      ["yellowface"],
      ["disorientation"],
    ],
    intentKeywords: [
      "asian",
      "american",
      "female",
      "model",
      "minority",
      "unhinged",
      "yellowface",
      "disorientation",
    ],
    recommendations: [
      {
        title: "Disorientation",
        author: "Elaine Hsieh Chou",
        reason: "Sharp satire of race, academia, and identity pressure.",
      },
      {
        title: "Boring Asian Female",
        author: "Neesha Meminger",
        reason: "Darkly funny essays on stereotypes and belonging.",
      },
      {
        title: "Yellowface",
        author: "R. F. Kuang",
        reason: "Messy ambition, cultural theft, and unreliable narration.",
      },
      {
        title: "The School for Good Mothers",
        author: "Jessamine Chan",
        reason: "Dystopian critique of motherhood and social scrutiny.",
      },
      {
        title: "Yolk",
        author: "Mary H. K. Choi",
        reason: "Body image, family tension, and emotional unraveling.",
      },
    ],
  },
  {
    triggers: [
      "horror folklore short stories",
      "horror folklore",
      "folklore horror",
      "horror short stories",
      "horror gothic",
      "gothic horror",
      "folklore short stories",
      "kissing the wtich",
      "kissing the witch",
      "bloody chamber",
      "how to be eaten",
    ],
    dynamicAnyOf: [
      ["horror", "folklore"],
      ["horror", "gothic"],
      ["gothic", "folklore"],
      ["horror", "short", "stories"],
      ["kissing", "witch"],
      ["bloody", "chamber"],
      ["how", "eaten"],
    ],
    intentKeywords: [
      "horror",
      "folklore",
      "gothic",
      "short",
      "stories",
      "witch",
      "chamber",
      "eaten",
      "beastly",
    ],
    recommendations: [
      {
        title: "How to Be Eaten",
        author: "Maria Adelmann",
        reason: "Dark, modern folklore with horror-inflected retellings.",
      },
      {
        title: "Kissing the Witch: Old Tales in New Skins",
        author: "Emma Donoghue",
        reason: "Gothic, subversive fairy-tale retellings in short form.",
      },
      {
        title: "Beastly: An Anthology",
        reason: "Folkloric beast motifs and eerie transformation stories.",
      },
      {
        title: "The Bloody Chamber",
        author: "Angela Carter",
        reason: "Classic gothic, sensual, and unsettling fairy-tale collection.",
      },
    ],
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const findHardcodedResults = (text: string): BookSuggestion[] | null => {
  const normalized = normalize(text);
  const tokenSet = new Set(normalized.split(" ").filter(Boolean));
  let bestMatch: { score: number; recommendations: BookSuggestion[] } | null = null;

  for (const scenario of HARDCODED_MATCHES) {
    const phraseMatch = scenario.triggers.some((trigger) =>
      normalized.includes(trigger),
    );
    const dynamicMatch =
      scenario.dynamicAnyOf?.some((keywordGroup) =>
        keywordGroup.every((keyword) => tokenSet.has(keyword)),
      ) ?? false;

    if (phraseMatch || dynamicMatch) {
      return scenario.recommendations;
    }

    const score =
      scenario.intentKeywords?.reduce((count, keyword) => {
        return count + (tokenSet.has(keyword) || normalized.includes(keyword) ? 1 : 0);
      }, 0) ?? 0;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, recommendations: scenario.recommendations };
    }
  }

  if (bestMatch && bestMatch.score >= 2) {
    return bestMatch.recommendations;
  }

  return null;
};

const rankOpenLibraryBooks = (
  docs: Array<{ title?: string; author_name?: string[] }>,
  vibe: string,
): BookSuggestion[] => {
  const vibeTerms = normalize(vibe)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return docs
    .filter((book) => Boolean(book.title))
    .slice(0, 30)
    .map((book) => {
      const title = book.title ?? "Untitled";
      const author = book.author_name?.[0];
      const corpus = normalize(`${title} ${author ?? ""}`);
      const score = vibeTerms.reduce(
        (total, term) => total + (corpus.includes(term) ? 1 : 0),
        0,
      );

      return {
        title,
        author,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 5)
    .map((book, index) => ({
      title: book.title,
      author: book.author,
      reason:
        book.score > 0
          ? "Matched your vibe terms with title/author context."
          : `Strong candidate #${index + 1} from a free Open Library catalog search.`,
    }));
};

const fetchOpenLibraryResults = async (
  mode: InputMode,
  value: string,
  vibe: string,
): Promise<BookSuggestion[]> => {
  const query = mode === "title" ? `${value} ${vibe}` : `${value} fiction ${vibe}`;
  const endpoint = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=30`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Unable to fetch recommendations right now.");
  }

  const payload = (await response.json()) as {
    docs?: Array<{ title?: string; author_name?: string[] }>;
  };
  const docs = payload.docs ?? [];

  if (!docs.length) {
    return [
      {
        title: "No close catalog matches found",
        reason: "Try a broader vibe or a different seed title/genre.",
      },
    ];
  }

  return rankOpenLibraryBooks(docs, vibe);
};

const BUBBLE_ANIMATION_MS = 3200;

function App() {
  const [fieldTab, setFieldTab] = useState<FieldTab>("title");
  const [titleInput, setTitleInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [vibeInput, setVibeInput] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState<BookSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hasTitle = titleInput.trim().length > 1;
  const hasGenre = genreInput.trim().length > 1;
  const hasVibe = vibeInput.trim().length > 2;

  const canSubmit = useMemo(
    () => hasTitle || hasGenre || hasVibe,
    [hasTitle, hasGenre, hasVibe],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Enter at least one input: Book title, Genre, or Vibes.");
      return;
    }

    setError("");
    setResults([]);
    setIsLoading(true);

    const mode: InputMode = hasTitle ? "title" : "genre";
    const value = hasTitle
      ? titleInput.trim()
      : hasGenre
        ? genreInput.trim()
        : vibeInput.trim();
    const vibeForSearch = hasVibe
      ? vibeInput.trim()
      : hasGenre
        ? genreInput.trim()
        : titleInput.trim();
    setIsAnimating(true);

    window.setTimeout(() => {
      setIsAnimating(false);
    }, BUBBLE_ANIMATION_MS);

    try {
      const hardcoded = findHardcodedResults(
        `${titleInput} ${genreInput} ${vibeInput}`,
      );
      const nextResults =
        hardcoded ??
        (await fetchOpenLibraryResults(mode, value, vibeForSearch));

      window.setTimeout(() => {
        setResults(nextResults);
      }, BUBBLE_ANIMATION_MS - 50);
    } catch (caught) {
      const nextError =
        caught instanceof Error
          ? caught.message
          : "Something went wrong while finding recommendations.";
      setError(nextError);
    } finally {
      window.setTimeout(() => {
        setIsLoading(false);
      }, BUBBLE_ANIMATION_MS - 50);
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Pythia</p>
        <h1>Speak, seeker. Tell Pythia a title, a genre, or a vibe, and she will reveal five destined reads.</h1>
        <p className="subtitle">
          An oracle-powered recommendation engine with instant curated matches. Named after
          Pythia, the Oracle of Delphi, it "prophesies" your next reading obsession.
        </p>
        <section className="sister-site" aria-label="Sister site: Medusa">
          <p className="sister-lead">
            Pythia is your general/main recommender. 
          </p>
          <ul>
            <li>For women who choose the bear, visit:
              <Link to="/medusa" className="sister-link">
                Medusa
              </Link>
            </li>
            <li>For those who aren't afraid of the dark, visit:
              <Link to="/hecate" className="sister-link">
                Hecate
              </Link>
            </li>
          </ul>
        </section>
      </header>

      <form className="prompt-card" onSubmit={onSubmit}>
        <div className="field-tabs" role="tablist" aria-label="Input sections">
          <button
            type="button"
            role="tab"
            aria-selected={fieldTab === "title"}
            className={fieldTab === "title" ? "active" : ""}
            onClick={() => setFieldTab("title")}
          >
            Book title
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={fieldTab === "genre"}
            className={fieldTab === "genre" ? "active" : ""}
            onClick={() => setFieldTab("genre")}
          >
            Genre
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={fieldTab === "vibes"}
            className={fieldTab === "vibes" ? "active" : ""}
            onClick={() => setFieldTab("vibes")}
          >
            Vibes
          </button>
        </div>

        {fieldTab === "title" ? (
          <>
            <label>
              Book title
              <input
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
                placeholder="Example: The Secret History"
              />
            </label>
          </>
        ) : fieldTab === "genre" ? (
          <label>
            Genre
            <input
              value={genreInput}
              onChange={(event) => setGenreInput(event.target.value)}
              placeholder="Example: Literary fiction"
            />
          </label>
        ) : (
          <label>
            Vibe and themes
            <textarea
              value={vibeInput}
              onChange={(event) => setVibeInput(event.target.value)}
              placeholder="Example: sad and introspective, makes you cry"
            />
          </label>
        )}

        <button className="submit" type="submit" disabled={isLoading}>
          {isLoading ? "Consulting the shelf..." : "Recommend"}
        </button>
        {!canSubmit && (
          <p className="helper-text">Add any one: Book title, Genre, or Vibes.</p>
        )}
      </form>

      <section className="stage" aria-live="polite">
        {isAnimating && (
          <div className="bubble-wrap">
            <div className="bubble" aria-hidden="true" />
            <span className="bubble-label">thinking</span>
            <div className="bubble-shadow" aria-hidden="true" />
            <div className="pop-ring" />
          </div>
        )}

        {!isAnimating && results.length > 0 && (
          <div className="results-block">
            <h3 className="results-heading">Recommendations</h3>
            <ol className="results">
              {results.map((book) => (
                <li key={book.title}>
                  <h4>{book.title}</h4>
                  {book.author ? <p className="author">by {book.author}</p> : null}
                  <p>{book.reason}</p>
                  <a
                    className="goodreads-link"
                    href={buildGoodreadsLink(book.title, book.author)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Goodreads
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isAnimating && error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default App;

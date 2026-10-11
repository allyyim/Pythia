import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./styles/App.css";

import { fetchRecommendations } from "./recommendations";
import { fetchTitleAutocompleteSuggestions, parseTitleAndAuthor } from "./titleAutocomplete";
import type { TitleSuggestion } from "./titleAutocomplete";

type InputMode = "title" | "genre" | "vibes";
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

const buildBookDisplayLabel = (title: string, author?: string) =>
  author ? `${title} by ${author}` : title;

function App() {
  const [fieldTab, setFieldTab] = useState<FieldTab>("title");
  const [titleInput, setTitleInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [vibeInput, setVibeInput] = useState("");
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [isLoadingTitleSuggestions, setIsLoadingTitleSuggestions] = useState(false);
  const [isTitleSuggestionsOpen, setIsTitleSuggestionsOpen] = useState(false);
  const [isTruthPopupOpen, setIsTruthPopupOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState<BookSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [catalogWarnings, setCatalogWarnings] = useState<string[]>([]);

  const hasTitle = titleInput.trim().length > 1;
  const hasGenre = genreInput.trim().length > 1;
  const hasVibe = vibeInput.trim().length > 2;

  const canSubmit = useMemo(
    () => hasTitle || hasGenre || hasVibe,
    [hasTitle, hasGenre, hasVibe],
  );

  useEffect(() => {
    if (fieldTab !== "title") {
      setTitleSuggestions([]);
      setIsLoadingTitleSuggestions(false);
      setIsTitleSuggestionsOpen(false);
      return;
    }

    const parsedTitle = parseTitleAndAuthor(titleInput);
    if (parsedTitle.title.trim().length < 3) {
      setTitleSuggestions([]);
      setIsLoadingTitleSuggestions(false);
      return;
    }

    let isCancelled = false;
    const debounceId = window.setTimeout(async () => {
      setIsLoadingTitleSuggestions(true);
      const suggestions = await fetchTitleAutocompleteSuggestions(titleInput);
      if (!isCancelled) {
        setTitleSuggestions(suggestions);
        setIsLoadingTitleSuggestions(false);
      }
    }, 260);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounceId);
    };
  }, [fieldTab, titleInput]);

  const selectTitleSuggestion = (suggestion: TitleSuggestion) => {
    const displayValue = suggestion.author
      ? `${suggestion.title} by ${suggestion.author}`
      : suggestion.title;
    setTitleInput(displayValue);
    setTitleSuggestions([]);
    setIsLoadingTitleSuggestions(false);
    setIsTitleSuggestionsOpen(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Enter at least one input: Book title, Genre, or Vibes.");
      return;
    }

    setError("");
    setResults([]);
    setTitleSuggestions([]);
    setIsTitleSuggestionsOpen(false);
    setIsLoading(true);
    setSourceLabel("");
    setCatalogWarnings([]);

    const preferredMode: InputMode = fieldTab;
    const mode: InputMode =
      preferredMode === "title" && hasTitle
        ? "title"
        : preferredMode === "genre" && hasGenre
          ? "genre"
          : preferredMode === "vibes" && hasVibe
            ? "vibes"
            : hasTitle
              ? "title"
              : hasGenre
                ? "genre"
                : "vibes";

    const value =
      mode === "title"
        ? titleInput.trim()
        : mode === "genre"
          ? genreInput.trim()
          : vibeInput.trim();
    setIsAnimating(true);

    try {
      const response = await fetchRecommendations(mode, value, hasVibe ? vibeInput.trim() : "");
      setResults(response.recommendations);
      setSourceLabel(`Source: ${response.source}`);
      setCatalogWarnings(response.warnings);
    } catch (caught) {
      const nextError =
        caught instanceof Error
          ? caught.message
          : "Something went wrong while finding recommendations.";
      setError(nextError);
    } finally {
      setIsAnimating(false);
      setIsLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Pythia</p>
        <h1>Speak, seeker. <br />Tell Pythia a title, a genre, or a vibe, and she will reveal five destined reads.</h1>
        <p className="subtitle">
          An oracle-powered recommender named for Delphi's Pythia that "prophesies" your next reading obsession.
        </p>
        <button
          type="button"
          className="truth-trigger"
          onClick={() => setIsTruthPopupOpen(true)}
        >
          Know your genre, seeker? Choose your oracle.
        </button>
      </header>

      {isTruthPopupOpen && (
        <div
          className="truth-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Oracle truth paths"
          onClick={() => setIsTruthPopupOpen(false)}
        >
          <section className="sister-site" aria-label="Oracle paths" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="truth-modal-close"
              aria-label="Close truth popup"
              onClick={() => setIsTruthPopupOpen(false)}
            >
              x
            </button>
            <p className="sister-lead">
              <strong>Four paths. Four truths. One next read.</strong>
            </p>
            <ul>
              <li>
                <Link to="/medusa" className="sister-card-link" onClick={() => setIsTruthPopupOpen(false)}>
                  <span className="sister-link">Medusa</span>
                  <span className="sister-copy">For women who choose the bear.</span>
                </Link>
              </li>
              <li>
                <Link to="/nyx" className="sister-card-link" onClick={() => setIsTruthPopupOpen(false)}>
                  <span className="sister-link">Nyx</span>
                  <span className="sister-copy">For those who are not afraid of the dark.</span>
                </Link>
              </li>
              <li>
                <Link to="/ariadne" className="sister-card-link" onClick={() => setIsTruthPopupOpen(false)}>
                  <span className="sister-link">Ariadne</span>
                  <span className="sister-copy">For those who believe in soulmates.</span>
                </Link>
              </li>
              <li>
                <Link to="/janus" className="sister-card-link" onClick={() => setIsTruthPopupOpen(false)}>
                  <span className="sister-link">Janus</span>
                  <span className="sister-copy">For readers who take the red pill.</span>
                </Link>
              </li>
            </ul>
          </section>
        </div>
      )}

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
          <div className="title-field-wrap">
            <label>
              Book title
              <input
                value={titleInput}
                onChange={(event) => {
                  setTitleInput(event.target.value);
                  setIsTitleSuggestionsOpen(true);
                }}
                onFocus={() => setIsTitleSuggestionsOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setIsTitleSuggestionsOpen(false), 100);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsTitleSuggestionsOpen(false);
                  }
                }}
                aria-expanded={isTitleSuggestionsOpen}
                aria-haspopup="listbox"
                placeholder="Example: The Secret History"
              />
            </label>
            {isTitleSuggestionsOpen && (isLoadingTitleSuggestions || titleSuggestions.length > 0) && (
              <div className="title-suggestions" role="listbox" aria-label="Book title and author suggestions">
                {isLoadingTitleSuggestions ? (
                  <p className="title-suggestions-status">Finding title suggestions...</p>
                ) : (
                  <ul>
                    {titleSuggestions.map((suggestion) => {
                      return (
                        <li key={`${suggestion.title}-${suggestion.author ?? ""}`}>
                          <button
                            type="button"
                            className="title-suggestion-btn"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectTitleSuggestion(suggestion)}
                          >
                            <span className="title-suggestion-title">{suggestion.title}</span>
                            {suggestion.author ? (
                              <span className="title-suggestion-author">by {suggestion.author}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
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
          {isLoading ? "Consulting Pythia..." : "Recommend"}
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
            {sourceLabel && <p className="helper-text">{sourceLabel}</p>}
            {catalogWarnings.map((warning) => <p className="helper-text" key={warning}>{warning}</p>)}
            <ol className="results">
              {results.map((book) => (
                <li key={`${book.title}-${book.author ?? ""}`}>
                  <h4>
                    <a
                      className="goodreads-link"
                      href={buildGoodreadsLink(book.title, book.author)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open Goodreads for ${buildBookDisplayLabel(book.title, book.author)}`}
                      title={buildBookDisplayLabel(book.title, book.author)}
                    >
                      {buildBookDisplayLabel(book.title, book.author)}
                    </a>
                  </h4>
                  <p>{book.reason}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isAnimating && !isLoading && !error && results.length === 0 && (
          <p className="helper-text">No recommendations yet. Try a shorter vibe phrase or broader genre terms.</p>
        )}

        {!isAnimating && error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default App;

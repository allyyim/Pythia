import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./styles/App.css";

type InputMode = "title" | "genre" | "vibes";
type FieldTab = "title" | "genre" | "vibes";

type BookSuggestion = {
  title: string;
  author?: string;
  reason: string;
};

type TitleSuggestion = {
  title: string;
  author?: string;
};

type SimilarBookFinderPick = {
  title: string;
  author?: string;
};

const buildGoodreadsLink = (title: string, author?: string) => {
  const query = author ? `${title} ${author}` : title;
  return `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
};

const buildBookDisplayLabel = (title: string, author?: string) =>
  author ? `${title} by ${author}` : title;

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildSimilarBookFinderLink = (title: string, author?: string, authorOrder: "first-last" | "last-first" = "first-last") => {
  const titleSlug = toSlug(title);

  const authorTokens = (author ?? "")
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  const authorNameForSlug = authorTokens.length > 1
    ? authorOrder === "last-first"
      ? `${authorTokens[authorTokens.length - 1]} ${authorTokens[0]}`
      : `${authorTokens[0]} ${authorTokens[authorTokens.length - 1]}`
    : authorTokens[0] ?? "";
  const authorSlug = toSlug(authorNameForSlug);

  const slug = authorSlug ? `${titleSlug}-by-${authorSlug}` : titleSlug;
  return `https://www.similarbookfinder.com/books/${slug}`;
};

const decodeHtmlEntities = (value: string) => {
  if (typeof window === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const extractTopSimilarBooksFromHtml = (html: string, limit = 5): SimilarBookFinderPick[] => {
  const pairedAnchorRegex = /<a[^>]*href="https:\/\/www\.amazon\.com\/dp\/[^"]+"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,1200}?by\s*<a[^>]*href="[^"]*amazon\.com\/s\?k=[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const pairedSeen = new Set<string>();
  const pairedBooks: SimilarBookFinderPick[] = [];

  let pairedMatch = pairedAnchorRegex.exec(html);
  while (pairedMatch && pairedBooks.length < limit) {
    const title = decodeHtmlEntities(
      pairedMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    const author = decodeHtmlEntities(
      pairedMatch[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );

    const key = `${normalize(title)}::${normalize(author)}`;
    if (title && author && !pairedSeen.has(key)) {
      pairedSeen.add(key);
      pairedBooks.push({ title, author });
    }

    pairedMatch = pairedAnchorRegex.exec(html);
  }

  if (pairedBooks.length > 0) {
    return pairedBooks;
  }

  if (typeof window !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const anchors = Array.from(doc.querySelectorAll('a[href^="https://www.amazon.com/dp/"]'));
    const seen = new Set<string>();
    const books: SimilarBookFinderPick[] = [];

    for (const anchor of anchors) {
      if (books.length >= limit) {
        break;
      }

      const title = decodeHtmlEntities(anchor.textContent?.replace(/\s+/g, " ").trim() ?? "");
      if (!title) {
        continue;
      }

      let author: string | undefined;
      const searchRoots = [anchor.parentElement, anchor.closest("div"), anchor.closest("section")].filter(Boolean) as Element[];

      for (const root of searchRoots) {
        const authorAnchor = root.querySelector('a[href*="amazon.com/s?k="]');
        const authorText = authorAnchor?.textContent?.replace(/\s+/g, " ").trim();
        if (authorText) {
          author = decodeHtmlEntities(authorText);
          break;
        }

        let sibling: Element | null = root.nextElementSibling;
        let hops = 0;
        while (sibling && hops < 6 && !author) {
          const siblingAuthorAnchor = sibling.querySelector('a[href*="amazon.com/s?k="]');
          const siblingAuthorText = siblingAuthorAnchor?.textContent?.replace(/\s+/g, " ").trim();
          if (siblingAuthorText) {
            author = decodeHtmlEntities(siblingAuthorText);
            break;
          }

          const text = sibling.textContent?.replace(/\s+/g, " ").trim() ?? "";
          const byMatch = text.match(/^by\s+(.+)$/i);
          if (byMatch?.[1]) {
            author = decodeHtmlEntities(byMatch[1].trim());
            break;
          }

          sibling = sibling.nextElementSibling;
          hops += 1;
        }

        if (author) {
          break;
        }
      }

      const key = `${normalize(title)}::${normalize(author ?? "")}`;
      if (!seen.has(key)) {
        seen.add(key);
        books.push({ title, author });
      }
    }

    if (books.length > 0) {
      return books;
    }
  }

  const amazonAnchorRegex = /<a[^>]*href="https:\/\/www\.amazon\.com\/dp\/[^"]+"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,800}?)/gi;
  const seen = new Set<string>();
  const books: SimilarBookFinderPick[] = [];

  let match = amazonAnchorRegex.exec(html);
  while (match && books.length < limit) {
    const rawTitle = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const title = decodeHtmlEntities(rawTitle);

    const authorMatch = match[2].match(/by\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const rawAuthor = authorMatch?.[1]
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? "";
    const author = rawAuthor ? decodeHtmlEntities(rawAuthor) : undefined;

    const key = `${normalize(title)}::${normalize(author ?? "")}`;
    if (title.length > 1 && !seen.has(key)) {
      seen.add(key);
      books.push({ title, author });
    }

    match = amazonAnchorRegex.exec(html);
  }

  return books;
};

const fetchSimilarBookFinderCandidate = async (url: string, limit = 5): Promise<{ books: SimilarBookFinderPick[]; url: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const books = extractTopSimilarBooksFromHtml(html, limit);
    if (!books.length) {
      return null;
    }

    return { books, url };
  } catch {
    return null;
  }
};

const fetchSimilarBookFinderTopBooksWithFallback = async (
  title: string,
  author?: string,
  limit = 5,
): Promise<{ books: SimilarBookFinderPick[]; url: string }> => {
  const lastFirstUrl = buildSimilarBookFinderLink(title, author, "last-first");
  const firstLastUrl = buildSimilarBookFinderLink(title, author, "first-last");
  const [lastFirstCandidate, firstLastCandidate] = await Promise.all([
    fetchSimilarBookFinderCandidate(lastFirstUrl, limit),
    author ? fetchSimilarBookFinderCandidate(firstLastUrl, limit) : Promise.resolve(null),
  ]);

  if (lastFirstCandidate?.books.length || !author) {
    return lastFirstCandidate ?? { books: [], url: lastFirstUrl };
  }

  return firstLastCandidate ?? { books: [], url: firstLastUrl };
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildGenreBlurb = (inputGenre: string, tags: string[], sourceLabel: string, hasStrongScore: boolean) => {
  const cleanedTags = uniqueQueries(
    tags
      .map((tag) => tag.replace(/\//g, " ").trim())
      .filter((tag) => tag.length > 0),
  ).slice(0, 3);

  if (cleanedTags.length > 0) {
    const tagLabel = cleanedTags.join(", ");
    return `Matches your ${inputGenre} request because it leans into ${tagLabel}.`;
  }

  return hasStrongScore
    ? `Matches your ${inputGenre} request based on strong ${sourceLabel} genre signals.`
    : `Matches your ${inputGenre} request based on available ${sourceLabel} genre signals.`;
};

const SUMMARY_LIKE_PATTERNS = [
  /\bsummary\b/,
  /\bconversation starters\b/,
  /\bstudy guide\b/,
  /\bbook habits\b/,
  /\bwhizbooks\b/,
  /\banalysis\b/,
];

const isLikelySummaryBook = (title: string, author?: string) => {
  const corpus = normalize(`${title} ${author ?? ""}`);
  return SUMMARY_LIKE_PATTERNS.some((pattern) => pattern.test(corpus));
};

const parseTitleAndAuthor = (input: string) => {
  const trimmed = input.trim();
  const byMatch = trimmed.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      author: byMatch[2].trim(),
    };
  }

  return {
    title: trimmed,
    author: "",
  };
};

const FETCH_TIMEOUT_MS = 6000;

const fetchJsonWithTimeout = async <T,>(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T | null> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const fetchTitleAutocompleteSuggestions = async (input: string): Promise<TitleSuggestion[]> => {
  const parsedInput = parseTitleAndAuthor(input);
  const titleQuery = parsedInput.title.trim();
  const authorQuery = normalize(parsedInput.author);

  if (titleQuery.length < 3) {
    return [];
  }

  const endpoint = `https://openlibrary.org/search.json?title=${encodeURIComponent(titleQuery)}&limit=10&fields=title,author_name`;
  const payload = await fetchJsonWithTimeout<{
    docs?: Array<{ title?: string; author_name?: string[] }>;
  }>(endpoint, 3500);

  if (!payload?.docs?.length) {
    return [];
  }

  const seen = new Set<string>();
  const suggestions = payload.docs
    .map((doc) => ({
      title: doc.title?.trim() ?? "",
      author: doc.author_name?.[0]?.trim(),
    }))
    .filter((item) => item.title.length > 0)
    .filter((item) => {
      const key = `${canonicalizeTitle(item.title)}::${normalize(item.author ?? "")}`;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (!authorQuery) {
        return a.title.localeCompare(b.title);
      }

      const aAuthorMatch = normalize(a.author ?? "").includes(authorQuery) ? 1 : 0;
      const bAuthorMatch = normalize(b.author ?? "").includes(authorQuery) ? 1 : 0;
      return bAuthorMatch - aAuthorMatch || a.title.localeCompare(b.title);
    })
    .slice(0, 6);

  return suggestions;
};

const rankOpenLibraryBooks = (
  docs: Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>,
  mode: InputMode,
  value: string,
  vibe: string,
  subjectWeights: Record<string, number> = {},
  titleContext?: TitleSimilarityContext,
): BookSuggestion[] => {
  const queryTerms = normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
  const vibeTerms = normalize(vibe).split(/[^a-z0-9]+/).filter(Boolean);
  const vibeProfile = buildVibeProfile(vibe);
  const requestedCanonicalTitle = canonicalizeTitle(value);

  const ranked = docs
    .filter((book) => Boolean(book.title))
    .slice(0, 30)
    .map((book) => {
      const title = book.title ?? "Untitled";
      const author = book.author_name?.[0];
      const subjectText = (book.subject ?? []).join(" ");
      const firstSentence = Array.isArray(book.first_sentence)
        ? book.first_sentence.join(" ")
        : (book.first_sentence ?? "");
      const corpus = normalize(`${title} ${author ?? ""} ${subjectText} ${firstSentence}`);
      const subjectCorpus = normalize(subjectText);
      const queryScore = queryTerms.reduce((total, term) => total + (corpus.includes(term) ? 1 : 0), 0);
      const vibeScore = vibeTerms.reduce((total, term) => total + (corpus.includes(term) ? 1 : 0), 0);
      const subjectVibeScore = vibeTerms.reduce((total, term) => total + (subjectCorpus.includes(term) ? 1 : 0), 0);
      const titleThemeMatches = countTermMatches(corpus, titleContext?.themeTerms ?? []);
      const titleThemeScore = (titleContext?.themeTerms?.length ?? 0) > 0
        ? titleThemeMatches / (titleContext?.themeTerms.length ?? 1)
        : 0;
      const titleCategoryMatches = countTermMatches(subjectCorpus, titleContext?.categoryTerms ?? []);
      const unrequestedNegativeSignals = vibeProfile.negativeSignals.filter(
        (signal) => !vibeProfile.requestedNegativeSignals.includes(signal),
      );
      const positiveMatches = countTermMatches(corpus, vibeProfile.positiveSignals);
      const negativeMatches = countTermMatches(corpus, unrequestedNegativeSignals);
      const requestedNegativeMatches = countTermMatches(corpus, vibeProfile.requestedNegativeSignals);
      const genreIntentMatches = countTermMatches(corpus, vibeProfile.preferredGenres.map(normalizeGenreTerm));
      const weightedSubjectScore = Object.entries(subjectWeights).reduce((total, [subjectPhrase, weight]) => {
        const normalizedPhrase = normalize(subjectPhrase);
        return total + (corpus.includes(normalizedPhrase) ? weight : 0);
      }, 0);

      let score = 0;
      if (mode === "title") {
        score =
          queryScore * 0.45 +
          titleThemeScore * 3.1 +
          Math.min(1.6, titleCategoryMatches * 0.35) +
          vibeScore * 0.15;

        // Deprioritize candidates that share almost no thematic signal with the seed title.
        if (titleThemeScore < 0.08 && titleCategoryMatches === 0) {
          score -= 0.7;
        }
      } else if (mode === "genre") {
        score = queryScore * 2.2 + vibeScore * 0.6 + subjectVibeScore * 0.7;
      } else {
        score =
          vibeScore * 2.1 +
          subjectVibeScore * 0.9 +
          genreIntentMatches * 0.9 +
          weightedSubjectScore * 1.2 +
            requestedNegativeMatches * 0.35 +
          positiveMatches * 0.35 +
          queryScore * 0.35 -
          negativeMatches * (vibeProfile.avoidDrama ? 0.55 : 0.25);
      }

      return {
        title,
        author,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const seenCanonicalTitles = new Set<string>();
  const deduped = ranked.filter((book) => {
    if (mode !== "title") {
      return true;
    }

    const canonicalTitle = canonicalizeTitle(book.title);
    if (!canonicalTitle || canonicalTitle === requestedCanonicalTitle || seenCanonicalTitles.has(canonicalTitle)) {
      return false;
    }

    seenCanonicalTitles.add(canonicalTitle);
    return true;
  });

  const qualityFiltered = deduped.filter((book) => !isLikelySummaryBook(book.title, book.author));

  return qualityFiltered.slice(0, 5).map((book, index) => ({
      title: book.title,
      author: book.author,
      reason: (() => {
        if (book.score > 0 && mode === "title") {
          return "Similar plot/themes to your selected title using Open Library subject and synopsis overlap.";
        }
        if (mode === "genre") {
          return buildGenreBlurb(value, book.title === "Untitled" ? [] : (docs.find((doc) => doc.title === book.title)?.subject ?? []), "Open Library", book.score > 0);
        }
        if (book.score > 0) {
          return "Matched your vibe description using title/author relevance.";
        }
        return `Strong candidate #${index + 1} from a free Open Library catalog search.`;
      })(),
    }));
};

const GOOGLE_BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY?.trim() ?? "";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "it", "its",
  "of", "on", "or", "that", "the", "their", "this", "to", "was", "with", "without",
]);

const extractKeywords = (text: string, max = 6) =>
  normalize(text)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, max);

const uniqueQueries = (queries: string[]) =>
  Array.from(new Set(queries.map((query) => query.trim()).filter(Boolean)));

const collectSettledArrays = async <T,>(promises: Array<Promise<T[]>>) => {
  const results = await Promise.allSettled(promises);
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
};

const extractGenrePhrases = (text: string, maxPhrases = 12) => {
  const keywords = extractKeywords(text, 10);
  const phrases: string[] = [];

  for (let size = 3; size >= 1; size -= 1) {
    for (let index = 0; index <= keywords.length - size; index += 1) {
      const phrase = keywords.slice(index, index + size).join(" ");
      if (phrase.length >= 4) {
        phrases.push(phrase);
      }
    }
  }

  return uniqueQueries(phrases).slice(0, maxPhrases);
};

const normalizeGenreTerm = (term: string) => {
  const normalized = normalize(term);
  if (normalized === "sci fi" || normalized === "scifi" || normalized === "science fiction") {
    return "science fiction";
  }
  if (normalized === "fairytales" || normalized === "fairytale" || normalized === "fairy tales") {
    return "fairy tale";
  }
  return normalized;
};

const toOpenLibrarySubjectSlug = (term: string) =>
  normalizeGenreTerm(term)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const countTermMatches = (corpus: string, terms: string[]) =>
  terms.reduce((total, term) => total + (corpus.includes(term) ? 1 : 0), 0);

const TITLE_VARIANT_NOISE = new Set([
  "illustrated",
  "annotated",
  "edition",
  "editions",
  "complete",
  "uncensored",
  "classics",
  "classic",
  "novel",
  "novels",
  "other",
  "volume",
  "vol",
  "book",
]);

const canonicalizeTitle = (title: string) =>
  normalize(title)
    .replace(/\b\d{4}\b/g, " ")
    .split(" ")
    .filter((word) => word.length > 0 && !TITLE_VARIANT_NOISE.has(word))
    .join(" ")
    .trim();

type VibeProfile = {
  preferLight: boolean;
  avoidDrama: boolean;
  wantsRomance: boolean;
  wantsFiction: boolean;
  avoidNonFiction: boolean;
  preferredGenres: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  requestedNegativeSignals: string[];
};

const buildVibeProfile = (vibe: string): VibeProfile => {
  const normalized = normalize(vibe);
  const preferLight = /(feel good|feelgood|lighthearted|cozy|comfort|uplifting|happy)/.test(normalized);
  const avoidDrama = /(no drama|without drama|low drama|not dramatic)/.test(normalized);
  const wantsRomance = /\bromance\b|rom com|romcom|love story|love stories/.test(normalized);
  const wantsFiction = /\bfiction\b|novel|novels/.test(normalized);
  const avoidNonFiction = wantsFiction || /no nonfiction|not nonfiction/.test(normalized);
  const preferredGenres = extractGenrePhrases(vibe, 8);
  const positiveSignals = [
    "feel good",
    "uplifting",
    "heartwarming",
    "humor",
    "comedy",
    "rom com",
    "romance",
    "cozy",
    "friendship",
    "hopeful",
    "slice of life",
    "coming of age",
    "girlhood",
    "queer",
    "metamorphosis",
    "mermaid",
    "ocean",
    "sea",
  ];
  const negativeSignals = [
    "drama",
    "tragedy",
    "grief",
    "trauma",
    "abuse",
    "war",
    "murder",
    "dark",
    "dystopian",
    "gothic",
    "heartbreak",
    "violence",
    "body horror",
    "memoir",
    "biography",
    "self help",
    "history",
  ];
  const requestedNegativeSignals = negativeSignals.filter((signal) => normalized.includes(normalize(signal)));

  return {
    preferLight,
    avoidDrama,
    wantsRomance,
    wantsFiction,
    avoidNonFiction,
    preferredGenres,
    positiveSignals,
    negativeSignals,
    requestedNegativeSignals,
  };
};

const NON_FICTION_TERMS = [
  "nonfiction",
  "memoir",
  "biography",
  "history",
  "essay",
  "self help",
  "journalism",
  "true crime",
  "reference",
];

const ROMANCE_TERMS = ["romance", "romantic", "love story", "rom com", "relationships"];

type GoogleBookCandidate = {
  title: string;
  author?: string;
  description?: string;
  categories?: string[];
  ratingsCount?: number;
  averageRating?: number;
};

type TitleSimilarityContext = {
  themeTerms: string[];
  categoryTerms: string[];
  seedAuthor?: string;
};

const buildTitleSimilarityContext = (
  seed: GoogleBookCandidate | undefined,
  titleValue: string,
): TitleSimilarityContext => {
  const categoryTerms = uniqueQueries(
    (seed?.categories ?? [])
      .flatMap((category) => extractKeywords(normalizeGenreTerm(category), 4))
      .map(normalizeGenreTerm),
  );

  const plotTerms = uniqueQueries(
    extractKeywords(seed?.description ?? "", 12).filter((term) => !["story", "book", "novel"].includes(term)),
  );

  const titleTerms = extractKeywords(titleValue, 5);

  return {
    themeTerms: uniqueQueries([...categoryTerms, ...plotTerms, ...titleTerms]).slice(0, 14),
    categoryTerms: categoryTerms.slice(0, 8),
    seedAuthor: seed?.author,
  };
};

const buildOpenLibraryTitleContext = (
  seedDoc: { subject?: string[]; first_sentence?: string | string[] } | undefined,
  seedAuthor: string | undefined,
  titleValue: string,
): TitleSimilarityContext => {
  const subjectTerms = uniqueQueries(
    (seedDoc?.subject ?? [])
      .flatMap((subject) => extractKeywords(normalizeGenreTerm(subject), 4))
      .map(normalizeGenreTerm),
  );

  const sentenceText = Array.isArray(seedDoc?.first_sentence)
    ? seedDoc?.first_sentence.join(" ")
    : (seedDoc?.first_sentence ?? "");
  const plotTerms = uniqueQueries(
    extractKeywords(sentenceText, 10).filter((term) => !["story", "book", "novel"].includes(term)),
  );
  const titleTerms = extractKeywords(titleValue, 5);

  return {
    themeTerms: uniqueQueries([...subjectTerms, ...plotTerms, ...titleTerms]).slice(0, 14),
    categoryTerms: subjectTerms.slice(0, 8),
    seedAuthor,
  };
};

const mergeUniqueRecommendations = (
  primary: BookSuggestion[],
  secondary: BookSuggestion[],
  limit = 5,
) => {
  const seen = new Set<string>();
  const merged: BookSuggestion[] = [];

  for (const book of [...primary, ...secondary]) {
    const canonical = canonicalizeTitle(book.title);
    if (!canonical || seen.has(canonical)) {
      continue;
    }
    seen.add(canonical);
    merged.push(book);
    if (merged.length >= limit) {
      break;
    }
  }

  return merged;
};

const dedupeGoogleBooks = (books: GoogleBookCandidate[]): GoogleBookCandidate[] => {
  const seen = new Set<string>();
  const deduped: GoogleBookCandidate[] = [];

  for (const book of books) {
    const key = `${normalize(book.title)}::${normalize(book.author ?? "")}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(book);
  }

  return deduped;
};

const rankGoogleBooks = (
  items: GoogleBookCandidate[],
  mode: InputMode,
  value: string,
  vibe: string,
  titleContext?: TitleSimilarityContext,
): BookSuggestion[] => {
  const vibeTerms = normalize(vibe).split(/[^a-z0-9]+/).filter(Boolean);
  const queryTerms = normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
  const requestedTitle = normalize(value);
  const requestedCanonicalTitle = canonicalizeTitle(value);
  const vibeProfile = buildVibeProfile(vibe);

  const ranked = items
    .slice(0, 30)
    .map((book) => {
      const titleAuthorCorpus = normalize(`${book.title} ${book.author ?? ""}`);
      const descriptionCorpus = normalize(book.description ?? "");
      const categoryCorpus = normalize((book.categories ?? []).join(" "));
      const contentCorpus = normalize(`${book.description ?? ""} ${(book.categories ?? []).join(" ")}`);

      const titleAuthorMatches = countTermMatches(titleAuthorCorpus, queryTerms);
      const descriptionMatches = countTermMatches(descriptionCorpus, vibeTerms);
      const categoryMatches = countTermMatches(categoryCorpus, vibeTerms);

      const titleAuthorScore = queryTerms.length
        ? titleAuthorMatches / queryTerms.length
        : 0;
      const descriptionScore = vibeTerms.length
        ? descriptionMatches / vibeTerms.length
        : 0;
      const categoryScore = vibeTerms.length
        ? categoryMatches / vibeTerms.length
        : 0;
      const popularityScore = Math.min(1, Math.log10((book.ratingsCount ?? 0) + 1) / 5);
      const ratingScore = Math.max(0, Math.min(1, (book.averageRating ?? 0) / 5));
      const exactTitleMatch = normalize(book.title) === requestedTitle;
      const titleThemeMatches = countTermMatches(contentCorpus, titleContext?.themeTerms ?? []);
      const titleThemeScore = (titleContext?.themeTerms?.length ?? 0) > 0
        ? titleThemeMatches / (titleContext?.themeTerms.length ?? 1)
        : 0;
      const titleCategoryMatches = countTermMatches(categoryCorpus, titleContext?.categoryTerms ?? []);
      const seedAuthorMatch = titleContext?.seedAuthor
        ? normalize(book.author ?? "") === normalize(titleContext.seedAuthor)
        : false;

      let weightedScore =
        descriptionScore * 0.4 +
        categoryScore * 0.3 +
        titleAuthorScore * 0.2 +
        popularityScore * 0.1;

      if (mode === "title") {
        weightedScore =
          titleAuthorScore * 0.2 +
          titleThemeScore * 0.46 +
          categoryScore * 0.12 +
          Math.min(0.24, titleCategoryMatches * 0.06) +
          (seedAuthorMatch ? 0.05 : 0) +
          popularityScore * 0.09 +
          ratingScore * 0.08 -
          (exactTitleMatch ? 0.45 : 0);

        // Strongly suppress books without meaningful shared plot/theme/category cues.
        if (titleThemeScore < 0.08 && titleCategoryMatches === 0 && categoryScore < 0.05) {
          weightedScore -= 0.32;
        }
      } else if (mode === "genre") {
        weightedScore =
          categoryScore * 0.22 +
          popularityScore * 0.43 +
          ratingScore * 0.3 +
          titleAuthorScore * 0.05;
      } else {
        const positiveMatches = countTermMatches(contentCorpus, vibeProfile.positiveSignals);
        const unrequestedNegativeSignals = vibeProfile.negativeSignals.filter(
          (signal) => !vibeProfile.requestedNegativeSignals.includes(signal),
        );
        const negativeMatches = countTermMatches(contentCorpus, unrequestedNegativeSignals);
        const requestedNegativeMatches = countTermMatches(contentCorpus, vibeProfile.requestedNegativeSignals);
        const romanceMatches = countTermMatches(contentCorpus, ROMANCE_TERMS);
        const nonFictionMatches = countTermMatches(contentCorpus, NON_FICTION_TERMS);

        weightedScore =
          descriptionScore * 0.56 +
          categoryScore * 0.29 +
          titleAuthorScore * 0.08 +
          popularityScore * 0.07;

        if (vibeTerms.length > 0 && descriptionMatches + categoryMatches === 0) {
          weightedScore -= 0.22;
        }

        if (!book.description && (!book.categories || book.categories.length === 0)) {
          weightedScore -= 0.08;
        }

        if (vibeProfile.preferLight) {
          weightedScore += Math.min(0.18, positiveMatches * 0.05);
        }

        if (vibeProfile.avoidDrama) {
          weightedScore -= Math.min(0.35, negativeMatches * 0.07);
        }

        if (vibeProfile.requestedNegativeSignals.length > 0) {
          weightedScore += Math.min(0.22, requestedNegativeMatches * 0.08);
        }

        if (vibeProfile.wantsRomance) {
          weightedScore += Math.min(0.2, romanceMatches * 0.06);
          if (romanceMatches === 0) {
            weightedScore -= 0.18;
          }
        }

        if (vibeProfile.avoidNonFiction && nonFictionMatches > 0) {
          weightedScore -= Math.min(0.3, nonFictionMatches * 0.08);
        }

        if (vibeProfile.preferredGenres.length > 0) {
          const genreIntentMatches = countTermMatches(contentCorpus, vibeProfile.preferredGenres);
          weightedScore += Math.min(0.2, genreIntentMatches * 0.06);
        }
      }

      return {
        ...book,
        weightedScore,
        descriptionMatches,
        categoryMatches,
      };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore || a.title.localeCompare(b.title));

  const seenCanonicalTitles = new Set<string>();
  const deduped = ranked.filter((book) => {
    if (mode !== "title") {
      return true;
    }

    const canonicalTitle = canonicalizeTitle(book.title);
    if (!canonicalTitle || canonicalTitle === requestedCanonicalTitle || seenCanonicalTitles.has(canonicalTitle)) {
      return false;
    }

    seenCanonicalTitles.add(canonicalTitle);
    return true;
  });

  const qualityFiltered = deduped.filter((book) => !isLikelySummaryBook(book.title, book.author));

  return qualityFiltered.slice(0, 5).map((book, index) => ({
      title: book.title,
      author: book.author,
      reason: (() => {
        if (mode === "title") {
          return book.weightedScore > 0
            ? "Similar plot and themes to your title using description/category overlap and metadata."
            : `Related title candidate #${index + 1} from Google Books.`;
        }
        if (mode === "genre") {
          return buildGenreBlurb(value, book.categories ?? [], "Google Books", book.weightedScore > 0);
        }

        if (vibeProfile.avoidDrama) {
          return book.descriptionMatches > 0 || book.categoryMatches > 0
            ? "Matched your vibe with low-drama filtering from Google Books metadata."
            : `Low-drama vibe candidate #${index + 1} from Google Books relevance.`;
        }

        return book.descriptionMatches > 0 || book.categoryMatches > 0
          ? "Matched your vibe description using Google Books description/category signals."
          : `Vibe candidate #${index + 1} from Google Books relevance.`;
      })(),
    }));
};

const FALLBACK_BOOK_POOL: Array<{ title: string; author?: string; tags: string[] }> = [
  {
    title: "Parable of the Sower",
    author: "Octavia E. Butler",
    tags: ["dystopian", "science fiction", "coming of age", "survival"],
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    tags: ["science fiction", "speculative", "political", "literary"],
  },
  {
    title: "The Ocean at the End of the Lane",
    author: "Neil Gaiman",
    tags: ["fairy tale", "mythic", "coming of age", "dark fantasy"],
  },
  {
    title: "The Song of Achilles",
    author: "Madeline Miller",
    tags: ["romance", "mythic", "literary", "emotional"],
  },
  {
    title: "Annihilation",
    author: "Jeff VanderMeer",
    tags: ["body horror", "weird fiction", "speculative", "atmospheric"],
  },
  {
    title: "The Fifth Season",
    author: "N. K. Jemisin",
    tags: ["dystopian", "fantasy", "speculative", "apocalyptic"],
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    tags: ["mystery", "fantasy", "dreamlike", "literary"],
  },
  {
    title: "House of Hollow",
    author: "Krystal Sutherland",
    tags: ["body horror", "dark fantasy", "sisters", "coming of age"],
  },
];

const getGuaranteedFallbackRecommendations = (
  mode: InputMode,
  value: string,
  vibe: string,
): BookSuggestion[] => {
  const intentTerms = uniqueQueries([
    ...extractKeywords(value, 6),
    ...extractKeywords(vibe, 8),
  ]);

  const rankedFallback = FALLBACK_BOOK_POOL
    .map((book) => {
      const corpus = normalize(`${book.title} ${book.author ?? ""} ${book.tags.join(" ")}`);
      const keywordScore = countTermMatches(corpus, intentTerms);
      const genreBoost = mode === "genre" || mode === "vibes"
        ? countTermMatches(corpus, extractGenrePhrases(`${value} ${vibe}`, 8).map(normalizeGenreTerm))
        : 0;

      return {
        ...book,
        score: keywordScore * 1.2 + genreBoost * 0.8,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 5);

  return rankedFallback.map((book, index) => ({
    title: book.title,
    author: book.author,
    reason: book.score > 0
      ? "Matched your request using local fallback relevance when live catalogs were unavailable."
      : `Reliable fallback pick #${index + 1} while external catalogs recover.`,
  }));
};

const fetchGoogleBooksResults = async (
  mode: InputMode,
  value: string,
  vibe: string,
): Promise<BookSuggestion[] | null> => {
  if (!GOOGLE_BOOKS_KEY) {
    return null;
  }

  const keyParam = GOOGLE_BOOKS_KEY ? `&key=${encodeURIComponent(GOOGLE_BOOKS_KEY)}` : "";
  const fetchGoogleVolumeQuery = async (query: string, maxResults = 30) => {
    try {
      const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}${keyParam}`;
      const payload = await fetchJsonWithTimeout<{
        items?: Array<{
          volumeInfo?: {
            title?: string;
            authors?: string[];
            description?: string;
            categories?: string[];
            ratingsCount?: number;
            averageRating?: number;
          };
        }>;
      }>(endpoint);

      if (!payload) {
        return [] as GoogleBookCandidate[];
      }

      return (payload.items ?? [])
        .map((item) => {
          const info = item.volumeInfo;

          return {
            title: info?.title?.trim() ?? "",
            author: info?.authors?.[0],
            description: info?.description,
            categories: info?.categories,
            ratingsCount: info?.ratingsCount,
            averageRating: info?.averageRating,
          } satisfies GoogleBookCandidate;
        })
        .filter((book) => book.title.length > 0);
    } catch {
      return [] as GoogleBookCandidate[];
    }
  };

  let books: GoogleBookCandidate[] = [];
  let titleSimilarityContext: TitleSimilarityContext | undefined;
  const vibeProfile = buildVibeProfile(vibe);
  const parsedTitleInput = parseTitleAndAuthor(value);

  if (mode === "title") {
    const titleValue = parsedTitleInput.title;
    const explicitAuthor = parsedTitleInput.author;
    const seedBooks = await fetchGoogleVolumeQuery(
      explicitAuthor ? `intitle:${titleValue} inauthor:${explicitAuthor}` : `intitle:${titleValue}`,
      20,
    );
    const titleKeywords = extractKeywords(titleValue, 4);
    const dynamicTitleQueries = uniqueQueries([
      explicitAuthor ? `${titleValue} ${explicitAuthor}` : "",
      titleKeywords.join(" "),
      `${titleValue} novel`,
      `${titleKeywords.join(" ")} literary fiction`,
    ]);
    const dynamicTitleBooks = dynamicTitleQueries.length
      ? dedupeGoogleBooks(
        (await collectSettledArrays(dynamicTitleQueries.map((query) => fetchGoogleVolumeQuery(`intitle:${query}`, 20))))
          .flat(),
      )
      : [];
    const seed = seedBooks[0];
    const seedCategory = seed?.categories?.[0];
    const seedAuthor = seed?.author;
    const resolvedAuthor = explicitAuthor || seedAuthor || "";
    titleSimilarityContext = buildTitleSimilarityContext(
      resolvedAuthor ? { ...seed, author: resolvedAuthor } : seed,
      titleValue,
    );

    const thematicQueries = uniqueQueries([
      ...titleSimilarityContext.categoryTerms.map((genre) => `subject:${genre} fiction`),
      ...titleSimilarityContext.themeTerms.slice(0, 4).map((term) => `${term} fiction novel`),
      resolvedAuthor ? `inauthor:${resolvedAuthor} fiction` : "",
    ]).slice(0, 6);

    const thematicBooks = thematicQueries.length
      ? dedupeGoogleBooks(
        (await collectSettledArrays(thematicQueries.map((query) => fetchGoogleVolumeQuery(query, 20)))).flat(),
      )
      : [];

    const relatedQueryParts = [
      seedCategory ? `subject:${seedCategory}` : "",
      resolvedAuthor ? `inauthor:${resolvedAuthor}` : "",
      "fiction",
    ].filter(Boolean);

    const relatedQuery = relatedQueryParts.join(" ");
    const relatedBooks = relatedQuery
      ? await fetchGoogleVolumeQuery(relatedQuery, 30)
      : [];

    books = dedupeGoogleBooks([...seedBooks, ...dynamicTitleBooks, ...thematicBooks, ...relatedBooks]).filter(
      (book) => normalize(book.title) !== normalize(titleValue),
    );
  } else if (mode === "genre") {
    books = dedupeGoogleBooks(
      await fetchGoogleVolumeQuery(`subject:${value} fiction`, 40),
    );
  } else {
    const normalizedGenres = uniqueQueries(vibeProfile.preferredGenres.map(normalizeGenreTerm));
    const subjectParts = [
      ...normalizedGenres.map((genre) => `subject:${genre}`),
      vibeProfile.wantsRomance ? "subject:romance" : "",
      "subject:fiction",
    ].filter(Boolean);

    const strictQuery = [
      value,
      ...subjectParts,
      vibeProfile.avoidDrama ? "-drama -tragedy -dark" : "",
      vibeProfile.avoidNonFiction ? "-memoir -biography -history" : "",
    ].filter(Boolean).join(" ");

    const relaxedQuery = [value, ...subjectParts].filter(Boolean).join(" ");
    const broadQuery = [
      ...subjectParts,
      vibeProfile.preferLight ? "uplifting cozy" : "",
    ].filter(Boolean).join(" ");

    const vibeKeywords = extractKeywords(vibe, 6);
    const dynamicVibeQueries = uniqueQueries([
      strictQuery,
      relaxedQuery,
      broadQuery,
      `${vibeKeywords.slice(0, 5).join(" ")} fiction novel`,
      `${normalizedGenres.join(" ")} ${vibeKeywords.slice(0, 3).join(" ")} fiction`,
      ...normalizedGenres.map((genre) => `subject:${genre} fiction novel`),
      ...normalizedGenres.map((genre) => `${genre} ${vibeKeywords.slice(0, 2).join(" ")} novel`),
      "fiction novel",
    ]).slice(0, 8);

    const dynamicVibeBooks = dedupeGoogleBooks(
      (await collectSettledArrays(dynamicVibeQueries.map((query) => fetchGoogleVolumeQuery(query, 20)))).flat(),
    );

    books = dynamicVibeBooks;
  }

  if (!books.length) {
    return null;
  }

  return rankGoogleBooks(books, mode, value, vibe, titleSimilarityContext);
};

const fetchOpenLibraryResults = async (
  mode: InputMode,
  value: string,
  vibe: string,
): Promise<BookSuggestion[]> => {
  const fetchOpenLibraryQuery = async (query: string, limit = 30, timeoutMs = FETCH_TIMEOUT_MS) => {
    try {
      const endpoint = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
      const payload = await fetchJsonWithTimeout<{
        docs?: Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>;
      }>(endpoint, timeoutMs);

      if (!payload) {
        return [] as Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>;
      }

      return payload.docs ?? [];
    } catch {
      return [] as Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>;
    }
  };

  const dedupeOpenLibraryDocs = (docs: Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>) => {
    const seen = new Set<string>();
    return docs.filter((doc) => {
      const key = `${normalize(doc.title ?? "")}::${normalize(doc.author_name?.[0] ?? "")}`;
      if (!doc.title || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const fetchOpenLibrarySubject = async (subject: string, limit = 25) => {
    try {
      const endpoint = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=${limit}`;
      const payload = await fetchJsonWithTimeout<{
        works?: Array<{
          title?: string;
          authors?: Array<{ name?: string }>;
          subject?: string[];
        }>;
      }>(endpoint);

      if (!payload) {
        return [] as Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>;
      }

      return (payload.works ?? []).map((work) => ({
        title: work.title,
        author_name: work.authors?.[0]?.name ? [work.authors[0].name] : [],
        subject: work.subject ?? [],
      }));
    } catch {
      return [] as Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }>;
    }
  };

  const probeOpenLibrarySubject = async (subject: string) => {
    try {
      const endpoint = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=1`;
      const payload = await fetchJsonWithTimeout<{ work_count?: number }>(endpoint);
      if (!payload) {
        return 0;
      }
      return payload.work_count ?? 0;
    } catch {
      return 0;
    }
  };

  let docs: Array<{ title?: string; author_name?: string[]; subject?: string[]; first_sentence?: string | string[] }> = [];
  let subjectWeights: Record<string, number> = {};
  let titleSimilarityContext: TitleSimilarityContext | undefined;
  const parsedTitleInput = parseTitleAndAuthor(value);

  if (mode === "title") {
    const titleValue = parsedTitleInput.title;
    const explicitAuthor = parsedTitleInput.author;
    const titleKeywords = extractKeywords(titleValue, 4);
    const seedDocs = await fetchOpenLibraryQuery(
      explicitAuthor ? `${titleValue} ${explicitAuthor}` : titleValue,
      25,
    );
    const seedAuthor = explicitAuthor || seedDocs[0]?.author_name?.[0] || "";
    titleSimilarityContext = buildOpenLibraryTitleContext(seedDocs[0], seedAuthor || undefined, titleValue);
    const seedSubjects = uniqueQueries(
      (seedDocs[0]?.subject ?? [])
        .map((subject) => normalizeGenreTerm(subject))
        .filter((subject) => subject.length > 0),
    ).slice(0, 5);
    const dynamicTitleQueries = uniqueQueries([
      titleValue,
      seedAuthor ? `${titleValue} ${seedAuthor}` : "",
      titleKeywords.join(" "),
      `${titleValue} novel`,
      `${titleKeywords.join(" ")} literary fiction`,
      seedAuthor ? `${seedAuthor} literary fiction` : "",
      ...seedSubjects.map((subject) => `${subject} fiction`),
      ...seedSubjects.map((subject) => `${subject} novels`),
    ]);
    const dynamicTitleDocs = (await collectSettledArrays(dynamicTitleQueries.map((query) => fetchOpenLibraryQuery(query, 25)))).flat();
    docs = dedupeOpenLibraryDocs([...seedDocs, ...dynamicTitleDocs]);
  } else if (mode === "genre") {
    docs = await fetchOpenLibraryQuery(`${value} fiction`, 30);
  } else {
    const vibeProfile = buildVibeProfile(vibe);
    const vibeTerms = normalize(vibe).split(/[^a-z0-9]+/).filter(Boolean);
    const normalizedGenres = uniqueQueries(vibeProfile.preferredGenres.map(normalizeGenreTerm));
    const genreTerms = normalizedGenres.join(" ");
    const strictQuery = [
      value,
      genreTerms,
      "fiction",
      vibeProfile.preferLight ? "uplifting cozy heartwarming" : "",
      vibeProfile.avoidDrama ? "low drama" : "",
    ].filter(Boolean).join(" ");

    const relaxedQuery = [value, genreTerms, "fiction"].filter(Boolean).join(" ");
    const broadQuery = [genreTerms, "fiction", vibeProfile.preferLight ? "uplifting" : ""]
      .filter(Boolean)
      .join(" ");
    const safetyNetQuery = vibeProfile.preferLight
      ? "uplifting fiction best books"
      : "popular fiction best books";

    const vibeKeywords = extractKeywords(vibe, 6);
    const dynamicVibeQueries = uniqueQueries([
      strictQuery,
      relaxedQuery,
      broadQuery,
      safetyNetQuery,
      `${vibeKeywords.slice(0, 5).join(" ")} fiction novel`,
      `${normalizedGenres.join(" ")} ${vibeKeywords.slice(0, 3).join(" ")} fiction`,
      ...normalizedGenres.map((genre) => `${genre} fiction novel`),
      ...normalizedGenres.map((genre) => `${genre} ${vibeKeywords.slice(0, 2).join(" ")} novel`),
      "fiction novel",
    ]).slice(0, 10);

    const candidatePhrases = uniqueQueries([
      ...extractGenrePhrases(vibe, 12),
      ...normalizedGenres,
      ...extractKeywords(vibe, 6),
    ]);

    const candidateSubjects = uniqueQueries(
      candidatePhrases
        .map((phrase) => `${normalizeGenreTerm(phrase)}::${toOpenLibrarySubjectSlug(phrase)}`)
        .filter((pair) => pair.split("::")[1]),
    )
      .map((pair) => {
        const [phrase, slug] = pair.split("::");
        return { phrase, slug };
      })
      .slice(0, 6);

    const subjectProbeResults = await Promise.all(
      candidateSubjects.map(async ({ phrase, slug }) => ({
        phrase,
        slug,
        workCount: await probeOpenLibrarySubject(slug),
      })),
    );

    const viableSubjects = subjectProbeResults
      .filter((item) => item.workCount > 0)
      .sort((a, b) => b.workCount - a.workCount)
      .slice(0, 6);

    const sparseSubjectCoverage = viableSubjects.length < 2;

    if (sparseSubjectCoverage) {
      const fallbackKeywordQueries = uniqueQueries([
        ...extractKeywords(vibe, 6).map((term) => `${term} fiction books`),
        ...extractKeywords(vibe, 4).map((term) => `${term} novels`),
        `${extractKeywords(vibe, 3).join(" ")} books`,
      ]);
      dynamicVibeQueries.push(...fallbackKeywordQueries);
    }

    subjectWeights = viableSubjects.reduce<Record<string, number>>((weights, item) => {
      const phraseTerms = normalize(item.phrase).split(/[^a-z0-9]+/).filter(Boolean);
      const overlap = phraseTerms.length
        ? countTermMatches(vibeTerms.join(" "), phraseTerms) / phraseTerms.length
        : 0;
      const popularityWeight = Math.min(1, Math.log10(item.workCount + 1) / 5);
      weights[item.phrase] = popularityWeight * Math.max(0.25, overlap);
      return weights;
    }, {});

    const dynamicVibeDocs = (await collectSettledArrays(dynamicVibeQueries.map((query) => fetchOpenLibraryQuery(query, 25)))).flat();
    const subjectDocs = (await collectSettledArrays(viableSubjects.map((subject) => fetchOpenLibrarySubject(subject.slug, 20)))).flat();

    docs = dedupeOpenLibraryDocs([...dynamicVibeDocs, ...subjectDocs]);
  }

  if (!docs.length) {
    const fallbackSeed = mode === "vibes" ? vibe : value;
    const fallbackKeywords = extractKeywords(fallbackSeed, 4);
    const fallbackQueries = uniqueQueries([
      `${fallbackKeywords.slice(0, 3).join(" ")} fiction`.trim(),
      `${fallbackKeywords.slice(0, 2).join(" ")} novels`.trim(),
      "popular fiction novels",
      "award winning fiction",
      "literary fiction",
    ]);

    const emergencyDocs = dedupeOpenLibraryDocs(
      (await collectSettledArrays(
        fallbackQueries.map((query) => fetchOpenLibraryQuery(query, 20, 9000)),
      )).flat(),
    );

    if (!emergencyDocs.length) {
      return [];
    }

    docs = emergencyDocs;
  }

  return rankOpenLibraryBooks(docs, mode, value, vibe, subjectWeights, titleSimilarityContext);
};

const fetchMainRecommenderResults = async (
  mode: InputMode,
  value: string,
  vibe: string,
): Promise<BookSuggestion[]> => {
  const googleTask = (async () => {
    try {
      const results = await fetchGoogleBooksResults(mode, value, vibe);
      return results?.length ? results : null;
    } catch {
      return null;
    }
  })();

  const openLibraryTask = (async () => {
    try {
      const results = await fetchOpenLibraryResults(mode, value, vibe);
      return results.length ? results : null;
    } catch {
      return null;
    }
  })();

  if (mode === "title") {
    const [googleResults, openLibraryResults] = await Promise.all([googleTask, openLibraryTask]);
    if (googleResults?.length && openLibraryResults?.length) {
      // Prefer stronger Google plot/theme matches first, then fill remaining slots from Open Library.
      if (googleResults.length >= 4) {
        return googleResults.slice(0, 5);
      }
      return mergeUniqueRecommendations(googleResults, openLibraryResults, 5);
    }
    if (googleResults?.length) {
      return googleResults;
    }
    if (openLibraryResults?.length) {
      return openLibraryResults;
    }
    return getGuaranteedFallbackRecommendations(mode, value, vibe);
  }

  if (mode === "genre") {
    const [googleResults, openLibraryResults] = await Promise.all([googleTask, openLibraryTask]);
    if (googleResults?.length) {
      return googleResults;
    }
    if (openLibraryResults?.length) {
      return openLibraryResults;
    }

    return getGuaranteedFallbackRecommendations(mode, value, vibe);
  }

  try {
    // Prefer the first source that produces a non-empty result set.
    const firstGood = await Promise.any([
      googleTask.then((result) => (result ? result : Promise.reject(new Error("Google empty")))),
      openLibraryTask.then((result) => (result ? result : Promise.reject(new Error("OpenLibrary empty")))),
    ]);
    return firstGood;
  } catch {
    // Both sources failed or returned empty.
  }

  const [googleResults, openLibraryResults] = await Promise.all([googleTask, openLibraryTask]);
  if (googleResults?.length) {
    return googleResults;
  }
  if (openLibraryResults?.length) {
    return openLibraryResults;
  }

  return getGuaranteedFallbackRecommendations(mode, value, vibe);
};

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
  const [lastSubmittedMode, setLastSubmittedMode] = useState<InputMode | null>(null);
  const [titleModeSourceLabel, setTitleModeSourceLabel] = useState("");

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
    setTitleModeSourceLabel("");

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
    let titleModePrimaryResults: BookSuggestion[] | null = null;

    setLastSubmittedMode(mode);
    if (mode === "title") {
      const parsedTitle = parseTitleAndAuthor(value);
      const similarBookFinderResult = await fetchSimilarBookFinderTopBooksWithFallback(
        parsedTitle.title,
        parsedTitle.author || undefined,
        5,
      );
      const similarBookFinderUrl = similarBookFinderResult.url;
      const sourceSlug = similarBookFinderUrl.split("/books/")[1] ?? "";

      // Debug helper: show the exact title-mode seed and outgoing SimilarBookFinder URL.
      console.info("[Pythia:title-mode]", {
        title: parsedTitle.title,
        author: parsedTitle.author || undefined,
        similarBookFinderUrl,
      });
      setTitleModeSourceLabel(sourceSlug ? `Source: SimilarBookFinder (best match: ${sourceSlug})` : "Source: SimilarBookFinder");

      const topSimilarBooks = similarBookFinderResult.books;
      console.info("[Pythia:title-mode:similar-books]", topSimilarBooks);

      if (topSimilarBooks.length > 0) {
        const exactSimilarBookFinderResults = topSimilarBooks.map((book, index) => ({
          title: book.title,
          author: book.author,
          reason: index === 0
            ? "Closest plot and theme match pulled from SimilarBookFinder."
            : "High plot/theme similarity pulled from SimilarBookFinder.",
        }));
        titleModePrimaryResults = exactSimilarBookFinderResults;
        setResults(exactSimilarBookFinderResults);
      }
    }

    const vibeForSearch =
      mode === "vibes"
        ? vibeInput.trim()
        : hasVibe
          ? vibeInput.trim()
          : mode === "genre"
            ? genreInput.trim()
            : titleInput.trim();
    setIsAnimating(true);

    try {
      const nextResults = await fetchMainRecommenderResults(mode, value, vibeForSearch);
      const safeResults = nextResults.length > 0
        ? nextResults
        : getGuaranteedFallbackRecommendations(mode, value, vibeForSearch);
      if (mode !== "title") {
        setResults(safeResults);
      } else if (!titleModePrimaryResults?.length) {
        setResults(safeResults);
      } else if (titleModePrimaryResults.length < 5) {
        const completedResults = mergeUniqueRecommendations(titleModePrimaryResults, safeResults, 5);
        setResults(completedResults);
      }
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
            {lastSubmittedMode === "title" && titleModeSourceLabel ? (
              <p className="helper-text">{titleModeSourceLabel}</p>
            ) : null}
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

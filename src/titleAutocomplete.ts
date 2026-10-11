export type TitleSuggestion = {
  title: string;
  author?: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const parseTitleAndAuthor = (input: string) => {
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

export const fetchTitleAutocompleteSuggestions = async (input: string): Promise<TitleSuggestion[]> => {
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

export type RecommendationResponse = {
  recommendations: Array<{ title: string; author: string; reason: string }>;
  source: string;
  warnings: string[];
};

export async function fetchRecommendations(mode: "title" | "genre" | "vibes", value: string, vibe: string): Promise<RecommendationResponse> {
  const endpoint = import.meta.env.VITE_RECOMMENDATIONS_API_URL?.trim();
  if (!endpoint) {
    throw new Error("AI recommendations are not configured. The site owner must set VITE_RECOMMENDATIONS_API_URL to the deployed recommendation service.");
  }
  let url: URL;
  try {
    url = new URL(endpoint);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error();
    if (url.username || url.password) throw new Error();
  } catch {
    throw new Error("The recommendation service URL is invalid. Use HTTPS (or localhost for development).");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90000);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, value, vibe }), signal: controller.signal,
      });
    } catch {
      throw new Error(controller.signal.aborted ? "AI recommendations timed out. Please try again." : "Cannot reach the AI recommendation service. Check its URL and CORS configuration, then try again.");
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(typeof payload?.error?.message === "string" ? payload.error.message : "The AI recommendation service is unavailable. Please try again later.");
    }
    if (!Array.isArray(payload?.recommendations) || payload.recommendations.length !== 5 ||
      payload.recommendations.some((book: RecommendationResponse["recommendations"][number]) => !book || typeof book.title !== "string" || !book.title.trim() || typeof book.author !== "string" || typeof book.reason !== "string" || !book.reason.trim()) ||
      new Set(payload.recommendations.map((book: RecommendationResponse["recommendations"][number]) => book.title.toLowerCase())).size !== 5 ||
      typeof payload.source !== "string" || !Array.isArray(payload.warnings) || payload.warnings.some((warning: unknown) => typeof warning !== "string")) {
      throw new Error("The AI recommendation service returned invalid results. Please try again.");
    }
    return payload as RecommendationResponse;
  } finally {
    window.clearTimeout(timeout);
  }
}

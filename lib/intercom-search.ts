/**
 * Live search against Formaloo's real Intercom help center
 * (help.formaloo.com), so the assistant can answer "how does X already
 * work" questions from current documentation instead of the static
 * knowledge file, which goes stale the moment an article is edited.
 *
 * Deliberately NOT RAG: no embeddings, no re-indexing, this hits Intercom's
 * live article search on every call, so it's never out of date.
 */

const INTERCOM_API = "https://api.intercom.io"
const MAX_RESULTS = 3
const TIMEOUT_MS = 4000

export type HelpArticle = {
  title: string
  url: string
  description: string
}

export async function searchHelpCenter(
  query: string,
  token: string
): Promise<HelpArticle[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(
      `${INTERCOM_API}/articles/search?phrase=${encodeURIComponent(query)}&per_page=${MAX_RESULTS}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    )

    if (!res.ok) {
      console.error(`[help-search] Intercom ${res.status}: ${await res.text()}`)
      return []
    }

    const data = await res.json()
    const articles = (data?.data?.articles ?? []) as Array<{
      title?: unknown
      url?: unknown
      description?: unknown
    }>

    return articles
      .filter((a) => typeof a.title === "string" && typeof a.url === "string")
      .slice(0, MAX_RESULTS)
      .map((a) => ({
        title: a.title as string,
        url: a.url as string,
        description: typeof a.description === "string" ? a.description : "",
      }))
  } catch (error) {
    // Never let a slow or failed help-center search break the chat itself.
    console.error("[help-search] failed", error)
    return []
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Formats results as the dynamic, per-turn block appended to the system
 * prompt. Empty when there's nothing worth injecting, so a turn with no
 * hits (or the token not configured) costs zero extra tokens.
 */
export function formatHelpResults(articles: HelpArticle[]): string {
  if (articles.length === 0) return ""

  const list = articles
    .map((a, i) => `${i + 1}. ${a.title} — ${a.url}\n   ${a.description}`)
    .join("\n")

  return `
## LIVE HELP CENTER SEARCH (real results for the visitor's latest message, fetched just now)

${list}

Only use titles and URLs from this list, never invent or reconstruct one. If
none of these are actually relevant to what the visitor asked, ignore this
section entirely and continue with normal routing.
`.trim()
}

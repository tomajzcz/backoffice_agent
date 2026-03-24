import { scrapeSreality } from "./sreality"
import { scrapeBezrealitky } from "./bezrealitky"
import type { ScrapedListing, JobConfig } from "./types"

export type { ScrapedListing, JobConfig }

const SCRAPERS: Record<string, (config: JobConfig) => Promise<ScrapedListing[]>> = {
  sreality: scrapeSreality,
  bezrealitky: scrapeBezrealitky,
}

/**
 * Run all configured scrapers in parallel, merge results, deduplicate by URL.
 */
export async function runScraper(config: JobConfig): Promise<ScrapedListing[]> {
  const sources = config.sources?.length ? config.sources : Object.keys(SCRAPERS)

  const tasks = sources
    .filter((s) => SCRAPERS[s])
    .map((s) => SCRAPERS[s](config).catch((err) => {
      console.error(`[scraper] ${s} failed:`, err)
      return [] as ScrapedListing[]
    }))

  const allResults = (await Promise.all(tasks)).flat()

  // Deduplicate by URL
  const seen = new Set<string>()
  return allResults.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
}

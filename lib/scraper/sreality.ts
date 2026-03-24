import type { ScrapedListing, JobConfig } from "./types"
import { resolveSrealityLocality } from "./localities"

// Sreality JSON API endpoint
const API_BASE = "https://www.sreality.cz/api/cs/v2/estates"

// Map property types to Sreality category_main_cb
const TYPE_MAP: Record<string, number> = {
  BYT: 1,
  DUM: 2,
  KOMERCNI: 3,
  POZEMEK: 4,
}

interface SrealityEstate {
  name: string
  locality: string
  price: number
  hash_id: number
  seo: {
    locality: string
  }
  labelsRefined?: Array<{ name: string }>
  gps?: { lat: number; lng: number }
}

interface SrealityResponse {
  _embedded: {
    estates: SrealityEstate[]
  }
  result_size: number
}

export async function scrapeSreality(config: JobConfig): Promise<ScrapedListing[]> {
  const resolved = resolveSrealityLocality(config.locality)
  if (!resolved) {
    console.warn(`[sreality] Neznámá lokalita: ${config.locality}`)
    return []
  }

  const results: ScrapedListing[] = []

  // Determine which property types to search
  const types = config.filters.types?.length
    ? config.filters.types
    : ["BYT"] // default

  for (const type of types) {
    const categoryMain = TYPE_MAP[type]
    if (!categoryMain) continue

    const params = new URLSearchParams({
      category_main_cb: String(categoryMain),
      category_type_cb: "1", // prodej
      [resolved.paramName]: String(resolved.id),
      per_page: "60",
      tms: String(Date.now()),
    })

    // Price filters
    if (config.filters.maxPrice) {
      params.set("czk_price_summary_order2", String(config.filters.maxPrice))
    }
    if (config.filters.minPrice) {
      params.set("czk_price_summary_order1", String(config.filters.minPrice))
    }

    // Area filters
    if (config.filters.minAreaM2) {
      params.set("usable_area|floor_area|built_up_area", `${config.filters.minAreaM2}|`)
    }

    try {
      const response = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        console.warn(`[sreality] HTTP ${response.status} for type ${type}`)
        continue
      }

      const data = (await response.json()) as SrealityResponse
      const estates = data._embedded?.estates ?? []

      for (const estate of estates) {
        // Extract disposition from title
        const dispMatch = estate.name.match(/(\d\+(?:kk|1|2|3))/i)
        const disposition = dispMatch ? dispMatch[1] : null

        // Extract area from title
        const areaMatch = estate.name.match(/(\d+)\s*m²/)
        const areaM2 = areaMatch ? Number(areaMatch[1]) : null

        // Apply disposition filter
        if (config.filters.dispositions?.length && disposition) {
          if (!config.filters.dispositions.includes(disposition)) continue
        }

        // Apply area filter (if not handled by API)
        if (config.filters.minAreaM2 && areaM2 && areaM2 < config.filters.minAreaM2) continue
        if (config.filters.maxAreaM2 && areaM2 && areaM2 > config.filters.maxAreaM2) continue

        results.push({
          source: "sreality",
          title: estate.name,
          url: `https://www.sreality.cz/detail/prodej/${categoryMain === 1 ? "byt" : categoryMain === 2 ? "dum" : "komercni"}/${estate.seo?.locality ?? ""}/${estate.hash_id}`,
          price: estate.price > 0 ? estate.price : null,
          district: estate.locality || config.locality,
          disposition,
          areaM2,
        })
      }
    } catch (error) {
      console.error(`[sreality] Scraping error for ${type}:`, error)
    }
  }

  return results
}

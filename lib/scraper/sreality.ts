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

// Map disposition strings to Sreality category_sub_cb values
const DISPOSITION_TO_SUB_CB: Record<string, number> = {
  "1+kk": 2, "1+1": 3,
  "2+kk": 4, "2+1": 5,
  "3+kk": 6, "3+1": 7,
  "4+kk": 8, "4+1": 9,
  "5+kk": 10, "5+1": 11,
  "6+kk": 12, "6+1": 12,
}

// Reverse map: category_sub_cb → disposition string
const SUB_CB_TO_DISPOSITION: Record<number, string> = {
  2: "1+kk", 3: "1+1",
  4: "2+kk", 5: "2+1",
  6: "3+kk", 7: "3+1",
  8: "4+kk", 9: "4+1",
  10: "5+kk", 11: "5+1",
  12: "6+kk", 16: "atypický",
}

// category_sub_cb → URL slug for detail page
const SUB_CB_TO_URL_SLUG: Record<number, string> = {
  2: "1+kk", 3: "1+1",
  4: "2+kk", 5: "2+1",
  6: "3+kk", 7: "3+1",
  8: "4+kk", 9: "4+1",
  10: "5+kk", 11: "5+1",
  12: "6-a-vice", 16: "atypicky",
}

interface SrealityEstate {
  name: string
  locality: string
  price: number
  hash_id: number
  seo: {
    locality: string
    category_sub_cb?: number
    category_main_cb?: number
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

  const types = config.filters.types?.length
    ? config.filters.types
    : ["BYT"]

  for (const type of types) {
    const categoryMain = TYPE_MAP[type]
    if (!categoryMain) continue

    const params = new URLSearchParams({
      category_main_cb: String(categoryMain),
      category_type_cb: "1", // prodej
      per_page: "60",
      tms: String(Date.now()),
    })

    // Set locality params based on resolution type
    if (resolved.type === "param") {
      params.set(resolved.paramName, String(resolved.id))
    } else {
      params.set("region", resolved.region)
      params.set("region_entity_type", resolved.regionEntityType)
    }

    // API-side disposition filter via category_sub_cb
    if (config.filters.dispositions?.length) {
      const subCbs = config.filters.dispositions
        .map((d) => DISPOSITION_TO_SUB_CB[d])
        .filter((v): v is number => v !== undefined)
      if (subCbs.length > 0) {
        params.set("category_sub_cb", subCbs.join("|"))
      }
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
        // Skip info-only listings (price = 1 Kč)
        if (estate.price <= 1) continue

        // Use structured disposition from API, fallback to regex from title
        const disposition = estate.seo?.category_sub_cb
          ? (SUB_CB_TO_DISPOSITION[estate.seo.category_sub_cb] ?? null)
          : (estate.name.match(/(\d\+(?:kk|\d))/i)?.[1] ?? null)

        // Extract area from title (list API doesn't return structured area)
        const areaMatch = estate.name.match(/(\d+)\s*m[²2]/)
        const areaM2 = areaMatch ? Number(areaMatch[1]) : null

        // Client-side price filter (API price params are unreliable)
        if (config.filters.minPrice && estate.price < config.filters.minPrice) continue
        if (config.filters.maxPrice && estate.price > config.filters.maxPrice) continue

        // Client-side area filter
        if (config.filters.minAreaM2 && areaM2 && areaM2 < config.filters.minAreaM2) continue
        if (config.filters.maxAreaM2 && areaM2 && areaM2 > config.filters.maxAreaM2) continue

        const typeSlug = categoryMain === 1 ? "byt" : categoryMain === 2 ? "dum" : categoryMain === 4 ? "pozemek" : "komercni"
        const dispSlug = estate.seo?.category_sub_cb
          ? (SUB_CB_TO_URL_SLUG[estate.seo.category_sub_cb] ?? "atypicky")
          : (disposition ?? "atypicky")

        results.push({
          source: "sreality",
          title: estate.name,
          url: `https://www.sreality.cz/detail/prodej/${typeSlug}/${dispSlug}/${estate.seo?.locality ?? ""}/${estate.hash_id}`,
          price: estate.price,
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

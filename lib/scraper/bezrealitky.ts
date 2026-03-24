import * as cheerio from "cheerio"
import type { ScrapedListing, JobConfig } from "./types"
import { resolveBezrealitkySlug } from "./localities"

const BASE_URL = "https://www.bezrealitky.cz"

const TYPE_SLUGS: Record<string, string> = {
  BYT: "byt",
  DUM: "dum",
  KOMERCNI: "komercni-prostor",
  POZEMEK: "pozemek",
}

export async function scrapeBezrealitky(config: JobConfig): Promise<ScrapedListing[]> {
  const localitySlug = resolveBezrealitkySlug(config.locality)

  const results: ScrapedListing[] = []

  const types = config.filters.types?.length
    ? config.filters.types
    : ["BYT"]

  for (const type of types) {
    const typeSlug = TYPE_SLUGS[type]
    if (!typeSlug) continue

    // Build URL with filters
    const params = new URLSearchParams({
      offerType: "prodej",
      estateType: typeSlug,
      disposition: config.filters.dispositions?.join(",") ?? "",
    })

    if (config.filters.minPrice) params.set("priceFrom", String(config.filters.minPrice))
    if (config.filters.maxPrice) params.set("priceTo", String(config.filters.maxPrice))
    if (config.filters.minAreaM2) params.set("surfaceFrom", String(config.filters.minAreaM2))
    if (config.filters.maxAreaM2) params.set("surfaceTo", String(config.filters.maxAreaM2))

    const searchUrl = `${BASE_URL}/vypis/prodej/${typeSlug}/${localitySlug}?${params.toString()}`

    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "cs-CZ,cs;q=0.9",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        console.warn(`[bezrealitky] HTTP ${response.status} for ${type}`)
        continue
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Parse listing cards — bezrealitky uses article or product-like cards
      $("article, [data-testid='property-card'], .property-list__item, a[href*='/nemovitosti-byty-domy/']").each((_, el) => {
        const $el = $(el)

        const titleEl = $el.find("h2, h3, .PropertyCard_title, [class*='title']").first()
        const title = titleEl.text().trim()
        if (!title) return

        // Extract URL
        let url = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href")
        if (!url) return
        if (url.startsWith("/")) url = `${BASE_URL}${url}`

        // Extract price
        const priceText = $el.find("[class*='price'], .PropertyCard_price, .product__value--main").text()
        const priceMatch = priceText.replace(/\s/g, "").match(/([\d,.]+)/)
        const price = priceMatch ? Number(priceMatch[1].replace(/[.,]/g, "")) : null

        // Extract disposition
        const dispMatch = title.match(/(\d\+(?:kk|1|2|3))/i)
        const disposition = dispMatch ? dispMatch[1] : null

        // Extract area
        const areaMatch = title.match(/(\d+)\s*m²/)
        const areaM2 = areaMatch ? Number(areaMatch[1]) : null

        // Apply filters
        if (config.filters.dispositions?.length && disposition) {
          if (!config.filters.dispositions.includes(disposition)) return
        }
        if (config.filters.minAreaM2 && areaM2 && areaM2 < config.filters.minAreaM2) return
        if (config.filters.maxAreaM2 && areaM2 && areaM2 > config.filters.maxAreaM2) return
        if (config.filters.minPrice && price && price < config.filters.minPrice) return
        if (config.filters.maxPrice && price && price > config.filters.maxPrice) return

        results.push({
          source: "bezrealitky",
          title,
          url,
          price,
          district: config.locality,
          disposition,
          areaM2,
        })
      })
    } catch (error) {
      console.error(`[bezrealitky] Scraping error for ${type}:`, error)
    }
  }

  return results
}

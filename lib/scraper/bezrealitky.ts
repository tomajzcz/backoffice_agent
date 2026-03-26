import type { ScrapedListing, JobConfig } from "./types"
import { resolveBezrealitkyOsmIds } from "./localities"

const GRAPHQL_URL = "https://api.bezrealitky.cz/graphql/"

// Internal estate type → GraphQL EstateType enum
const ESTATE_TYPE_MAP: Record<string, string[]> = {
  BYT: ["BYT"],
  DUM: ["DUM"],
  KOMERCNI: ["KANCELAR", "NEBYTOVY_PROSTOR"],
  POZEMEK: ["POZEMEK"],
}

// Internal disposition "2+kk" → GraphQL Disposition enum "DISP_2_KK"
function toGraphQLDispositions(dispositions: string[]): string[] {
  return dispositions
    .map((d) => {
      const match = d.match(/^(\d)\+(kk|\d)$/i)
      if (!match) return null
      const num = match[1]
      const suffix = match[2].toUpperCase() === "KK" ? "KK" : match[2]
      return `DISP_${num}_${suffix}`
    })
    .filter((d): d is string => d !== null)
}

// GraphQL Disposition enum "DISP_2_KK" → human-readable "2+kk"
function fromGraphQLDisposition(disp: string | null): string | null {
  if (!disp) return null
  const match = disp.match(/^DISP_(\d)_(\w+)$/)
  if (!match) {
    if (disp === "GARSONIERA") return "garsoniéra"
    return null
  }
  return `${match[1]}+${match[2].toLowerCase()}`
}

const ADVERT_LIST_QUERY = `
query AdvertList(
  $offerType: [OfferType],
  $estateType: [EstateType],
  $regionOsmIds: [ID],
  $priceFrom: Int,
  $priceTo: Int,
  $surfaceFrom: Int,
  $surfaceTo: Int,
  $disposition: [Disposition],
  $limit: Int,
  $order: ResultOrder
) {
  listAdverts(
    offerType: $offerType,
    estateType: $estateType,
    regionOsmIds: $regionOsmIds,
    priceFrom: $priceFrom,
    priceTo: $priceTo,
    surfaceFrom: $surfaceFrom,
    surfaceTo: $surfaceTo,
    disposition: $disposition,
    limit: $limit,
    order: $order
  ) {
    list {
      id
      uri
      title
      price
      surface
      address(locale: CS)
      estateType
      disposition
    }
  }
}`

interface BezrealitkyAdvert {
  id: string
  uri: string
  title: string
  price: number | null
  surface: number | null
  address: string | null
  estateType: string
  disposition: string | null
}

interface GraphQLResponse {
  data?: {
    listAdverts?: {
      list: BezrealitkyAdvert[]
    }
  }
  errors?: Array<{ message: string }>
}

export async function scrapeBezrealitky(config: JobConfig): Promise<ScrapedListing[]> {
  const osmIds = resolveBezrealitkyOsmIds(config.locality)
  if (osmIds.length === 0) {
    console.warn(`[bezrealitky] Neznámá lokalita: ${config.locality}`)
    return []
  }

  const types = config.filters.types?.length ? config.filters.types : ["BYT"]

  // Collect all GraphQL estate types
  const estateTypes = types.flatMap((t) => ESTATE_TYPE_MAP[t] ?? [])
  if (estateTypes.length === 0) return []

  // Build variables
  const variables: Record<string, unknown> = {
    offerType: ["PRODEJ"],
    estateType: estateTypes,
    regionOsmIds: osmIds,
    limit: 60,
    order: "TIMEORDER_DESC",
  }

  if (config.filters.minPrice) variables.priceFrom = config.filters.minPrice
  if (config.filters.maxPrice) variables.priceTo = config.filters.maxPrice
  if (config.filters.minAreaM2) variables.surfaceFrom = config.filters.minAreaM2
  if (config.filters.maxAreaM2) variables.surfaceTo = config.filters.maxAreaM2

  if (config.filters.dispositions?.length) {
    const graphQLDisps = toGraphQLDispositions(config.filters.dispositions)
    if (graphQLDisps.length > 0) variables.disposition = graphQLDisps
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; personal-use-scraper/1.0)",
      },
      body: JSON.stringify({
        operationName: "AdvertList",
        query: ADVERT_LIST_QUERY,
        variables,
      }),
    })

    if (!response.ok) {
      console.warn(`[bezrealitky] HTTP ${response.status}`)
      return []
    }

    const json = (await response.json()) as GraphQLResponse

    if (json.errors?.length) {
      console.warn(`[bezrealitky] GraphQL errors:`, json.errors.map((e) => e.message).join(", "))
      return []
    }

    const adverts = json.data?.listAdverts?.list ?? []

    return adverts.map((ad) => ({
      source: "bezrealitky" as const,
      title: ad.title || `${ad.estateType} ${ad.disposition ?? ""}`.trim(),
      url: `https://www.bezrealitky.cz/nemovitosti-byty-domy/${ad.uri}`,
      price: ad.price && ad.price > 0 ? ad.price : null,
      district: ad.address || config.locality,
      disposition: fromGraphQLDisposition(ad.disposition),
      areaM2: ad.surface ?? null,
    }))
  } catch (error) {
    console.error(`[bezrealitky] Scraping error:`, error)
    return []
  }
}

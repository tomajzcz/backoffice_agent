export interface ScrapedListing {
  source: string
  title: string
  url: string
  price: number | null
  district: string | null
  disposition: string | null
  areaM2: number | null
}

export interface JobConfig {
  locality: string
  sources: string[]
  filters: {
    types?: string[]           // ["BYT", "DUM"]
    dispositions?: string[]    // ["2+kk", "3+kk"]
    minPrice?: number
    maxPrice?: number
    minAreaM2?: number
    maxAreaM2?: number
  }
}

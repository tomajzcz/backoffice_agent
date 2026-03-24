/**
 * Shared locality resolution for Czech Republic scrapers.
 * Supports all regions, major cities, and Prague districts.
 */

// ---------------------------------------------------------------------------
// Diacritics & Slugification
// ---------------------------------------------------------------------------

const DIACRITICS_MAP: Record<string, string> = {
  á: "a", č: "c", ď: "d", é: "e", ě: "e", í: "i", ň: "n",
  ó: "o", ř: "r", š: "s", ť: "t", ú: "u", ů: "u", ý: "y", ž: "z",
  Á: "a", Č: "c", Ď: "d", É: "e", Ě: "e", Í: "i", Ň: "n",
  Ó: "o", Ř: "r", Š: "s", Ť: "t", Ú: "u", Ů: "u", Ý: "y", Ž: "z",
}

export function removeDiacritics(str: string): string {
  return str.replace(/[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, (ch) => DIACRITICS_MAP[ch] ?? ch)
}

export function slugify(str: string): string {
  return removeDiacritics(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ---------------------------------------------------------------------------
// Bezrealitky — slug resolution
// ---------------------------------------------------------------------------

/**
 * Override map for localities where the bezrealitky URL slug doesn't match
 * simple slugification (mainly Prague district aliases).
 */
const BEZREALITKY_SLUG_OVERRIDES: Record<string, string> = {
  // Prague district aliases (short name → full slug)
  "holešovice": "praha-7-holesovice",
  "žižkov": "praha-3-zizkov",
  "vinohrady": "praha-2-vinohrady",
  "smíchov": "praha-5-smichov",
  "staré město": "praha-1-stare-mesto",
  "nusle": "praha-4-nusle",
  "dejvice": "praha-6-dejvice",
  "karlín": "praha-8-karlin",
  "vršovice": "praha-10-vrsovice",
  "vysočany": "praha-9-vysocany",
  "stodůlky": "praha-13-stodulky",
  "letná": "praha-7-letna",
  "bubeneč": "praha-6-bubenec",
  "břevnov": "praha-6-brevnov",
  "podolí": "praha-4-podoli",
  "braník": "praha-4-branik",
  "kobylisy": "praha-8-kobylisy",
  "libeň": "praha-8-liben",
  "prosek": "praha-9-prosek",
  "černý most": "praha-9-cerny-most",
  "háje": "praha-11-haje",
  "chodov": "praha-11-chodov",
  "modřany": "praha-12-modrany",
  "řepy": "praha-17-repy",
  "zbraslav": "praha-16-zbraslav",
  "suchdol": "praha-6-suchdol",
  "troja": "praha-7-troja",
  // Full Prague district names
  "praha 7 holešovice": "praha-7-holesovice",
  "praha 3 žižkov": "praha-3-zizkov",
  "praha 2 vinohrady": "praha-2-vinohrady",
  "praha 5 smíchov": "praha-5-smichov",
  "praha 1 staré město": "praha-1-stare-mesto",
  "praha 4 nusle": "praha-4-nusle",
  "praha 6 dejvice": "praha-6-dejvice",
  "praha 8 karlín": "praha-8-karlin",
  "praha 10 vršovice": "praha-10-vrsovice",
  "praha 9 vysočany": "praha-9-vysocany",
  "praha 13 stodůlky": "praha-13-stodulky",
}

/**
 * Resolve a locality string to a bezrealitky URL slug.
 * Never returns null — falls back to dynamic slugification.
 */
export function resolveBezrealitkySlug(locality: string): string {
  const normalized = locality.toLowerCase().trim()

  // Check override map (substring match for backward compat)
  for (const [key, slug] of Object.entries(BEZREALITKY_SLUG_OVERRIDES)) {
    if (normalized.includes(key)) return slug
  }

  // Also check without diacritics
  const noDia = removeDiacritics(normalized)
  for (const [key, slug] of Object.entries(BEZREALITKY_SLUG_OVERRIDES)) {
    if (noDia.includes(removeDiacritics(key))) return slug
  }

  // Fallback: generate slug dynamically — works for most Czech cities
  // e.g. "Plzeň" → "plzen", "České Budějovice" → "ceske-budejovice"
  return slugify(locality)
}

// ---------------------------------------------------------------------------
// Sreality — locality ID resolution
// ---------------------------------------------------------------------------

export interface SrealityLocality {
  id: number
  paramName: "locality_district_id" | "locality_region_id"
}

/**
 * Comprehensive Sreality locality map.
 * Prague districts use locality_district_id, everything else uses locality_region_id.
 */
const SREALITY_MAP: Record<string, SrealityLocality> = {
  // ── Prague districts (locality_district_id) ──────────────────────────
  "praha 1": { id: 5001, paramName: "locality_district_id" },
  "praha 1 staré město": { id: 5001, paramName: "locality_district_id" },
  "staré město": { id: 5001, paramName: "locality_district_id" },
  "praha 2": { id: 5002, paramName: "locality_district_id" },
  "praha 2 vinohrady": { id: 5002, paramName: "locality_district_id" },
  "vinohrady": { id: 5002, paramName: "locality_district_id" },
  "praha 3": { id: 5003, paramName: "locality_district_id" },
  "praha 3 žižkov": { id: 5003, paramName: "locality_district_id" },
  "žižkov": { id: 5003, paramName: "locality_district_id" },
  "praha 4": { id: 5004, paramName: "locality_district_id" },
  "praha 4 nusle": { id: 5004, paramName: "locality_district_id" },
  "nusle": { id: 5004, paramName: "locality_district_id" },
  "praha 5": { id: 5005, paramName: "locality_district_id" },
  "praha 5 smíchov": { id: 5005, paramName: "locality_district_id" },
  "smíchov": { id: 5005, paramName: "locality_district_id" },
  "praha 6": { id: 5058, paramName: "locality_district_id" },
  "praha 6 dejvice": { id: 5058, paramName: "locality_district_id" },
  "dejvice": { id: 5058, paramName: "locality_district_id" },
  "praha 7": { id: 5006, paramName: "locality_district_id" },
  "praha 7 holešovice": { id: 5006, paramName: "locality_district_id" },
  "holešovice": { id: 5006, paramName: "locality_district_id" },
  "praha 8": { id: 5008, paramName: "locality_district_id" },
  "praha 8 karlín": { id: 5008, paramName: "locality_district_id" },
  "karlín": { id: 5008, paramName: "locality_district_id" },
  "praha 9": { id: 5009, paramName: "locality_district_id" },
  "praha 9 vysočany": { id: 5009, paramName: "locality_district_id" },
  "vysočany": { id: 5009, paramName: "locality_district_id" },
  "praha 10": { id: 5010, paramName: "locality_district_id" },
  "praha 10 vršovice": { id: 5010, paramName: "locality_district_id" },
  "vršovice": { id: 5010, paramName: "locality_district_id" },
  "praha 11": { id: 5059, paramName: "locality_district_id" },
  "praha 12": { id: 5060, paramName: "locality_district_id" },
  "praha 13": { id: 5057, paramName: "locality_district_id" },
  "praha 13 stodůlky": { id: 5057, paramName: "locality_district_id" },
  "stodůlky": { id: 5057, paramName: "locality_district_id" },

  // ── Praha celá (region) ──────────────────────────────────────────────
  "praha": { id: 10, paramName: "locality_region_id" },

  // ── Kraje ČR (locality_region_id) ────────────────────────────────────
  "jihočeský kraj": { id: 101, paramName: "locality_region_id" },
  "jihočeský": { id: 101, paramName: "locality_region_id" },
  "plzeňský kraj": { id: 103, paramName: "locality_region_id" },
  "plzeňský": { id: 103, paramName: "locality_region_id" },
  "středočeský kraj": { id: 104, paramName: "locality_region_id" },
  "středočeský": { id: 104, paramName: "locality_region_id" },
  "ústecký kraj": { id: 106, paramName: "locality_region_id" },
  "ústecký": { id: 106, paramName: "locality_region_id" },
  "liberecký kraj": { id: 107, paramName: "locality_region_id" },
  "liberecký": { id: 107, paramName: "locality_region_id" },
  "královéhradecký kraj": { id: 108, paramName: "locality_region_id" },
  "královéhradecký": { id: 108, paramName: "locality_region_id" },
  "pardubický kraj": { id: 109, paramName: "locality_region_id" },
  "pardubický": { id: 109, paramName: "locality_region_id" },
  "vysočina": { id: 110, paramName: "locality_region_id" },
  "kraj vysočina": { id: 110, paramName: "locality_region_id" },
  "jihomoravský kraj": { id: 116, paramName: "locality_region_id" },
  "jihomoravský": { id: 116, paramName: "locality_region_id" },
  "olomoucký kraj": { id: 120, paramName: "locality_region_id" },
  "olomoucký": { id: 120, paramName: "locality_region_id" },
  "zlínský kraj": { id: 113, paramName: "locality_region_id" },
  "zlínský": { id: 113, paramName: "locality_region_id" },
  "moravskoslezský kraj": { id: 124, paramName: "locality_region_id" },
  "moravskoslezský": { id: 124, paramName: "locality_region_id" },
  "karlovarský kraj": { id: 102, paramName: "locality_region_id" },
  "karlovarský": { id: 102, paramName: "locality_region_id" },

  // ── Krajská města a velká města (locality_region_id) ─────────────────
  "brno": { id: 116, paramName: "locality_region_id" },
  "plzeň": { id: 103, paramName: "locality_region_id" },
  "ostrava": { id: 124, paramName: "locality_region_id" },
  "olomouc": { id: 120, paramName: "locality_region_id" },
  "liberec": { id: 107, paramName: "locality_region_id" },
  "české budějovice": { id: 101, paramName: "locality_region_id" },
  "hradec králové": { id: 108, paramName: "locality_region_id" },
  "pardubice": { id: 109, paramName: "locality_region_id" },
  "zlín": { id: 113, paramName: "locality_region_id" },
  "karlovy vary": { id: 102, paramName: "locality_region_id" },
  "ústí nad labem": { id: 106, paramName: "locality_region_id" },
  "jihlava": { id: 110, paramName: "locality_region_id" },

  // Další velká města
  "kladno": { id: 104, paramName: "locality_region_id" },
  "most": { id: 106, paramName: "locality_region_id" },
  "teplice": { id: 106, paramName: "locality_region_id" },
  "děčín": { id: 106, paramName: "locality_region_id" },
  "chomutov": { id: 106, paramName: "locality_region_id" },
  "opava": { id: 124, paramName: "locality_region_id" },
  "frýdek-místek": { id: 124, paramName: "locality_region_id" },
  "karviná": { id: 124, paramName: "locality_region_id" },
  "havířov": { id: 124, paramName: "locality_region_id" },
  "třinec": { id: 124, paramName: "locality_region_id" },
  "mladá boleslav": { id: 104, paramName: "locality_region_id" },
  "kolín": { id: 104, paramName: "locality_region_id" },
  "příbram": { id: 104, paramName: "locality_region_id" },
  "tábor": { id: 101, paramName: "locality_region_id" },
  "písek": { id: 101, paramName: "locality_region_id" },
  "strakonice": { id: 101, paramName: "locality_region_id" },
  "český krumlov": { id: 101, paramName: "locality_region_id" },
  "jindřichův hradec": { id: 101, paramName: "locality_region_id" },
  "prostějov": { id: 120, paramName: "locality_region_id" },
  "přerov": { id: 120, paramName: "locality_region_id" },
  "šumperk": { id: 120, paramName: "locality_region_id" },
  "znojmo": { id: 116, paramName: "locality_region_id" },
  "břeclav": { id: 116, paramName: "locality_region_id" },
  "hodonín": { id: 116, paramName: "locality_region_id" },
  "vyškov": { id: 116, paramName: "locality_region_id" },
  "blansko": { id: 116, paramName: "locality_region_id" },
  "kroměříž": { id: 113, paramName: "locality_region_id" },
  "uherské hradiště": { id: 113, paramName: "locality_region_id" },
  "vsetín": { id: 113, paramName: "locality_region_id" },
  "jičín": { id: 108, paramName: "locality_region_id" },
  "trutnov": { id: 108, paramName: "locality_region_id" },
  "náchod": { id: 108, paramName: "locality_region_id" },
  "rychnov nad kněžnou": { id: 108, paramName: "locality_region_id" },
  "svitavy": { id: 109, paramName: "locality_region_id" },
  "chrudim": { id: 109, paramName: "locality_region_id" },
  "ústí nad orlicí": { id: 109, paramName: "locality_region_id" },
  "jablonec nad nisou": { id: 107, paramName: "locality_region_id" },
  "česká lípa": { id: 107, paramName: "locality_region_id" },
  "semily": { id: 107, paramName: "locality_region_id" },
  "domažlice": { id: 103, paramName: "locality_region_id" },
  "klatovy": { id: 103, paramName: "locality_region_id" },
  "rokycany": { id: 103, paramName: "locality_region_id" },
  "sokolov": { id: 102, paramName: "locality_region_id" },
  "cheb": { id: 102, paramName: "locality_region_id" },
  "havlíčkův brod": { id: 110, paramName: "locality_region_id" },
  "pelhřimov": { id: 110, paramName: "locality_region_id" },
  "třebíč": { id: 110, paramName: "locality_region_id" },
  "žďár nad sázavou": { id: 110, paramName: "locality_region_id" },
  "nový jičín": { id: 124, paramName: "locality_region_id" },
  "bruntál": { id: 124, paramName: "locality_region_id" },
  "beroun": { id: 104, paramName: "locality_region_id" },
  "benešov": { id: 104, paramName: "locality_region_id" },
  "kutná hora": { id: 104, paramName: "locality_region_id" },
  "mělník": { id: 104, paramName: "locality_region_id" },
  "nymburk": { id: 104, paramName: "locality_region_id" },
  "rakovník": { id: 104, paramName: "locality_region_id" },
  "litoměřice": { id: 106, paramName: "locality_region_id" },
  "louny": { id: 106, paramName: "locality_region_id" },
}

/**
 * Resolve a locality string to a Sreality locality (ID + param name).
 * Uses diacritics-insensitive matching.
 */
export function resolveSrealityLocality(locality: string): SrealityLocality | null {
  const normalized = locality.toLowerCase().trim()

  // Exact match first
  if (SREALITY_MAP[normalized]) return SREALITY_MAP[normalized]

  // Exact match without diacritics
  const noDia = removeDiacritics(normalized)
  for (const [key, value] of Object.entries(SREALITY_MAP)) {
    if (removeDiacritics(key) === noDia) return value
  }

  // Substring match (backward compat — "Praha 7 Holešovice" contains "holešovice")
  for (const [key, value] of Object.entries(SREALITY_MAP)) {
    if (normalized.includes(key)) return value
  }

  // Substring match without diacritics
  for (const [key, value] of Object.entries(SREALITY_MAP)) {
    if (noDia.includes(removeDiacritics(key))) return value
  }

  return null
}

// ---------------------------------------------------------------------------
// Suggested localities for UI datalist
// ---------------------------------------------------------------------------

export const SUGGESTED_LOCALITIES = [
  // Praha
  "Praha",
  "Praha 1 Staré Město",
  "Praha 2 Vinohrady",
  "Praha 3 Žižkov",
  "Praha 4 Nusle",
  "Praha 5 Smíchov",
  "Praha 6 Dejvice",
  "Praha 7 Holešovice",
  "Praha 8 Karlín",
  "Praha 9 Vysočany",
  "Praha 10 Vršovice",
  // Krajská města
  "Brno",
  "Plzeň",
  "Ostrava",
  "Olomouc",
  "Liberec",
  "České Budějovice",
  "Hradec Králové",
  "Pardubice",
  "Zlín",
  "Karlovy Vary",
  "Ústí nad Labem",
  "Jihlava",
  // Další velká města
  "Kladno",
  "Most",
  "Opava",
  "Frýdek-Místek",
  "Mladá Boleslav",
  "Teplice",
  "Děčín",
  "Karviná",
  "Havířov",
  "Chomutov",
  "Prostějov",
  "Přerov",
  "Třebíč",
  "Znojmo",
  "Trutnov",
  "Český Krumlov",
]

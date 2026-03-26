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
// Bezrealitky — OSM region ID resolution (used by GraphQL API)
// ---------------------------------------------------------------------------

/**
 * Map locality names to OpenStreetMap relation IDs used by Bezrealitky GraphQL API.
 * IDs sourced from bezrealitky's own `czechRegions` query.
 */
const BEZREALITKY_OSM_MAP: Record<string, string[]> = {
  // ── Praha celá ────────────────────────────────────────────────────────
  "praha": ["R435514"],

  // ── Prague numbered districts → whole Praha (API doesn't have Praha 1-13) ──
  "praha 1": ["R435514"],
  "praha 2": ["R435514"],
  "praha 3": ["R435514"],
  "praha 4": ["R435514"],
  "praha 5": ["R435514"],
  "praha 6": ["R435514"],
  "praha 7": ["R435514"],
  "praha 8": ["R435514"],
  "praha 9": ["R435514"],
  "praha 10": ["R435514"],
  "praha 11": ["R435514"],
  "praha 12": ["R435514"],
  "praha 13": ["R435514"],

  // ── Prague neighborhoods (katastrální území) ──────────────────────────
  "staré město": ["R428812"],
  "vinohrady": ["R428841"],
  "žižkov": ["R428824"],
  "nusle": ["R434063"],
  "smíchov": ["R429381"],
  "dejvice": ["R428868"],
  "holešovice": ["R429461"],
  "karlín": ["R435856"],
  "vysočany": ["R426322"],
  "vršovice": ["R428842"],
  "stodůlky": ["R429527"],
  "bubeneč": ["R433262"],
  "břevnov": ["R429357"],
  "podolí": ["R431322"],
  "braník": ["R431321"],
  "kobylisy": ["R426433"],
  "libeň": ["R429373"],
  "prosek": ["R434448"],
  "černý most": ["R434268"],
  "háje": ["R433253"],
  "chodov": ["R428988"],
  "modřany": ["R428820"],
  "řepy": ["R431329"],
  "zbraslav": ["R429554"],
  "suchdol": ["R428596"],
  "troja": ["R429379"],
  "letná": ["R429461"], // part of Holešovice

  // ── Full Prague district names ────────────────────────────────────────
  "praha 1 staré město": ["R428812"],
  "praha 2 vinohrady": ["R428841"],
  "praha 3 žižkov": ["R428824"],
  "praha 4 nusle": ["R434063"],
  "praha 5 smíchov": ["R429381"],
  "praha 6 dejvice": ["R428868"],
  "praha 7 holešovice": ["R429461"],
  "praha 8 karlín": ["R435856"],
  "praha 9 vysočany": ["R426322"],
  "praha 10 vršovice": ["R428842"],
  "praha 13 stodůlky": ["R429527"],

  // ── Kraje ČR ──────────────────────────────────────────────────────────
  "jihočeský kraj": ["R442321"],
  "jihočeský": ["R442321"],
  "jihomoravský kraj": ["R442311"],
  "jihomoravský": ["R442311"],
  "karlovarský kraj": ["R442314"],
  "karlovarský": ["R442314"],
  "kraj vysočina": ["R442453"],
  "vysočina": ["R442453"],
  "královéhradecký kraj": ["R442463"],
  "královéhradecký": ["R442463"],
  "liberecký kraj": ["R442455"],
  "liberecký": ["R442455"],
  "moravskoslezský kraj": ["R442461"],
  "moravskoslezský": ["R442461"],
  "olomoucký kraj": ["R442459"],
  "olomoucký": ["R442459"],
  "pardubický kraj": ["R442460"],
  "pardubický": ["R442460"],
  "plzeňský kraj": ["R442466"],
  "plzeňský": ["R442466"],
  "středočeský kraj": ["R442397"],
  "středočeský": ["R442397"],
  "ústecký kraj": ["R442452"],
  "ústecký": ["R442452"],
  "zlínský kraj": ["R442449"],
  "zlínský": ["R442449"],

  // ── Krajská města (okres-level OSM IDs) ───────────────────────────────
  "brno": ["R442273"],
  "plzeň": ["R442399"],
  "ostrava": ["R435509"],
  "olomouc": ["R441579"],
  "liberec": ["R441329"],
  "české budějovice": ["R441226"],
  "hradec králové": ["R441917"],
  "pardubice": ["R441234"],
  "zlín": ["R440923"],
  "karlovy vary": ["R440798"],
  "ústí nad labem": ["R442324"],
  "jihlava": ["R441185"],

  // ── Další velká města (okres-level) ───────────────────────────────────
  "kladno": ["R441012"],
  "most": ["R442417"],
  "teplice": ["R441318"],
  "děčín": ["R441155"],
  "chomutov": ["R441437"],
  "opava": ["R442422"],
  "frýdek-místek": ["R442412"],
  "karviná": ["R441200"],
  "havířov": ["R442412"], // okres Frýdek-Místek
  "třinec": ["R442412"],  // okres Frýdek-Místek
  "mladá boleslav": ["R441981"],
  "kolín": ["R441315"],
  "příbram": ["R441434"],
  "tábor": ["R441914"],
  "písek": ["R441220"],
  "strakonice": ["R442320"],
  "český krumlov": ["R441576"],
  "jindřichův hradec": ["R441869"],
  "prostějov": ["R441197"],
  "přerov": ["R441573"],
  "šumperk": ["R442318"],
  "znojmo": ["R441326"],
  "břeclav": ["R442309"],
  "hodonín": ["R441151"],
  "vyškov": ["R442281"],
  "blansko": ["R441793"],
  "kroměříž": ["R442410"],
  "uherské hradiště": ["R442087"],
  "vsetín": ["R442448"],
  "jičín": ["R441987"],
  "trutnov": ["R442413"],
  "náchod": ["R441794"],
  "rychnov nad kněžnou": ["R441223"],
  "svitavy": ["R441911"],
  "chrudim": ["R441441"],
  "ústí nad orlicí": ["R441218"],
  "jablonec nad nisou": ["R441190"],
  "česká lípa": ["R441446"],
  "semily": ["R442423"],
  "domažlice": ["R441864"],
  "klatovy": ["R442419"],
  "rokycany": ["R441451"],
  "sokolov": ["R442313"],
  "cheb": ["R441990"],
  "havlíčkův brod": ["R441984"],
  "pelhřimov": ["R441102"],
  "třebíč": ["R442210"],
  "žďár nad sázavou": ["R441749"],
  "nový jičín": ["R441188"],
  "bruntál": ["R441193"],
  "beroun": ["R442335"],
  "benešov": ["R441521"],
  "kutná hora": ["R441861"],
  "mělník": ["R442362"],
  "nymburk": ["R441570"],
  "rakovník": ["R442396"],
  "litoměřice": ["R442420"],
  "louny": ["R441333"],
}

/**
 * Resolve a locality string to Bezrealitky OSM region IDs.
 * Returns an array of IDs (may be empty if locality is unknown).
 */
export function resolveBezrealitkyOsmIds(locality: string): string[] {
  const normalized = locality.toLowerCase().trim()

  // Exact match first
  if (BEZREALITKY_OSM_MAP[normalized]) return BEZREALITKY_OSM_MAP[normalized]

  // Exact match without diacritics
  const noDia = removeDiacritics(normalized)
  for (const [key, ids] of Object.entries(BEZREALITKY_OSM_MAP)) {
    if (removeDiacritics(key) === noDia) return ids
  }

  // Substring match (e.g. "Praha 7 Holešovice" contains "holešovice")
  for (const [key, ids] of Object.entries(BEZREALITKY_OSM_MAP)) {
    if (normalized.includes(key)) return ids
  }

  // Substring match without diacritics
  for (const [key, ids] of Object.entries(BEZREALITKY_OSM_MAP)) {
    if (noDia.includes(removeDiacritics(key))) return ids
  }

  return []
}

// ---------------------------------------------------------------------------
// Sreality — locality ID resolution
// ---------------------------------------------------------------------------

export type SrealityLocality =
  | { type: "param"; id: number; paramName: "locality_district_id" | "locality_region_id" }
  | { type: "region"; region: string; regionEntityType: string }

/**
 * Comprehensive Sreality locality map.
 * IDs sourced from Sreality's own suggest API (/api/cs/v2/suggest).
 *
 * Praha celá → locality_region_id=10
 * Praha X (numbered districts) → locality_district_id with legacy IDs (5001–5060)
 * Prague neighborhoods → region + region_entity_type=osmm (text-based search)
 * Cities → locality_district_id (okres level, new IDs from suggest API)
 * Regions → locality_region_id (new IDs from suggest API)
 */
const SREALITY_MAP: Record<string, SrealityLocality> = {
  // ── Praha celá ────────────────────────────────────────────────────────
  "praha": { type: "param", id: 10, paramName: "locality_region_id" },

  // ── Praha numbered districts (legacy locality_district_id) ────────────
  "praha 1": { type: "param", id: 5001, paramName: "locality_district_id" },
  "praha 2": { type: "param", id: 5002, paramName: "locality_district_id" },
  "praha 3": { type: "param", id: 5003, paramName: "locality_district_id" },
  "praha 4": { type: "param", id: 5004, paramName: "locality_district_id" },
  "praha 5": { type: "param", id: 5005, paramName: "locality_district_id" },
  "praha 6": { type: "param", id: 5058, paramName: "locality_district_id" },
  "praha 7": { type: "param", id: 5006, paramName: "locality_district_id" },
  "praha 8": { type: "param", id: 5008, paramName: "locality_district_id" },
  "praha 9": { type: "param", id: 5009, paramName: "locality_district_id" },
  "praha 10": { type: "param", id: 5010, paramName: "locality_district_id" },
  "praha 11": { type: "param", id: 5059, paramName: "locality_district_id" },
  "praha 12": { type: "param", id: 5060, paramName: "locality_district_id" },
  "praha 13": { type: "param", id: 5057, paramName: "locality_district_id" },

  // ── Praha neighborhoods (region text search) ──────────────────────────
  "praha 1 staré město": { type: "region", region: "Staré Město", regionEntityType: "osmm" },
  "staré město": { type: "region", region: "Staré Město", regionEntityType: "osmm" },
  "praha 2 vinohrady": { type: "region", region: "Vinohrady", regionEntityType: "osmm" },
  "vinohrady": { type: "region", region: "Vinohrady", regionEntityType: "osmm" },
  "praha 3 žižkov": { type: "region", region: "Žižkov", regionEntityType: "osmm" },
  "žižkov": { type: "region", region: "Žižkov", regionEntityType: "osmm" },
  "praha 4 nusle": { type: "region", region: "Nusle", regionEntityType: "osmm" },
  "nusle": { type: "region", region: "Nusle", regionEntityType: "osmm" },
  "praha 5 smíchov": { type: "region", region: "Smíchov", regionEntityType: "osmm" },
  "smíchov": { type: "region", region: "Smíchov", regionEntityType: "osmm" },
  "praha 6 dejvice": { type: "region", region: "Dejvice", regionEntityType: "osmm" },
  "dejvice": { type: "region", region: "Dejvice", regionEntityType: "osmm" },
  "praha 7 holešovice": { type: "region", region: "Holešovice", regionEntityType: "osmm" },
  "holešovice": { type: "region", region: "Holešovice", regionEntityType: "osmm" },
  "praha 8 karlín": { type: "region", region: "Karlín", regionEntityType: "osmm" },
  "karlín": { type: "region", region: "Karlín", regionEntityType: "osmm" },
  "praha 9 vysočany": { type: "region", region: "Vysočany", regionEntityType: "osmm" },
  "vysočany": { type: "region", region: "Vysočany", regionEntityType: "osmm" },
  "praha 10 vršovice": { type: "region", region: "Vršovice", regionEntityType: "osmm" },
  "vršovice": { type: "region", region: "Vršovice", regionEntityType: "osmm" },
  "praha 13 stodůlky": { type: "region", region: "Stodůlky", regionEntityType: "osmm" },
  "stodůlky": { type: "region", region: "Stodůlky", regionEntityType: "osmm" },
  "kobylisy": { type: "region", region: "Kobylisy", regionEntityType: "osmm" },
  "libeň": { type: "region", region: "Libeň", regionEntityType: "osmm" },
  "prosek": { type: "region", region: "Prosek", regionEntityType: "osmm" },
  "černý most": { type: "region", region: "Černý Most", regionEntityType: "osmm" },
  "háje": { type: "region", region: "Háje", regionEntityType: "osmm" },
  "chodov": { type: "region", region: "Chodov", regionEntityType: "osmm" },
  "modřany": { type: "region", region: "Modřany", regionEntityType: "osmm" },
  "řepy": { type: "region", region: "Řepy", regionEntityType: "osmm" },
  "zbraslav": { type: "region", region: "Zbraslav", regionEntityType: "osmm" },
  "suchdol": { type: "region", region: "Suchdol", regionEntityType: "osmm" },
  "troja": { type: "region", region: "Troja", regionEntityType: "osmm" },
  "letná": { type: "region", region: "Holešovice", regionEntityType: "osmm" },
  "bubeneč": { type: "region", region: "Bubeneč", regionEntityType: "osmm" },
  "břevnov": { type: "region", region: "Břevnov", regionEntityType: "osmm" },
  "podolí": { type: "region", region: "Podolí", regionEntityType: "osmm" },
  "braník": { type: "region", region: "Braník", regionEntityType: "osmm" },

  // ── Kraje ČR (locality_region_id) ────────────────────────────────────
  "jihočeský kraj": { type: "param", id: 1, paramName: "locality_region_id" },
  "jihočeský": { type: "param", id: 1, paramName: "locality_region_id" },
  "plzeňský kraj": { type: "param", id: 2, paramName: "locality_region_id" },
  "plzeňský": { type: "param", id: 2, paramName: "locality_region_id" },
  "karlovarský kraj": { type: "param", id: 3, paramName: "locality_region_id" },
  "karlovarský": { type: "param", id: 3, paramName: "locality_region_id" },
  "ústecký kraj": { type: "param", id: 4, paramName: "locality_region_id" },
  "ústecký": { type: "param", id: 4, paramName: "locality_region_id" },
  "liberecký kraj": { type: "param", id: 5, paramName: "locality_region_id" },
  "liberecký": { type: "param", id: 5, paramName: "locality_region_id" },
  "královéhradecký kraj": { type: "param", id: 6, paramName: "locality_region_id" },
  "královéhradecký": { type: "param", id: 6, paramName: "locality_region_id" },
  "pardubický kraj": { type: "param", id: 7, paramName: "locality_region_id" },
  "pardubický": { type: "param", id: 7, paramName: "locality_region_id" },
  "olomoucký kraj": { type: "param", id: 8, paramName: "locality_region_id" },
  "olomoucký": { type: "param", id: 8, paramName: "locality_region_id" },
  "zlínský kraj": { type: "param", id: 9, paramName: "locality_region_id" },
  "zlínský": { type: "param", id: 9, paramName: "locality_region_id" },
  "středočeský kraj": { type: "param", id: 11, paramName: "locality_region_id" },
  "středočeský": { type: "param", id: 11, paramName: "locality_region_id" },
  "moravskoslezský kraj": { type: "param", id: 12, paramName: "locality_region_id" },
  "moravskoslezský": { type: "param", id: 12, paramName: "locality_region_id" },
  "vysočina": { type: "param", id: 13, paramName: "locality_region_id" },
  "kraj vysočina": { type: "param", id: 13, paramName: "locality_region_id" },
  "jihomoravský kraj": { type: "param", id: 14, paramName: "locality_region_id" },
  "jihomoravský": { type: "param", id: 14, paramName: "locality_region_id" },

  // ── Krajská města (locality_district_id = okres) ──────────────────────
  "brno": { type: "param", id: 72, paramName: "locality_district_id" },
  "plzeň": { type: "param", id: 12, paramName: "locality_district_id" },
  "ostrava": { type: "param", id: 65, paramName: "locality_district_id" },
  "olomouc": { type: "param", id: 42, paramName: "locality_district_id" },
  "liberec": { type: "param", id: 22, paramName: "locality_district_id" },
  "české budějovice": { type: "param", id: 1, paramName: "locality_district_id" },
  "hradec králové": { type: "param", id: 28, paramName: "locality_district_id" },
  "pardubice": { type: "param", id: 32, paramName: "locality_district_id" },
  "zlín": { type: "param", id: 38, paramName: "locality_district_id" },
  "karlovy vary": { type: "param", id: 10, paramName: "locality_district_id" },
  "ústí nad labem": { type: "param", id: 27, paramName: "locality_district_id" },
  "jihlava": { type: "param", id: 67, paramName: "locality_district_id" },

  // ── Další velká města (locality_district_id = okres) ──────────────────
  "kladno": { type: "param", id: 50, paramName: "locality_district_id" },
  "most": { type: "param", id: 25, paramName: "locality_district_id" },
  "teplice": { type: "param", id: 26, paramName: "locality_district_id" },
  "děčín": { type: "param", id: 19, paramName: "locality_district_id" },
  "chomutov": { type: "param", id: 20, paramName: "locality_district_id" },
  "opava": { type: "param", id: 64, paramName: "locality_district_id" },
  "frýdek-místek": { type: "param", id: 61, paramName: "locality_district_id" },
  "karviná": { type: "param", id: 62, paramName: "locality_district_id" },
  "havířov": { type: "param", id: 62, paramName: "locality_district_id" },
  "třinec": { type: "param", id: 61, paramName: "locality_district_id" },
  "mladá boleslav": { type: "param", id: 53, paramName: "locality_district_id" },
  "kolín": { type: "param", id: 51, paramName: "locality_district_id" },
  "příbram": { type: "param", id: 58, paramName: "locality_district_id" },
  "tábor": { type: "param", id: 7, paramName: "locality_district_id" },
  "písek": { type: "param", id: 4, paramName: "locality_district_id" },
  "strakonice": { type: "param", id: 6, paramName: "locality_district_id" },
  "český krumlov": { type: "param", id: 2, paramName: "locality_district_id" },
  "jindřichův hradec": { type: "param", id: 3, paramName: "locality_district_id" },
  "prostějov": { type: "param", id: 40, paramName: "locality_district_id" },
  "přerov": { type: "param", id: 43, paramName: "locality_district_id" },
  "šumperk": { type: "param", id: 44, paramName: "locality_district_id" },
  "znojmo": { type: "param", id: 77, paramName: "locality_district_id" },
  "břeclav": { type: "param", id: 74, paramName: "locality_district_id" },
  "hodonín": { type: "param", id: 75, paramName: "locality_district_id" },
  "vyškov": { type: "param", id: 76, paramName: "locality_district_id" },
  "blansko": { type: "param", id: 71, paramName: "locality_district_id" },
  "kroměříž": { type: "param", id: 39, paramName: "locality_district_id" },
  "uherské hradiště": { type: "param", id: 41, paramName: "locality_district_id" },
  "vsetín": { type: "param", id: 45, paramName: "locality_district_id" },
  "jičín": { type: "param", id: 30, paramName: "locality_district_id" },
  "trutnov": { type: "param", id: 36, paramName: "locality_district_id" },
  "náchod": { type: "param", id: 31, paramName: "locality_district_id" },
  "rychnov nad kněžnou": { type: "param", id: 33, paramName: "locality_district_id" },
  "svitavy": { type: "param", id: 35, paramName: "locality_district_id" },
  "chrudim": { type: "param", id: 29, paramName: "locality_district_id" },
  "ústí nad orlicí": { type: "param", id: 37, paramName: "locality_district_id" },
  "jablonec nad nisou": { type: "param", id: 21, paramName: "locality_district_id" },
  "česká lípa": { type: "param", id: 18, paramName: "locality_district_id" },
  "semily": { type: "param", id: 34, paramName: "locality_district_id" },
  "domažlice": { type: "param", id: 8, paramName: "locality_district_id" },
  "klatovy": { type: "param", id: 11, paramName: "locality_district_id" },
  "rokycany": { type: "param", id: 15, paramName: "locality_district_id" },
  "sokolov": { type: "param", id: 16, paramName: "locality_district_id" },
  "cheb": { type: "param", id: 9, paramName: "locality_district_id" },
  "havlíčkův brod": { type: "param", id: 66, paramName: "locality_district_id" },
  "pelhřimov": { type: "param", id: 68, paramName: "locality_district_id" },
  "třebíč": { type: "param", id: 69, paramName: "locality_district_id" },
  "žďár nad sázavou": { type: "param", id: 70, paramName: "locality_district_id" },
  "nový jičín": { type: "param", id: 63, paramName: "locality_district_id" },
  "bruntál": { type: "param", id: 60, paramName: "locality_district_id" },
  "beroun": { type: "param", id: 49, paramName: "locality_district_id" },
  "benešov": { type: "param", id: 48, paramName: "locality_district_id" },
  "kutná hora": { type: "param", id: 52, paramName: "locality_district_id" },
  "mělník": { type: "param", id: 54, paramName: "locality_district_id" },
  "nymburk": { type: "param", id: 55, paramName: "locality_district_id" },
  "rakovník": { type: "param", id: 59, paramName: "locality_district_id" },
  "litoměřice": { type: "param", id: 23, paramName: "locality_district_id" },
  "louny": { type: "param", id: 24, paramName: "locality_district_id" },
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

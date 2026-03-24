// Czech label maps for all Prisma enums

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  BYT: "Byt",
  DUM: "Dům",
  POZEMEK: "Pozemek",
  KOMERCNI: "Komerční",
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Dostupné",
  IN_NEGOTIATION: "V jednání",
  SOLD: "Prodáno",
  RENTED: "Pronajato",
  WITHDRAWN: "Staženo",
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nový",
  CONTACTED: "Kontaktován",
  QUALIFIED: "Kvalifikován",
  CONVERTED: "Konvertován",
  LOST: "Ztracen",
}

export const DEAL_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Probíhá",
  CLOSED_WON: "Uzavřeno (úspěšně)",
  CLOSED_LOST: "Uzavřeno (neúspěšně)",
}

export const SHOWING_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Naplánováno",
  COMPLETED: "Dokončeno",
  CANCELLED: "Zrušeno",
  NO_SHOW: "Nedostavil se",
}

export const ACQUISITION_SOURCE_LABELS: Record<string, string> = {
  SREALITY: "Sreality",
  BEZREALITKY: "Bezrealitky",
  DOPORUCENI: "Doporučení",
  WEB: "Firemní web",
  INZERCE: "Inzerce",
  LINKEDIN: "LinkedIn",
}

export const CLIENT_SEGMENT_LABELS: Record<string, string> = {
  INVESTOR: "Investor",
  PRVNI_KUPUJICI: "První kupující",
  UPGRADER: "Upgrader",
  DOWNGRADER: "Downgrader",
  PRENAJIMATEL: "Pronajímatel",
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktivní",
  PAUSED: "Pozastaveno",
  ERROR: "Chyba",
}

// Status badge color maps
export const STATUS_COLORS: Record<string, string> = {
  // Property
  AVAILABLE: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  IN_NEGOTIATION: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  SOLD: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  RENTED: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  WITHDRAWN: "text-muted-foreground border-border/40 bg-secondary/40",
  // Lead
  NEW: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  CONTACTED: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  QUALIFIED: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  CONVERTED: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  LOST: "text-red-400 border-red-500/20 bg-red-500/10",
  // Deal
  IN_PROGRESS: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  CLOSED_WON: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  CLOSED_LOST: "text-red-400 border-red-500/20 bg-red-500/10",
  // Showing
  SCHEDULED: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  COMPLETED: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  CANCELLED: "text-red-400 border-red-500/20 bg-red-500/10",
  NO_SHOW: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  // Job
  ACTIVE: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  PAUSED: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  ERROR: "text-red-400 border-red-500/20 bg-red-500/10",
}

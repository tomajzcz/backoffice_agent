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

export const LIFECYCLE_STAGE_LABELS: Record<string, string> = {
  ACQUISITION: "Akvizice",
  IN_RENOVATION: "V rekonstrukci",
  READY_FOR_SALE: "Připraveno k prodeji",
  LISTED: "Inzerováno",
  SOLD: "Prodáno",
}

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Nízká",
  MEDIUM: "Střední",
  HIGH: "Vysoká",
  URGENT: "Urgentní",
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Otevřeno",
  IN_PROGRESS: "Probíhá",
  DONE: "Hotovo",
  CANCELLED: "Zrušeno",
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  KUPNI_SMLOUVA: "Kupní smlouva",
  NAVRH_NA_VKLAD: "Návrh na vklad",
  ZNALECKY_POSUDEK: "Znalecký posudek",
  ENERGETICKY_STITEK: "Energetický štítek",
  LIST_VLASTNICTVI: "List vlastnictví",
  FOTODOKUMENTACE: "Fotodokumentace",
  OSTATNI: "Ostatní",
}

export const CALL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Čeká",
  INITIATED: "Zahájeno",
  FAILED: "Selhalo",
  NO_PHONE: "Bez telefonu",
  SKIPPED: "Přeskočeno",
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
  // Lifecycle stages
  ACQUISITION: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  IN_RENOVATION: "text-orange-400 border-orange-500/20 bg-orange-500/10",
  READY_FOR_SALE: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  LISTED: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  // SOLD already defined above
  // Task priority
  LOW: "text-muted-foreground border-border/40 bg-secondary/40",
  MEDIUM: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  HIGH: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  URGENT: "text-red-400 border-red-500/20 bg-red-500/10",
  // Task status
  OPEN: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  DONE: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  // Call status
  PENDING: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  INITIATED: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  NO_PHONE: "text-muted-foreground border-border/40 bg-secondary/40",
}

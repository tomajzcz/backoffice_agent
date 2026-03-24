import { tool } from "ai"
import { z } from "zod"
import { createScheduledJob } from "@/lib/db/queries/monitoring"

export const createMonitoringJobTool = tool({
  description:
    "Vytvoří nový monitorovací job pro sledování realitních nabídek. " +
    "Job bude automaticky scrapovat zadané servery podle cron rozvrhu " +
    "a posílat email s novými nabídkami.",
  parameters: z.object({
    name: z.string().describe("Název jobu, např. 'Monitor Praha Holešovice'"),
    description: z.string().optional().describe("Volitelný popis jobu"),
    locality: z.string().describe("Lokalita pro vyhledávání, např. 'Praha 7 Holešovice'"),
    sources: z.array(z.enum(["sreality", "bezrealitky"])).default(["sreality", "bezrealitky"])
      .describe("Zdroje k prohledávání"),
    types: z.array(z.enum(["BYT", "DUM", "KOMERCNI"])).optional()
      .describe("Typy nemovitostí (BYT, DUM, KOMERCNI)"),
    dispositions: z.array(z.string()).optional()
      .describe("Filtr dispozic, např. ['2+kk', '3+kk']"),
    minPrice: z.number().optional().describe("Minimální cena v CZK"),
    maxPrice: z.number().optional().describe("Maximální cena v CZK"),
    minAreaM2: z.number().optional().describe("Minimální plocha v m²"),
    maxAreaM2: z.number().optional().describe("Maximální plocha v m²"),
    cronExpr: z.string().default("0 7 * * 1-5")
      .describe("Cron výraz pro rozvrh, výchozí: pracovní dny v 7:00"),
    notifyEmail: z.string().email().optional()
      .describe("Email pro zasílání notifikací o nových nabídkách"),
  }),
  execute: async ({ name, description, locality, sources, types, dispositions, minPrice, maxPrice, minAreaM2, maxAreaM2, cronExpr, notifyEmail }) => {
    const job = await createScheduledJob({
      name,
      description,
      cronExpr,
      notifyEmail,
      configJson: {
        locality,
        sources,
        filters: {
          types: types?.length ? types : undefined,
          dispositions: dispositions?.length ? dispositions : undefined,
          minPrice,
          maxPrice,
          minAreaM2,
          maxAreaM2,
        },
      },
    })

    return {
      toolName: "createMonitoringJob",
      job: {
        id: job.id,
        name: job.name,
        locality,
        cronExpr,
        notifyEmail: notifyEmail ?? null,
        status: "ACTIVE",
      },
      message: `Monitorovací job "${name}" vytvořen (ID: ${job.id}). ${notifyEmail ? `Notifikace budou zasílány na ${notifyEmail}.` : "Email notifikace nejsou nastaveny."}`,
      chartType: "none" as const,
    }
  },
})

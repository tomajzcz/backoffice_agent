import { PrismaClient, AcquisitionSource, ClientSegment, PropertyType, PropertyStatus, DealStatus, LeadStatus, ShowingStatus } from "@prisma/client"
import { Faker, cs, en } from "@faker-js/faker"
const faker = new Faker({ locale: [cs, en] })

const prisma = new PrismaClient()

faker.seed(42)

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// Weight function: more leads in recent months
function weightedDate(baseDate: Date, totalDays: number): Date {
  // Quadratic weight: later dates are 2x more likely than earlier
  const u = Math.random()
  const dayOffset = Math.floor(totalDays * Math.sqrt(u))
  return addDays(baseDate, dayOffset)
}

const PRAGUE_DISTRICTS = [
  "Praha 1 – Staré Město",
  "Praha 2 – Vinohrady",
  "Praha 3 – Žižkov",
  "Praha 4 – Nusle",
  "Praha 5 – Smíchov",
  "Praha 6 – Dejvice",
  "Praha 7 – Holešovice",
  "Praha 8 – Libeň",
  "Praha 9 – Vysočany",
  "Praha 10 – Vršovice",
  "Praha 12 – Modřany",
  "Praha 13 – Stodůlky",
]

const PREMIUM_DISTRICTS = [
  "Praha 1 – Staré Město",
  "Praha 2 – Vinohrady",
  "Praha 6 – Dejvice",
]

const DISPOSITIONS = ["1+kk", "1+1", "2+kk", "2+1", "3+kk", "3+1", "4+kk", "4+1", "5+kk"]

const STREETS = [
  "Mánesova", "Blanická", "Máchova", "Italská", "Korunní", "Londýnská",
  "Španělská", "Mánesova", "Krkonošská", "Chodská", "Slavíkova",
  "Pohořelec", "Letohradská", "Dukelských hrdinů", "Komunardů",
  "Přístavní", "Tusarova", "Ortenovo náměstí", "Nábřeží Kapitána Jaroše",
  "Budečská", "Mánesova", "Seifertova", "Chelčického", "Bořivojova",
  "Jugoslávská", "Jana Masaryka", "Mánesova", "Rumunská", "Francouzská",
]

const ACQUISITION_SOURCES: AcquisitionSource[] = [
  AcquisitionSource.SREALITY,
  AcquisitionSource.SREALITY,
  AcquisitionSource.SREALITY,
  AcquisitionSource.BEZREALITKY,
  AcquisitionSource.BEZREALITKY,
  AcquisitionSource.DOPORUCENI,
  AcquisitionSource.DOPORUCENI,
  AcquisitionSource.WEB,
  AcquisitionSource.INZERCE,
  AcquisitionSource.LINKEDIN,
]

const CLIENT_SEGMENTS: ClientSegment[] = [
  ClientSegment.INVESTOR,
  ClientSegment.INVESTOR,
  ClientSegment.PRVNI_KUPUJICI,
  ClientSegment.PRVNI_KUPUJICI,
  ClientSegment.PRVNI_KUPUJICI,
  ClientSegment.UPGRADER,
  ClientSegment.UPGRADER,
  ClientSegment.DOWNGRADER,
  ClientSegment.PRENAJIMATEL,
  ClientSegment.PRENAJIMATEL,
]

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedClients() {
  console.log("Seeding clients...")
  const clients = []
  const emailDomains = ["gmail.com", "email.cz", "seznam.cz", "centrum.cz", "post.cz"]

  for (let i = 0; i < 45; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const name = `${firstName} ${lastName}`
    const emailBase = `${firstName.toLowerCase().replace(/[áčďéěíňóřšťúůýž]/g, (c) =>
      "acdeeinorstuuyz"["áčďéěíňóřšťúůýž".indexOf(c)] ?? c
    )}.${lastName.toLowerCase().replace(/[áčďéěíňóřšťúůýž]/g, (c) =>
      "acdeeinorstuuyz"["áčďéěíňóřšťúůýž".indexOf(c)] ?? c
    )}${i > 20 ? i : ""}`
    const email = `${emailBase}@${randomItem(emailDomains)}`

    // Spread createdAt over Jan 2025 – Mar 2026 with slight growth trend
    const startDate = new Date("2025-01-01")
    const totalDays = 445 // ~14.7 months
    const createdAt = weightedDate(startDate, totalDays)

    clients.push({
      name,
      email,
      phone: faker.phone.number("+420 ### ### ###"),
      acquisitionSource: randomItem(ACQUISITION_SOURCES),
      segment: randomItem(CLIENT_SEGMENTS),
      createdAt,
    })
  }

  // Ensure unique emails
  const uniqueClients = clients.filter(
    (c, i, arr) => arr.findIndex((x) => x.email === c.email) === i
  )

  await prisma.client.createMany({ data: uniqueClients, skipDuplicates: true })
  console.log(`  ✓ Created ${uniqueClients.length} clients`)
}

async function seedProperties() {
  console.log("Seeding properties...")
  const clients = await prisma.client.findMany({ select: { id: true } })
  const clientIds = clients.map((c) => c.id)

  const properties = []

  const PROPERTY_TYPES: PropertyType[] = [
    PropertyType.BYT, PropertyType.BYT, PropertyType.BYT,
    PropertyType.BYT, PropertyType.BYT,
    PropertyType.DUM,
    PropertyType.POZEMEK,
    PropertyType.KOMERCNI,
  ]

  const STATUSES: PropertyStatus[] = [
    PropertyStatus.AVAILABLE, PropertyStatus.AVAILABLE, PropertyStatus.AVAILABLE,
    PropertyStatus.IN_NEGOTIATION, PropertyStatus.IN_NEGOTIATION,
    PropertyStatus.SOLD, PropertyStatus.SOLD, PropertyStatus.SOLD,
    PropertyStatus.RENTED,
    PropertyStatus.WITHDRAWN,
  ]

  for (let i = 0; i < 55; i++) {
    const district = i < 10
      ? randomItem(PREMIUM_DISTRICTS)
      : randomItem(PRAGUE_DISTRICTS)

    const type = randomItem(PROPERTY_TYPES)
    const isPremium = PREMIUM_DISTRICTS.includes(district)

    // Price: premium districts 2x more expensive
    const basePrice = type === PropertyType.BYT
      ? randomInt(3_500_000, isPremium ? 18_000_000 : 11_000_000)
      : type === PropertyType.DUM
      ? randomInt(8_000_000, 35_000_000)
      : randomInt(1_200_000, 6_000_000)

    // 15 properties intentionally missing renovation data (for Day 2 tool)
    const missingRenovation = i >= 40

    properties.push({
      address: `${randomItem(STREETS)} ${randomInt(1, 80)}, ${district}`,
      district,
      type,
      price: basePrice,
      status: randomItem(STATUSES),
      areaM2: type === PropertyType.BYT
        ? randomInt(35, 180)
        : type === PropertyType.DUM
        ? randomInt(120, 450)
        : randomInt(200, 2000),
      disposition: type === PropertyType.BYT ? randomItem(DISPOSITIONS) : null,
      yearBuilt: randomInt(1920, 2022),
      lastRenovationYear: missingRenovation ? null : randomInt(2005, 2023),
      renovationNotes: missingRenovation
        ? null
        : randomItem([
            "Kompletní rekonstrukce bytového jádra 2019",
            "Nová kuchyňská linka, podlahy 2021",
            "Rekonstrukce koupelny a WC 2020",
            "Nová elektroinstalace, rozvody 2018",
            "Zateplení fasády a nová okna 2022",
            "Rekonstrukce celého bytu 2023, nová kuchyně",
            "Vyměněna okna, nové podlahy dřevo 2021",
            null,
          ]),
      ownerId: Math.random() > 0.4 ? randomItem(clientIds) : null,
      createdAt: new Date(
        randomInt(new Date("2024-06-01").getTime(), new Date("2026-01-01").getTime())
      ),
    })
  }

  await prisma.property.createMany({ data: properties })
  console.log(`  ✓ Created ${properties.length} properties (15 missing renovation data)`)
}

async function seedLeads() {
  console.log("Seeding leads...")
  const leads = []
  const emailDomains = ["gmail.com", "email.cz", "seznam.cz", "centrum.cz", "icloud.com"]
  const startDate = new Date("2025-01-01")
  const totalDays = 445 // up to today ~2026-03-21

  const INTERESTS = [
    "3+kk Praha 6, do 8M Kč",
    "2+kk Praha 7 Holešovice, do 5M Kč",
    "4+kk Praha 2 Vinohrady, investice",
    "1+kk Praha centrum, pronájem",
    "Rodinný dům Praha okolí, do 15M Kč",
    "2+1 Praha 5, první byt",
    "3+1 Praha 10, výměna za větší",
    "Komerční prostory Praha 1",
    "Pozemek Praha okolí, výstavba",
    "4+1 Praha 3 Žižkov, investice",
    null,
  ]

  for (let i = 0; i < 150; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const emailBase = `${firstName.toLowerCase().replace(/[áčďéěíňóřšťúůýž]/g, (c) =>
      "acdeeinorstuuyz"["áčďéěíňóřšťúůýž".indexOf(c)] ?? c
    )}.${lastName.toLowerCase().replace(/[áčďéěíňóřšťúůýž]/g, (c) =>
      "acdeeinorstuuyz"["áčďéěíňóřšťúůýž".indexOf(c)] ?? c
    )}${i}`

    // ~30% converted
    const isConverted = Math.random() < 0.3
    const createdAt = weightedDate(startDate, totalDays)

    const LEAD_STATUSES: LeadStatus[] = isConverted
      ? [LeadStatus.CONVERTED]
      : [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.LOST]

    leads.push({
      name: `${firstName} ${lastName}`,
      email: `${emailBase}@${randomItem(emailDomains)}`,
      phone: Math.random() > 0.3 ? faker.phone.number("+420 ### ### ###") : null,
      source: randomItem(ACQUISITION_SOURCES),
      status: randomItem(LEAD_STATUSES),
      propertyInterest: randomItem(INTERESTS),
      createdAt,
      convertedAt: isConverted
        ? addDays(createdAt, randomInt(3, 45))
        : null,
    })
  }

  await prisma.lead.createMany({ data: leads, skipDuplicates: true })
  console.log(`  ✓ Created ${leads.length} leads`)
}

async function seedDeals() {
  console.log("Seeding deals...")
  const clients = await prisma.client.findMany({ select: { id: true } })
  const properties = await prisma.property.findMany({ select: { id: true, price: true } })

  const deals = []
  const usedPairs = new Set<string>()

  for (let i = 0; i < 22; i++) {
    let propertyId: number, clientId: number, pairKey: string
    let attempts = 0

    do {
      propertyId = randomItem(properties).id
      clientId = randomItem(clients).id
      pairKey = `${propertyId}-${clientId}`
      attempts++
    } while (usedPairs.has(pairKey) && attempts < 100)

    usedPairs.add(pairKey)

    const property = properties.find((p) => p.id === propertyId)!
    const baseValue = Number(property.price)
    const value = baseValue * (0.92 + Math.random() * 0.12) // ±8% from list price

    const isWon = Math.random() < 0.65
    const isLost = !isWon && Math.random() < 0.5
    const status = isWon
      ? DealStatus.CLOSED_WON
      : isLost
      ? DealStatus.CLOSED_LOST
      : DealStatus.IN_PROGRESS

    const createdAt = new Date(
      randomInt(new Date("2025-01-01").getTime(), new Date("2026-01-01").getTime())
    )
    const closedAt =
      status !== DealStatus.IN_PROGRESS
        ? addDays(createdAt, randomInt(14, 90))
        : null

    deals.push({
      propertyId,
      clientId,
      status,
      value: Math.round(value),
      closedAt,
      createdAt,
    })
  }

  await prisma.deal.createMany({ data: deals })
  console.log(`  ✓ Created ${deals.length} deals`)
}

async function seedShowings() {
  console.log("Seeding showings...")
  const clients = await prisma.client.findMany({ select: { id: true } })
  const properties = await prisma.property.findMany({ select: { id: true } })

  const showings = []
  const SHOWING_STATUSES: ShowingStatus[] = [
    ShowingStatus.COMPLETED, ShowingStatus.COMPLETED, ShowingStatus.COMPLETED,
    ShowingStatus.SCHEDULED,
    ShowingStatus.CANCELLED,
    ShowingStatus.NO_SHOW,
  ]

  for (let i = 0; i < 40; i++) {
    const scheduledAt = new Date(
      randomInt(new Date("2025-03-01").getTime(), new Date("2026-05-01").getTime())
    )

    showings.push({
      propertyId: randomItem(properties).id,
      clientId: randomItem(clients).id,
      scheduledAt,
      status: randomItem(SHOWING_STATUSES),
      notes: Math.random() > 0.6
        ? randomItem([
            "Klient má zájem, čeká na hypotéku",
            "Prohlídka proběhla, klient zvažuje",
            "Velmi zaujatý klient, plánuje druhou prohlídku",
            "Klient hledá dál, nemovitost nevyhovuje dispozičně",
            "Zájem o snížení ceny",
            null,
          ])
        : null,
    })
  }

  await prisma.showing.createMany({ data: showings })
  console.log(`  ✓ Created ${showings.length} showings`)
}

async function seedWeeklyReports() {
  console.log("Seeding weekly reports...")
  const reports = []

  // 18 weeks back from today (2026-03-21)
  const today = new Date("2026-03-21")
  let baseLeads = 6
  let baseClients = 2

  for (let i = 17; i >= 0; i--) {
    // Get Monday of the week i weeks ago
    const weekStart = addDays(today, -(i * 7 + today.getDay() - 1))
    weekStart.setHours(0, 0, 0, 0)

    // Add upward trend with noise
    const weekProgress = (17 - i) / 17
    const newLeads = Math.max(1, Math.round(baseLeads * (1 + weekProgress * 0.8) + randomInt(-2, 3)))
    const newClients = Math.max(0, Math.round(baseClients * (1 + weekProgress * 0.6) + randomInt(-1, 2)))
    const propertiesListed = randomInt(1, 5)
    const dealsClosed = Math.random() < 0.4 ? randomInt(1, 3) : 0
    const revenue = dealsClosed > 0
      ? dealsClosed * randomInt(4_500_000, 12_000_000)
      : 0

    reports.push({
      weekStart,
      newLeads,
      newClients,
      propertiesListed,
      dealsClosed,
      revenue,
    })
  }

  await prisma.weeklyReport.createMany({ data: reports, skipDuplicates: true })
  console.log(`  ✓ Created ${reports.length} weekly reports`)
}

async function seedScheduledJobs() {
  console.log("Seeding scheduled jobs...")

  const jobs = await prisma.scheduledJob.createMany({
    data: [
      {
        name: "Monitor Praha Holešovice",
        description: "Každé ráno v 7:00 hledá nové nabídky v lokalitě Praha 7 – Holešovice",
        cronExpr: "0 7 * * 1-5",
        lastRunAt: addDays(new Date(), -1),
        nextRunAt: new Date(new Date().setHours(7, 0, 0, 0)),
        status: "ACTIVE",
        configJson: {
          locality: "Praha 7 Holešovice",
          sources: ["sreality", "bezrealitky"],
          filters: { maxPrice: 12000000, types: ["BYT"] },
        },
      },
      {
        name: "Monitor Praha Žižkov",
        description: "Každé ráno v 7:30 hledá nové nabídky v lokalitě Praha 3 – Žižkov",
        cronExpr: "30 7 * * 1-5",
        lastRunAt: addDays(new Date(), -1),
        nextRunAt: new Date(new Date().setHours(7, 30, 0, 0)),
        status: "ACTIVE",
        configJson: {
          locality: "Praha 3 Žižkov",
          sources: ["sreality", "bezrealitky"],
          filters: { maxPrice: 9000000, types: ["BYT", "DUM"] },
        },
      },
    ],
  })

  // Add monitoring results
  const job1 = await prisma.scheduledJob.findFirst({ where: { name: "Monitor Praha Holešovice" } })
  const job2 = await prisma.scheduledJob.findFirst({ where: { name: "Monitor Praha Žižkov" } })

  if (job1 && job2) {
    await prisma.monitoringResult.createMany({
      data: [
        {
          jobId: job1.id,
          source: "sreality",
          title: "Prodej bytu 3+kk, 78 m², Praha 7 – Holešovice, Milady Horákové",
          url: "https://www.sreality.cz/detail/prodej/byt/3+kk/praha-holesovice/123456",
          price: 7_890_000,
          district: "Praha 7 – Holešovice",
          disposition: "3+kk",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
        {
          jobId: job1.id,
          source: "bezrealitky",
          title: "Prodej bytu 2+kk, 55 m², Praha 7 Holešovice, Jablonského",
          url: "https://www.bezrealitky.cz/nemovitosti-byty-domy/654321",
          price: 5_450_000,
          district: "Praha 7 – Holešovice",
          disposition: "2+kk",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
        {
          jobId: job1.id,
          source: "sreality",
          title: "Prodej bytu 4+kk, 112 m², Praha 7 – Holešovice, Nábřeží Kapitána Jaroše",
          url: "https://www.sreality.cz/detail/prodej/byt/4+kk/praha-holesovice/789012",
          price: 11_200_000,
          district: "Praha 7 – Holešovice",
          disposition: "4+kk",
          foundAt: addDays(new Date(), -2),
          isNew: false,
        },
        {
          jobId: job2.id,
          source: "sreality",
          title: "Prodej bytu 2+1, 62 m², Praha 3 – Žižkov, Seifertova",
          url: "https://www.sreality.cz/detail/prodej/byt/2+1/praha-zizkov/345678",
          price: 4_800_000,
          district: "Praha 3 – Žižkov",
          disposition: "2+1",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
        {
          jobId: job2.id,
          source: "bezrealitky",
          title: "Prodej bytu 3+1, 74 m², Praha 3 Žižkov, Bořivojova",
          url: "https://www.bezrealitky.cz/nemovitosti-byty-domy/901234",
          price: 5_950_000,
          district: "Praha 3 – Žižkov",
          disposition: "3+1",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
      ],
    })
  }

  console.log("  ✓ Created 2 scheduled jobs + 5 monitoring results")
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Starting database seed...\n")

  // Clear existing data in correct FK order
  await prisma.agentRun.deleteMany()
  await prisma.agentTask.deleteMany()
  await prisma.monitoringResult.deleteMany()
  await prisma.scheduledJob.deleteMany()
  await prisma.weeklyReport.deleteMany()
  await prisma.showing.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.property.deleteMany()
  await prisma.client.deleteMany()

  console.log("  ✓ Cleared existing data\n")

  await seedClients()
  await seedProperties()
  await seedLeads()
  await seedDeals()
  await seedShowings()
  await seedWeeklyReports()
  await seedScheduledJobs()

  // Summary
  const counts = {
    clients: await prisma.client.count(),
    leads: await prisma.lead.count(),
    properties: await prisma.property.count(),
    deals: await prisma.deal.count(),
    showings: await prisma.showing.count(),
    weeklyReports: await prisma.weeklyReport.count(),
    scheduledJobs: await prisma.scheduledJob.count(),
    monitoringResults: await prisma.monitoringResult.count(),
  }

  console.log("\n✅ Seed completed!")
  console.log("   Counts:", counts)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

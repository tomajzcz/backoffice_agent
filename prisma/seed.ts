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

type LifecycleStage = "ACQUISITION" | "IN_RENOVATION" | "READY_FOR_SALE" | "LISTED" | "SOLD"

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

  // Lifecycle stage assignment based on index for variety
  function getLifecycleStage(i: number, status: PropertyStatus): LifecycleStage {
    if (status === PropertyStatus.SOLD) return "SOLD"
    if (i < 5) return "ACQUISITION"
    if (i < 10) return "IN_RENOVATION"
    if (i < 15) return "READY_FOR_SALE"
    if (status === PropertyStatus.WITHDRAWN) return randomItem(["ACQUISITION", "IN_RENOVATION"] as LifecycleStage[])
    return "LISTED"
  }

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

    const status = randomItem(STATUSES)
    const lifecycleStage = getLifecycleStage(i, status)

    const createdAt = new Date(
      randomInt(new Date("2024-06-01").getTime(), new Date("2026-01-01").getTime())
    )

    // stageChangedAt: for stalled identification, some IN_RENOVATION get old dates
    const stageChangedAt = (lifecycleStage === "IN_RENOVATION" && i < 7)
      ? addDays(createdAt, randomInt(1, 10)) // >45 days ago = stalled
      : addDays(createdAt, randomInt(1, 60))

    // Financial data for ~25 properties
    const hasFinancials = i < 25
    const purchasePrice = hasFinancials ? Math.round(basePrice * (0.6 + Math.random() * 0.25)) : null
    const renovationCost = hasFinancials && purchasePrice ? Math.round(purchasePrice * (0.05 + Math.random() * 0.15)) : null
    const expectedSalePrice = hasFinancials ? Math.round(basePrice * (1.05 + Math.random() * 0.30)) : null

    properties.push({
      address: `${randomItem(STREETS)} ${randomInt(1, 80)}, ${district}`,
      district,
      type,
      price: basePrice,
      status,
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
      lifecycleStage,
      stageChangedAt,
      purchasePrice,
      renovationCost,
      expectedSalePrice,
      ownerId: Math.random() > 0.4 ? randomItem(clientIds) : null,
      createdAt,
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

  await prisma.scheduledJob.createMany({
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

  // Add monitoring results with scoring
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
          areaM2: 78,
          pricePerM2: 101154,
          score: 85,
          scoreReason: "Dobrá cena/m², atraktivní lokalita Holešovice, 3+kk ideální pro flip",
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
          areaM2: 55,
          pricePerM2: 99091,
          score: 78,
          scoreReason: "Slušná cena/m², menší dispozice ale dobrá lokalita",
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
          areaM2: 112,
          pricePerM2: 100000,
          score: 65,
          scoreReason: "Větší byt, vyšší celková cena, delší doba prodeje",
          foundAt: addDays(new Date(), -2),
          isNew: false,
        },
        {
          jobId: job1.id,
          source: "sreality",
          title: "Prodej bytu 2+1, 48 m², Praha 7 – Holešovice, Tusarova",
          url: "https://www.sreality.cz/detail/prodej/byt/2+1/praha-holesovice/111222",
          price: 4_200_000,
          district: "Praha 7 – Holešovice",
          disposition: "2+1",
          areaM2: 48,
          pricePerM2: 87500,
          score: 92,
          scoreReason: "Výborná cena/m², malý byt vhodný pro rychlý flip, Tusarova roste",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
        {
          jobId: job1.id,
          source: "bezrealitky",
          title: "Prodej bytu 1+kk, 32 m², Praha 7 Holešovice, Komunardů",
          url: "https://www.bezrealitky.cz/nemovitosti-byty-domy/333444",
          price: 3_100_000,
          district: "Praha 7 – Holešovice",
          disposition: "1+kk",
          areaM2: 32,
          pricePerM2: 96875,
          score: 55,
          scoreReason: "Příliš malá dispozice, omezený trh kupujících po rekonstrukci",
          foundAt: addDays(new Date(), -3),
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
          areaM2: 62,
          pricePerM2: 77419,
          score: 88,
          scoreReason: "Nízká cena/m² pro Žižkov, blízko Jiřího z Poděbrad, skvělý flip potenciál",
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
          areaM2: 74,
          pricePerM2: 80405,
          score: 82,
          scoreReason: "Dobrá cena/m², Bořivojova je žádaná ulice, 3+1 snadno prodejné",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
        {
          jobId: job2.id,
          source: "sreality",
          title: "Prodej bytu 1+1, 38 m², Praha 3 – Žižkov, Chelčického",
          url: "https://www.sreality.cz/detail/prodej/byt/1+1/praha-zizkov/555666",
          price: 3_200_000,
          district: "Praha 3 – Žižkov",
          disposition: "1+1",
          areaM2: 38,
          pricePerM2: 84211,
          score: 70,
          scoreReason: "Dobrá cena, ale malá dispozice; vhodné spíše pro pronájem",
          foundAt: addDays(new Date(), -2),
          isNew: false,
        },
        {
          jobId: job2.id,
          source: "bezrealitky",
          title: "Prodej bytu 3+kk, 85 m², Praha 3 Žižkov, Koněvova",
          url: "https://www.bezrealitky.cz/nemovitosti-byty-domy/777888",
          price: 7_200_000,
          district: "Praha 3 – Žižkov",
          disposition: "3+kk",
          areaM2: 85,
          pricePerM2: 84706,
          score: 75,
          scoreReason: "Solidní cena/m², Koněvova ale méně atraktivní než centrum Žižkova",
          foundAt: addDays(new Date(), -1),
          isNew: true,
        },
      ],
    })
  }

  console.log("  ✓ Created 2 scheduled jobs + 9 monitoring results (with scores)")
}

async function seedAgentTasks() {
  console.log("Seeding agent tasks...")
  const properties = await prisma.property.findMany({ select: { id: true }, take: 20 })
  const deals = await prisma.deal.findMany({ where: { status: "IN_PROGRESS" }, select: { id: true }, take: 5 })

  const now = new Date()

  const tasks = [
    // 5 overdue tasks
    {
      title: "Doplnit energetický štítek — Mánesova 12",
      description: "Energetický štítek chybí, nutné pro inzerci",
      status: "OPEN" as const,
      priority: "HIGH" as const,
      dueDate: addDays(now, -7),
      assignee: "Pepa",
      propertyId: properties[0]?.id ?? null,
      dealId: null,
    },
    {
      title: "Objednat znalecký posudek — Blanická 45",
      description: "Posudek potřeba pro hypotéku kupujícího",
      status: "OPEN" as const,
      priority: "URGENT" as const,
      dueDate: addDays(now, -3),
      assignee: "Pepa",
      propertyId: properties[1]?.id ?? null,
      dealId: deals[0]?.id ?? null,
    },
    {
      title: "Zkontrolovat stav rekonstrukce — Italská 8",
      description: "Stavbyvedoucí slíbil dokončení minulý týden",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      dueDate: addDays(now, -5),
      assignee: "Martin",
      propertyId: properties[2]?.id ?? null,
      dealId: null,
    },
    {
      title: "Poslat fotodokumentaci investorovi Novákovi",
      description: "Investor žádá aktuální fotky z rekonstrukce",
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, -2),
      assignee: "Pepa",
      propertyId: properties[3]?.id ?? null,
      dealId: null,
    },
    {
      title: "Zaregistrovat kupní smlouvu na katastr",
      description: "Smlouva podepsána, čeká na vklad",
      status: "OPEN" as const,
      priority: "URGENT" as const,
      dueDate: addDays(now, -1),
      assignee: "Martin",
      propertyId: properties[4]?.id ?? null,
      dealId: deals[1]?.id ?? null,
    },
    // 4 upcoming tasks
    {
      title: "Připravit inzerát pro nový byt — Korunní 33",
      description: "Rekonstrukce hotová, připravit texty a fotky",
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, 2),
      assignee: "Pepa",
      propertyId: properties[5]?.id ?? null,
      dealId: null,
    },
    {
      title: "Schůzka s investorem Černým — přehled portfolia",
      description: "Čtvrtletní reporting, připravit prezentaci",
      status: "OPEN" as const,
      priority: "HIGH" as const,
      dueDate: addDays(now, 1),
      assignee: "Pepa",
      propertyId: null,
      dealId: null,
    },
    {
      title: "Ověřit list vlastnictví — Londýnská 5",
      description: null,
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, 3),
      assignee: null,
      propertyId: properties[6]?.id ?? null,
      dealId: null,
    },
    {
      title: "Kontaktovat správce budovy — oprava stoupačky",
      description: "Stoupačka teče, nutné řešit před prodejem",
      status: "OPEN" as const,
      priority: "HIGH" as const,
      dueDate: addDays(now, 2),
      assignee: "Martin",
      propertyId: properties[7]?.id ?? null,
      dealId: null,
    },
    // 4 done tasks
    {
      title: "Nafotit nemovitost pro inzerci — Španělská 22",
      description: null,
      status: "DONE" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, -10),
      assignee: "Pepa",
      propertyId: properties[8]?.id ?? null,
      dealId: null,
    },
    {
      title: "Odeslat kupní smlouvu právníkovi",
      description: "Smlouva zkontrolována a odeslána",
      status: "DONE" as const,
      priority: "HIGH" as const,
      dueDate: addDays(now, -14),
      assignee: "Pepa",
      propertyId: properties[9]?.id ?? null,
      dealId: deals[2]?.id ?? null,
    },
    {
      title: "Aktualizovat cenu v inzerátu — Chodská 7",
      description: null,
      status: "DONE" as const,
      priority: "LOW" as const,
      dueDate: addDays(now, -8),
      assignee: "Martin",
      propertyId: properties[10]?.id ?? null,
      dealId: null,
    },
    {
      title: "Objednat úklidovou firmu po rekonstrukci",
      description: null,
      status: "DONE" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, -6),
      assignee: "Pepa",
      propertyId: properties[11]?.id ?? null,
      dealId: null,
    },
    // 2 cancelled tasks
    {
      title: "Nabídka na koupi pozemku — Modřany",
      description: "Vlastník si nabídku rozmyslel",
      status: "CANCELLED" as const,
      priority: "LOW" as const,
      dueDate: addDays(now, -20),
      assignee: null,
      propertyId: null,
      dealId: null,
    },
    {
      title: "Jednání s developerem — projekt zrušen",
      description: null,
      status: "CANCELLED" as const,
      priority: "MEDIUM" as const,
      dueDate: addDays(now, -15),
      assignee: "Martin",
      propertyId: null,
      dealId: null,
    },
  ]

  for (const task of tasks) {
    await prisma.agentTask.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        propertyId: task.propertyId,
        dealId: task.dealId,
      },
    })
  }

  console.log(`  ✓ Created ${tasks.length} agent tasks (5 overdue, 4 upcoming, 4 done, 2 cancelled)`)
}

async function seedInvestors() {
  console.log("Seeding investors...")

  // Find clients with INVESTOR segment to link some
  const investorClients = await prisma.client.findMany({
    where: { segment: "INVESTOR" },
    select: { id: true, name: true, email: true, phone: true },
    take: 3,
  })

  const properties = await prisma.property.findMany({
    select: { id: true, price: true },
    take: 20,
  })

  const investors = [
    {
      name: "Jan Novák",
      email: "jan.novak@investice.cz",
      phone: "+420 777 111 222",
      company: "Novák Invest s.r.o.",
      notes: "Dlouhodobý investor, preferuje Praha 2 a Praha 7",
      clientId: investorClients[0]?.id ?? null,
    },
    {
      name: "Petra Černá",
      email: "petra.cerna@realty-group.cz",
      phone: "+420 603 333 444",
      company: "Realty Group CZ",
      notes: "Zaměřuje se na menší byty pro flip, Praha 3 a Praha 10",
      clientId: investorClients[1]?.id ?? null,
    },
    {
      name: "Tomáš Dvořák",
      email: "tomas.dvorak@gmail.com",
      phone: "+420 721 555 666",
      company: null,
      notes: "Privátní investor, 2 byty v portfoliu",
      clientId: investorClients[2]?.id ?? null,
    },
    {
      name: "Investiční fond Praha a.s.",
      email: "info@ifp-praha.cz",
      phone: "+420 222 777 888",
      company: "Investiční fond Praha a.s.",
      notes: "Institucionální investor, větší projekty",
      clientId: null,
    },
    {
      name: "Martin Svoboda",
      email: "m.svoboda@seznam.cz",
      phone: "+420 606 999 000",
      company: null,
      notes: "Nový investor, první nákup v Q1 2026",
      clientId: null,
    },
  ]

  for (const inv of investors) {
    const created = await prisma.investor.create({
      data: {
        name: inv.name,
        email: inv.email,
        phone: inv.phone,
        company: inv.company,
        notes: inv.notes,
        clientId: inv.clientId,
      },
    })

    // Link 2-4 properties to each investor
    const propCount = randomInt(2, Math.min(4, properties.length))
    const usedIds = new Set<number>()
    for (let j = 0; j < propCount; j++) {
      let propId: number
      let attempts = 0
      do {
        propId = randomItem(properties).id
        attempts++
      } while (usedIds.has(propId) && attempts < 50)
      usedIds.add(propId)

      const prop = properties.find((p) => p.id === propId)
      const investedAmount = prop ? Math.round(Number(prop.price) * (0.7 + Math.random() * 0.2)) : null

      try {
        await prisma.investorProperty.create({
          data: {
            investorId: created.id,
            propertyId: propId,
            investedAmount,
            notes: randomItem([
              "Koupeno v akvizici Q3 2025",
              "Rekonstrukce dokončena",
              "Čeká na prodej",
              null,
            ]),
          },
        })
      } catch {
        // Skip if duplicate constraint
      }
    }
  }

  console.log(`  ✓ Created ${investors.length} investors with property links`)
}

async function seedDocuments() {
  console.log("Seeding documents...")
  const properties = await prisma.property.findMany({ select: { id: true }, take: 55 })

  type DocType = "KUPNI_SMLOUVA" | "NAVRH_NA_VKLAD" | "ZNALECKY_POSUDEK" | "ENERGETICKY_STITEK" | "LIST_VLASTNICTVI" | "FOTODOKUMENTACE" | "OSTATNI"

  const DOC_TYPES: DocType[] = [
    "KUPNI_SMLOUVA",
    "ENERGETICKY_STITEK",
    "LIST_VLASTNICTVI",
    "FOTODOKUMENTACE",
    "ZNALECKY_POSUDEK",
    "NAVRH_NA_VKLAD",
    "OSTATNI",
  ]

  const DOC_NAMES: Record<string, string[]> = {
    KUPNI_SMLOUVA: ["Kupní smlouva 2025", "Kupní smlouva - podepsaná"],
    NAVRH_NA_VKLAD: ["Návrh na vklad do KN"],
    ZNALECKY_POSUDEK: ["Znalecký posudek - odhad tržní ceny"],
    ENERGETICKY_STITEK: ["Energetický štítek budovy - PENB"],
    LIST_VLASTNICTVI: ["Výpis z katastru nemovitostí", "LV - aktuální"],
    FOTODOKUMENTACE: ["Fotodokumentace - exteriér", "Fotodokumentace - interiér", "Fotky z rekonstrukce"],
    OSTATNI: ["Projektová dokumentace", "Protokol o předání"],
  }

  let count = 0

  // First 30 properties get 2-5 documents
  for (let i = 0; i < Math.min(30, properties.length); i++) {
    const propId = properties[i].id
    const docCount = randomInt(2, 5)
    const usedTypes = new Set<string>()

    for (let j = 0; j < docCount; j++) {
      let docType: DocType
      let attempts = 0
      do {
        docType = randomItem(DOC_TYPES)
        attempts++
      } while (usedTypes.has(docType) && attempts < 20)
      usedTypes.add(docType)

      const names = DOC_NAMES[docType] ?? ["Dokument"]
      await prisma.document.create({
        data: {
          propertyId: propId,
          type: docType,
          name: randomItem(names),
          url: `https://drive.google.com/file/d/${faker.string.alphanumeric(20)}/view`,
          notes: Math.random() > 0.7 ? randomItem(["Ověřeno", "Čeká na podpis", "Platné do 2027", null]) : null,
        },
      })
      count++
    }
  }

  // Remaining 25 properties get 0-1 documents (intentionally incomplete)
  for (let i = 30; i < properties.length; i++) {
    if (Math.random() < 0.3) {
      const docType = randomItem(DOC_TYPES)
      const names = DOC_NAMES[docType] ?? ["Dokument"]
      await prisma.document.create({
        data: {
          propertyId: properties[i].id,
          type: docType,
          name: randomItem(names),
          url: `https://drive.google.com/file/d/${faker.string.alphanumeric(20)}/view`,
        },
      })
      count++
    }
  }

  console.log(`  ✓ Created ${count} documents (25 properties with incomplete/no docs)`)
}

// ─── Renovations ─────────────────────────────────────────────────────────────

async function seedRenovations() {
  console.log("Seeding renovations...")

  const now = new Date()

  // Find properties in IN_RENOVATION lifecycle stage
  const renovationProperties = await prisma.property.findMany({
    where: { lifecycleStage: "IN_RENOVATION" },
    select: { id: true, address: true },
    take: 5,
    orderBy: { id: "asc" },
  })

  if (renovationProperties.length === 0) {
    console.log("  ⚠ No IN_RENOVATION properties found, skipping renovations")
    return
  }

  type RenovationSeed = {
    propertyId: number
    phase: "PLANNING" | "DEMOLITION" | "ROUGH_WORK" | "INSTALLATIONS" | "SURFACES" | "FINISHING" | "READY_FOR_HANDOVER" | "COMPLETED" | "ON_HOLD"
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD"
    startedAt: Date
    plannedEndAt: Date | null
    isDelayed: boolean
    nextStep: string | null
    blockers: string | null
    ownerName: string | null
    contractorName: string | null
    budgetPlanned: number | null
    budgetActual: number | null
    notes: string | null
  }

  const renovationSeeds: RenovationSeed[] = [
    {
      propertyId: renovationProperties[0].id,
      phase: "DEMOLITION",
      status: "ACTIVE",
      startedAt: addDays(now, -45),
      plannedEndAt: addDays(now, -20),
      isDelayed: true,
      nextStep: null,
      blockers: "Stavební povolení čeká na schválení magistrátu",
      ownerName: "Pepa Novák",
      contractorName: null,
      budgetPlanned: 850000,
      budgetActual: 320000,
      notes: "Čekáme na vyjádření stavebního úřadu. Bourací práce pozastaveny.",
    },
    ...(renovationProperties.length > 1 ? [{
      propertyId: renovationProperties[1].id,
      phase: "INSTALLATIONS" as const,
      status: "ACTIVE" as const,
      startedAt: addDays(now, -30),
      plannedEndAt: addDays(now, 15),
      isDelayed: false,
      nextStep: "Elektroinstalace patro 2",
      blockers: null,
      ownerName: "Pepa Novák",
      contractorName: "StavbyPraha s.r.o.",
      budgetPlanned: 1200000,
      budgetActual: 680000,
      notes: "Postup dle plánu. SDK příčky hotové.",
    }] : []),
    ...(renovationProperties.length > 2 ? [{
      propertyId: renovationProperties[2].id,
      phase: "SURFACES" as const,
      status: "ACTIVE" as const,
      startedAt: addDays(now, -60),
      plannedEndAt: addDays(now, 5),
      isDelayed: false,
      nextStep: "Obklady koupelna",
      blockers: null,
      ownerName: "Martin Dvořák",
      contractorName: "RealReko a.s.",
      budgetPlanned: 950000,
      budgetActual: 1120000,
      notes: "Rozpočet přečerpán kvůli změně materiálu podlah na vinyl.",
    }] : []),
    ...(renovationProperties.length > 3 ? [{
      propertyId: renovationProperties[3].id,
      phase: "PLANNING" as const,
      status: "ACTIVE" as const,
      startedAt: addDays(now, -5),
      plannedEndAt: addDays(now, 90),
      isDelayed: false,
      nextStep: "Vybrat dodavatele a domluvit harmonogram",
      blockers: null,
      ownerName: "Pepa Novák",
      contractorName: null,
      budgetPlanned: 1500000,
      budgetActual: null,
      notes: null,
    }] : []),
    ...(renovationProperties.length > 4 ? [{
      propertyId: renovationProperties[4].id,
      phase: "FINISHING" as const,
      status: "ACTIVE" as const,
      startedAt: addDays(now, -90),
      plannedEndAt: addDays(now, 10),
      isDelayed: false,
      nextStep: "Montáž kuchyňské linky a spotřebičů",
      blockers: null,
      ownerName: "Pepa Novák",
      contractorName: "Bytový Flip CZ s.r.o.",
      budgetPlanned: 1100000,
      budgetActual: 980000,
      notes: "Finální fáze. Elektro a vodo revize objednány na příští týden.",
    }] : []),
  ]

  const createdRenovations: Array<{ id: number; propertyId: number }> = []

  for (const seed of renovationSeeds) {
    const renovation = await prisma.renovation.create({
      data: seed,
    })
    createdRenovations.push({ id: renovation.id, propertyId: renovation.propertyId })
  }

  // Create tasks linked to renovations
  const renovationTasks = [
    // Overdue tasks for the delayed renovation (index 0)
    ...(createdRenovations.length > 0 ? [
      {
        title: "Zajistit stavební povolení",
        description: "Kontaktovat stavební úřad a urgovat schválení",
        status: "OPEN" as const,
        priority: "URGENT" as const,
        dueDate: addDays(now, -10),
        assignee: "Pepa",
        propertyId: createdRenovations[0].propertyId,
        renovationId: createdRenovations[0].id,
      },
      {
        title: "Vybrat nového dodavatele bourání",
        description: "Oslovit min. 3 firmy na bourací práce",
        status: "OPEN" as const,
        priority: "HIGH" as const,
        dueDate: addDays(now, -5),
        assignee: "Pepa",
        propertyId: createdRenovations[0].propertyId,
        renovationId: createdRenovations[0].id,
      },
    ] : []),
    // Tasks for installations renovation (index 1)
    ...(createdRenovations.length > 1 ? [
      {
        title: "Objednat elektroinstalační materiál",
        description: null,
        status: "IN_PROGRESS" as const,
        priority: "MEDIUM" as const,
        dueDate: addDays(now, 3),
        assignee: "Martin",
        propertyId: createdRenovations[1].propertyId,
        renovationId: createdRenovations[1].id,
      },
    ] : []),
    // Tasks for surfaces renovation (index 2) - one overdue
    ...(createdRenovations.length > 2 ? [
      {
        title: "Kontrola kvality obkladů",
        description: "Zkontrolovat dodané obklady vs. objednávka",
        status: "OPEN" as const,
        priority: "HIGH" as const,
        dueDate: addDays(now, -2),
        assignee: "Martin",
        propertyId: createdRenovations[2].propertyId,
        renovationId: createdRenovations[2].id,
      },
      {
        title: "Doobjednat vinylové podlahy",
        description: null,
        status: "DONE" as const,
        priority: "MEDIUM" as const,
        dueDate: addDays(now, -15),
        assignee: "Martin",
        propertyId: createdRenovations[2].propertyId,
        renovationId: createdRenovations[2].id,
      },
    ] : []),
    // Tasks for finishing renovation (index 4)
    ...(createdRenovations.length > 4 ? [
      {
        title: "Objednat revizi elektro",
        description: null,
        status: "OPEN" as const,
        priority: "MEDIUM" as const,
        dueDate: addDays(now, 5),
        assignee: "Pepa",
        propertyId: createdRenovations[4].propertyId,
        renovationId: createdRenovations[4].id,
      },
      {
        title: "Montáž kuchyňské linky",
        description: "IKEA kuchyně - montáž + zapojení spotřebičů",
        status: "IN_PROGRESS" as const,
        priority: "HIGH" as const,
        dueDate: addDays(now, 7),
        assignee: "Bytový Flip CZ",
        propertyId: createdRenovations[4].propertyId,
        renovationId: createdRenovations[4].id,
      },
    ] : []),
  ]

  for (const task of renovationTasks) {
    await prisma.agentTask.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        propertyId: task.propertyId,
        renovationId: task.renovationId,
        sourceQuery: "seed",
      },
    })
  }

  console.log(`  ✓ Created ${createdRenovations.length} renovations + ${renovationTasks.length} linked tasks`)
}

// ─── Automation Configs ──────────────────────────────────────────────────────

async function seedAutomationConfigs() {
  await prisma.automationConfig.createMany({
    data: [
      {
        key: "daily_reminder_calls",
        isActive: true,
        recipientEmail: "",
        cronExpr: "0 5 * * *",
      },
      {
        key: "weekly_executive_report",
        isActive: true,
        recipientEmail: "management@pragueproperties.cz",
        cronExpr: "0 7 * * 1",
      },
    ],
  })
  console.log("  ✓ 2 automation configs seeded")
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Starting database seed...\n")

  // Clear existing data in correct FK order
  await prisma.executiveReportRun.deleteMany()
  await prisma.automationConfig.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.callLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.investorProperty.deleteMany()
  await prisma.investor.deleteMany()
  await prisma.agentTask.deleteMany()
  await prisma.renovation.deleteMany()
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
  await seedAgentTasks()
  await seedRenovations()
  await seedInvestors()
  await seedDocuments()
  await seedAutomationConfigs()

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
    agentTasks: await prisma.agentTask.count(),
    investors: await prisma.investor.count(),
    investorProperties: await prisma.investorProperty.count(),
    documents: await prisma.document.count(),
    renovations: await prisma.renovation.count(),
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

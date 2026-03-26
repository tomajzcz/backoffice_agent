# Video prezentace — scénář

Celková délka: cca 8–12 minut. Rozdělen na dvě části: technické shrnutí (2–3 min) a uživatelská ukázka (6–9 min).

---

## ČÁST 1: Technické shrnutí (2–3 min)

### 1.1 Úvod (30 s)

**Co říct:**

> Toto je Back Office Operations Agent — AI asistent pro realitní kancelář v Praze. Pepa, back office manažer, potřebuje denně řešit desítky operativních úkolů: kontrolovat stav nemovitostí, plánovat prohlídky, komunikovat s klienty, sledovat trh. Místo pěti různých aplikací má jeden chat.

**Co ukázat:**
- Otevřít aplikaci na `/` — split-screen s chatem vlevo a výsledky vpravo
- Krátce najet myší na navrhované dotazy

### 1.2 Architektura (60 s)

**Co říct:**

> Aplikace běží na Next.js 15 s App Routerem. Frontend je React 19, backend je API route, která streamuje odpovědi přes SSE.
>
> Jádro systému je 45 AI nástrojů rozdělených do 13 kategorií — analytika, CRUD operace, Google Kalendář, Gmail, monitoring trhu, export a další. Agent používá Claude Sonnet 4.6 přes Vercel AI SDK.
>
> Klíčová věc: agent nehallucinuje data. Každý nástroj sahá přímo do PostgreSQL databáze nebo volá externí API — Google Calendar, Gmail, Twilio pro SMS, ElevenLabs pro hlasové hovory, Sreality a Bezrealitky pro scraping trhu.
>
> Výsledky jsou typované — každý nástroj vrací strukturovaný objekt s diskriminantem toolName. Frontend podle něj automaticky přepne záložku na Data, Graf, Report nebo Email.

**Co ukázat:**
- Přepnout na záložku Logy — krátce ukázat strukturu explainability (jaké nástroje, jaká data)
- Nemusí se nic klikat, stačí verbálně popsat

### 1.3 Databáze a integrace (30 s)

**Co říct:**

> Databáze je PostgreSQL na Neonu s 17 modely — klienti, nemovitosti, leady, obchody, prohlídky, rekonstrukce, investoři, dokumenty, úkoly a monitorovací úlohy.
>
> Aplikace má tři cron joby na Vercelu: denní připomínkové hovory přes ElevenLabs, automatický scraping trhu v pracovní dny a týdenní executive report jako PPTX prezentace odeslaná mailem.

### 1.4 Tři stránky (20 s)

**Co říct:**

> Aplikace má tři stránky: Chat pro práci s agentem, Správu dat pro ruční editaci záznamů, a Dashboard pro řízení automatizací. Teď si ukážeme, co to všechno umí v praxi.

**Co ukázat:**
- Krátce kliknout na každou stránku v sidebaru (/, /sprava, /dashboard) — jen flash, nemusí se nic číst

---

## ČÁST 2: Uživatelská ukázka (6–9 min)

### 2.1 Ranní briefing (60 s)

**Dotaz v chatu:**
```
Ranní briefing — jaký je operativní stav firmy?
```

**Co se stane:**
- Agent zavolá `scanOperationalHealth` → `scanRenovationHealth` → `scanOverdueTasks`
- Záložka se přepne na Graf s health score
- V odpovědi bude shrnutí problémů

**Co ukázat a říct:**
- Záložka **Graf** — skóre operativního zdraví
- Záložka **Data** — přepnout, ukázat tabulku s problémy
- Záložka **Logy** — ukázat jaké nástroje agent použil, kolik záznamů prošel
- > Agent prošel desítky záznamů přes tři specializované nástroje a sestavil přehled. V logách vidíte přesně co udělal — plná transparentnost.

### 2.2 Rekonstrukce — životní cyklus nemovitosti (90 s)

**Krok 1 — ukázat přes agenta:**

**Dotaz:**
```
Jak probíhají rekonstrukce? Jsou nějaké zpožděné?
```

**Co ukázat:**
- Agent zavolá `queryActiveRenovations` + `scanRenovationHealth`
- Záložka Data/Graf — seznam rekonstrukcí, fáze, zpoždění, rozpočet

**Krok 2 — ukázat přes UI:**

**Co říct a udělat:**
> Teď ukážu, co se stane, když nemovitost přepnu do fáze rekonstrukce.

1. Přejít na **/sprava**
2. V záložce **Nemovitosti** najít nemovitost ve stavu "Akvizice"
3. Kliknout na editaci, změnit **Fáze životního cyklu** na **V rekonstrukci**
4. Uložit

**Co říct:**
> Systém automaticky vytvořil novou rekonstrukci ve fázi Plánování. Nemovitost a rekonstrukce jsou synchronizované — když přepnu fázi na nemovitosti, rekonstrukce se vytvoří automaticky. A naopak — když vytvořím rekonstrukci, nemovitost se přepne do fáze rekonstrukce.

5. Přepnout na záložku **Rekonstrukce** — ukázat nově vytvořený záznam
6. Kliknout na detail rekonstrukce (**/sprava/rekonstrukce/[id]**)
7. Ukázat: fáze, rozpočet, úkoly, stav

**Co říct:**
> Na detailu rekonstrukce vidím časovou osu fází, plánovaný a skutečný rozpočet, propojené úkoly. Tady mohu přímo spravovat celou rekonstrukci.

### 2.3 Plánování prohlídky + kalendář + SMS (90 s)

**Krok 1 — přes agenta:**

**Dotaz:**
```
Naplánuj prohlídku bytu na Vinohradské pro klienta Nováka na příští úterý ve 14:00
```

**Co se stane (popsat):**
- Agent nejdřív najde nemovitost (`getPropertyDetails`)
- Zkontroluje dostupnost v Google Kalendáři (`getCalendarAvailability`)
- Vytvoří prohlídku v databázi (`createShowing`)
- Automaticky přidá událost do Google Kalendáře
- Automaticky odešle SMS potvrzení klientovi přes Twilio

**Co ukázat:**
- Záložka **Data** — detail vytvořené prohlídky s calendar event ID a SMS statusem
- > Agent vytvořil prohlídku, zároveň ji zapsal do Google Kalendáře a odeslal SMS s adresou a časem. To všechno v jednom kroku.

**Krok 2 — zrušení prohlídky:**

**Dotaz:**
```
Zruš tu prohlídku
```

**Co ukázat:**
- Agent zavolá `updateShowing` se statusem CANCELLED
- Smaže událost z Google Kalendáře
- Odešle SMS o zrušení
- > Při zrušení se automaticky smaže kalendářová událost a odešle se SMS o zrušení — klient je vždy informovaný.

**Krok 3 — ukázat ruční správu:**
- Přejít na **/sprava** → záložka **Prohlídky**
- Ukázat, že prohlídky jdou vytvářet a upravovat i ručně přes formulář

### 2.4 Hlasové připomínky — Voice Agent (30 s)

**Co říct (nemusí se klikat):**

> Systém má ještě jednu vrstvu komunikace — hlasové připomínky. Každé ráno v 5:00 automatický cron job projde dnešní naplánované prohlídky a pro každou zavolá klientovi přes ElevenLabs Voice AI. AI hlas řekne jméno klienta, adresu nemovitosti a čas prohlídky.

**Co ukázat:**
- Přejít na **/dashboard** → záložka **Připomínkové hovory**
- Ukázat tabulku s call logy — statusy INITIATED, PENDING, NO_PHONE
- > Tady vidím logy všech hovorů — kdo byl kontaktován, kdo nemá telefon, kde hovor selhal. Automatizaci mohu pozastavit nebo spustit ručně.

### 2.5 Diktování hlasem (20 s)

**Co říct a udělat:**

> Vstup do chatu funguje i hlasem.

1. Kliknout na ikonu mikrofonu v chatovém vstupním poli
2. Říct: *"Kolik máme aktivních klientů?"*
3. Ukázat, jak se text automaticky přepíše do pole
4. Odeslat

**Co říct:**
> Rozpoznávání řeči je v češtině — můžu agentovi diktovat místo psaní.

### 2.6 Monitoring trhu — scraping (90 s)

**Krok 1 — vytvoření monitoringu přes agenta:**

**Dotaz:**
```
Vytvoř monitoring trhu pro Prahu 3 — byty 2+kk a 3+kk do 8 milionů, scrapuj Sreality a Bezrealitky v pracovní dny v 7:00, posílej výsledky na pepa@firma.cz
```

**Co ukázat:**
- Agent zavolá `createMonitoringJob` s parametry
- Záložka Data — potvrzení vytvoření jobu

**Krok 2 — spuštění a výsledky přes agenta:**

**Dotaz:**
```
Spusť ten nový monitoring hned
```

- Agent zavolá `triggerMonitoringJob`
- Zobrazí kolik inzerátů bylo nalezeno, kolik je nových

**Dotaz:**
```
Analyzuj výsledky monitoringu
```

- Agent zavolá `analyzeNewListings`
- Záložka **Graf** — rozložení podle dispozice, průměrné ceny
- Záložka **Data** — top nabídky se skóre

**Co říct:**
> Agent scrape provedl, deduplikoval výsledky a ohodnotil je skóre. Vidím průměrné ceny, rozložení podle dispozice a nejzajímavější nabídky.

**Krok 3 — ukázat ruční správu na dashboardu:**

- Přejít na **/dashboard** → záložka **Monitoring**
- Ukázat nově vytvořený job
- Kliknout na **Spustit teď** (tlačítko play) — ukázat, že scraping jde spustit i ručně
- Kliknout na **editaci** — ukázat formulář s lokalitou, zdroji, filtry, cronem, emailem
- Kliknout na **pozastavení** — ukázat toggle ACTIVE/PAUSED
- > Monitoring jde vytvořit přes agenta i ručně přes dashboard. Tady vidím všechny joby, můžu je editovat, pozastavit, spustit nebo smazat.

### 2.7 Export — prezentace, PDF, CSV, email (90 s)

**Krok 1 — prezentace + email:**

**Dotaz:**
```
Připrav prezentaci s přehledem KPI za posledních 8 týdnů a investorským portfoliem
```

**Co ukázat:**
- Agent zavolá `queryWeeklyKPIs` + `getInvestorOverview` + `generatePresentation`
- Záložka **Zpráva** — odkaz na stažení PPTX + formulář pro odeslání emailem

**Co říct:**
> Agent shromáždil data, vygeneroval PPTX prezentaci s metrikovými kartami a tabulkami. Můžu si ji stáhnout nebo rovnou poslat emailem.

**Krok 2 — odeslání emailem:**

**Dotaz:**
```
Pošli tu prezentaci na investor@firma.cz
```

- Agent zavolá `sendPresentationEmail`
- Záložka **Email** — náhled konceptu emailu s přílohou
- Ukázat tlačítko **Schválit** (draft se uloží do Gmailu)

**Co říct:**
> Agent nikdy neposílá email automaticky — vytvoří koncept v Gmailu. Tady ho vidím, můžu upravit text a pak schválit. Lidská kontrola je vždy zachovaná.

**Krok 3 — CSV a PDF export:**

- V záložce **Data** ukázat tlačítka exportu (CSV, PDF) v pravém horním rohu
- Kliknout na **CSV** — stáhne se soubor
- Kliknout na **PDF** — vygeneruje se report

**Co říct:**
> Jakákoliv data v záložce Data jdou exportovat do CSV nebo PDF. Export je jedním kliknutím.

### 2.8 Správa dat přes UI (45 s)

**Co ukázat na /sprava:**

1. Záložka **Nemovitosti** — ukázat tabulku, řazení kliknutím na záhlaví, filtrování
2. Kliknout na **+ Nový záznam** — ukázat formulář pro vytvoření nemovitosti
3. Zavřít formulář
4. Záložka **Klienti** — přepnout, ukázat jiný typ dat
5. Záložka **Obchody** — přepnout, ukázat propojení obchod → nemovitost → klient
6. Záložka **Úkoly** — ukázat úkoly s prioritami a termíny

**Co říct:**
> Všechna data jdou spravovat i ručně přes toto rozhraní. Řazení, filtrování, vytváření i editace — bez nutnosti používat chat.

### 2.9 Automatizace na dashboardu (30 s)

**Co ukázat na /dashboard:**

1. Záložka **Ostatní automatizace** — ukázat konfiguraci týdenního executive reportu
2. Kliknout na **nastavení** (ozubené kolečko) — ukázat dialog s cronExpression, emailem, toggle active/paused
3. Ukázat historii běhů — tabulka s trigger (cron/manuální), status, počet slidů

**Co říct:**
> Na dashboardu můžu řídit všechny automatizace — monitoring, připomínkové hovory i týdenní reporty. Každá automatizace má konfiguraci cronu, email a historii běhů.

---

## ČÁST 3: Závěr (30 s)

**Co říct:**

> Shrnutí: 45 AI nástrojů, Google Kalendář, Gmail, SMS, hlasové hovory, scraping trhu, export do PPTX/PDF/CSV, automatické cron joby — a to celé v jednom chatovém okně v češtině.
>
> Agent nikdy nehallucinuje data, vždy sahá do databáze nebo volá API. Každý email je draft — nic se nepošle bez schválení. A vše jde ovládat přes chat i ručně přes UI.

---

## Checklist — nic nesmí chybět

| Funkce | Kde ve videu | Chat | UI |
|--------|-------------|------|-----|
| Ranní briefing / operativní zdraví | 2.1 | `Ranní briefing` | Logy tab |
| Rekonstrukce — auto-vytvoření při změně fáze | 2.2 | `Jak probíhají rekonstrukce?` | /sprava → editace nemovitosti → IN_RENOVATION |
| Detail rekonstrukce (fáze, rozpočet, úkoly) | 2.2 | — | /sprava/rekonstrukce/[id] |
| Plánování prohlídky + kalendář + SMS | 2.3 | `Naplánuj prohlídku...` | /sprava → Prohlídky |
| Zrušení prohlídky + SMS o zrušení | 2.3 | `Zruš tu prohlídku` | — |
| Voice agent — připomínkové hovory | 2.4 | — | /dashboard → Připomínkové hovory |
| Diktování hlasem | 2.5 | Mikrofon → česká řeč | — |
| Scraping trhu — vytvoření monitoringu | 2.6 | `Vytvoř monitoring...` | /dashboard → Monitoring → + Nový |
| Scraping — spuštění + výsledky | 2.6 | `Spusť monitoring` + `Analyzuj` | /dashboard → Play tlačítko |
| Scraping — ruční editace jobu | 2.6 | — | /dashboard → editace jobu |
| Export PPTX prezentace | 2.7 | `Připrav prezentaci...` | — |
| Odeslání prezentace emailem | 2.7 | `Pošli prezentaci na...` | Email tab → Schválit |
| CSV a PDF export | 2.7 | — | Data tab → Export tlačítka |
| Správa dat přes UI | 2.8 | — | /sprava (všechny záložky) |
| Ruční úpravy automatizací | 2.9 | — | /dashboard → nastavení |
| Automatický týdenní report | 2.9 | — | /dashboard → Ostatní automatizace |

---

## Tipy pro natáčení

1. **Připravit data předem** — spustit `npm run db:reset` pro čistá seed data
2. **Google účet** — mít přihlášený Google účet s Calendar a Gmail
3. **Twilio** — mít konfigurované Twilio pro skutečné SMS (nebo ukázat v logách)
4. **Velikost okna** — full HD (1920x1080), browser v plném okně
5. **Tempo** — nenechávat agenta dlouho přemýšlet, sestříhat čekání
6. **Záložky** — po každém dotazu ukázat relevantní záložku (Data, Graf, Logy)
7. **Dvojí ovládání** — vždy zdůraznit: "Toto jde udělat přes chat i ručně přes UI"
8. **Čeština** — mluvit česky, agent odpovídá česky, UI je v češtině

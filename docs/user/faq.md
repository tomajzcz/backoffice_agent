# Časté otázky (FAQ)

## Rozumí agent česky?

Ano. Celé rozhraní, systémový prompt i odpovědi agenta jsou v češtině. Agent rozumí přirozenému jazyku — nemusíte používat speciální příkazy.

## Posílá agent emaily automaticky?

**Ne.** Agent vždy vytvoří pouze koncept emailu, který se zobrazí v záložce Email. Vy si email přečtete, případně upravíte, a teprve po kliknutí na "Schválit" se uloží jako koncept v Gmailu. Odeslání je vždy na vás.

## Odkud jsou data?

Veškerá data pocházejí z reálných zdrojů:
- **Databáze** — PostgreSQL s daty o klientech, nemovitostech, obchodech, atd.
- **Google Kalendář** — skutečné události z vašeho kalendáře
- **Sreality.cz a Bezrealitky.cz** — skutečné nabídky z realitních portálů

Agent si **nikdy nevymýšlí data**. Pokud informace nemá, řekne to.

## Kolik nástrojů agent má?

Agent má 45 nástrojů v 8 kategoriích:
- Analytika (5) — KPI, trendy, reporty
- Operativní inteligence (8) — zdraví, ziskovost, dokumenty
- Google integrace (6) — kalendář a email
- Export (2) — PPTX a emailové přílohy
- Monitoring (4) — sledování trhu
- CRUD operace (15) — správa dat
- Rekonstrukce (3) — sledování stavebních prací
- Úkoly (2) — vytváření a detail úkolů

## Můžu upravit data i mimo chat?

Ano. Stránka **Správa** (`/sprava`) nabízí přímý přístup ke všem datům přes tabulky a formuláře. Odkaz najdete v levém panelu chatu.

## Jak funguje monitoring trhu?

Systém automaticky každý pracovní den v 5:00 ráno kontroluje:
- **sreality.cz** — přes jejich JSON API
- **bezrealitky.cz** — přes HTML scraping

Nové nabídky jsou uloženy, obodovány podle relevance a pokud je nastavena emailová notifikace, dostanete upozornění. Monitoring lze spustit i ručně přes chat ("Spusť monitoring teď").

## Jak fungují hlasové hovory?

Systém automaticky každý den v 5:00 ráno:
1. Najde prohlídky naplánované na tento den
2. Zavolá klientům s připomínkou (v češtině)
3. Zaznamená výsledek hovoru do logu

Hovory probíhají přes službu ElevenLabs. Přehled je na stránce Automatizace (`/dashboard`).

## Co když agent vrátí špatný výsledek?

- Zkontrolujte **panel transparentnosti** v záložce Odpověď — ukazuje, jaké nástroje byly použity a jaká data byla zpracována
- Zkuste dotaz formulovat konkrétněji — "klienti za Q1 2025" místo "ukaž klienty"
- Pokud se jedná o chybu v datech, upravte je přes stránku Správa

## Jaké jsou limity systému?

| Limit | Popis |
|-------|-------|
| **10 nástrojů na dotaz** | Složité dotazy mohou vyžadovat více kroků — v tom případě je rozdělit |
| **Časový limit** | Odpověď může trvat až 2 minuty u složitých dotazů |
| **Jeden kalendář** | Systém je připojen k jednomu Google účtu |
| **Scraper přesnost** | Nabídky na realitních portálech se mohou měnit, scraper nemusí vždy zachytit vše |
| **Stažení souborů** | PPTX a PDF se generují dočasně — stáhněte ihned po vytvoření |

## Jak interpretovat skóre zdraví?

Operativní zdraví a zdraví rekonstrukcí používají skóre **0–100**:

| Rozsah | Význam |
|--------|--------|
| 90–100 | Výborné — žádné významné problémy |
| 70–89 | Dobré — drobné problémy k řešení |
| 50–69 | Vyžaduje pozornost — několik oblastí potřebuje zásah |
| 0–49 | Kritické — okamžitá akce nutná |

Agent automaticky identifikuje a prioritizuje konkrétní problémy.

## Viz také

- [Jak to funguje](./how-it-works.md) — popis systému
- [Funkce](./features.md) — přehled funkcí
- [Co agent umí](./agent-capabilities.md) — schopnosti agenta

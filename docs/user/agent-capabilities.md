# Co agent umí

Agent má 45 nástrojů rozdělených do 8 kategorií. Zde je přehled podle typu dotazu.

## "Jaký je stav?" — Operativní přehled

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Jaký je stav operativy?" | Spustí kompletní audit — skóre 0–100, problémy, doporučení | Graf |
| "Jsou nějaké zpožděné úkoly?" | Najde úkoly po termínu a blížící se deadline | Data |
| "Jaký je stav rekonstrukcí?" | Přehled aktivních rekonstrukcí + zdraví skóre | Graf |
| "Chybí nám nějaké dokumenty?" | Zkontroluje povinné dokumenty u nemovitostí | Data |

## "Kolik máme...?" — Analytika

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Kolik máme nových klientů za Q1?" | Rozdělení po kvartálech a zdrojích akvizice | Graf |
| "Jak vypadá trend leadů a prodejů?" | Měsíční přehled konverze za posledních X měsíců | Graf |
| "Ukaž týdenní KPI" | 52 týdnů: leady, klienti, obchody, tržby | Graf |
| "Jaká je ziskovost nemovitostí?" | ROI analýza podle nemovitosti nebo městské části | Graf |
| "Které nemovitosti nemají data o rekonstrukci?" | Výpis nemovitostí s chybějícími údaji | Graf |

## "Ukaž mi..." — Data a seznamy

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Ukaž seznam nemovitostí" | Stránkovaný výpis s filtry | Data |
| "Ukaž klienty typu investor" | Filtrovaný výpis klientů | Data |
| "Ukaž leady se statusem nový" | Filtrovaný výpis leadů | Data |
| "Jaké máme obchody?" | Výpis obchodů se stavem | Data |
| "Ukaž prohlídky na tento týden" | Výpis prohlídek podle termínu | Data |
| "Detail nemovitosti #12" | Kompletní info: obchody, prohlídky, dokumenty | Data |
| "Přehled investorů" | Portfolio, investované částky | Data |
| "Detail rekonstrukce na Karlíně" | Fáze, rozpočet, dodavatel, blokátory | Data |

## "Naplánuj..." — Kalendář a prohlídky

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Kdy mám volno příští týden?" | Zobrazí volné sloty (9–18h, Po–Pá) | Graf |
| "Naplánuj prohlídku na úterý v 10:00" | Vytvoří prohlídku + Google Kalendář událost | Data |
| "Přesuň prohlídku na čtvrtek" | Aktualizuje prohlídku + kalendář | Data |
| "Zruš prohlídku #5" | Zruší prohlídku + smaže událost z kalendáře | Data |
| "Co mám v kalendáři tento týden?" | Výpis událostí | Data |

## "Napiš..." — Emaily

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Napiš email klientovi s pozvánkou na prohlídku" | Připraví draft s HTML obsahem | Email |
| "Pošli prezentaci na email" | Přiloží PPTX k emailu | Email |

Agent **nikdy neodešle email automaticky**. Vždy vytvoří koncept, který schválíte v záložce Email.

## "Připrav..." — Reporty a prezentace

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Připrav report pro vedení" | Markdown report z aktuálních dat | Zpráva |
| "Udělej prezentaci na 5 slidů" | PPTX ke stažení | Zpráva |
| "Exportuj data jako CSV" | CSV soubor ke stažení | Data |
| "Exportuj jako PDF" | PDF ke stažení | Zpráva |

## "Vytvoř..." — Nové záznamy

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Vytvoř nového klienta Jana Nováka" | Založí klienta s údaji | Data |
| "Přidej nemovitost na Vinohradech" | Založí nemovitost | Data |
| "Zaznamenej nový lead ze Sreality" | Založí lead | Data |
| "Vytvoř obchod na nemovitost #3" | Založí obchod | Data |
| "Vytvoř úkol: zkontrolovat dokumenty" | Založí úkol s prioritou | Data |

## "Co je na trhu?" — Monitoring

| Dotaz | Co agent udělá | Záložka |
|-------|---------------|---------|
| "Co je nového na trhu?" | Zobrazí výsledky monitoringu | Data |
| "Jaké jsou nové nabídky v Praze 2?" | Filtrované výsledky s bodováním | Data |
| "Ukaž monitorovací joby" | Seznam úloh a jejich stav | Data |
| "Spusť monitoring teď" | Manuální spuštění scraperu | Data |

## Jak agent řetězí nástroje

Agent dokáže v jednom dotazu použít až 10 nástrojů za sebou. Příklady:

**Jednoduchý dotaz** (1 nástroj):
> "Kolik máme klientů?" → `listClients` → tabulka

**Složený dotaz** (3–5 nástrojů):
> "Naplánuj prohlídku" → `getPropertyDetails` → `getCalendarAvailability` → `createShowing` → `createCalendarEvent` → `createGmailDraft`

**Ranní briefing** (3 nástroje):
> "Jaký je stav?" → `scanOperationalHealth` → `scanRenovationHealth` → `scanOverdueTasks` → souhrnná odpověď

## Limity

- Agent odpovídá pouze na základě dat z nástrojů — nikdy si nevymýšlí
- Maximálně 10 nástrojů na jeden dotaz
- Složité dotazy mohou trvat 10–30 sekund
- Emaily jsou vždy jen koncepty — odesílání je na vás

## Viz také

- [Funkce](./features.md) — přehled všech funkcí
- [Použití](./use-cases.md) — praktické scénáře krok za krokem
- [FAQ](./faq.md) — časté otázky

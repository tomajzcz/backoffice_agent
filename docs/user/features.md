# Funkce

## Analytika a reporty

- **Nový klienti** — přehled nových klientů po kvartálech, rozdělení podle zdroje akvizice (Sreality, Bezrealitky, doporučení, web, inzerce, LinkedIn)
- **Leady a prodeje** — měsíční trend konverze leadů na prodeje s grafem
- **Týdenní KPI** — 52 týdnů zpětně: nové leady, klienti, uzavřené obchody, tržby
- **Generování reportů** — markdown reporty z reálných dat, ke stažení jako PDF
- **Ziskovost nemovitostí** — ROI analýza podle nemovitosti nebo městské části

## Správa dat

Agent umí pracovat se všemi typy dat:

| Entita | Operace |
|--------|---------|
| Nemovitosti | Výpis, vytvoření, úprava (adresa, cena, stav, dispozice, fáze) |
| Klienti | Výpis, vytvoření, úprava (kontakt, segment, zdroj) |
| Leady | Výpis, vytvoření, úprava (stav, zdroj, zájem) |
| Obchody | Výpis, vytvoření, úprava (nemovitost, klient, hodnota, stav) |
| Prohlídky | Výpis, vytvoření, úprava (termín, stav, poznámky) |

Data lze spravovat přes chat i přes stránku Správa (`/sprava`).

## Google Kalendář

- **Dostupnost** — zobrazí volné sloty v pracovních hodinách (9–18h, Po–Pá)
- **Vytvoření události** — naplánuje prohlídku s automatickým zápisem do kalendáře
- **Úprava a zrušení** — změny se projeví i v Google Kalendáři
- **Seznam událostí** — přehled naplánovaných událostí v zadaném období

Při vytvoření prohlídky se automaticky vytvoří i odpovídající událost v Google Kalendáři.

## Email

- **Návrh emailu** — agent připraví email s předmětem a HTML obsahem
- **Kontrola před odesláním** — email se zobrazí v záložce Email ke schválení
- **Schválení** — email se uloží jako koncept v Gmailu
- **Prezentace emailem** — možnost poslat PPTX prezentaci jako přílohu

Agent **nikdy neodešle email automaticky** — vždy čeká na vaše schválení.

## Prezentace a export

- **PPTX prezentace** — 1–10 slidů z předpřipravených šablon (KPI, trendy, doporučení, akční plán)
- **PDF export** — reporty a tabulky ke stažení
- **CSV export** — data ke stažení pro Excel (s českou diakritikou)

Prezentace mají profesionální tmavý design odpovídající designu aplikace.

## Monitoring trhu

- **Automatické sledování** — scraping sreality.cz a bezrealitky.cz každý pracovní den v 5:00
- **Konfigurace** — filtry podle městské části, typu nemovitosti, ceny, dispozice, plochy
- **Bodování** — nové nabídky jsou hodnoceny podle relevance
- **Emailové notifikace** — upozornění na nové nabídky
- **Manuální spuštění** — možnost spustit monitoring kdykoliv přes chat

## Rekonstrukce

- **Aktivní rekonstrukce** — přehled podle fáze (plánování → bourání → hrubé práce → instalace → povrchy → dokončení)
- **Detail rekonstrukce** — fáze, rozpočet (plánovaný vs. skutečný), dodavatel, blokátory, úkoly
- **Zdraví rekonstrukcí** — skóre 0–100 s detekcí zpoždění a překročení rozpočtu

## Hlasové hovory

- **Automatické připomínky** — systém volá klientům den před plánovanou prohlídkou
- **České hovory** — volání probíhají v češtině přes ElevenLabs
- **Logy hovorů** — přehled na stránce Automatizace

## Operativní zdraví

- **Celkové skóre** — 0–100 bodů na základě analýzy všech oblastí
- **Detekce problémů** — zpožděné úkoly, stagnující nemovitosti, chybějící dokumenty
- **Ranní briefing** — kombinace zdraví operativy, rekonstrukcí a úkolů do jednoho přehledu

## Investoři

- **Přehled investorů** — portfolio, investované částky, propojení s klienty
- **Ziskovost** — ROI analýza investic podle nemovitostí a městských částí
- **Dokumenty** — kontrola kompletnosti dokumentace

## Úkoly

- **Vytvoření úkolu** — s prioritou, termínem, přiřazením a vazbou na nemovitost/obchod/rekonstrukci
- **Sledování termínů** — detekce zpožděných a blížících se úkolů
- **Správa** — přehled a úprava přes chat i stránku Správa

## Viz také

- [Jak to funguje](./how-it-works.md) — vysvětlení rozhraní
- [Použití](./use-cases.md) — praktické příklady
- [Co agent umí](./agent-capabilities.md) — podrobný přehled schopností

# Funkce systemu

## 1. Přehled

Back Office Agent je interní nástroj pro správu realitní kanceláře. Komunikace probíhá v češtině přes chatové rozhraní -- stačí napsat požadavek běžným jazykem a systém provede potřebnou akci.

Systém nabízí 45 specializovaných nástrojů rozdělených do 13 kategorií:

| Kategorie | Počet nástrojů | Popis |
|-----------|---------------|-------|
| Analytika | 6 | Přehled klientů, leadů, KPI, životního cyklu, rentability, investorů |
| Správa nemovitostí | 5 | Seznam, vytvoření, úprava, detail, dokumenty |
| Správa klientů | 3 | Seznam, vytvoření, úprava |
| Správa leadů | 3 | Seznam, vytvoření, úprava |
| Správa obchodů | 3 | Seznam, vytvoření, úprava |
| Správa prohlídek | 3 | Seznam, vytvoření, úprava (včetně kalendáře a SMS) |
| Google Kalendář | 5 | Dostupnost, vytvoření, úprava, smazání, seznam |
| Email a export | 3 | Gmail koncepty, PPTX prezentace, odeslání prezentace |
| Monitoring trhu | 5 | Úlohy, spuštění, výsledky, vytvoření úlohy, analýza nabídek |
| Rekonstrukce | 3 | Aktivní rekonstrukce, detail, sken zdraví |
| Kvalita dat | 4 | Chybějící data rekonstrukcí, chybějící dokumenty, operativní zdraví, zpožděné úkoly |
| Reporty a úkoly | 2 | Generování reportu, vytvoření úkolu |
| Analýza trhu | 1 | Analýza nových nabídek |

Všechny nástroje jsou dostupné přes chat. Není potřeba si pamatovat žádné příkazy -- stačí popsat, co potřebujete, a agent vybere správný nástroj automaticky.

---

## 2. Analytika a reporty

### Přehled nových klientů podle zdroje akvizice

Zobrazuje nové klienty rozdělené podle zdroje (Sreality, Bezrealitky, doporučení, web, inzerce, LinkedIn). Data jsou členěna po kvartálech a vizualizována grafem v záložce Graf.

Příklad: *"Ukaž mi nové klienty za poslední rok"*

### Časová osa leadů a prodejů

Měsíční trend ukazující, kolik leadů přišlo a kolik se konvertovalo na prodeje. Pomáhá sledovat konverzní poměr a sezónní výkyvy.

Příklad: *"Jak vypadá timeline leadů a prodejů?"*

### Týdenní KPI

Přehled klíčových ukazatelů za posledních 4 až 12 týdnů:

- Nové leady
- Noví klienti
- Uzavřené obchody
- Tržby

Data jsou zobrazena jako graf s trendem.

Příklad: *"Ukaž KPI za posledních 8 týdnů"*

### Přehled nemovitostí podle životního cyklu

Rozdělení nemovitostí podle fáze: nabídka, prohlížení, rezervace, prodáno, archivováno. Pomáhá identifikovat, kde se nemovitosti hromadí a kde je pipeline plynulá.

Příklad: *"Kolik nemovitostí máme v jednotlivých fázích?"*

### Výpočet rentability nemovitostí (ROI)

Analýza návratnosti investic podle konkrétní nemovitosti nebo městské části. Zahrnuje nákupní cenu, náklady na rekonstrukci a prodejní cenu.

Příklad: *"Spočítej rentabilitu nemovitostí v Praze 5"*

### Přehled investorských portfolií

Zobrazuje investory, jejich portfolia, investované částky a propojení s nemovitostmi.

Příklad: *"Ukaž přehled investorů a jejich portfolií"*

### Analýza nových nabídek na trhu

Vyhodnocení nových nabídek získaných monitoringem. Nabídky jsou bodovány podle relevance a filtrovány podle zadaných kritérií.

Příklad: *"Analyzuj nové nabídky z posledního monitoringu"*

---

## 3. Správa dat

Agent umí pracovat se všemi typy dat přímo přes chat. Stačí popsat, co chcete vytvořit, upravit nebo zobrazit.

| Entita | Operace |
|--------|---------|
| Nemovitosti | seznam, vytvoření, úprava, detail, dokumenty |
| Klienti | seznam, vytvoření, úprava |
| Leady | seznam, vytvoření, úprava |
| Obchody | seznam, vytvoření, úprava |
| Prohlídky | seznam, vytvoření, úprava (+ automatické propojení s kalendářem a SMS) |
| Úkoly | vytvoření, seznam |
| Rekonstrukce | přehled aktivních, detail, sken zdraví |

### Správa přes webové rozhraní

Kromě chatu je správa dat dostupná také přes stránku `/sprava`, která nabízí tabulkové zobrazení a formuláře pro editaci. Detail rekonstrukce je na stránce `/sprava/rekonstrukce/[id]`.

### Příklady příkazů

- *"Vytvoř nového klienta: Jan Novák, telefon 123456789, zdroj doporučení"*
- *"Ukaž všechny nemovitosti v Praze 3"*
- *"Změň stav leadu č. 5 na kvalifikovaný"*
- *"Přidej obchod na nemovitost Vinohradská 12 pro klienta Novák"*

---

## 4. Google Kalendář

Systém je propojený s Google Kalendářem a umožňuje správu událostí přímo přes chat.

### Zjištění volných termínů

Zobrazuje volné časové sloty v pracovní době (9:00--18:00, pondělí až pátek). Víkendy a obsazené časy jsou automaticky vyloučeny.

Příklad: *"Kdy mám volno příští týden?"*

### Vytvoření události

Vytvoří novou událost v Google Kalendáři. Při vytvoření prohlídky se událost vytvoří automaticky.

Příklad: *"Naplánuj prohlídku na čtvrtek v 10:00"*

### Úprava události

Změna času, data nebo popisu existující události. Změny se okamžitě projeví v Google Kalendáři.

Příklad: *"Přesuň prohlídku z čtvrtka na pátek"*

### Smazání události

Odstraní událost z Google Kalendáře.

Příklad: *"Zruš prohlídku na pátek"*

### Seznam událostí

Přehled všech naplánovaných událostí v zadaném období.

Příklad: *"Ukaž mi kalendář na příští týden"*

### Automatické propojení s prohlídkami

Když vytvoříte nebo upravíte prohlídku, systém automaticky vytvoří nebo aktualizuje odpovídající událost v Google Kalendáři. ID události je uloženo na záznamu prohlídky.

---

## 5. SMS potvrzení

Systém automaticky odesílá SMS zprávy při operacích s prohlídkami prostřednictvím služby Twilio.

### Automatické SMS při vytvoření prohlídky

Když agent vytvoří novou prohlídku, klient obdrží SMS s potvrzením obsahujícím:

- Adresu nemovitosti
- Datum a čas prohlídky

### SMS o zrušení

Pokud se status prohlídky změní na zrušenou, klient obdrží SMS s informací o zrušení.

### Technické detaily

- SMS jsou odesílány ve formátu E.164 (česká předvolba +420)
- Texty zpráv jsou v češtině
- Případné selhání odeslání SMS neblokuje samotnou operaci s prohlídkou -- chyba je zaznamenána a zobrazena v odpovědi

---

## 6. Email

### Vytvoření konceptu emailu v Gmailu

Agent připraví email s předmětem a HTML obsahem. Email se zobrazí v záložce Email v pravém panelu.

### Bezpečnost -- nikdy automatické odeslání

Agent nikdy neodešle email automaticky. Vždy vytvoří pouze koncept (draft) v Gmailu, který si můžete prohlédnout, upravit a až potom odeslat ručně.

### Možnost úpravy a schválení

V záložce Email vidíte návrh emailu a můžete ho schválit. Po schválení se uloží jako koncept v Gmailu.

### Podpora příloh

K emailu lze přiložit PPTX prezentaci -- například výsledky analýzy nebo týdenní report.

Příklad: *"Připrav email pro investora Nováka s přehledem jeho portfolia"*

---

## 7. Prezentace a export

### Generování PPTX prezentací

Systém vytváří profesionální prezentace o 1 až 10 slidech. K dispozici je sada připravených šablon:

- KPI metriky a trendy
- Přehled leadů a obchodů
- Stav rekonstrukcí
- Doporučení a akční plán

Prezentace mají tmavý design s metrikovými kartami a tabulkami.

### Stažení jako soubor

Po vygenerování je prezentace k dispozici ke stažení přímo z aplikace.

### Odeslání prezentace emailem

Prezentaci lze odeslat jako přílohu emailu přímo z chatu.

Příklad: *"Vygeneruj prezentaci s KPI za poslední měsíc a pošli ji emailem"*

### Export do PDF

Reporty a tabulky jsou ke stažení ve formátu PDF.

### Export do CSV

Data lze exportovat do CSV souboru pro další zpracování v Excelu. Export zachovává českou diakritiku.

---

## 8. Monitoring trhu

### Automatické scrapování

Systém automaticky sleduje nové nabídky na portálech:

- **Sreality.cz**
- **Bezrealitky.cz**

### Naplánované úlohy

Monitoring běží automaticky každý pracovní den (pondělí až pátek) v 5:00 ráno. Konfigurace je dostupná na stránce `/dashboard`.

### Skóre a hodnocení

Každá nová nabídka je ohodnocena skórem relevance podle zadaných kritérií (lokalita, typ nemovitosti, cena, dispozice, plocha).

### Deduplikace

Systém automaticky rozpozná duplicitní záznamy a nezakládá je znovu. Každá nabídka se v databázi objeví pouze jednou.

### Ruční spuštění monitoringu

Monitoring lze spustit kdykoliv ručně přes chat.

Příklad: *"Spusť monitoring trhu"*

### Správa monitorovacích úloh

Přes chat lze vytvořit novou monitorovací úlohu s vlastními filtry, zobrazit seznam existujících úloh nebo si nechat zobrazit výsledky.

Příklad: *"Vytvoř monitoring pro byty 2+kk v Praze 5 do 6 milionů"*

---

## 9. Rekonstrukce

### Přehled aktivních rekonstrukcí

Zobrazuje všechny probíhající rekonstrukce s aktuální fází, odhadem dokončení a stavem rozpočtu.

### Detail rekonstrukce s fázemi

Každá rekonstrukce prochází následujícími fázemi:

1. Plánování
2. Demolice (bourání)
3. Hrubá stavba
4. Instalace (elektřina, voda, topení)
5. Povrchy (podlahy, obklady, malby)
6. Dokončování (kuchyně, koupelny, dveře)
7. Předání
8. Hotovo

### Rozpočet

U každé rekonstrukce je sledován plánovaný a skutečný rozpočet. Systém upozorní na překročení rozpočtu.

### Indikace zpoždění

Systém detekuje, zda je rekonstrukce ve zpoždění vůči plánu, a označí ji příslušným indikátorem.

### Propojení s úkoly

Ke každé rekonstrukci mohou být přiřazeny úkoly s termíny a prioritami.

### Sken zdraví rekonstrukcí

Automatická analýza všech aktivních rekonstrukcí s hodnocením 0--100 bodů. Detekuje:

- Zpoždění vůči plánu
- Překročení rozpočtu
- Chybějící data
- Blokující problémy

### Webové rozhraní

Detail rekonstrukce je dostupný na stránce `/sprava/rekonstrukce/[id]` s vizuálním zobrazením fází, rozpočtu a úkolů.

---

## 10. Hlasové hovory

### Automatické připomínkové hovory

Systém automaticky volá klientům den před plánovanou prohlídkou. Hovor obsahuje informace o čase, místě a podrobnostech prohlídky.

### AI hlas

Hovory probíhají v češtině pomocí služby ElevenLabs, která generuje přirozeně znějící hlas.

### Denní spouštění

Hovory se spouštějí automaticky každý den v 5:00 ráno. Systém zkontroluje, které prohlídky jsou naplánovány na následující den, a pro každou z nich iniciuje hovor.

### Sledování stavu hovorů

Všechny hovory jsou logovány v tabulce CallLog. Přehled hovorů je dostupný na stránce `/dashboard` v sekci Automatizace.

---

## 11. Operativní zdraví

### Sken operativního zdraví

Komplexní analýza stavu kanceláře v šesti oblastech:

| Oblast | Co se kontroluje |
|--------|-----------------|
| Nemovitosti bez vlastníka | Nemovitosti, které nemají přiřazeného klienta nebo investora |
| Zpožděné úkoly | Úkoly po termínu splnění |
| Stagnující obchody | Obchody, které se dlouho nepohly v pipeline |
| Prohlídky bez následné akce | Prohlídky, po kterých nebylo nic podniknuto |
| Chybějící životní cyklus | Nemovitosti bez určené fáze |
| Chybějící data rekonstrukcí | Rekonstrukce s nekompletními údaji |

### Sken chybějících dokumentů

Kontroluje, zda mají nemovitosti všechny potřebné dokumenty (nabývací titul, energetický štítek, fotodokumentace apod.).

Příklad: *"Zkontroluj, jaké dokumenty chybí"*

### Skóre zdraví s doporučeními

Celkové skóre 0--100 bodů s konkrétními doporučeními, co napravit. Čím vyšší skóre, tím lepší stav kanceláře.

Příklad: *"Jak je na tom operativní zdraví?"*

---

## 12. Investoři

### Přehled investorských portfolií

Zobrazuje všechny investory a jejich nemovitostní portfolia -- kolik nemovitostí vlastní, v jakých lokalitách a v jakém stavu.

### Investované částky na nemovitost

U každé nemovitosti v portfoliu investora je evidována investovaná částka.

### Výpočet rentability (ROI)

Analýza návratnosti investic včetně nákupní ceny, nákladů na rekonstrukci a aktuální/prodejní ceny.

### Propojení investorů s klienty

Investoři jsou propojeni se záznamy klientů v systému, což umožňuje sledování komunikace a obchodních aktivit.

Příklad: *"Ukaž portfolio investora Horáčka včetně ROI"*

---

## 13. Úkoly

### Vytváření úkolů

Úkoly lze vytvářet s následujícími parametry:

- **Název a popis** -- co je třeba udělat
- **Priorita** -- nízká, střední, vysoká, urgentní
- **Termín** -- datum, do kdy má být úkol splněn
- **Propojení** -- vazba na nemovitost, obchod nebo rekonstrukci

Příklad: *"Vytvoř úkol: zkontrolovat stav podlah, priorita vysoká, termín pátek, nemovitost Vinohradská 12"*

### Stavy úkolů

Každý úkol má jeden ze stavů:

| Stav | Význam |
|------|--------|
| Otevřený | Úkol je zadaný, ale nikdo na něm nezačal pracovat |
| Probíhá | Někdo na úkolu aktivně pracuje |
| Hotový | Úkol je dokončený |
| Zrušený | Úkol byl zrušen a nebude se plnit |

### Sken zpožděných úkolů

Systém automaticky detekuje úkoly, které jsou po termínu splnění, a zobrazí je s upozorněním.

Příklad: *"Jsou nějaké zpožděné úkoly?"*

---

## 14. Automatické týdenní reporty

### Generování reportu

Každé pondělí v 9:00 (CEST) systém automaticky vygeneruje PPTX prezentaci s přehledem za uplynulý týden.

### Obsah reportu

Prezentace obsahuje 5 slidů:

1. Souhrn týdenního KPI (leady, klienti, obchody, tržby)
2. Trendy -- porovnání s předchozími týdny
3. Přehled nových leadů
4. Stav rekonstrukcí
5. Doporučení a další kroky

### Odeslání emailem

Report je automaticky odeslán na konfigurovanou emailovou adresu.

### Zapnutí a vypnutí

Automatické reporty lze zapnout nebo vypnout na stránce `/dashboard`.

---

## 15. Transparentnost (Logy)

### Metadata u každé odpovědi

Každá odpověď agenta obsahuje metadata, která ukazují:

- Které nástroje byly použity
- Z jakých datových zdrojů agent čerpal
- Kolik záznamů bylo zpracováno
- Jaké filtry byly aplikovány
- Zda byly výsledky omezeny (např. zobrazeno 10 z 50 záznamů)

### Záložka Logy

Metadata jsou zobrazena v záložce Logy v pravém panelu. Tato záložka umožňuje ověřit, že agent pracoval se správnými daty a použil očekávaný postup.

---

## 16. Viz také

- [Jak to funguje](./how-it-works.md) -- vysvětlení rozhraní a komunikace s agentem
- [Praktické příklady použití](./use-cases.md) -- scénáře z běžného provozu
- [Co agent umí](./agent-capabilities.md) -- podrobný přehled schopností a omezení
- [Často kladené otázky](./faq.md) -- odpovědi na běžné dotazy

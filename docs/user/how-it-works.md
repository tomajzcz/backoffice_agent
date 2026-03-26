# Jak systém funguje

## Co to je

Back Office Agent je AI asistent pro správu realitní kanceláře v Praze. Místo přepínání mezi tabulkami, e-mailem, kalendářem a realitními portály komunikujete s jedním chatem, který vše zvládne za vás.

## Rozvržení obrazovky

Aplikace má dvě části vedle sebe:

| Levý panel (Chat) | Pravý panel (Výsledky) |
|-------------------|----------------------|
| Textový vstup pro dotazy | 6 záložek s výsledky |
| Historie konverzace | Automaticky se přepíná podle typu odpovědi |
| Navrhované dotazy (na začátku) | Kontextový popis výsledku |
| Navigace na Správu a Dashboard | |

## Jak komunikovat s agentem

Pište česky, přirozeným jazykem. Agent rozumí kontextu a sám vybere správné nástroje.

**Příklady dobrých dotazů:**
- "Jaký je stav operativy?"
- "Kolik máme nových klientů tento kvartál?"
- "Naplánuj prohlídku bytu na Vinohradech na příští úterý"
- "Připrav prezentaci pro investory"
- "Co je nového na trhu v Praze 2?"
- "Vytvoř úkol: zkontrolovat stav rekonstrukce na Karlíně"

**Tipy:**
- Buďte konkrétní — "klienti za Q1 2025" je lepší než "ukaž mi klienty"
- Agent zvládá složité požadavky — "najdi volný termín, zapiš prohlídku a připrav email"
- Pokud odpověď není úplná, ptejte se dál — agent si pamatuje kontext konverzace

## Co se děje na pozadí

Když zadáte dotaz:

1. **Agent přijme vaši zprávu** a rozhodne, které nástroje potřebuje
2. **Spustí nástroje** — dotazy do databáze, Google Kalendáře, scraperů trhu
3. **Získá skutečná data** — nikdy si nic nevymýšlí
4. **Zpracuje výsledky** a vrátí je ve správném formátu
5. **Pravý panel se přepne** na příslušnou záložku

Celý proces trvá obvykle 3–15 sekund, v závislosti na složitosti dotazu.

## Záložky výsledků

| Záložka | Ikona | Co zobrazuje |
|---------|-------|-------------|
| **Odpověď** | 💬 | Textová odpověď agenta + panel transparentnosti (jaké nástroje byly použity) |
| **Data** | 📊 | Tabulky s daty — klienti, nemovitosti, leady, obchody, prohlídky |
| **Graf** | 📈 | Vizualizace — sloupcové a čárové grafy |
| **Zpráva** | 📄 | Reporty a prezentace — s možností stažení (PDF, PPTX) |
| **Email** | ✉️ | Návrhy emailů — ke schválení před odesláním |
| **Logy** | 📋 | Historie volání nástrojů — pro kontrolu, co agent dělal |

Záložky se přepínají automaticky, ale můžete na ně kliknout i ručně.

## Další stránky aplikace

### Správa dat (`/sprava`)

Přímý přístup k datům bez chatu. Devět záložek:

1. **Nemovitosti** — seznam, vytvoření, úprava nemovitostí
2. **Klienti** — správa klientů
3. **Leady** — sledování potenciálních klientů
4. **Obchody** — přehled obchodů a jejich stav
5. **Prohlídky** — plánované a dokončené prohlídky
6. **Úkoly** — úkoly s prioritou a termínem
7. **Investoři** — portfolio investorů
8. **Dokumenty** — dokumenty k nemovitostem
9. **Rekonstrukce** — přehled a řízení rekonstrukcí (s detailní stránkou)

Každá záložka má tabulku s řazením, stránkováním a možností editace.

#### Rekonstrukce — podrobně

Záložka Rekonstrukce zobrazuje tabulku všech rekonstrukcí s klíčovými sloupci: nemovitost, čtvrť, fáze, status, začátek, plánovaný konec, zpoždění, počet otevřených úkolů a počet úkolů po termínu. Řádky se vizuálně odliší — červeně pokud je rekonstrukce zpožděná, žlutě pokud má úkoly po termínu.

**Kliknutím na řádek** se otevře detailní stránka rekonstrukce (`/sprava/rekonstrukce/{id}`), která obsahuje:

**Hlavička:**
- Adresa nemovitosti, čtvrť, ID rekonstrukce, počet dní od zahájení
- Štítky: aktuální fáze, status, a "Zpožděno" pokud je po termínu

**Varování:**
- Systém automaticky zobrazuje varování podle stavu — rekonstrukce po termínu, překročený rozpočet, zpožděné úkoly, chybějící dodavatel, chybějící další krok

**Přehledová karta:**
- Datum zahájení a plánovaného dokončení
- Vlastník, dodavatel
- Další krok, blokátory (červeně)

**Rozpočet:**
- Plánovaný a skutečný rozpočet v CZK
- Ukazatel čerpání s barevnou škálou: zelená (< 80%), žlutá (80–100%), červená (> 100%)

**Fázový ukazatel:**
- Vizuální průběh 8 fází: Plánování → Bourání → Hrubé práce → Instalace → Povrchy → Dokončení → Předání → Hotovo
- Tlačítko "Další fáze →" pro posun do další fáze (pouze u aktivních rekonstrukcí)

**Úkoly:**
- Tabulka úkolů napojených na rekonstrukci (název, status, priorita, termín, zodpovědný)
- Úkoly po termínu jsou zvýrazněny červeně
- Tlačítko **"Přidat úkol"** — vytvoří nový úkol, který je automaticky propojen s touto rekonstrukcí i její nemovitostí

#### Propojení rekonstrukcí a úkolů

Úkoly (AgentTask) mají vazbu na tři typy entit — nemovitost, obchod, nebo rekonstrukci. Jde o polymorfní vazbu:

- Každý úkol může být navázán na **jednu rekonstrukci** přes `renovationId`
- Při vytvoření úkolu z detailu rekonstrukce se `renovationId` a `propertyId` nastaví automaticky
- Při smazání rekonstrukce se navázané úkoly neodstraní — pouze se odpojí (renovationId se nastaví na null)
- Agent v chatu dokáže vytvářet úkoly s vazbou na rekonstrukci (např. "Vytvoř úkol pro rekonstrukci na Karlíně: objednat materiál")
- V ranním briefingu agent kontroluje zpožděné úkoly u rekonstrukcí a zahrne je do přehledu

### Automatizace (`/dashboard`)

Stránka se dvěma záložkami pro automatizované procesy.

#### Monitoring trhu

Nastavené úlohy pro automatické sledování nových nabídek na sreality.cz a bezrealitky.cz. Každá úloha má:
- Název a popis
- Cron plán (výchozí: každý pracovní den v 5:00)
- Konfiguraci filtrů (městská část, typ nemovitosti, cenový rozsah, dispozice, plocha)
- Emailovou adresu pro notifikace

Záložka zobrazuje seznam úloh, jejich stav (aktivní/pozastaveno/chyba), datum posledního běhu a tlačítko pro manuální spuštění. Pod každou úlohou jsou výsledky — nalezené nabídky s cenou, lokalitou a odkazem na portál.

#### Připomínkové hovory

Systém automaticky volá klientům, kteří mají v daný den naplánovanou prohlídku. Cílem je připomenout jim termín a adresu.

**Jak to funguje krok za krokem:**

1. Každý den v **5:00 ráno UTC** (7:00 pražského času) se spustí Vercel cron job
2. Systém najde všechny prohlídky naplánované na tento den se stavem **SCHEDULED**
3. Pro každou prohlídku zkontroluje, zda klient již nebyl volán (ochrana proti duplicitám)
4. Normalizuje české telefonní číslo do mezinárodního formátu (+420...)
5. Zavolá klientovi přes **ElevenLabs Voice AI** — hovor probíhá v češtině
6. Hlasový agent sdělí klientovi:
   - jeho jméno
   - adresu nemovitosti
   - čas a datum prohlídky
7. Výsledek hovoru se zaznamená do logu

**Stavy hovorů:**

| Stav | Barva | Význam |
|------|-------|--------|
| **PENDING** | Žlutá | Hovor vytvořen, čeká na zahájení |
| **INITIATED** | Zelená | Hovor úspěšně zahájen přes ElevenLabs |
| **FAILED** | Červená | Hovor se nezdařil (chyba API, nedostupné číslo) |
| **NO_PHONE** | Šedá | Klient nemá telefonní číslo nebo ho nelze normalizovat |
| **SKIPPED** | Šedá | Klient byl již dnes volán (duplicita) |

**Tabulka logů zobrazuje:**
- Datum hovoru
- Jméno klienta
- Telefonní číslo (normalizované)
- Adresu nemovitosti
- Čas prohlídky
- Stav hovoru (s barevným štítkem)
- U selhání: důvod chyby

Hovory lze spustit i manuálně tlačítkem **"Spustit teď"** na stránce Automatizace — to je užitečné pro testování nebo pokud chcete hovory zahájit mimo obvyklý čas.

**Důležité:** Systém nikdy nevolá dvakrát pro stejnou prohlídku v jeden den. Pokud cron job nebo manuální spuštění proběhne opakovaně, existující hovory jsou přeskočeny.

## Hlasový vstup

Na pravé straně vstupního pole je tlačítko mikrofonu. Klikněte a mluvte česky — text se přepíše do pole. Funguje v prohlížečích Chrome a Edge.

## Panel transparentnosti

V záložce "Odpověď" je sekce, která ukazuje:
- **Použité nástroje** — které nástroje agent zavolal
- **Zdroje dat** — odkud data pocházejí (databáze, Google Calendar, apod.)
- **Počty záznamů** — kolik dat bylo zpracováno
- **Filtry** — jaké parametry byly použity

Toto slouží k ověření, že agent pracuje se správnými daty.

## Viz také

- [Funkce](./features.md) — přehled všech funkcí
- [Použití](./use-cases.md) — konkrétní scénáře krok za krokem
- [Co agent umí](./agent-capabilities.md) — schopnosti agenta

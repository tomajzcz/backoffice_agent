# Jak systém funguje

## 1. Co je Back Office Agent

Back Office Agent je AI asistent pro správu realitní kanceláře v Praze. Slouží jako centrální rozhraní, které spojuje databázi nemovitostí, klientů, obchodů, kalendář, email, monitoring trhu a další systémy do jednoho chatu.

**Kdo je Pepa:** Back office manažer, který denně řeší desítky operativních úkolů -- od plánování prohlídek přes přípravu reportů až po sledování stavu obchodů. Místo přepínání mezi tabulkami, emailem, kalendářem a realitními portály komunikuje s jedním AI asistentem, který vše zvládne za něj.

**Jak agent pomáhá:**

- Odpovídá na dotazy o stavu kanceláře, klientech, nemovitostech a obchodech
- Vytváří a upravuje záznamy v databázi (klienti, nemovitosti, prohlídky, úkoly)
- Generuje reporty, prezentace a exporty (PPTX, PDF, CSV)
- Komunikuje s klienty -- odesílá SMS potvrzení, připravuje emaily, spouští hlasové připomínky
- Plánuje události v Google Kalendáři
- Sleduje trh na realitních portálech (sreality.cz, bezrealitky.cz)

Agent má k dispozici 45 nástrojů ve 13 kategoriích a vždy odpovídá česky.

---

## 2. Rozložení obrazovky

Aplikace má split-screen rozložení -- dva panely vedle sebe, oba viditelné současně:

| Levý panel -- Chat | Pravý panel -- Výsledky |
|---------------------|--------------------------|
| Vstupní pole pro psaní dotazů | 6 záložek s výsledky (viz sekce 5) |
| Historie konverzace s agentem | Automatické přepínání záložek podle typu odpovědi |
| 8 navrhovaných dotazů (při prázdném chatu) | Tabulky, grafy, reporty, emaily |
| Tlačítko hlasového vstupu (mikrofon) | Možnost stažení exportů |
| Navigace na Správu dat a Dashboard | Panel transparentnosti (logy) |

Levý panel má šířku 400 px. Pravý panel zabírá zbytek obrazovky a přizpůsobuje se obsahu odpovědi.

---

## 3. Jak komunikovat s agentem

Pište česky, přirozeným jazykem. Agent rozumí kontextu a sám vybere správné nástroje pro splnění požadavku.

**Příklady dobrých dotazů:**

- "Jaký je stav operativy?"
- "Kolik máme aktivních klientů?"
- "Naplánuj prohlídku na Vinohradech na příští úterý v 10:00"
- "Připrav týdenní report"
- "Vytvoř email pro klienta Nováka s pozvánkou na prohlídku"
- "Co je nového na trhu v Praze 2?"
- "Ukaž graf leadů za poslední kvartál"
- "Zkontroluj stav rekonstrukce na Karlíně"

**Tipy pro lepší výsledky:**

- Buďte konkrétní -- "klienti za Q1 2025" je lepší než "ukaž mi klienty"
- Zmiňujte jména, data, adresy a čtvrti -- agent díky nim přesně najde správné záznamy
- Agent zvládá složené požadavky -- "najdi volný termín, zapiš prohlídku a pošli SMS klientovi"
- Pokud odpověď není úplná, ptejte se dál -- agent si pamatuje kontext celé konverzace

**Navrhované dotazy:** Při prázdném chatu se zobrazí 8 předpřipravených dotazů. Kliknutím na některý z nich se dotaz automaticky odešle agentovi. Slouží jako inspirace pro nové uživatele.

---

## 4. Co se děje na pozadí

Když zadáte dotaz, proběhne následující:

1. **Napíšete dotaz** -- zadáte text do vstupního pole (nebo použijete hlasový vstup) a odešlete
2. **Agent vybere relevantní nástroje** -- z 45 dostupných nástrojů automaticky zvolí ty, které odpovídají vašemu dotazu (např. dotaz o klientech aktivuje databázové nástroje, dotaz o kalendáři aktivuje Google Calendar nástroje)
3. **Nástroje provedou operace** -- spustí se dotazy do databáze, volání Google Kalendáře, scrapování realitních portálů nebo generování dokumentů
4. **Agent sestaví odpověď v češtině** -- zpracuje výsledky z nástrojů a formuluje srozumitelnou odpověď
5. **Výsledky se zobrazí v odpovídající záložce** -- pravý panel se automaticky přepne na záložku, která nejlépe odpovídá typu výsledku (tabulka, graf, report, email)

Celý proces trvá obvykle 3--15 sekund v závislosti na složitosti dotazu. Agent nikdy nevymýšlí data -- vždy pracuje se skutečnými záznamy z databáze a externích služeb.

---

## 5. Záložky výsledků

Pravý panel obsahuje 6 záložek. Agent automaticky přepne na tu správnou, ale můžete na libovolnou záložku kliknout i ručně.

| Záložka | Co zobrazuje | Kdy se aktivuje |
|---------|-------------|-----------------|
| **Odpověď** | Textová odpověď agenta s panelem transparentnosti | Vždy -- každá odpověď se zobrazí zde |
| **Data** | Tabulky, seznamy a detaily záznamů (klienti, nemovitosti, leady, obchody, prohlídky) | Při dotazech na data -- "ukaž klienty", "detail nemovitosti" |
| **Graf** | Sloupcové a čárové grafy s vizualizací dat | Při analytických dotazech -- "graf leadů", "timeline obchodů" |
| **Zpráva** | Markdown reporty, PPTX prezentace ke stažení | Při generování reportů -- "připrav týdenní report", "generuj prezentaci" |
| **Email** | Náhled emailového konceptu (předmět, příjemce, tělo) s možností schválení nebo úpravy | Při vytváření emailů -- "napiš email klientovi" |
| **Logy** | Transparentnost: jaké nástroje byly použity, z jakých zdrojů data pocházejí, kolik záznamů bylo nalezeno | Vždy dostupné -- pro kontrolu, co agent dělal |

---

## 6. Další stránky aplikace

Kromě hlavního chatu (stránka `/`) jsou k dispozici dvě další stránky:

### Správa dat (/sprava)

CRUD rozhraní pro přímou práci s daty bez použití chatu. Stránka obsahuje záložky pro jednotlivé entity:

| Záložka | Obsah |
|---------|-------|
| **Nemovitosti** | Seznam, vytvoření a úprava nemovitostí -- adresa, typ, cena, čtvrť, stav |
| **Klienti** | Správa klientů -- jméno, kontakt, typ (kupující/prodávající), stav |
| **Leady** | Sledování potenciálních klientů a jejich konverze |
| **Obchody** | Přehled obchodů, jejich stav a hodnota |
| **Prohlídky** | Plánované a dokončené prohlídky s vazbou na klienta a nemovitost |
| **Úkoly** | Úkoly s prioritou, termínem a zodpovědnou osobou |
| **Rekonstrukce** | Přehled a řízení rekonstrukcí |

Každá záložka nabízí tabulku s řazením podle sloupců, filtrováním a stránkováním. Záznamy lze vytvářet, upravovat i mazat přímo v rozhraní.

**Detail rekonstrukce (/sprava/rekonstrukce/[id])** -- kliknutím na řádek rekonstrukce se otevře podrobná stránka s:

- Časovou osou 8 fází (Plánování, Bourání, Hrubé práce, Instalace, Povrchy, Dokončení, Předání, Hotovo)
- Přehledem rozpočtu (plánovaný vs. skutečný) s barevným ukazatelem čerpání
- Seznamem napojených úkolů
- Varováními (překročený rozpočet, zpožděné úkoly, chybějící dodavatel)

### Automatizace (/dashboard)

Stránka pro správu automatizovaných procesů. Obsahuje následující sekce:

**Monitoring trhu** -- naplánované scrapovací úlohy, které automaticky sledují nové nabídky na sreality.cz a bezrealitky.cz. Každá úloha má konfiguraci filtrů (městská část, typ nemovitosti, cenový rozsah, dispozice, plocha) a emailovou adresu pro notifikace. Úlohy běží každý pracovní den v 5:00.

**Připomínkové hovory** -- logy denních hlasových připomínek klientům před prohlídkami. Systém automaticky volá přes ElevenLabs Voice AI v češtině a sděluje klientovi čas, datum a adresu prohlídky. Tabulka zobrazuje stav každého hovoru (zahájen, selhán, přeskočen).

**Týdenní reporty** -- historie automaticky generovaných prezentací s KPI a přehledy za uplynulý týden.

Automatizace lze spouštět i manuálně tlačítkem "Spustit teď" pro testování nebo mimo obvyklý čas.

---

## 7. Hlasový vstup

Na pravé straně vstupního pole je tlačítko mikrofonu.

1. Klikněte na ikonu mikrofonu
2. Mluvte česky -- systém rozpoznává průběžně
3. Text se automaticky přepíše do vstupního pole
4. Odešlete dotaz jako běžně (klávesa Enter nebo tlačítko odeslat)

Hlasový vstup podporuje průběžné rozpoznávání -- text se zobrazuje již během mluvení. Funguje v prohlížečích Chrome a Edge.

---

## 8. Panel transparentnosti (Logy)

Záložka Logy slouží k ověření, že agent pracuje se správnými daty. Při každé odpovědi zobrazuje:

| Informace | Popis |
|-----------|-------|
| **Použité nástroje** | Které z 45 nástrojů agent zavolal pro splnění dotazu |
| **Datové zdroje** | Odkud data pocházejí (databáze, Google Calendar, realitní portály) |
| **Počty záznamů** | Kolik záznamů bylo nalezeno a zpracováno |
| **Aplikované filtry** | Jaké parametry a podmínky byly použity při dotazování |
| **Omezení výsledku** | Zda byl výsledek zkrácen (např. zobrazeno 10 z 50 záznamů) |

Panel transparentnosti je dostupný u každé odpovědi agenta. Slouží ke kontrole, že agent hledal ve správných datech a použil správné filtry -- můžete tak ověřit spolehlivost každé odpovědi.

---

## 9. Viz také

- [Funkce](./features.md) -- přehled všech funkcí systému
- [Použití](./use-cases.md) -- konkrétní scénáře krok za krokem
- [Co agent umí](./agent-capabilities.md) -- kompletní přehled schopností agenta
- [Často kladené otázky](./faq.md) -- odpovědi na běžné dotazy

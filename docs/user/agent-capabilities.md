# Co agent umi -- Kompletni prirucka

## 1. Prehled

Agent ma k dispozici **45 specializovanych nastroju** rozdelenich do **12 kategorii**. Na kazdy dotaz muze pouzit az **5 nastroju v retezci** -- to znamena, ze i slozity pozadavek (napr. "najdi nemovitost, zjisti volny termin, naplanuj prohlidku a posli email") zvladne najednou.

Agent odpovida cesky. Analyzuje vas dotaz, automaticky vybere spravne nastroje a vysledky zobrazi ve spravne zalozce (Graf, Data, Zprava, Email, Logy).

| Kategorie | Pocet nastroju | K cemu slouzi |
|-----------|---------------|---------------|
| Jadro (CORE) | 2 | Generovani reportu, vytvareni ukolu |
| Analytika (ANALYTICS) | 6 | Statistiky klientu, leadu, KPI, rentabilita, investori |
| Kalendar (CALENDAR) | 5 | Volne terminy, udalosti, planovani |
| Email a export (EMAIL_EXPORT) | 3 | Koncepty emailu, prezentace, odeslani prezentace |
| Nemovitosti (CRUD_PROPERTIES) | 5 | Seznam, detail, dokumenty, vytvoreni, uprava |
| Klienti (CRUD_CLIENTS) | 3 | Seznam, vytvoreni, uprava |
| Leady (CRUD_LEADS) | 3 | Seznam, vytvoreni, uprava |
| Obchody (CRUD_DEALS) | 3 | Seznam, vytvoreni, uprava |
| Prohlidky (CRUD_SHOWINGS) | 3 | Seznam, vytvoreni, uprava |
| Monitoring (MONITORING) | 5 | Monitorovaci ulohy, scraping, analyza nabidek |
| Rekonstrukce (RENOVATION) | 3 | Prehled rekonstrukci, detail, zdravi audit |
| Kvalita dat (DATA_QUALITY) | 4 | Operativni zdravi, zpozdene ukoly, chybejici data |

---

## 2. "Jaky je stav?" -- Operativni prehled

Agent provede audit operativniho zdravi firmy. Ziska celkove skore (0--100 bodu), upozorni na problemy a doporuci dalsi kroky.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Jaky je stav operativy?" | Spusti kompletni audit -- skore, problemy, doporuceni | Graf |
| "Ranni briefing" | Operativni zdravi + rekonstrukce + zpozdene ukoly | Graf + Odpoved |
| "Co potrebuje pozornost?" | Scan problemu a kritickich polozek | Graf |
| "Jaky je stav rekonstrukci?" | Prehled aktivnich rekonstrukci, fazovani, zdravi skore | Graf |
| "Jsou nejake zpozdene ukoly?" | Ukoly po terminu a blizici se deadline | Data |
| "Chybi nam nejake dokumenty?" | Kontrola povinnych dokumentu u nemovitosti | Data |
| "Ktere nemovitosti nemaji data o rekonstrukci?" | Vypis nemovitosti s chybejicimi udaji | Graf |

**Jak to funguje v praxi:**
Kdyz reknete "ranni briefing", agent automaticky spusti az 3 nastroje za sebou -- nejdriv operativni zdravi, pak rekonstrukce, pak zpozdene ukoly -- a shrne vse do jedne odpovedi.

---

## 3. "Kolik mame...?" -- Analytika

Agent zpracovava data z databaze a vytvari grafy primo v aplikaci. Grafy se zobrazuji v zalozce Graf, cisla a tabulky v zalozce Data.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Kolik mame novych klientu?" | Rozdeleni podle zdroje akvizice a obdobi | Graf |
| "Kolik mame novych klientu za Q1?" | Rozdeleni po kvartalech a zdrojich | Graf |
| "Jak vypada trend leadu a prodeju?" | Mesicni prehled konverze | Graf |
| "Jak vypadaji KPI?" | Tydenni prehled: leady, klienti, obchody, trzby | Graf |
| "Jaka je rentabilita portfolia?" | ROI analyza podle nemovitosti nebo mestske casti | Graf |
| "Jaka je ziskovost nemovitosti na Zizkove?" | Detailni kalkulace profitability | Graf |
| "Prehled investoru" | Portfolia, investovane castky, navratnost | Data |
| "Jaky je stav pipeline?" | Nemovitosti podle faze zivotniho cyklu | Graf |

---

## 4. "Ukaz mi..." -- Data a seznamy

Agent nacte zaznamy z databaze a zobrazi je v tabulce. Podporuje filtrovani podle statusu, typu, lokality, ceny, data a dalsich parametru.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Ukaz mi vsechny byty na Vinohradech" | Filtrovany vypis nemovitosti podle lokality | Data |
| "Ukaz klienty typu investor" | Filtrovany vypis klientu | Data |
| "Ukaz leady se statusem novy" | Filtrovany vypis leadu | Data |
| "Jake jsou aktivni obchody?" | Vypis obchodu se stavem | Data |
| "Ukaz prohlidky na tento tyden" | Vypis prohlidek podle terminu | Data |
| "Detail nemovitosti #12" | Kompletni info: obchody, prohlidky, dokumenty | Data |
| "Jake ma nemovitost dokumenty?" | Seznam dokumentu k nemovitosti | Data |
| "Detail rekonstrukce na Karline" | Faze, rozpocet, dodavatel, blokatory | Data |
| "Prehled aktivnich rekonstrukci" | Vsechny bezici rekonstrukce s parametry | Data |

**Filtry, ktere muzete pouzit:**
- Nemovitosti: status, typ, dispozice, lokalita (mestska cast), cenovy rozsah
- Klienti: typ segmentu (investor, prvni kupujici, upgrader, downgrader, pronajimatel)
- Leady: status, zdroj, priorita
- Obchody: stav, faze
- Prohlidky: datum od/do, status, nemovitost

---

## 5. "Naplanuj..." -- Kalendar a prohlidky

Agent spolupracuje s Google Kalendarem. Zjisti volne terminy, vytvori prohlidku, synchronizuje s kalendarem a posle potvrzovaci SMS (pokud je nakonfigurovano Twilio).

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Kdy ma Pepa volno pristi tyden?" | Zobrazi volne sloty (9:00--18:00, Po--Pa) | Graf |
| "Naplanuj prohlidku na utery v 10:00" | Vytvori prohlidku + Google Kalendar udalost + SMS | Data |
| "Presun prohlidku na ctvrtek" | Aktualizuje prohlidku + kalendar | Data |
| "Zrus prohlidku #5" | Nastavi status na CANCELLED + smaze udalost z kalendare | Data |
| "Co mam v kalendari tento tyden?" | Vypis vsech udalosti | Data |

**Typicky workflow planovani prohlidky (az 5 kroku):**

1. Agent zjisti detail nemovitosti (adresa, dispozice)
2. Agent zkontroluje volne terminy v kalendari
3. Nabidne vam konkretni sloty
4. Po vasem vyberu vytvori prohlidku -- automaticky se vytvori udalost v Google Kalendari a odesle se SMS klientovi s adresou a casem
5. Potvrdi vytvoreni vcetne odkazu na udalost

Pracovni hodiny pro planovani: pondeli az patek, 9:00--18:00. Vikendy se preskakuji.

---

## 6. "Napis..." -- Emaily

Agent pripravi koncept emailu v Gmailu. **Nikdy neodesle email automaticky** -- vzdy zobrazi navrh v zalozce Email, kde jej muzete upravit, schvalit nebo zamitnout.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Napis email klientovi o nove nemovitosti" | Pripravi HTML koncept emailu | Email |
| "Posli pozvanku na prohlidku" | Pripravi koncept s detaily nemovitosti a terminem | Email |
| "Posli prezentaci na email" | Pripravi email s prilozenou PPTX prezentaci | Email |

**Jak to funguje:**
1. Agent si nejdriv zjisti potrebna data (detail nemovitosti, volne terminy)
2. Sestavi HTML email s konkretnimi udaji
3. Zobrazi navrh v zalozce Email
4. Vy email prectete, pripadne upravite
5. Po schvaleni se draft ulozi do Gmailu

---

## 7. "Priprav..." -- Reporty a prezentace

Agent generuje strukturovane reporty a prezentace z aktualnych dat.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Priprav tydenni report" | Markdown report z aktualnich dat | Zprava |
| "Vytvor prezentaci pro investory" | PPTX prezentace s grafy a metrikami (1--10 slidu) | Zprava |
| "Priprav report pro vedeni" | Strukturovany report s KPI a trendy | Zprava |
| "Exportuj jako PDF" | PDF ke stazeni z panelu | Zprava |

**Prezentace:** Agent generuje PPTX soubory s az 10 slidy. Prezentace obsahuji grafy, tabulky a klicove metriky. Vysledny soubor si stahnete primo z aplikace.

**Odeslani prezentace emailem:** Po vygenerovani prezentace muzete rict "Posli ji na email" a agent pripravi koncept emailu s prilozenou prezentaci.

---

## 8. "Vytvor..." -- Nove zaznamy

Agent vytvari nove zaznamy v databazi. Pokud mu neuvedete vsechna povinne pole, zepta se.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Vytvor noveho klienta Jan Novak" | Zalozi klienta s udaji | Data |
| "Zaloz lead pro byt na Zizkove" | Zalozi novy lead | Data |
| "Pridej nemovitost na Vinohradech" | Zalozi nemovitost | Data |
| "Vytvor obchod na nemovitost #3" | Zalozi obchod | Data |
| "Vytvor ukol: zkontrolovat dokumenty" | Zalozi ukol s prioritou a terminem | Data |

**Workflow pro upravu zaznamu:**
1. Agent nejdriv najde zaznam pres vyhledavani
2. Potvrdi s vami, ktery zaznam chcete upravit (ukaze ID a klicove udaje)
3. Provede zmenu
4. Potvrdi provedenou upravu

---

## 9. "Co je na trhu?" -- Monitoring

Agent pracuje s monitorovacim systemem, ktery sleduje nove nabidky na Sreality a Bezrealitky. Scraping probiha automaticky kazdy pracovni den v 5:00 rano.

| Dotaz | Co agent udela | Zalozka |
|-------|---------------|---------|
| "Co je noveho na trhu v Holesovicich?" | Zobrazi vysledky monitoringu s filtrovanim | Data |
| "Jake jsou nove nabidky?" | Prehled novych nabidek s bodovanim | Data |
| "Ukaz monitorovaci joby" | Seznam uloh a jejich stav | Data |
| "Spust monitoring Zizkov" | Rucni spusteni scraperu | Data |
| "Vytvor novy monitorovaci job pro Prahu 3" | Zalozi novou monitorovaci ulohu | Data |
| "Analyzuj nove nabidky" | Prioritizace a hodnoceni nabidek | Data |

---

## 10. Jak agent retezi nastroje

Agent dokaze v jednom dotazu pouzit az 5 nastroju za sebou. Cim slozitejsi pozadavek, tim vice kroku agent provede.

**Jednoduchy dotaz (1 krok):**

```
"Kolik mame klientu?"
  -> listClients
  -> Zalozka: Data
```

**Slozeny dotaz (3 kroky):**

```
"Ranni briefing"
  -> scanOperationalHealth
  -> scanRenovationHealth
  -> scanOverdueTasks
  -> Zalozka: Graf + Odpoved
```

**Kompletni workflow (5 kroku):**

```
"Naplanuj prohlidku a posli pozvanku"
  -> getPropertyDetails (zjisti adresu a detaily)
  -> getCalendarAvailability (zjisti volne terminy)
  -> createShowing (vytvori prohlidku + kalendar + SMS)
  -> createGmailDraft (pripravi email s pozvankou)
  -> Zalozka: Data + Email
```

**Investor reporting (4 kroky):**

```
"Priprav prehled pro investora Novaka"
  -> getInvestorOverview (portfolio a castky)
  -> calculatePropertyProfitability (ziskovost)
  -> generateReport (strukturovany report)
  -> Zalozka: Zprava
```

---

## 11. Jak agent vybira nastroje

Agent analyzuje vas dotaz a hleda ceska klicova slova. Na jejich zaklade vybere relevantni skupinu nastroju.

| Klicove slovo v dotazu | Aktivovane skupiny nastroju |
|------------------------|---------------------------|
| klient, klienty, klientu | Sprava klientu + Analytika |
| nemovitost, byt, adresa | Sprava nemovitosti + Analytika |
| lead, leady | Sprava leadu + Analytika |
| obchod, deal, prodej, trzba | Sprava obchodu + Analytika |
| prohlidka, SMS | Sprava prohlidek + Kalendar |
| kalendar, termin, schuzka | Kalendar |
| email, mail, draft | Email a export |
| prezentace, PPTX | Email a export + Analytika |
| report, zprava, prehled, PDF | Jadro + Analytika |
| monitoring, nabidka, Sreality, Bezrealitky | Monitoring |
| rekonstrukce, renovace, oprava, stavba | Rekonstrukce |
| briefing, ranni, stav, zdravi, audit | Kvalita dat + Rekonstrukce + Analytika |
| ukol, task | Jadro + Kvalita dat |
| investor, portfolio, ROI, zisk | Analytika |
| KPI, tyden, mesic, kvartal | Analytika |
| vytvor, pridej, uprav, aktualizuj | Vsechny CRUD skupiny |

Skupina **Jadro** (generateReport, createAgentTask) je vzdy k dispozici u kazdeho dotazu.

Pokud agent zadne klicove slovo v dotazu nenajde, pouzije vsech 45 nastroju -- takze i neobvykly dotaz dostane odpoved.

---

## 12. Limity a omezeni

| Omezeni | Detail |
|---------|--------|
| Maximalne 5 nastroju na dotaz | Slozity pozadavek muze vyzadovat rozdeleni do vice dotazu |
| Emaily jsou vzdy jen koncepty | Agent nikdy neposila email automaticky -- vzdy ceka na vase schvaleni |
| SMS vyzaduje Twilio | Potvrzovaci SMS se odesle jen pokud je nakonfigurovano Twilio |
| Kalendar vyzaduje Google ucet | Planovani do kalendare funguje jen s pripojenym Google uctem |
| Data z databaze | Agent pracuje s daty v databazi, ne s zivymi zdroji (krome monitoringu) |
| Financni vypocty jsou zjednodusene | ROI a ziskovost pocitaji zakladnim vzorcem (prijem - naklady) |
| Agent si nevymysli data | Vsechna cisla, jmena a datumy pochazi z nastroju -- nikdy z fantazie |
| Slozite dotazy mohou trvat dele | Dotaz s 5 kroky muze trvat 10--30 sekund |

---

## 13. Viz take

- [Jak to funguje](./how-it-works.md) -- technicka architektura a tok dat
- [Prakticke scenare](./use-cases.md) -- scenare pouziti krok za krokem
- [Prehled funkci](./features.md) -- prehled vsech funkci aplikace
- [Caste otazky](./faq.md) -- odpovedi na nejcastejsi dotazy

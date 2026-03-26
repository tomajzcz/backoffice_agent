# Praktické scenaře -- krok za krokem

## 1. Uvod

Tento dokument obsahuje 8 praktickych scenaru, ktere ukazuji, jak s agentem pracovat v beznem provozu. Kazdy scenar popisuje konkretni situaci, presny dotaz, co agent udela a kde najdete vysledek. Scenare pokryvaji kazdodenni operativu -- od ranniho briefingu pres planovani prohlidek az po spravu dat.

---

## 2. Scenar 1: Ranni briefing

**Situace**: Pepa zacina pracovni den a potrebuje rychly prehled stavu operativy.

**Dotaz**: "Jaky je stav operativy?"

**Co se stane**:

1. Agent provede scan operativniho zdravi -- vyhodnoti celkove skore na stupnici 0--100.
2. Zkontroluje stav rekonstrukci -- hleda zpozdeni, prekroceni rozpoctu, aktivni blokatory.
3. Najde zpozdene ukoly a ukoly s blizicim se terminem.
4. Zobrazi souhrnne skore s rozpisem kategorii a prioritizovanymi doporucenimi.

**Vysledek**:

- Zalozka **Graf**: celkove skore zdravi s rozpisem podle kategorii (rekonstrukce, pipeline, ukoly).
- Zalozka **Odpoved**: textovy souhrn s konkretnimi doporucenimi, na co se zamerit.

**Priklad odpovedi agenta**:
> Operativni zdravi: 72/100. Hlavni problemy: 3 nemovitosti stagnuji v pipeline dele nez 30 dni, 2 rekonstrukce maji zpozdeni, 5 ukolu je po terminu. Doporucuji se zamerit na nemovitost na Vinohradech -- je ve fazi akvizice uz 45 dni.

---

## 3. Scenar 2: Priprava na schuzku s investorem

**Situace**: Pepa ma odpoledne schuzku s investorem a potrebuje podklady o portfoliu.

**Dotaz**: "Priprav prehled portfolia pro investory"

**Co se stane**:

1. Agent nacte prehled investoru a jejich portfolii -- ktere nemovitosti vlastni a kolik investovali.
2. Spocita rentabilitu jednotlivych nemovitosti (ROI, prijem vs. naklady).
3. Zobrazi data v prehledne tabulce a doplni grafem pro vizualni srovnani.

**Vysledek**:

- Zalozka **Data**: tabulka investoru s portfoliem, investovanymi castkami a rentabilitou.
- Zalozka **Graf**: sloupcovy ci kolacovy graf s porovnanim vykonnosti nemovitosti.

**Navazujici kroky** (volitelne):
- "Udel z toho prezentaci na 5 slidu" -- agent vygeneruje PPTX ke stazeni.
- "Posli prezentaci na jan.investor@email.cz" -- agent pripravi email s prilohou ke schvaleni.

---

## 4. Scenar 3: Naplanovani prohlidky

**Situace**: Klient Jan Novak chce videt byt na Vinohradske 15.

**Dotaz**: "Naplanuj prohlidku bytu na Vinohradske 15 pro Jana Novaka na utery v 14:00"

**Co se stane**:

1. Agent najde detail nemovitosti na Vinohradske 15 v databazi.
2. Zkontroluje dostupnost v Google Kalendari -- overi, ze v pozadovanem case neni jina udalost.
3. Vytvori zaznam prohlidky v databazi s propojenim na nemovitost a klienta.
4. Prida udalost do Google Kalendare s adresou a udaji o klientovi.
5. Odesle SMS potvrzeni klientovi na jeho telefonni cislo z databaze.
6. Rano v den prohlidky system automaticky provede pripominkovy hovor klientovi (pokud je aktivovano).

**Vysledek**:

- Zalozka **Data**: kompletni detail vytvorene prohlidky -- datum, cas, nemovitost, klient, stav.

**Dobre vedet**: SMS se posila automaticky pri vytvoreni prohlidky. Pokud by odeslani SMS selhalo (napr. chybne cislo), prohlidka se vytvori normalne a v odpovedi agent upozorni na problem s SMS.

---

## 5. Scenar 4: Kontrola rekonstrukce

**Situace**: Pepa chce vedet, jak pokracuji aktivni rekonstrukce a jestli neco nevyzaduje zasah.

**Dotaz**: "Jak probihaji rekonstrukce?"

**Co se stane**:

1. Agent nacte vsechny aktivni rekonstrukce z databaze.
2. Zkontroluje zdravi rekonstrukci -- porovnava planovanou a skutecnou casovou osu, rozpocet a blokatory.
3. Zobrazi seznam rekonstrukci s aktualni fazi, stavem rozpoctu a identifikovanymi problemy.

**Vysledek**:

- Zalozka **Graf**: prehledovy graf zdravi rekonstrukci (skore podle projektu).
- Zalozka **Data**: tabulka s detaily -- nazev, faze, planovany vs. skutecny rozpocet, zpozdeni.

**Co agent detekuje automaticky**:
- Prekroceni planovaneho rozpoctu.
- Zpozdeni oproti planovane casove ose.
- Aktivni blokatory (cekani na material, stavebni povoleni, dodavatele).

**Poznamka**: Pro kompletni detail konkretni rekonstrukce vcetne casove osy fazi prejdete na stranku `/sprava/rekonstrukce/[id]` -- napriklad `/sprava/rekonstrukce/5`. Na teto strance najdete rozepsane jednotlive faze, milniky a fotodokumentaci.

---

## 6. Scenar 5: Analyza novych nabidek na trhu

**Situace**: Pepa chce vedet, co noveho se objevilo na realitnim trhu v konkretni lokalite.

**Dotaz**: "Co je noveho na trhu v Holesovicich?"

**Co se stane**:

1. Agent najde monitorovaci ulohy nastavene pro danou lokalitu (Holesovice).
2. Nacte vysledky posledniho behu monitoringu -- data ze stranek sreality.cz a bezrealitky.cz.
3. Analyzuje nove nabidky -- u kazde uvede cenu, dispozici, plochu, lokalitu a relevancni skore.

**Vysledek**:

- Zalozka **Data**: seznam nabidek s cenou, lokalitou, dispozici, plochou a skore relevance.

**Jak monitoring funguje na pozadi**:
- Automaticky bezi kazdy pracovni den v 5:00 rano.
- Prochazi sreality.cz a bezrealitky.cz.
- Filtruje podle nastavenych kriterii (lokalita, cenove rozpeti, typ nemovitosti).
- Nove nabidky jsou ulozeny do databaze a deduplikovany (stejna nabidka se nezobrazi dvakrat).

---

## 7. Scenar 6: Tydenni KPI report

**Situace**: Pepa potrebuje pripravit tydenni prehled klicovych metrik pro vedeni firmy.

**Dotaz**: "Jak vypadaji KPI za poslednich 8 tydnu?"

**Co se stane**:

1. Agent nacte tydenni metriky za pozadovane obdobi -- pocet novych leadu, pocet novych klientu, pocet uzavrenych obchodu, celkove trzby.
2. Zobrazi trend v grafu -- je videt vyvoj jednotlivych metrik v case.
3. V textove odpovedi shrne klicova cisla a nabidne moznost generovat prezentaci.

**Vysledek**:

- Zalozka **Graf**: spojnicovy graf s KPI trendy za poslednich 8 tydnu.
- Zalozka **Odpoved**: textovy souhrn klicovych cisel a trendu.

**Navazujici kroky** (volitelne):
- "Priprav z toho report" -- agent vygeneruje Markdown report s klicovymi metrikami.
- "Exportuj jako prezentaci" -- agent vytvori PPTX ke stazeni.

---

## 8. Scenar 7: Sprava dat mimo chat

**Situace**: Pepa potrebuje rychle upravit nekolik zaznamu, prohlednout si data v tabulce nebo zalozit novy zaznam -- a nechce psat do chatu.

**Popis**: Pro tyto ucely slouzi stranka `/sprava`, kterou najdete v navigaci aplikace.

**Jak stranku pouzit**:

1. **Prepnuti na entitu**: V horni casti stranky jsou zalozky -- Nemovitosti, Klienti, Leady, Obchody, Prohlidky. Kliknete na tu, se kterou chcete pracovat.

2. **Razeni podle sloupce**: Kliknete na zahlavi libovolneho sloupce v tabulce. Prvni kliknuti seradi vzestupne, druhe sestupne.

3. **Filtrovani podle statusu**: U nekterych entit (napr. Nemovitosti, Leady) muzete filtrovat podle stavu -- zobrazit napr. pouze aktivni nemovitosti nebo rozpracovane leady.

4. **Vytvoreni noveho zaznamu**: Kliknete na tlacitko pro vytvoreni noveho zaznamu. Otevre se formular, kde vyplnite potrebne udaje a ulozite.

5. **Uprava existujiciho zaznamu**: U kazdeho radku v tabulce najdete ikonu pro upravu. Po kliknuti se otevre formular s predvyplnenymi daty -- upravte co potrebujete a ulozte.

6. **Detail rekonstrukce**: Pro rekonstrukce existuje specialni detailni stranka na `/sprava/rekonstrukce/[id]`. Najdete tam casovou osu fazi, rozpocet, stav a dalsi informace.

**Tabulky podporuji**:
- Razeni podle libovolneho sloupce.
- Strankovani (tabulka se nezahltí, i kdyz je zaznamu hodne).
- Barevne stitky pro stavy a typy (napr. zelena = aktivni, cervena = zruseno).
- Formatovani men (CZK), dat a ciselnych hodnot.

---

## 9. Scenar 8: Vytvoreni a sledovani ukolu

**Situace**: Pepa si chce zapsat ukol, ktery nesmi zapomenout -- napriklad zkontrolovat dokumenty pro konkretni nemovitost.

**Dotaz**: "Vytvor ukol: Zkontrolovat dokumenty pro Vinohradskou 15, priorita vysoka, do patku"

**Co se stane**:

1. Agent vytvori ukol v databazi s nazvem "Zkontrolovat dokumenty pro Vinohradskou 15".
2. Propoji ukol s prislusnou nemovitosti (Vinohradska 15), pokud ji najde v databazi.
3. Nastavi prioritu na "vysoka" a termin splneni na nejblizsi patek.

**Vysledek**:

- Zalozka **Odpoved**: potvrzeni o vytvoreni ukolu s detaily (nazev, priorita, termin, vazba na nemovitost).

**Dobre vedet**: Pri pristim rannim briefingu (scenar 1) bude tento ukol automaticky zahrnut v prehledu operativniho zdravi. Pokud se blizi jeho termin nebo je po terminu, agent na nej upozorni.

---

## 10. Viz take

- [Jak to funguje](./how-it-works.md) -- popis rozhrani a zakladni orientace v aplikaci
- [Funkce](./features.md) -- kompletni prehled vsech funkci systemu
- [Co agent umi](./agent-capabilities.md) -- detailni prehled schopnosti agenta
- [Caste dotazy](./faq.md) -- odpovedi na nejcastejsi otazky

# Caste otazky (FAQ)

## 1. Rozumi agent cesky?

Ano, agent je navrzen pro komunikaci v cestine. Systemovy prompt, klicova slova pro vyber nastroju i odpovedi jsou v cestine. Muzete psat prirozenym jazykem -- neni treba pouzivat zadne specialni prikazy ani anglicke vyrazy.

## 2. Posila agent emaily automaticky?

Ne, nikdy. Agent vytvari pouze koncepty (drafty) v Gmailu. Kazdy email si muzete prohlednout, upravit a schvalit v zalozce Email. Bez vaseho schvaleni se nic neodesle. Toto je zamerne bezpecnostni opatreni -- agent nema opravneni odesilat zpravy vasim jmenem.

## 3. Odkud jsou data?

Data pochazi z PostgreSQL databaze, ktera obsahuje informace o nemovitostech, klientech, leadech, obchodech, prohlidkach, ukolech a rekonstrukcich. Monitorovaci data pochazi z pravidelneho scrapovani Sreality.cz a Bezrealitky.cz.

Data nejsou ziva v realnem case -- aktualizuji se pri kazde operaci (vytvoreni, uprava, smazani) nebo pri behu cron uloh. Agent si nikdy nevymysli data. Pokud informaci nema, rekne to.

## 4. Kolik nastroju agent ma?

Agent disponuje 45 specializovanymi nastroji rozdelenymi do 13 kategorii:

- **Analytika** (5) -- KPI, trendy, reporty, kvalita dat, generovani reportu
- **Sprava dat** (16) -- vytvareni, uprava a prohlizeni nemovitosti, klientu, leadu, obchodu a prohlidek
- **Google integrace** (6) -- kalendar (vytvareni, uprava, mazani, dostupnost) a email (koncepty)
- **Export** (2) -- PPTX prezentace a emailove prilohy
- **Monitoring trhu** (4) -- sledovani nabidek na realitnich portalech
- **Rekonstrukce** -- sledovani stavebniho provedu
- **Ukoly** -- vytvareni a detail ukolu
- **Investori** -- analyza investicnich prilezitosti
- **Kvalita dat** -- skenovani chybejicich a nekonzistentnich udaju

Na jeden dotaz muze agent pouzit az 5 nastroju. Pokud je operace slozitejsi, rozdelete dotaz do vice zprav.

## 5. Mohu upravit data i mimo chat?

Ano. Stranka Sprava dat (`/sprava`) nabizi plne CRUD rozhrani pro vsechny entity -- nemovitosti, klienty, leady, obchody, prohlidky a dalsi. Muzete vytvaret, upravovat a prohlizet zaznamy bez pouziti chatu.

Odkaz na stranku Sprava najdete v navigaci aplikace. Zmeny provedene na teto strance se okamzite projevi i v datech, se kterymi agent pracuje.

## 6. Jak funguje monitoring trhu?

System automaticky scrapuje Sreality.cz a Bezrealitky.cz v pracovni dny v 5:00 rano. Vysledky jsou duplikovany a ohodnoceny skore relevance.

Muzete se agenta zeptat napriklad "Co je noveho na trhu?" nebo "Ukaz posledni monitorovaci vysledky". Vysledky si take muzete prohlednout na strance Dashboard (`/dashboard`), kde najdete prehled monitorovacich uloh a jejich vysledku.

Monitoring lze spustit i rucne pres chat prikazem "Spust monitoring ted".

## 7. Jak funguji hlasove hovory?

Kazdy den v 5:00 rano system automaticky zkontroluje naplanovane prohlidky. Pro kazdou prohlidku s klientem, ktery ma telefonni cislo, provede AI hlasovy hovor (sluzba ElevenLabs) s pripominkou. Hovor obsahuje:

- Adresu nemovitosti
- Cas prohlidky
- Jmeno klienta

Hovory probiaji v cestine. Stav hovoru (uskutecneny, neuspesny, nedostupny) je sledovan v databazi. Prehled najdete na strance Dashboard (`/dashboard`) v sekci Automatizace.

## 8. Jak funguji SMS potvrzeni?

Pri vytvoreni prohlidky pres agenta se automaticky odesle SMS potvrzeni klientovi. Zprava obsahuje adresu nemovitosti a cas prohlidky. Pri zruseni prohlidky se odesle SMS o zruseni.

SMS se posilaji pres sluzbu Twilio. Pokud Twilio neni nakonfigurovano (chybi pristupove udaje), SMS se preskoci a agent o tom informuje ve sve odpovedi. Selhani SMS nikdy neblokuje samotne vytvoreni nebo zruseni prohlidky.

## 9. Co delat, kdyz agent vrati spatny vysledek?

Pokud odpoved agenta neni spravna nebo uplna, zkuste nasledujici:

- **Budte konkretnejsi v dotazu** -- pridejte jmena, data, lokality. Napriklad misto "ukaz klienty" zkuste "ukaz klienty z Prahy 5 za rok 2025".
- **Zkontrolujte zalozku Logy** -- uvidite jake nastroje agent pouzil, jaka data nacetl a jak je zpracoval. To vam pomuze pochopit, proc odpoved vypada tak, jak vypada.
- **Overte data na strance Sprava dat** (`/sprava`) -- je mozne, ze zdrojova data obsahuji chybu nebo nejsou aktualni.
- **Preformulujte dotaz** -- nekdy staci polozit otazku jinak, aby agent zvolil vhodnejsi nastroj.

## 10. Jake jsou limity systemu?

- **Maximalne 5 nastroju na jeden dotaz** -- slozitejsi operace mohou vyzadovat vice zprav.
- **Emaily se nikdy neposilaji automaticky** -- vzdy jen koncepty ke schvaleni.
- **SMS vyzaduje konfiguraci Twilio** -- bez pristupovych udaju se SMS neodeslou.
- **Kalendar vyzaduje pripojeni Google uctu** -- bez autorizace nejsou kalendarni funkce dostupne.
- **Data nejsou v realnem case** -- aktualizuji se pri operacich a behu cron uloh.
- **Financni vypocty jsou zjednodusene** -- zakladni ROI, bez DCF a slozitejsich modelu.
- **System nema prihlaseni** -- predpoklada duveryhodne vnitrni prostredi bez autentizace.
- **Historie konverzace se uchovava pouze po dobu relace** -- po obnoveni stranky se historie smaze.
- **Casovy limit** -- odpoved muze trvat az 2 minuty u slozitych dotazu.
- **Stazeni souboru** -- PPTX a PDF se generuji docasne, stahnete je ihned po vytvoreni.

## 11. Jak interpretovat skore zdravi?

### Operativni zdravi

Agent vyhodnoti 6 kategorii: chybejici vlastnici, zpozdene ukoly, stagnujici obchody, prohlidky bez nasledne akce, chybejici zivotni cyklus a chybejici renovacni data. Kazda kategorie prispiva k celkovemu skore na skale 0--100.

| Rozsah | Vyznam |
|--------|--------|
| 90--100 | Vyborne -- zadne vyznamne problemy |
| 70--89 | Dobre -- drobne problemy k reseni |
| 50--69 | Vyzaduje pozornost -- nekolik oblasti potrebuje zasah |
| 0--49 | Kriticke -- okamzita akce nutna |

Doporuceni jsou serazena podle priority. Agent automaticky identifikuje konkretni problemy a navrne kroky k naprave.

### Zdravi rekonstrukci

Hodnoti se zpozdene faze, prekroceny rozpocet a blokatory. Barevne indikatory:

- **Zelena** -- v poradku, vse bezi podle planu
- **Zluta** -- pozor, drobne odchylky nebo blizici se terminy
- **Cervena** -- problem, vyzaduje okamzity zasah

## 12. Jak funguje automaticky tydenni report?

Kazde pondeli v 9:00 (CEST) system automaticky provede nasledujici kroky:

1. Shromazdi KPI za poslednich 12 tydnu
2. Nacte trend leadu a prodeju za 6 mesicu
3. Zkontroluje stav rekonstrukci
4. Vygeneruje 5-slidovou PPTX prezentaci s grafy a tabulkami
5. Odesle prezentaci emailem na nastavenou adresu

Tuto automatizaci muzete zapnout nebo vypnout na strance Dashboard (`/dashboard`). Report si muzete take vygenerovat rucne pres chat prikazem "Vygeneruj tydenni report".

## Viz take

- [Jak to funguje](./how-it-works.md) -- popis architektury a toku dat
- [Pripady pouziti](./use-cases.md) -- ukazkove scenare a dotazy
- [Funkce](./features.md) -- prehled vsech funkci systemu
- [Co agent umi](./agent-capabilities.md) -- detailni popis schopnosti agenta

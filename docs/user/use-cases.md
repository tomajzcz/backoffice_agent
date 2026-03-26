# Praktické scénáře

## 1. Ranní briefing

**Situace**: Pepa začíná pracovní den a chce rychlý přehled.

**Dotaz**: "Jaký je stav operativy?"

**Co se stane**:
1. Agent spustí kontrolu operativního zdraví (skóre 0–100)
2. Zkontroluje stav rekonstrukcí (zpoždění, překročení rozpočtu)
3. Najde zpožděné a blížící se úkoly
4. Vrátí souhrnný briefing s prioritizovanými problémy

**Výsledek**:
- Záložka **Graf**: celkové skóre zdraví s rozpisem kategorií
- Záložka **Odpověď**: textový souhrn s doporučeními

**Příklad odpovědi agenta**:
> Operativní zdraví: 72/100. Hlavní problémy: 3 nemovitosti stagnují v pipeline déle než 30 dní, 2 rekonstrukce mají zpoždění, 5 úkolů je po termínu. Doporučuji se zaměřit na nemovitost na Vinohradech — je ve fázi akvizice už 45 dní.

---

## 2. Příprava na schůzku s investorem

**Situace**: Pepa má odpoledne schůzku s investorem a potřebuje podklady.

**Kroky**:

1. "Ukaž přehled investorů"
   - → Tabulka investorů s portfoliem a investovanými částkami

2. "Jaká je ziskovost nemovitostí v Praze 2?"
   - → ROI analýza s grafem podle nemovitostí

3. "Připrav report o výkonnosti za tento kvartál"
   - → Markdown report v záložce Zpráva

4. "Udělej z toho prezentaci na 5 slidů"
   - → PPTX ke stažení v záložce Zpráva

5. "Pošli prezentaci na jan.investor@email.cz"
   - → Email s přílohou v záložce Email ke schválení

**Celý proces**: ~2 minuty místo hodiny manuální práce.

---

## 3. Naplánování prohlídky

**Situace**: Klient chce vidět byt na Vinohradech.

**Dotaz**: "Naplánuj prohlídku bytu na Vinohradech s klientem Novákem na příští úterý"

**Co se stane**:
1. Agent najde nemovitost a klienta v databázi
2. Zkontroluje dostupnost v Google Kalendáři
3. Nabídne volné časy
4. Po potvrzení vytvoří prohlídku v systému
5. Zapíše událost do Google Kalendáře
6. Připraví email s pozvánkou

**Výsledek**:
- Záložka **Data**: detail vytvořené prohlídky
- Záložka **Email**: návrh pozvánky ke schválení
- Google Kalendář: nová událost

**Následující den**: Systém automaticky zavolá klientovi s připomínkou (pokud je nastaveno).

---

## 4. Kontrola rekonstrukce

**Situace**: Pepa chce vědět, jak pokračují rekonstrukce.

**Kroky**:

1. "Jaký je stav rekonstrukcí?"
   - → Přehled aktivních rekonstrukcí podle fáze
   - → Skóre zdraví rekonstrukcí (0–100)

2. "Ukaž detail rekonstrukce na Karlíně"
   - → Kompletní detail: fáze, rozpočet, dodavatel, blokátory, úkoly

3. "Vytvoř úkol: kontaktovat dodavatele ohledně zpoždění"
   - → Úkol s vazbou na rekonstrukci

**Co agent detekuje automaticky**:
- Překročení plánovaného rozpočtu
- Zpoždění oproti termínu
- Aktivní blokátory (čekání na materiál, povolení, apod.)

---

## 5. Analýza nových nabídek na trhu

**Situace**: Pepa chce vědět, co nového se objevilo na trhu.

**Dotaz**: "Co je nového na trhu v Praze 2?"

**Co se stane**:
1. Agent zkontroluje výsledky monitoringu
2. Analyzuje nové nabídky — cena, dispozice, plocha, lokalita
3. Ohodnotí nabídky podle relevance
4. Prezentuje top příležitosti

**Výsledek**:
- Záložka **Data**: tabulka nabídek s cenami a odkazy
- Záložka **Odpověď**: analýza trendu a doporučení

**Jak monitoring funguje**:
- Automaticky běží každý pracovní den v 5:00
- Sleduje sreality.cz a bezrealitky.cz
- Filtruje podle nastavených kritérií (lokalita, cena, typ)
- Posílá emailové notifikace při nových nabídkách

---

## 6. Týdenní KPI report

**Situace**: Pepa potřebuje připravit týdenní přehled pro vedení.

**Kroky**:

1. "Ukaž týdenní KPI za posledních 12 týdnů"
   - → Graf s trendy: nové leady, klienti, uzavřené obchody

2. "Kolik máme nových klientů za Q1?"
   - → Sloupcový graf podle zdroje akvizice

3. "Připrav report pro vedení"
   - → Markdown report s klíčovými metrikami

4. "Exportuj jako PDF"
   - → PDF ke stažení

**Výsledek**: Profesionální report připravený za 1 minutu.

---

## 7. Správa dat mimo chat

**Situace**: Pepa potřebuje rychle upravit několik záznamů.

**Postup**:
1. Přejděte na `/sprava` (odkaz v levém panelu)
2. Vyberte záložku (Nemovitosti, Klienti, Leady...)
3. Najděte záznam v tabulce (řazení, stránkování)
4. Klikněte na ikonu úprav → otevře se formulář
5. Upravte data → Uložit

Tabulky podporují:
- Řazení podle sloupců
- Stránkování
- Filtrování podle stavu (barevné štítky)
- Formátování měny (CZK), dat a stavů

## Viz také

- [Jak to funguje](./how-it-works.md) — popis rozhraní
- [Funkce](./features.md) — kompletní přehled funkcí
- [Co agent umí](./agent-capabilities.md) — schopnosti agenta

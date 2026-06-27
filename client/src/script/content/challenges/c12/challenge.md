---
order: 12
id: C12
title: Bibot auf Schatzsuche
room: "Láda előtt · 5 párhuzamos"
tags: [Programozás, "5 párhuzamos"]
dial: "🟡 → 1"
code: "1"
lockColor: var(--lock-gold)
who: Coco mondja
lines:
  - "„Die allerletzte Aufgabe, kleine Crew — und hier hilft euch ein Roboter! Das ist BIBOT. Vor der Truhe liegen fünf Bibot-Karten mit einem Gitter bereit: jeder schnappt sich eine, führt die Befehle Schritt für Schritt aus — Bibot geht vorwärts und dreht sich — und findet heraus, auf welchem Feld Bibot stehen bleibt — zum Beispiel C3!”"
  - "„Sucht euer Feld in der Tabelle auf eurer Karte — daneben steht eure Zahl. Dann legt eure fünf Zahlen zusammen und sucht die Summe in der Schatz-Tabelle auf der Anleitungs-Karte. Die Zahl daneben tippt ihr mir mit der Fernbedienung ein — und das GOLDENE Schloss fällt!”"
parent:
  ph: Szülőknek
  entries:
    - [Elrejtés, "Az anleitő kártya (Schatz-Tabellával) + az 5 Bibot-kártya a láda előtt kiterítve. Minden kártyán egy 4×4 rács (A–D oszlop, 1–4 sor, mint a sakktáblán), a Bibot robot a kiinduló mezőn, az ORRÁVAL a kezdő nézési irányba fordulva, mellette a parancsok (↑ = egy mezőt előre, ↻ = jobbra fordul helyben, ↺ = balra fordul helyben) és egy kis „mező → szám” tábla. A több parancsos kártyákat a nagyobbaknak, a kevesebbet a kisebbeknek."]
    - ["Mind az 5", "Mindenki végrehajtja a parancsokat (a fordulás csak az irányt változtatja, az előre mindig az aktuális nézési irányba lép), megkeresi a végmezőt, majd a kártya tábláján a hozzá tartozó számot. Kártya / kezdőmező (nézés) / parancsok → végmező → szám: 1) B1 (↑), ↑↑↻↑↑ → D3 → 5 · 2) A4 (→), ↑↻↑↑ → B2 → 3 · 3) C1 (↑), ↑↑↑↺↑ → B4 → 6 · 4) D2 (←), ↑↑↻↑ → B3 → 4 · 5) A1 (→), ↑↑↺↑↑↑ → C4 → 6."]
    - [Megoldás, "Összeadás: 5 + 3 + 6 + 4 + 6 = 24 → Schatz-Tabelle: 24 → **1**", sol]
---

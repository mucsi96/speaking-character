---
order: 1
id: C1
title: Kanonenkugel-Mathe
room: "Konyha · vegyes matek"
tags: [Matek, "5 párhuzamos"]
dial: "🔴 → 3"
code: "3"
lockColor: var(--lock-red)
# First challenge of the RED lock — carries the lock header. Coco's `lines` are
# spoken right after the C0 OK press: he reveals the chest + the four locks,
# opens the RED lock and points to the kitchen. Coco never explains the task
# itself; the puzzle lives on the printable.
lock:
  anchor: z1
  emoji: "🔴"
  color: var(--lock-red)
  headGradient: "linear-gradient(180deg,#d6463a,var(--lock-red))"
  unlockGradient: "linear-gradient(90deg,#d6463a,var(--lock-red))"
  title: "Lakat 1 — Rot · Kombüse"
  subtitle: "Konyha → fürdő → nappali · C1 C2 C3 · matek + keresés + felolvasás"
  code: "3 - 7 - 4"
who: Coco mondja
lines:
  - "„Yo-ho-ho! Da ist sie ja — unsere **Schatztruhe**, mitten im Wohnzimmer! Schaut sie euch ganz genau an: Sie hat **VIER** Schlösser, und jedes hat eine **eigene Farbe** — **ROT**, **BLAU**, **GRÜN** und **GOLD**. Achtet immer auf die Farbe, denn die verrät euch, welches Schloss ihr gerade knackt! Jedes Schloss hat **drei Drehräder** mit Zahlen. Nach jeder Aufgabe bekommt ihr eine Zahl — die drückt ihr mir auf der Fernbedienung, und dann dreht ihr das nächste Rad von **oben nach unten** auf die richtige Zahl. Wenn alle drei Räder eines Schlosses stimmen, fällt es ab!”"
  - "„Fangen wir an, kleine Piraten — das erste Schloss ist **ROT**, die Kombüse! Eure allererste Aufgabe wartet in der **KÜCHE**: dort liegen fünf Aufgaben-Karten für euch bereit — jeder schnappt sich eine und rechnet los!”"
  - "„Die Karten verraten euch, was zu tun ist. Wenn ihr die erste Aufgabe gelöst habt, kommt wieder zu mir zurück und **tippt die Zahl mit der Fernbedienung** ein — dann sage ich euch, ob sie stimmt. Auf geht's!”"
hint: "💡 A piros lakat indul: a feladatkártyák a konyhaszigeten. (A láda ekkor már a nappaliban van — lásd C0.)"
parent:
  ph: Szülőknek
  entries:
    - [Elrejtés, "A leírókártya + az 5 feladatkártya a konyhaszigeten, jól láthatóan (a feladat a számolás, nem a keresés)."]
    - ["Mind az 5", "1) 15+9+8=32 · 2) 7×4=28 · 3) piramis 8,6,5 → 25 · 4) 2,5,8,?,14 → 11 · 5) 4+3+5=12. A nehezebbeket (1–3) a nagyobbaknak, a 4–5-öt a kisebbeknek."]
    - [Megoldás, "20 alatt: 11, 12 → 2 db → Schatz-Tabelle: 2 → **3**", sol]
---

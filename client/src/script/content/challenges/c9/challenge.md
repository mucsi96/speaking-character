---
order: 9
id: C9
title: Schatz-Puzzle
room: "Dolgozószoba · puzzle"
tags: [Puzzle, Csapat]
dial: "🟢 → 8"
code: "8"
lockColor: var(--lock-green)
who: Coco mondja
lines:
  - "„Zurück ins **ARBEITSZIMMER**, kleine Piraten! Sucht dort eure nächste Aufgabe — alle helfen mit!”"
parent:
  ph: Szülőknek
  entries:
    - [Elrejtés, "A felvágott négyzeteket egy kis kalózládikóban/borítékban add oda a dolgozószobában; az egyik egyszemélyes ágyon rakják össze."]
    - [Megoldás, "A kép egy nagy „8” → **8**", sol]
# The break that follows the GREEN lock is its own codeless OK-gated scene
# (c9-break). The kids set the lock's dials digit by digit as they solve C7–C9,
# so there's no separate unlock scene — Coco's praise on the C9 code is the
# celebration, then the break.
---

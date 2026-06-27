---
order: 0
id: C0
variant: intro
title: Die Schatztruhe finden
room: "Háló → nappali · a láda megkeresése"
tags: [Keresés, "Nincs kód"]
# The codeless prologue (C0). It carries TWO spoken scenes:
#   * `intro`  — greeting + the remote-control explanation + the mission to
#                find the chest and carry it to the living-room sofa. After it
#                Coco PAUSES (the scene is gated): nothing happens until a
#                grown-up presses OK once the truhe is in the living room.
#   * `lines`  — spoken only after that OK press: Coco reveals the four locks,
#                their colours and the three dials, then hands off to lock 1.
# No code: this challenge never asks the kids for a number.
intro:
  who: "Coco · Prológus + távirányító"
  lines:
    - "Ahoi, ihr tapferen kleinen Piraten! Ich bin Käpten Coco, der schlauste Papagei der sieben Weltmeere! Herzlichen Glückwunsch zum Geburtstag! Heute gehen wir gemeinsam auf eine große Schatzsuche."
    - "Aber zuerst zeige ich euch mein Zauber-Werkzeug — die **Fernbedienung**! Mit der großen runden **OK-Taste** in der Mitte rede ich weiter und sage euch, wie es weitergeht: drückt OK immer dann, wenn ihr bereit seid. Und die **Zahlentasten von 0 bis 9** brauchen wir später, um die geheimen Zahlen einzugeben. Ein großer Pirat darf die Fernbedienung halten und auf die Knöpfe drücken!"
    - "Und jetzt eure allererste Mission: Irgendwo in diesem Schiff liegt eine **Schatztruhe** — verschlossen mit **VIER** Schlössern. Sucht dort, wo der Kapitän schläft und seine Sachen versteckt: **hinter einer großen Tür, wo Kleider hängen**. Habt ihr die Truhe gefunden? Dann tragt sie ganz vorsichtig ins **Wohnzimmer** und stellt sie **vor das Sofa** — dort sehe ich euch am besten und kann euch alles erklären. Wenn die Truhe vor dem Sofa steht, **drückt OK**!"
  hint: "💡 A láda a hálószobai nagy gardróbban van. Amikor a gyerekek behozták a nappaliba (a kanapé elé), **nyomj OK-t / Entert a távirányítón** — csak ekkor kezd Coco mesélni a lakatokról."
who: Coco mondja
lines:
  - "„Yo-ho-ho! Da ist sie ja — unsere **Schatztruhe**, mitten im Wohnzimmer! Schaut sie euch ganz genau an: Sie hat **VIER** Schlösser, und jedes hat eine **eigene Farbe** — **ROT**, **BLAU**, **GRÜN** und **GOLD**. Achtet immer auf die Farbe, denn die verrät euch, welches Schloss ihr gerade knackt! Jedes Schloss hat **drei Drehräder** mit Zahlen. Nach jeder Aufgabe bekommt ihr eine Zahl — die drückt ihr mir auf der Fernbedienung, und dann dreht ihr das nächste Rad von **oben nach unten** auf die richtige Zahl. Wenn alle drei Räder eines Schlosses stimmen, fällt es ab! Und so bekommt ihr die Zahl: Wenn ihr die erste Aufgabe gelöst habt, kommt wieder zu mir zurück und **tippt die Zahl mit der Fernbedienung** ein — dann sage ich euch, ob sie stimmt! Jetzt geht es los — auf zum ersten Schloss, kleine Piraten!”"
parent:
  ph: Szülőknek
  entries:
    - [Elrejtés, "A láda a hálószobai nagy gardróbban, mind a 4 lakattal a buli előtt (lásd a kódtáblát + a beállítási listát)."]
    - [Távirányító, "Te tartod a távirányítót. **OK / Enter** = Coco továbbmegy; a **0–9** számgombokkal írják be a gyerekek a kódot. Coco az intróban maga is elmagyarázza."]
    - ["A láda útja", "A gyerekek a gardróbból a **nappaliba**, a kanapé elé hozzák — ez lesz a központi hely, ahonnan Coco navigál."]
    - [Megoldás, "**Nincs kód.** Amikor a láda a kanapé előtt áll, nyomj **OK-t** — Coco ekkor mesél a négy lakatról, majd a konyhába küldi őket (C1).", sol]
---

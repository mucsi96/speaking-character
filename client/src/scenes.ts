/**
 * ============================================================================
 *  GESCHICHTE / SCRIPT — HIER BEARBEITEN
 * ============================================================================
 *  Dies ist der komplette Text, den der Piraten-Papagei spricht.
 *  - `intro`  : Begrüßung + erste Aufgabe (wird beim Start gezeigt).
 *  - weitere  : jede weitere Szene = nächste Aufgabe der Schatzsuche.
 *  - `outro`  : Abschluss, wenn alle Aufgaben geschafft sind.
 *
 *  Einfach den `text` ändern. Der Text wird per ElevenLabs auf Deutsch
 *  vorgelesen. `title` erscheint groß auf dem Bildschirm.
 *  Mit einer Farbtaste auf der Fernbedienung geht es zur nächsten Szene.
 * ============================================================================
 */

export interface Scene {
  id: string;
  title: string;
  text: string;
}

export const scenes: Scene[] = [
  {
    id: 'intro',
    title: 'Ahoi, kleine Piraten!',
    text:
      'Ahoi, ihr tapferen kleinen Piraten! Ich bin Käpten Coco, der schlauste ' +
      'Papagei der sieben Weltmeere! Herzlichen ' +
      'Glückwunsch zum Geburtstag! Heute gehen wir gemeinsam auf eine große ' +
      'Schatzsuche. Versteckt auf dieser Insel liegt ein geheimer Piratenschatz. ' +
      'Aber Achtung: Nur mutige Piraten finden ihn! Eure erste Aufgabe: Sucht ' +
      'im Garten nach drei roten Federn, so rot wie meine Lieblingsbeeren. ' +
      'Wenn ihr sie gefunden habt, drückt eine bunte Taste auf der Fernbedienung!',
  },
  {
    id: 'task-1',
    title: 'Die Schatzkarte',
    text:
      'Stark gemacht, ihr Landratten! Ihr habt die roten Federn gefunden! ' +
      'Jetzt braucht ihr die geheime Schatzkarte. Sie ist in viele kleine ' +
      'Teile zerrissen. Sucht im ganzen Haus nach den Kartenstücken und setzt ' +
      'sie wie ein Puzzle zusammen. Wenn die Karte vollständig ist, drückt ' +
      'wieder eine bunte Taste!',
  },
  {
    id: 'task-2',
    title: 'Das Piratenlied',
    text:
      'Yo-ho-ho! Die Karte ist fertig! Echte Piraten müssen auch singen ' +
      'können. Eure Aufgabe: Singt alle zusammen so laut ihr könnt das ' +
      'Geburtstagslied. Und tanzt dabei wie wilde Seeräuber! Wenn ihr fertig ' +
      'gesungen habt, drückt eine bunte Taste.',
  },
  {
    id: 'task-3',
    title: 'Der Mutige Sprung',
    text:
      'Donnerwetter, das klang wunderbar! Jetzt kommt die Mutprobe. Auf der ' +
      'Schatzkarte ist ein großes X eingezeichnet. Folgt der Karte bis zum X. ' +
      'Dort müsst ihr gemeinsam dreimal hüpfen und laut Arrr! rufen. Dann ist ' +
      'der Schatz nicht mehr weit. Drückt eine bunte Taste, wenn ihr beim X seid!',
  },
  {
    id: 'outro',
    title: 'Der Schatz ist gefunden!',
    text:
      'Ihr habt es geschafft, ihr großartigen Piraten! Genau hier ist der ' +
      'Schatz vergraben. Grabt vorsichtig und teilt die Beute gerecht unter ' +
      'allen auf. Ihr seid jetzt echte Piraten der sieben Weltmeere! Und nun: ' +
      'Lasst die Geburtstagsfeier beginnen! Arrr und alles Gute zum Geburtstag!',
  },
];

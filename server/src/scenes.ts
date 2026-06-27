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
 *
 *  `code` (optionale Ziffer 0–9): Nach dem Vorlesen erscheint ein Eingabefeld.
 *  Die Kinder geben die Lösung über die Zahlentasten der Fernbedienung ein.
 *  - Richtig → Käpten Coco jubelt (Animation `celebrate`) und es geht weiter.
 *  - Falsch  → Coco schüttelt den Kopf (Animation `wrong`) und sie dürfen es
 *    nochmal versuchen.
 *  Tipp: Versteckt die passende Zahl als echten Hinweis im Spielbereich
 *  (z.B. auf der Schatzkarte). Szenen ohne `code` (wie `outro`) gehen einfach
 *  zu Ende.
 *
 *  Das Script lebt auf dem Server: es wird per `GET /api/script` an den Client
 *  ausgeliefert und beim Serverstart komplett vorgerendert (Cache-Preheat),
 *  damit die Show ohne ElevenLabs-Wartezeit läuft.
 * ============================================================================
 */

export interface Scene {
  id: string;
  text: string;
  /** Single-digit answer the kids must enter to continue (optional). */
  code?: string;
}

export interface Script {
  scenes: Scene[];
  correctLines: string[];
  wrongLines: string[];
}

export const scenes: Scene[] = [
  {
    id: 'intro',
    text:
      'Ahoi, ihr tapferen kleinen Piraten! Ich bin Käpten Coco, der schlauste ' +
      'Papagei der sieben Weltmeere! Herzlichen ' +
      'Glückwunsch zum Geburtstag! Heute gehen wir gemeinsam auf eine große ' +
      'Schatzsuche. Versteckt auf dieser Insel liegt ein geheimer Piratenschatz. ' +
      'Aber Achtung: Nur mutige Piraten finden ihn! Eure erste Aufgabe: Sucht ' +
      'im Garten nach roten Federn, so rot wie meine Lieblingsbeeren. ' +
      'Zählt sie genau und tippt ein, wie viele Federn ihr gefunden habt!',
    code: '3',
  },
  {
    id: 'task-1',
    text:
      'Stark gemacht, ihr Landratten! Ihr habt die roten Federn gefunden! ' +
      'Jetzt braucht ihr die geheime Schatzkarte. Sie ist in viele kleine ' +
      'Teile zerrissen. Sucht im ganzen Haus nach den Kartenstücken und setzt ' +
      'sie wie ein Puzzle zusammen. Auf der fertigen Karte steht eine große ' +
      'geheime Zahl. Findet sie und tippt sie auf der Fernbedienung ein!',
    code: '7',
  },
  {
    id: 'task-2',
    text:
      'Yo-ho-ho! Die Karte ist fertig! Echte Piraten müssen auch singen ' +
      'können. Eure Aufgabe: Singt alle zusammen so laut ihr könnt das ' +
      'Geburtstagslied. Und tanzt dabei wie wilde Seeräuber! Am Ende des Liedes ' +
      'ruft der Käpten eine Glückszahl. Zählt mit und tippt die Zahl ein!',
    code: '5',
  },
  {
    id: 'task-3',
    text:
      'Donnerwetter, das klang wunderbar! Jetzt kommt die Mutprobe. Auf der ' +
      'Schatzkarte ist ein großes X eingezeichnet. Folgt der Karte bis zum X. ' +
      'Dort liegt ein versteckter Hinweis mit einer geheimen Zahl. Hüpft dreimal, ' +
      'ruft laut Arrr! und tippt dann die Zahl vom Hinweis ein!',
    code: '9',
  },
  {
    id: 'outro',
    text:
      'Ihr habt es geschafft, ihr großartigen Piraten! Genau hier ist der ' +
      'Schatz vergraben. Grabt vorsichtig und teilt die Beute gerecht unter ' +
      'allen auf. Ihr seid jetzt echte Piraten der sieben Weltmeere! Und nun: ' +
      'Lasst die Geburtstagsfeier beginnen! Arrr und alles Gute zum Geburtstag!',
  },
];

/**
 * Generic lines Käpten Coco speaks while celebrating a correct code. One is
 * picked at random and played together with the `celebrate` animation.
 */
export const correctLines: string[] = [
  'Yo-ho-ho! Das war goldrichtig, ihr schlauen Seeräuber!',
  'Arrr! Genau die richtige Zahl! Weiter geht die Schatzsuche!',
  'Bravo, kleine Piraten! Volltreffer!',
];

/**
 * Generic lines Coco speaks on a wrong code, played with the `wrong` animation
 * before the kids get another try. The tone stays calm and encouraging: never
 * cross, always inviting the kids to take another try because they can do it.
 */
export const wrongLines: string[] = [
  'Das war noch nicht die richtige Zahl, aber das macht gar nichts. ' +
    'Da habt ihr euch wohl verzählt. Geht nochmal ganz in Ruhe zur Aufgabe ' +
    'zurück, löst sie in Ruhe und holt euch die richtige Zahl. Ihr schafft das!',
  'Fast geschafft, kleine Piraten! Diese Zahl passt noch nicht ganz. ' +
    'Geht nochmal zurück zur Aufgabe und schaut euch alles ganz genau an, ' +
    'dann findet ihr die richtige Zahl. Ich glaube ganz fest an euch!',
  'Kein Problem, das passiert den besten Seeräubern! Da hat sich ein kleiner ' +
    'Fehler eingeschlichen. Macht die Aufgabe in Ruhe nochmal, dann habt ihr ' +
    'die richtige Zahl. Ihr seid clever genug, das zu lösen!',
];

/** The full script served to the client via `GET /api/script`. */
export const script: Script = { scenes, correctLines, wrongLines };

/**
 * Every line Käpten Coco can possibly speak — scene tasks plus the random
 * correct/wrong reactions. Used to pre-render all TTS on server startup so the
 * live show never waits on ElevenLabs.
 */
export const allSpeech: string[] = [
  ...scenes.map((scene) => scene.text),
  ...correctLines,
  ...wrongLines,
];

import type { Zone as ZoneData } from '../types';
import { CocoBubble, Station } from './Station';
import { Inline } from './Html';

/** A color-coded lock zone: heading, Coco intro, its stations, and the
 *  unlock / break bars that close it out. */
export function Zone({ zone }: { zone: ZoneData }) {
  return (
    <section id={zone.anchor}>
      <div className="zonehead" style={{ background: zone.headGradient }}>
        <span className="zlk">{zone.emoji}</span>
        <div>
          <h3>{zone.title}</h3>
          <span className="zsub">{zone.subtitle}</span>
        </div>
        <span className="zcode">{zone.code}</span>
      </div>

      <CocoBubble who={zone.intro.who} lines={zone.intro.lines} hint={zone.intro.hint} />

      {zone.stations.map((station) => (
        <Station key={station.id} station={station} color={zone.color} />
      ))}

      {zone.unlock ? (
        <div className="unlock" style={{ background: zone.unlockGradient }}>
          <span className="ic">🔓</span>
          <div>
            <h5>{zone.unlock.title}</h5>
            <Inline as="p" md={zone.unlock.text} />
          </div>
        </div>
      ) : null}

      {zone.break ? (
        <div className="breakbar">
          <span className="ic">{zone.break.emoji}</span>
          <div>
            <h4>{zone.break.title}</h4>
            <p>{zone.break.text}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

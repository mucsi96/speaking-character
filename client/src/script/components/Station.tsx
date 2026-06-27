import { Fragment, type CSSProperties } from 'react';
import type { ParentEntry, Station as StationData } from '../types';
import { Inline } from './Html';

const PRINTREF: CSSProperties = {
  fontFamily: 'var(--head)',
  fontSize: '12.5px',
  color: 'var(--sea)',
  marginTop: '6px',
};

const HINT: CSSProperties = {
  fontSize: '.86em',
  color: 'var(--ink-soft)',
  fontStyle: 'italic',
  borderTop: '1px dotted var(--rope)',
  marginTop: '6px',
  paddingTop: '5px',
};

/** Coco's speech bubble — narration lines, an optional bolded question and an
 *  optional Hungarian hint for the parent. */
export function CocoBubble({
  who,
  lines,
  question,
  hint,
}: {
  who: string;
  lines: string[];
  question?: string;
  hint?: string;
}) {
  return (
    <div className="coco">
      <span className="bird">🦜</span>
      <div className="said">
        <div className="who">{who}</div>
        {lines.map((line, i) => (
          <Inline key={i} as="p" md={line} />
        ))}
        {question ? <Inline as="p" className="q" md={question} /> : null}
        {hint ? <Inline as="p" className="hint" style={HINT} md={hint} /> : null}
      </div>
    </div>
  );
}

/** The oxblood-bordered "parent" note: a definition list of hide/solve tips. */
export function ParentBox({ ph, entries }: { ph: string; entries: ParentEntry[] }) {
  return (
    <div className="parent">
      <div className="ph">{ph}</div>
      <dl>
        {entries.map(([term, desc, sol], i) => (
          <Fragment key={i}>
            <dt>{term}</dt>
            <Inline as="dd" className={sol ? 'sol' : undefined} md={desc} />
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

function PrintRef({ name }: { name: string }) {
  return (
    <p className="printref" style={PRINTREF}>
      ✂ Nyomtatandó: <strong>{name}</strong>
    </p>
  );
}

/** A single task station (C1–C12), or the special gold-zone finale card. */
export function Station({ station, color }: { station: StationData; color: string }) {
  if (station.variant === 'finale') {
    return (
      <div
        className="station"
        style={{ borderColor: 'var(--gold)', borderStyle: 'solid', borderWidth: '2px', borderLeftWidth: '6px' }}
      >
        <div className="head" style={{ background: station.headGradient, color: '#3a2a05' }}>
          <span className="cid" style={{ background: '#fff7e0' }}>
            {station.icon ?? station.id}
          </span>
          <div>
            <h4>{station.title}</h4>
            <span className="room" style={{ color: '#5a4310' }}>
              {station.room}
            </span>
          </div>
        </div>
        <div className="body">
          <CocoBubble who={station.who} lines={station.lines} />
          <ParentBox ph={station.parent.ph} entries={station.parent.entries} />
          {station.print ? <PrintRef name={station.print} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="station" style={{ borderLeftColor: color }}>
      <div className="head">
        <span className="cid">{station.id}</span>
        <div>
          <h4>{station.title}</h4>
          <span className="room">{station.room}</span>
        </div>
        {station.tags?.length ? (
          <div className="tags">
            {station.tags.map((tag, i) => (
              <span key={i} className="tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {station.dial ? <span className="dialbadge">{station.dial}</span> : null}
      </div>
      <div className="body">
        <CocoBubble who={station.who} lines={station.lines} question={station.question} />
        <ParentBox ph={station.parent.ph} entries={station.parent.entries} />
        {station.print ? <PrintRef name={station.print} /> : null}
      </div>
    </div>
  );
}

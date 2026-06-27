import { Fragment, type CSSProperties } from 'react';
import type { Challenge as ChallengeData, ParentEntry } from '../types';
import { Inline } from './Html';

const HINT: CSSProperties = {
  fontSize: '.86em',
  color: 'var(--ink-soft)',
  fontStyle: 'italic',
  borderTop: '1px dotted var(--rope)',
  marginTop: '6px',
  paddingTop: '5px',
};

/** Coco's speech bubble — the narration lines spoken before a challenge and an
 *  optional Hungarian hint for the parent. (Coco no longer poses the task: the
 *  question lives on the printable, so there's no `question` line here.) */
export function CocoBubble({
  who,
  lines,
  hint,
}: {
  who: string;
  lines: string[];
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

/** The color-coded lock header shown above the first challenge of each lock.
 *  The lock's lead-in narration now lives in that challenge's own `lines`. */
function LockHead({ lock }: { lock: NonNullable<ChallengeData['lock']> }) {
  return (
    <div className="zonehead" id={lock.anchor} style={{ background: lock.headGradient }}>
      <span className="zlk">{lock.emoji}</span>
      <div>
        <h3>{lock.title}</h3>
        <span className="zsub">{lock.subtitle}</span>
      </div>
      <span className="zcode">{lock.code}</span>
    </div>
  );
}

/** One entry of the flat challenge list. Most are task cards (C0–C12); a
 *  challenge's `variant` switches it to the gold finale card or to the colored
 *  unlock / break bars that close a lock — each now its own standalone scene. */
export function Challenge({ challenge }: { challenge: ChallengeData }) {
  if (challenge.variant === 'finale') {
    return (
      <div
        className="station"
        style={{ borderColor: 'var(--gold)', borderStyle: 'solid', borderWidth: '2px', borderLeftWidth: '6px' }}
      >
        <div className="head" style={{ background: challenge.headGradient, color: '#3a2a05' }}>
          <span className="cid" style={{ background: '#fff7e0' }}>
            {challenge.icon ?? challenge.id}
          </span>
          <div>
            <h4>{challenge.title}</h4>
            <span className="room" style={{ color: '#5a4310' }}>
              {challenge.room}
            </span>
          </div>
        </div>
        <div className="body">
          <CocoBubble who={challenge.who ?? ''} lines={challenge.lines} />
          {challenge.parent ? <ParentBox ph={challenge.parent.ph} entries={challenge.parent.entries} /> : null}
        </div>
      </div>
    );
  }

  // A lock's unlock celebration — a colored bar; its body is the spoken lines.
  if (challenge.variant === 'unlock') {
    return (
      <div className="unlock" style={{ background: challenge.gradient }}>
        <span className="ic">🔓</span>
        <div>
          <h5>{challenge.title}</h5>
          {challenge.lines.map((line, i) => (
            <Inline key={i} as="p" md={line} />
          ))}
        </div>
      </div>
    );
  }

  // A between-locks break. Coco speaks the kid-facing `lines`; the printable bar
  // shows the parent-only prep `note`.
  if (challenge.variant === 'break') {
    return (
      <div className="breakbar">
        <span className="ic">{challenge.emoji}</span>
        <div>
          <h4>{challenge.title}</h4>
          {challenge.note ? <p>{challenge.note}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <>
      {challenge.lock ? <LockHead lock={challenge.lock} /> : null}

      <div className="station" style={{ borderLeftColor: challenge.lockColor }}>
        <div className="head">
          <span className="cid">{challenge.id}</span>
          <div>
            <h4>{challenge.title}</h4>
            <span className="room">{challenge.room}</span>
          </div>
          {challenge.tags?.length ? (
            <div className="tags">
              {challenge.tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {challenge.dial ? <span className="dialbadge">{challenge.dial}</span> : null}
        </div>
        <div className="body">
          <CocoBubble who={challenge.who ?? ''} lines={challenge.lines} hint={challenge.hint} />
          {challenge.parent ? <ParentBox ph={challenge.parent.ph} entries={challenge.parent.entries} /> : null}
        </div>
      </div>
    </>
  );
}

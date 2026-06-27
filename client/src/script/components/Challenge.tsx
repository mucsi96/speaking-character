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

/** The color-coded lock header + Coco's lock intro, shown above the first
 *  challenge of each lock. */
function LockHead({ lock }: { lock: NonNullable<ChallengeData['lock']> }) {
  return (
    <>
      <div className="zonehead" id={lock.anchor} style={{ background: lock.headGradient }}>
        <span className="zlk">{lock.emoji}</span>
        <div>
          <h3>{lock.title}</h3>
          <span className="zsub">{lock.subtitle}</span>
        </div>
        <span className="zcode">{lock.code}</span>
      </div>
      <CocoBubble who={lock.intro.who} lines={lock.intro.lines} hint={lock.intro.hint} />
    </>
  );
}

/** A single task challenge (C1–C12), or the special gold-zone finale card. The
 *  challenge renders its own lock header/intro (when it opens a lock) and its
 *  unlock / break bars (when it closes one). */
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
          <CocoBubble who={challenge.who} lines={challenge.lines} />
          <ParentBox ph={challenge.parent.ph} entries={challenge.parent.entries} />
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
          <CocoBubble who={challenge.who} lines={challenge.lines} />
          <ParentBox ph={challenge.parent.ph} entries={challenge.parent.entries} />
        </div>
      </div>

      {challenge.unlock ? (
        <div className="unlock" style={{ background: challenge.unlock.gradient ?? challenge.lock?.unlockGradient }}>
          <span className="ic">🔓</span>
          <div>
            <h5>{challenge.unlock.title}</h5>
            <Inline as="p" md={challenge.unlock.text} />
          </div>
        </div>
      ) : null}

      {challenge.break ? (
        <div className="breakbar">
          <span className="ic">{challenge.break.emoji}</span>
          <div>
            <h4>{challenge.break.title}</h4>
            <p>{challenge.break.text}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

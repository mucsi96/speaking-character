import type { CSSProperties } from 'react';
import type { Printable } from '../types';
import { Block, Inline } from './Html';

const answerStyle = (marginTop?: string): CSSProperties => ({
  textAlign: 'center',
  fontSize: '.85em',
  color: '#b9a06a',
  marginTop,
});

const headStyle = (marginTop?: string): CSSProperties => ({
  textAlign: 'center',
  fontFamily: 'var(--head)',
  color: 'var(--sea-deep)',
  marginTop,
});

/** Renders the bespoke "cut-out" artwork of one printable sheet, dispatched on
 *  `visual.type`. Each branch mirrors the markup of the original script.html. */
function Visual({ visual }: { visual: Record<string, any> }) {
  switch (visual.type) {
    case 'svg':
      // A self-contained print-ready card; the raw markup is inlined verbatim
      // so the same asset drives both the screen and the A4 printout.
      return (
        <div className="svg-card" dangerouslySetInnerHTML={{ __html: visual.svg as string }} />
      );

    case 'log':
      return <Block className="log" md={visual.text} />;

    case 'cannonballs':
      return (
        <>
          <div className="cards">
            {visual.items.map((it: { expr: string; ans: string }, i: number) => (
              <div key={i}>
                <div className="ball">{it.expr}</div>
                <div className="ans" style={{ textAlign: 'center' }}>
                  {it.ans}
                </div>
              </div>
            ))}
          </div>
          <p style={headStyle('12px')}>{visual.question}</p>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'coins':
      return (
        <>
          <div className="cards" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            {visual.coins.map((c: string, i: number) => (
              <div key={i} className="coin">
                {c}
              </div>
            ))}
          </div>
          <p style={headStyle('12px')}>{visual.question}</p>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'story':
      return (
        <>
          <div className="log">
            <ol>
              {visual.steps.map((step: string, i: number) => (
                <Inline key={i} as="li" md={step} />
              ))}
            </ol>
          </div>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'mirror':
      return (
        <>
          <div className="mcards">
            {visual.words.map((w: { word: string; pos: string }, i: number) => (
              <div key={i} className="mcard">
                <div className="word mirror">{w.word}</div>
                <div className="pos">{w.pos}</div>
              </div>
            ))}
          </div>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'sequence':
      return (
        <>
          <div className="scroll">{visual.scroll}</div>
          <div className="tiles">
            {visual.tiles.map((t: string, i: number) => (
              <span key={i} className="tile">
                {t}
              </span>
            ))}
          </div>
          <p style={headStyle('10px')}>{visual.question}</p>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'tetra':
      return (
        <>
          <div className="bluep" style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="220" height="190" viewBox="0 0 220 190" aria-label="Tetraeder">
              <polygon points="40,150 170,150 105,120" fill="none" stroke="#9fd6ff" strokeWidth="2" />
              <line x1="40" y1="150" x2="105" y2="40" stroke="#9fd6ff" strokeWidth="2" />
              <line x1="170" y1="150" x2="105" y2="40" stroke="#9fd6ff" strokeWidth="2" />
              <line x1="105" y1="120" x2="105" y2="40" stroke="#9fd6ff" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="40" cy="150" r="10" fill="#d9d9d9" stroke="#fff" />
              <circle cx="170" cy="150" r="10" fill="#d9d9d9" stroke="#fff" />
              <circle cx="105" cy="120" r="10" fill="#d9d9d9" stroke="#fff" />
              <circle cx="105" cy="40" r="10" fill="#ffd76a" stroke="#fff" />
            </svg>
          </div>
          <p style={headStyle()}>{visual.question}</p>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'gears':
      return (
        <>
          <div className="gears">{visual.gears}</div>
          <Inline as="p" style={{ textAlign: 'center' }} md={visual.text} />
          <p style={headStyle()}>{visual.question}</p>
          <Inline as="p" style={answerStyle()} md={visual.answer} />
        </>
      );

    case 'cipher':
      return (
        <>
          <div className="legend">
            {visual.legend.map((l: string, i: number) => (
              <div key={i} className="legitem">
                {l}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'var(--head)', color: 'var(--oxblood)', margin: '10px 0 0' }}>
            {visual.prompt}
          </p>
          <div className="cipher">
            {visual.word.map((w: string, i: number) => (
              <div key={i} className="csym">
                {w}
              </div>
            ))}
          </div>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'jig':
      return (
        <>
          <div className="jig">
            <span className="num">{visual.num}</span>
            <div className="grid"></div>
          </div>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'riddles':
      return (
        <>
          {visual.riddles.map((r: { n: string; q: string; a: string }, i: number) => (
            <div key={i} className="riddle">
              <b>{r.n}</b> {r.q} <span className="a">{r.a}</span>
            </div>
          ))}
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'map':
      return (
        <>
          <div className="map">
            <svg className="route" viewBox="0 0 560 400" preserveAspectRatio="none">
              <polyline
                points={visual.route}
                fill="none"
                stroke="#8c2b22"
                strokeWidth="4"
                strokeDasharray="10 8"
              />
            </svg>
            {visual.labels.map(
              (l: { top: string; left: string; text: string; oxblood?: boolean }, i: number) => (
                <div
                  key={i}
                  className="lbl"
                  style={{ top: l.top, left: l.left, color: l.oxblood ? 'var(--oxblood)' : undefined }}
                >
                  {l.text}
                </div>
              )
            )}
            {visual.marks.map((m: { top: string; left: string }, i: number) => (
              <div key={i} className="x" style={{ top: m.top, left: m.left }}>
                ✗
              </div>
            ))}
          </div>
          <p style={headStyle('8px')}>{visual.question}</p>
          <p style={answerStyle()}>{visual.answer}</p>
        </>
      );

    case 'ribbons':
      return (
        <>
          <div className="ribbons">
            {visual.ribbons.map(
              (r: { bg: string; color?: string; label: string; small: string }, i: number) => (
                <div key={i} className="ribbon" style={{ background: r.bg, color: r.color }}>
                  {r.label}
                  <small>{r.small}</small>
                </div>
              )
            )}
          </div>
          <p style={answerStyle('8px')}>{visual.answer}</p>
        </>
      );

    case 'diploma':
      return (
        <>
          {Array.from({ length: visual.count as number }).map((_, i) => (
            <div key={i} className="diploma">
              <h4>{visual.heading}</h4>
              <p style={{ fontFamily: 'var(--head)', letterSpacing: '.05em' }}>{visual.from}</p>
              <div className="name-line"></div>
              <p className="small">{visual.nameLabel}</p>
              <p style={{ marginTop: '12px' }}>{visual.body}</p>
              <p style={{ fontFamily: 'var(--display)', fontSize: '22px', color: 'var(--oxblood)', marginTop: '12px' }}>
                {visual.sign}
              </p>
            </div>
          ))}
        </>
      );

    default:
      return null;
  }
}

/** A printable cut-out sheet: dashed frame, title, optional German note, art.
 *  SVG cards are self-contained (frame + title baked in), so they skip the
 *  HTML chrome and render the artwork alone. */
export function PrintableSheet({ printable }: { printable: Printable }) {
  if (printable.visual.type === 'svg') {
    return <Visual visual={printable.visual} />;
  }
  return (
    <div className={printable.pageBreak ? 'sheet page-break' : 'sheet'}>
      <h3>{printable.title}</h3>
      {printable.note ? <p className="de-note">{printable.note}</p> : null}
      <Visual visual={printable.visual} />
    </div>
  );
}

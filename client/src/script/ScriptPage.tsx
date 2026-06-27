import { Fragment, useEffect, type CSSProperties } from 'react';
import './script.css';
import { scriptDoc } from './content';
import type { CodeTable } from './types';
import { Block, Inline, Raw } from './components/Html';
import { Challenge } from './components/Challenge';
import { PrintableSheet } from './components/Visual';

const SUBHEAD: CSSProperties = {
  fontFamily: 'var(--head)',
  color: 'var(--sea-deep)',
  margin: '22px 0 8px',
};

/** A two-style data table: the dark "secret" code table and the parchment
 *  validation table. One column may be highlighted (code badge / digit). */
function DataTable({
  table,
  className,
  badgeColumn,
  badgeClass,
}: {
  table: CodeTable;
  className: string;
  badgeColumn?: number;
  badgeClass: string;
}) {
  return (
    <table className={className}>
      <tbody>
        <tr>
          {table.columns.map((col, i) => (
            <th key={i}>{col}</th>
          ))}
        </tr>
        {table.rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} className={ci === badgeColumn ? badgeClass : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The "Coco & die 4 Schlösser" parent guide, rendered from the markdown
 * directory in `content/`. Reproduces the look & feel of the original static
 * `script.html`; reachable at `/script`.
 */
export default function ScriptPage() {
  const { meta, overview, codes, flow, challenges, tv, printIntro, printGroups } = scriptDoc;

  useEffect(() => {
    // The app's global styles pin html/body to a full-screen, non-scrolling
    // show; opt this page out so the long guide scrolls and gets the parchment
    // background. Restored on unmount.
    document.documentElement.classList.add('script-mode');
    document.body.classList.add('script-mode');
    const previousTitle = document.title;
    document.title = meta.title.replace(/\n/g, ' ');

    // Load the pirate web fonts the same way the original static page did: as
    // <head> links that fall back to serif if the CDN is unavailable.
    const fontLinks = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Pirata+One&family=Cinzel:wght@500;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Special+Elite&display=swap',
      },
    ].map(({ rel, href, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      document.documentElement.classList.remove('script-mode');
      document.body.classList.remove('script-mode');
      document.title = previousTitle;
      fontLinks.forEach((link) => link.remove());
    };
  }, [meta.title]);

  return (
    <div className="script-root">
      <nav className="topbar">
        <div className="wrap">
          <span className="brand">{meta.brand}</span>
          {meta.nav.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a
            className="printbtn"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.print();
            }}
          >
            🖨
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="eyebrow">{meta.eyebrow}</div>
        <h1 className="title">
          {meta.title.split('\n').map((line, i, arr) => (
            <Fragment key={i}>
              {line}
              {i < arr.length - 1 ? <br /> : null}
            </Fragment>
          ))}
        </h1>
        <p className="subtitle">{meta.subtitle}</p>
        <div className="lockrow-hero">
          {meta.locks.map((lock, i) => (
            <span key={i} className="lockpill">
              <span className="dot" style={{ background: lock.color }}></span> {lock.label}
            </span>
          ))}
        </div>
      </header>

      <div className="wrap">
        {/* Overview */}
        <section id={overview.id}>
          <h2 className="sec">
            <span className="num">{overview.num}</span>
            {overview.title} {overview.note ? <span className="lang-hu">{overview.note}</span> : null}
          </h2>
          <hr className="rule" />
          <Raw html={overview.introHtml} />
          <div className="grid two">
            {overview.columns.map((col, i) => (
              <div key={i} className="parent">
                <div className="ph">{col.title}</div>
                <Block md={col.body} />
              </div>
            ))}
          </div>
        </section>

        {/* Secret codes */}
        <section id={codes.id}>
          <h2 className="sec">
            <span className="num">{codes.num}</span>
            {codes.title} {codes.note ? <span className="lang-hu">{codes.note}</span> : null}
          </h2>
          <hr className="rule" />
          <div className="secret">
            <div className="ph">{codes.secret.heading}</div>
            <DataTable
              table={codes.secret}
              className="codes"
              badgeColumn={codes.secret.codeColumn}
              badgeClass="code"
            />
            {codes.secret.note ? (
              <Inline as="p" style={{ fontSize: '.85em', opacity: 0.85, marginTop: '10px' }} md={codes.secret.note} />
            ) : null}
          </div>
          <h3 style={SUBHEAD}>{codes.validation.heading}</h3>
          <DataTable
            table={codes.validation}
            className="val"
            badgeColumn={codes.validation.digitColumn}
            badgeClass="d"
          />
        </section>

        {/* Game flow */}
        <section>
          <h2 className="sec">
            <span className="num">{flow.num}</span>
            {flow.title} {flow.note ? <span className="lang-hu">{flow.note}</span> : null}
          </h2>
          <hr className="rule" />
          <div className="sessions">
            {flow.sessions.map((session, i) => (
              <div key={i} className="session">
                <span className="when">{session.when}</span>
                <h4>{session.title}</h4>
                <p style={{ fontSize: '.92em', margin: '.2em 0' }}>{session.lead}</p>
                <ul>
                  {session.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
                {session.foot ? (
                  <p style={{ fontSize: '.85em', color: 'var(--ink-soft)', margin: '.4em 0 0' }}>{session.foot}</p>
                ) : null}
              </div>
            ))}
          </div>
          {flow.footnote ? (
            <p style={{ fontSize: '.9em', color: 'var(--ink-soft)', marginTop: '10px' }}>{flow.footnote}</p>
          ) : null}
        </section>

        {/* Flat challenge list — each challenge renders its own lock header,
            intro, and unlock / break bars where it opens or closes a lock. */}
        <section id="kihivasok">
          {challenges.map((challenge) => (
            <Challenge key={challenge.id} challenge={challenge} />
          ))}
        </section>

        {/* Parent setup checklist */}
        <section id={tv.id}>
          <h2 className="sec">
            <span className="num">{tv.num}</span>
            {tv.title}{' '}
            {tv.note ? <span className={`lang-${tv.noteLang ?? 'hu'}`}>{tv.note}</span> : null}
          </h2>
          <hr className="rule" />
          <h3 style={SUBHEAD}>{tv.setup.heading}</h3>
          <div className="parent">
            <div className="ph">{tv.setup.ph}</div>
            <ul style={{ margin: '.2em 0', paddingLeft: '18px', fontSize: '.95em' }}>
              {tv.setup.items.map((item, i) => (
                <Inline key={i} as="li" md={item} />
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Printables */}
      <div className="wrap">
        <section id={printIntro.id} className="page-break">
          <div className="print-intro">
            <h2>{printIntro.heading}</h2>
            <Inline as="p" md={printIntro.lead} />
          </div>
          {printGroups.map((g) => (
            <div key={g.challengeId} className={g.svg ? 'printgroup printgroup--svg' : 'printgroup'}>
              {g.sheets.map((sheet, i) => (
                <PrintableSheet key={i} printable={sheet} />
              ))}
            </div>
          ))}
        </section>
      </div>

      <footer>
        {meta.footer.map((line, i) =>
          i === 0 ? (
            <p key={i}>{line}</p>
          ) : (
            <p key={i} className="noprint" style={{ fontSize: '.85em' }}>
              {line}
            </p>
          )
        )}
      </footer>
    </div>
  );
}

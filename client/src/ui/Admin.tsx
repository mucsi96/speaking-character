import { useEffect, useState } from 'react';
import {
  fetchState,
  putScript,
  putShow,
  subscribeState,
  type AppState,
  type Phase,
  type Scene,
  type Script,
} from '../api';

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Startbildschirm',
  playing: 'Spricht / Szene',
  entering: 'Code-Eingabe',
  celebrating: 'Jubeln',
  rejecting: 'Ablehnen',
  finished: 'Ende',
};

/**
 * Admin UI (served at `/admin`). Edit the show script and drive the live show
 * state. Everything is kept in sync with the server over SSE, so changes here
 * reach the TV display instantly — no reload on either side.
 */
export function Admin() {
  const [server, setServer] = useState<AppState | null>(null);
  const [draft, setDraft] = useState<Script | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let dropped = false;
    void fetchState().then((state) => {
      if (dropped) return;
      setServer(state);
      setDraft((current) => current ?? state.script);
    });
    // Mirror live server state. The effect below adopts the script into the
    // editable draft when there are no unsaved edits (so two admins don't fight).
    const unsubscribe = subscribeState((state) => {
      setServer(state);
      setConnected(true);
    });
    return () => {
      dropped = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the server pushes a script change and we have no unsaved edits, adopt
  // it so two admins don't fight. (Kept out of the SSE callback to read `dirty`.)
  useEffect(() => {
    if (server && !dirty) setDraft(server.script);
  }, [server, dirty]);

  if (!draft || !server) {
    return <div className="admin admin--loading">Lädt …</div>;
  }

  const editScene = (index: number, patch: Partial<Scene>) => {
    setDirty(true);
    setDraft({
      ...draft,
      scenes: draft.scenes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const removeScene = (index: number) => {
    setDirty(true);
    setDraft({ ...draft, scenes: draft.scenes.filter((_, i) => i !== index) });
  };

  const addScene = () => {
    setDirty(true);
    setDraft({
      ...draft,
      scenes: [...draft.scenes, { id: `scene-${draft.scenes.length}`, text: '' }],
    });
  };

  const editLines = (key: 'correctLines' | 'wrongLines', value: string) => {
    setDirty(true);
    setDraft({ ...draft, [key]: value.split('\n') });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await putScript(draft);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setDraft(server.script);
    setDirty(false);
    setError(null);
  };

  const drive = (phase: Phase, sceneIndex = server.show.sceneIndex) => {
    void putShow({ phase, sceneIndex });
  };

  const { show, script: liveScript } = server;
  const currentSceneId = liveScript.scenes[show.sceneIndex]?.id ?? '—';

  return (
    <div className="admin">
      <header className="admin__bar">
        <h1>🦜 Admin — Schatzsuche</h1>
        <span className={`admin__dot ${connected ? 'is-on' : ''}`} title="Live-Verbindung">
          {connected ? 'live' : 'offline'}
        </span>
      </header>

      {/* ---- Live show control ------------------------------------------- */}
      <section className="admin__panel">
        <h2>Bildschirm steuern</h2>
        <p className="admin__status">
          Aktuell: <strong>{PHASE_LABELS[show.phase]}</strong> · Szene{' '}
          <strong>{show.sceneIndex + 1}</strong> ({currentSceneId}) · rev {server.rev}
        </p>
        <p className="admin__hint">
          Die TV-Anzeige folgt diesen Schaltern sofort — sobald dort jemand
          „Start" oder „Weiter" gedrückt hat. Nach einem Neuladen zeigt die
          Anzeige immer zuerst den Start-/Weiter-Bildschirm.
        </p>

        <div className="admin__scenes-jump">
          {liveScript.scenes.map((scene, i) => (
            <button
              key={scene.id}
              className={`admin__chip ${i === show.sceneIndex ? 'is-active' : ''}`}
              onClick={() => drive('playing', i)}
            >
              {i + 1}. {scene.id}
            </button>
          ))}
        </div>

        <div className="admin__phase-buttons">
          <button onClick={() => drive('idle', 0)}>Startbildschirm</button>
          <button onClick={() => drive('playing')}>Szene abspielen</button>
          <button onClick={() => drive('entering')}>Code-Eingabe</button>
          <button onClick={() => drive('celebrating')}>Jubeln</button>
          <button onClick={() => drive('rejecting')}>Ablehnen</button>
          <button onClick={() => drive('finished')}>Ende</button>
        </div>
      </section>

      {/* ---- Script editor ------------------------------------------------ */}
      <section className="admin__panel">
        <div className="admin__panel-head">
          <h2>Skript bearbeiten</h2>
          <div className="admin__actions">
            {error && <span className="admin__error">{error}</span>}
            {dirty && <span className="admin__unsaved">ungespeicherte Änderungen</span>}
            <button onClick={revert} disabled={!dirty || saving}>
              Zurücksetzen
            </button>
            <button className="admin__save" onClick={save} disabled={!dirty || saving}>
              {saving ? 'Speichert …' : 'Speichern'}
            </button>
          </div>
        </div>

        {draft.scenes.map((scene, i) => (
          <div className="admin__scene" key={i}>
            <div className="admin__scene-head">
              <span className="admin__scene-no">Szene {i + 1}</span>
              <input
                className="admin__id"
                value={scene.id}
                aria-label="Szenen-ID"
                onChange={(e) => editScene(i, { id: e.target.value })}
              />
              <label className="admin__code">
                Code:
                <input
                  value={scene.code ?? ''}
                  inputMode="numeric"
                  maxLength={1}
                  placeholder="–"
                  onChange={(e) =>
                    editScene(i, {
                      code: e.target.value.replace(/\D/g, '').slice(0, 1) || undefined,
                    })
                  }
                />
              </label>
              <button
                className="admin__remove"
                onClick={() => removeScene(i)}
                disabled={draft.scenes.length <= 1}
                title="Szene entfernen"
              >
                ✕
              </button>
            </div>
            <textarea
              className="admin__text"
              value={scene.text}
              rows={4}
              onChange={(e) => editScene(i, { text: e.target.value })}
            />
          </div>
        ))}
        <button className="admin__add" onClick={addScene}>
          + Szene hinzufügen
        </button>

        <div className="admin__lines">
          <label>
            <span>Lob-Sätze (richtig) — eine Zeile pro Satz</span>
            <textarea
              rows={4}
              value={draft.correctLines.join('\n')}
              onChange={(e) => editLines('correctLines', e.target.value)}
            />
          </label>
          <label>
            <span>Aufmunter-Sätze (falsch) — eine Zeile pro Satz</span>
            <textarea
              rows={4}
              value={draft.wrongLines.join('\n')}
              onChange={(e) => editLines('wrongLines', e.target.value)}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

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
  idle: 'Start screen',
  playing: 'Speaking / Scene',
  entering: 'Code entry',
  celebrating: 'Celebrating',
  rejecting: 'Rejecting',
  finished: 'End',
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
    return <div className="admin admin--loading">Loading …</div>;
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
      setError(err instanceof Error ? err.message : 'Save failed.');
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
        <h1>🦜 Admin — Treasure Hunt</h1>
        <span className={`admin__dot ${connected ? 'is-on' : ''}`} title="Live connection">
          {connected ? 'live' : 'offline'}
        </span>
      </header>

      {/* ---- Live show control ------------------------------------------- */}
      <section className="admin__panel">
        <h2>Control screen</h2>
        <p className="admin__status">
          Current: <strong>{PHASE_LABELS[show.phase]}</strong> · Scene{' '}
          <strong>{show.sceneIndex + 1}</strong> ({currentSceneId}) · rev {server.rev}
        </p>
        <p className="admin__hint">
          The TV display follows these controls instantly — as soon as someone
          there has pressed “Start” or “Next”. After a reload, the display always
          shows the Start/Next screen first.
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
          <button onClick={() => drive('idle', 0)}>Start screen</button>
          <button onClick={() => drive('playing')}>Play scene</button>
          <button onClick={() => drive('entering')}>Code entry</button>
          <button onClick={() => drive('celebrating')}>Celebrate</button>
          <button onClick={() => drive('rejecting')}>Reject</button>
          <button onClick={() => drive('finished')}>End</button>
        </div>
      </section>

      {/* ---- Script editor ------------------------------------------------ */}
      <section className="admin__panel">
        <div className="admin__panel-head">
          <h2>Edit script</h2>
          <div className="admin__actions">
            {error && <span className="admin__error">{error}</span>}
            {dirty && <span className="admin__unsaved">unsaved changes</span>}
            <button onClick={revert} disabled={!dirty || saving}>
              Reset
            </button>
            <button className="admin__save" onClick={save} disabled={!dirty || saving}>
              {saving ? 'Saving …' : 'Save'}
            </button>
          </div>
        </div>

        {draft.scenes.map((scene, i) => (
          <div className="admin__scene" key={i}>
            <div className="admin__scene-head">
              <span className="admin__scene-no">Scene {i + 1}</span>
              <input
                className="admin__id"
                value={scene.id}
                aria-label="Scene ID"
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
                title="Remove scene"
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
          + Add scene
        </button>

        <div className="admin__lines">
          <label>
            <span>Praise lines (correct) — one sentence per line</span>
            <textarea
              rows={4}
              value={draft.correctLines.join('\n')}
              onChange={(e) => editLines('correctLines', e.target.value)}
            />
          </label>
          <label>
            <span>Encouragement lines (wrong) — one sentence per line</span>
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

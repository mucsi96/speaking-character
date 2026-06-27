import { useShow } from '../store';
import { audioEngine } from '../audio';

/**
 * Full-screen start overlay. The click/Enter here is the user gesture that
 * unlocks audio playback on the TV browser. If the server has saved progress, a
 * "Weiter" (resume) button continues from that scene; otherwise just Start.
 */
export function StartScreen() {
  const start = useShow((s) => s.start);
  const resume = useShow((s) => s.resume);
  const ready = useShow((s) => s.script !== null);
  const hasProgress = useShow((s) => s.hasProgress);
  const savedSceneIndex = useShow((s) => s.savedSceneIndex);

  const handleStart = () => {
    audioEngine.ensureContext();
    start();
  };

  const handleResume = () => {
    audioEngine.ensureContext();
    resume();
  };

  return (
    <div className="overlay overlay--center">
      <h1 className="title">🦜 Piraten-Schatzsuche</h1>
      <p className="subtitle">Drücke Start und das Abenteuer beginnt!</p>
      <div className="start-buttons">
        <button className="start-button" onClick={handleStart} disabled={!ready} autoFocus>
          {ready ? '▶ Start' : '… lädt …'}
        </button>
        {ready && hasProgress && (
          <button className="start-button start-button--secondary" onClick={handleResume}>
            ⏵ Weiter (Szene {savedSceneIndex + 1})
          </button>
        )}
      </div>
      <p className="hint">OK-Taste auf der Fernbedienung drücken</p>
    </div>
  );
}

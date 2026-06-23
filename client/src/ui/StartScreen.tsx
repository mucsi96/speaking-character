import { useShow } from '../store';
import { audioEngine } from '../audio';

/**
 * Full-screen start overlay. The click/Enter here is the user gesture that
 * unlocks audio playback on the TV browser.
 */
export function StartScreen() {
  const start = useShow((s) => s.start);

  const handleStart = () => {
    audioEngine.ensureContext();
    start();
  };

  return (
    <div className="overlay overlay--center">
      <h1 className="title">🦜 Piraten-Schatzsuche</h1>
      <p className="subtitle">Drücke Start und das Abenteuer beginnt!</p>
      <button className="start-button" onClick={handleStart} autoFocus>
        ▶ Start
      </button>
      <p className="hint">OK-Taste auf der Fernbedienung drücken</p>
    </div>
  );
}

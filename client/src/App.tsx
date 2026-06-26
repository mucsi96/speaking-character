import { Scene } from './three/Scene';
import { StartScreen } from './ui/StartScreen';
import { CodeInput } from './ui/CodeInput';
import { useRemote } from './useRemote';
import { useNarration } from './useNarration';
import { useShow } from './store';
import { scenes } from './scenes';

export default function App() {
  useRemote();
  useNarration();

  const phase = useShow((s) => s.phase);
  const sceneIndex = useShow((s) => s.sceneIndex);
  const reset = useShow((s) => s.reset);
  const scene = scenes[sceneIndex];

  return (
    <div className="app">
      <Scene />

      {phase === 'playing' && scene && (
        <div className="overlay overlay--top">
          <h2 className="scene-title">{scene.title}</h2>
        </div>
      )}

      {phase === 'idle' && <StartScreen />}
      {phase === 'entering' && <CodeInput />}

      {phase === 'celebrating' && (
        <div className="overlay overlay--top">
          <h2 className="feedback feedback--correct">✅ Richtig! Yo-ho-ho!</h2>
        </div>
      )}
      {phase === 'rejecting' && (
        <div className="overlay overlay--top">
          <h2 className="feedback feedback--wrong">❌ Oje, versucht es nochmal!</h2>
        </div>
      )}

      {phase === 'finished' && (
        <div className="overlay overlay--center">
          <h1 className="title">🎉 Geschafft!</h1>
          <p className="subtitle">Der Schatz ist gefunden. Alles Gute zum Geburtstag!</p>
          <button className="start-button" onClick={reset} autoFocus>
            Nochmal spielen
          </button>
        </div>
      )}
    </div>
  );
}

import { Scene } from './three/Scene';
import { StartScreen } from './ui/StartScreen';
import { CodeInput } from './ui/CodeInput';
import { WaitPrompt } from './ui/WaitPrompt';
import { useRemote } from './useRemote';
import { useNarration } from './useNarration';
import { useShow } from './store';

export default function App() {
  useRemote();
  useNarration();

  const phase = useShow((s) => s.phase);
  
  return (
    <div className="app">
      <Scene />

      {phase === 'idle' && <StartScreen />}
      {phase === 'waiting' && <WaitPrompt />}
      {phase === 'entering' && <CodeInput />}
    </div>
  );
}

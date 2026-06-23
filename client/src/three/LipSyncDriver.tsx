import { useFrame } from '@react-three/fiber';
import { audioEngine } from '../audio';
import { useShow } from '../store';

/**
 * Single per-frame reader of the audio amplitude. Writes the smoothed
 * mouth-open value into the store so the parrot (GLB or procedural) can drive
 * its jaw/beak without each component polling the analyser separately.
 */
export function LipSyncDriver(): null {
  useFrame(() => {
    const amp = audioEngine.getAmplitude();
    if (Math.abs(amp - useShow.getState().mouthOpen) > 0.001) {
      useShow.getState().setMouthOpen(amp);
    }
  });
  return null;
}

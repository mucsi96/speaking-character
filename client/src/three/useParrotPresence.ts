import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useShow } from '../store';

/**
 * Drives the parrot group's appear / idle / disappear motion.
 * - Scales in (and rises) once the show starts and stays visible for the whole
 *   show — through narration *and* the between-scene code prompts.
 * - Hidden (scale 0, sunk) only while `idle` (start screen) — so it sinks away
 *   on reset and scales back in on the next start.
 * - Gentle idle bob + sway while visible.
 *
 * Visibility is deliberately decoupled from narration timing: tying it to the
 * `playing` phase made the parrot flash out the instant narration finished (or
 * failed fast when TTS is unconfigured), which looked like it vanished as soon
 * as it started talking.
 * Returns a ref to attach to the parrot's root <group>.
 */
export function useParrotPresence() {
  const ref = useRef<THREE.Group>(null);
  const visibleAmount = useRef(0);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;

    // Present for the whole show; only hidden on the idle start screen.
    const visible = useShow.getState().phase !== 'idle';
    const target = visible ? 1 : 0;
    // Smoothly approach the target visibility (frame-rate independent).
    visibleAmount.current = THREE.MathUtils.damp(
      visibleAmount.current,
      target,
      6,
      delta
    );
    const v = visibleAmount.current;

    group.scale.setScalar(v);
    group.visible = v > 0.01;

    const t = state.clock.elapsedTime;
    // Rise into view, plus a soft idle bob and sway.
    group.position.y = THREE.MathUtils.lerp(-0.8, 0, v) + Math.sin(t * 1.6) * 0.04 * v;
    group.rotation.z = Math.sin(t * 1.1) * 0.04 * v;
    group.rotation.y = Math.sin(t * 0.5) * 0.12 * v;
  });

  return ref;
}

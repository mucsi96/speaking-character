import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useShow } from '../store';

/**
 * Drives the parrot group's appear / idle / disappear motion.
 * - Visible (scale 1, raised) while the show is `playing`.
 * - Hidden (scale 0, sunk) otherwise.
 * - Gentle idle bob + sway while visible.
 * Returns a ref to attach to the parrot's root <group>.
 */
export function useParrotPresence() {
  const ref = useRef<THREE.Group>(null);
  const visibleAmount = useRef(0);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;

    const visible = useShow.getState().phase === 'playing';
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

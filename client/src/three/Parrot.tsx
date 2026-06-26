import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

const MODEL_URL = '/models/coco.glb';

// Named AnimationClips exported from Blender (Animation Mode = "NLA Tracks"), one
// 1-second clip per control. Each clip animates only its own bones (jaw vs. the
// two wings), so we can run both at full weight at once without them fighting.
const JAW_CLIP = 'jaw_close';
const WINGS_CLIP = 'wings_down';

/**
 * The real "Coco" parrot exported from Blender (`coco.glb`). Instead of driving
 * bones by hand, we play the two baked clips *paused* at full weight and scrub
 * each clip's playhead from a 0→1 signal:
 *
 * - `jaw_close` — scrubbed from the narration amplitude for lip-sync. The clip
 *   runs rest/open (t=0) → closed (t=end), so we scrub `1 - mouthOpen`: closed in
 *   silence, opening as the voice gets louder. (Drop the `1 -` if your clip is
 *   authored the other way round.)
 * - `wings_down` — scrubbed from a gentle idle flap plus the speech energy, so
 *   the wings always move a little and flap harder while it talks.
 */
export function Parrot() {
  const root = useParrotPresence();
  const { scene, animations } = useGLTF(MODEL_URL);
  // Clone so multiple mounts / HMR don't mutate the cached source scene.
  // IMPORTANT: SkeletonUtils.clone, not scene.clone(true) — the parrot is a
  // SkinnedMesh, and a plain Object3D.clone() leaves the cloned mesh bound to
  // the original skeleton, so the mixer's bone animation never reaches the body.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions } = useAnimations(animations, model);

  // Start both clips playing but paused at full weight. We set each action's
  // `time` every frame; drei's useAnimations runs mixer.update, which applies the
  // posed (paused) clips to the bones.
  useEffect(() => {
    for (const name of [JAW_CLIP, WINGS_CLIP]) {
      const action = actions[name];
      if (!action) continue;
      action.reset();
      action.play();
      action.setEffectiveWeight(1);
      action.paused = true;
      action.time = 0;
    }
  }, [actions]);

  // Smoothed "is speaking" envelope that drives how hard the wings flap.
  const speakEnergy = useRef(0);

  useFrame((state, delta) => {
    const mouth = useShow.getState().mouthOpen;
    const t = state.clock.elapsedTime;

    // Lip-sync: scrub the jaw clip — closed in silence, open with the voice.
    const jaw = actions[JAW_CLIP];
    if (jaw) {
      const dur = jaw.getClip().duration;
      jaw.time = THREE.MathUtils.clamp(1 - mouth, 0, 1) * dur;
    }

    // Wings: ease toward the current speech energy; a baseline idle flap keeps
    // the bird alive when quiet, speech layers a faster, wider flap on top.
    speakEnergy.current = THREE.MathUtils.damp(
      speakEnergy.current,
      mouth,
      8,
      delta
    );
    const energy = speakEnergy.current;
    const idleFlap = 0.12 + 0.08 * Math.sin(t * 2.2);
    const speakFlap = energy * (0.5 + 0.5 * Math.sin(t * (4 + energy * 10)));
    const wingsDown = THREE.MathUtils.clamp(idleFlap + speakFlap, 0, 1);

    const wings = actions[WINGS_CLIP];
    if (wings) {
      const dur = wings.getClip().duration;
      wings.time = wingsDown * dur;
    }
  });

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

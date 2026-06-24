import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

const MODEL_URL = '/models/coco.glb';

// Exact shape-key (morph target) names authored in Blender. The model exposes
// these two and we drive them directly — no rig guessing.
const JAW_CLOSE = 'jaw_close';
const WINGS_DOWN = 'wings_down';

interface MorphRef {
  mesh: THREE.Mesh;
  index: number;
}

/** Find the mesh + influence index for a named morph target anywhere in the tree. */
function findMorph(root: THREE.Object3D, name: string): MorphRef | null {
  let found: MorphRef | null = null;
  root.traverse((obj) => {
    if (found) return;
    const mesh = obj as THREE.Mesh;
    const dict = mesh.morphTargetDictionary;
    if (dict && name in dict) {
      found = { mesh, index: dict[name] };
    }
  });
  return found;
}

function setMorph(ref: MorphRef | null, value: number): void {
  if (!ref) return;
  const infl = ref.mesh.morphTargetInfluences;
  if (infl) infl[ref.index] = value;
}

/**
 * The real "Coco" parrot exported from Blender (`coco.glb`). It carries two
 * shape keys that we animate every frame:
 *
 * - `jaw_close` — closes the beak. The base mesh is modelled mouth-open, so the
 *   beak rests fully closed (influence 1) and *opens* with the narration
 *   amplitude: `jaw_close = 1 - mouthOpen`. This is the lip-sync.
 * - `wings_down` — lowers the wings. We keep them softly relaxed at idle and let
 *   the parrot flap with rising excitement while it speaks, so the whole body
 *   feels alive during narration rather than just the beak.
 */
export function Parrot() {
  const root = useParrotPresence();
  const { scene, animations } = useGLTF(MODEL_URL);
  // Clone so multiple mounts / HMR don't mutate the cached source scene.
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions, names } = useAnimations(animations, model);

  const jaw = useMemo(() => findMorph(model, JAW_CLOSE), [model]);
  const wings = useMemo(() => findMorph(model, WINGS_DOWN), [model]);

  // Play a built-in idle clip if the model ships one (harmless no-op otherwise).
  useEffect(() => {
    if (names.length === 0) return;
    const idle = names.find((n) => /idle|breath|fly|loop/i.test(n)) ?? names[0];
    const action = actions[idle];
    action?.reset().fadeIn(0.3).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names]);

  // Smoothed "is speaking" envelope that drives how hard the wings flap.
  const speakEnergy = useRef(0);

  useFrame((state, delta) => {
    const mouth = useShow.getState().mouthOpen;
    const t = state.clock.elapsedTime;

    // Lip-sync: beak rests closed, opens with the voice amplitude.
    setMorph(jaw, 1 - mouth);

    // Wings: ease toward the current speech energy, then flap faster + wider the
    // louder the narration. At rest they settle to a slightly-relaxed pose.
    speakEnergy.current = THREE.MathUtils.damp(
      speakEnergy.current,
      mouth,
      8,
      delta
    );
    const energy = speakEnergy.current;
    // Baseline idle flap so the parrot always looks alive, even before/without
    // narration (no audio → no speech energy). Speech adds a faster, wider flap
    // on top, so it gets livelier the louder it talks.
    const idleFlap = 0.12 + 0.08 * Math.sin(t * 2.2);
    const speakFlap = energy * (0.5 + 0.5 * Math.sin(t * (4 + energy * 10)));
    setMorph(wings, THREE.MathUtils.clamp(idleFlap + speakFlap, 0, 1));
  });

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

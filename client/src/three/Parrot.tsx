import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

const MODEL_URL = '/models/pirate-parrot.glb';

// Names that typically identify a mouth/jaw on a rigged model.
const JAW_NAME = /(jaw|beak|mouth|mandible|chin)/i;
const MOUTH_MORPH = /(jaw|mouth|open|aa|viseme|talk)/i;

/**
 * The real Sketchfab "Pirate Parrot" (CC-BY, Lautaro Masseroni). Plays the
 * model's built-in idle animation and lip-syncs by driving whatever the rig
 * exposes: a jaw/beak bone, a mouth morph target, or — failing both — a subtle
 * head bob scaled by the narration amplitude.
 */
export function Parrot() {
  const root = useParrotPresence();
  const { scene, animations } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const { actions, names } = useAnimations(animations, cloned);

  // Locate a jaw bone and/or a mouth morph target once the model is ready.
  const rig = useMemo<{
    jaw: THREE.Object3D | null;
    jawBaseX: number;
    morphMesh: THREE.Mesh | null;
    morphIndex: number;
  }>(() => {
    let jaw: THREE.Object3D | null = null;
    let jawBaseX = 0;
    let morphMesh: THREE.Mesh | null = null;
    let morphIndex = -1;

    cloned.traverse((obj) => {
      if (!jaw && JAW_NAME.test(obj.name)) {
        jaw = obj;
        jawBaseX = obj.rotation.x;
      }
      const mesh = obj as THREE.Mesh;
      if (morphIndex < 0 && mesh.morphTargetDictionary) {
        for (const [key, idx] of Object.entries(mesh.morphTargetDictionary)) {
          if (MOUTH_MORPH.test(key)) {
            morphMesh = mesh;
            morphIndex = idx;
            break;
          }
        }
      }
    });

    return { jaw, jawBaseX, morphMesh, morphIndex };
  }, [cloned]);

  // Play the first/looping animation as an idle.
  useEffect(() => {
    if (names.length === 0) return;
    const idle =
      names.find((n) => /idle|breath|fly|loop/i.test(n)) ?? names[0];
    const action = actions[idle];
    action?.reset().fadeIn(0.3).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names]);

  const headBob = useRef(0);

  useFrame((_state, delta) => {
    const mouth = useShow.getState().mouthOpen;

    if (rig.jaw) {
      (rig.jaw as THREE.Object3D).rotation.x = rig.jawBaseX + mouth * 0.5;
    } else if (rig.morphMesh && rig.morphIndex >= 0) {
      const infl = rig.morphMesh.morphTargetInfluences;
      if (infl) infl[rig.morphIndex] = mouth;
    } else {
      // No mouth rig: bob the whole model a touch while speaking.
      headBob.current = THREE.MathUtils.damp(headBob.current, mouth, 10, delta);
      cloned.rotation.x = headBob.current * 0.12;
    }
  });

  return (
    <group ref={root}>
      <primitive object={cloned} />
    </group>
  );
}

// Preload is intentionally not called: if the asset is absent we want the
// ModelErrorBoundary to catch the failure and show the procedural parrot.

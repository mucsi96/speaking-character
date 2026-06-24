import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

const MODEL_URL = '/models/coco.glb';

// Bone names exported from the Blender armature (`Parrot_Rig`).
const JAW_BONE = 'jaw';
const WING_L_BONE = 'wing.L';
const WING_R_BONE = 'wing.R';

// ---------------------------------------------------------------------------
// We re-implement the Blender drivers in code.
//
// In Blender the mouth/wings are NOT mesh morphs — `jaw_close` and `wings_down`
// are empty 0–1 control dials, and a *driver* turns each dial into an axis-angle
// bone rotation. glTF 2.0 exports neither drivers nor empty shape keys' intent,
// so we reproduce the drivers here. The driven channel is the bone's axis-angle
// "Rotation W" (= rotation angle in radians):
//
//   jaw    : W = jaw_close  * -1
//   wing.L : W = wings_down *  1.308997   (≈  75°)
//   wing.R : W = wings_down * -1.308997   (≈ -75°, mirror of the left)
//
// Each angle is applied around the bone's local hinge axis (its axis-angle
// X/Y/Z) on top of the exported rest rotation. If a hinge twists instead of
// swinging, change the matching *_AXIS to a different local unit vector.
// ---------------------------------------------------------------------------
const JAW_FACTOR = -1;
const WING_L_FACTOR = 1.308997;
const WING_R_FACTOR = -1.308997;

const JAW_AXIS = new THREE.Vector3(1, 0, 0);
const WING_AXIS = new THREE.Vector3(1, 0, 0);

interface BoneRig {
  jaw?: THREE.Object3D;
  wingL?: THREE.Object3D;
  wingR?: THREE.Object3D;
  restJaw?: THREE.Quaternion;
  restWingL?: THREE.Quaternion;
  restWingR?: THREE.Quaternion;
}

/**
 * The real "Coco" parrot exported from Blender (`coco.glb`). The mouth and wings
 * are animated by rotating the armature bones every frame (the Blender drivers,
 * reproduced in code — see the notes above):
 *
 * - `jaw` — beak rests open and *closes* as `jaw_close` rises. We drive
 *   `jaw_close = 1 - mouthOpen`, so it sits closed in silence and swings open
 *   with the narration amplitude (lip-sync).
 * - `wing.L` / `wing.R` — flap from a `wings_down` value: a gentle idle flap so
 *   the bird always looks alive, plus a faster, wider flap layered on from the
 *   speech energy while it talks.
 */
export function Parrot() {
  const root = useParrotPresence();
  const { scene, animations } = useGLTF(MODEL_URL);
  // Clone so multiple mounts / HMR don't mutate the cached source scene.
  // IMPORTANT: SkeletonUtils.clone, not scene.clone(true) — the parrot is a
  // SkinnedMesh, and a plain Object3D.clone() leaves the cloned mesh bound to
  // the original skeleton so our bone rotations never reach the rendered body.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, names } = useAnimations(animations, model);

  // Grab the bones by name and snapshot their exported rest rotations so each
  // frame's rotation is a clean delta from rest rather than an accumulation.
  const rig = useMemo<BoneRig>(() => {
    const jaw = model.getObjectByName(JAW_BONE);
    const wingL = model.getObjectByName(WING_L_BONE);
    const wingR = model.getObjectByName(WING_R_BONE);
    return {
      jaw,
      wingL,
      wingR,
      restJaw: jaw?.quaternion.clone(),
      restWingL: wingL?.quaternion.clone(),
      restWingR: wingR?.quaternion.clone(),
    };
  }, [model]);

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
  // Reusable scratch quaternion so we don't allocate every frame.
  const tmpQ = useRef(new THREE.Quaternion());

  useFrame((state, delta) => {
    const mouth = useShow.getState().mouthOpen;
    const t = state.clock.elapsedTime;
    const q = tmpQ.current;

    // --- Mouth: jaw_close dial — closed in silence, opens with the voice. ---
    if (rig.jaw && rig.restJaw) {
      const jawClose = 1 - mouth; // 0..1 control dial
      q.setFromAxisAngle(JAW_AXIS, jawClose * JAW_FACTOR);
      rig.jaw.quaternion.copy(rig.restJaw).multiply(q);
    }

    // --- Wings: wings_down dial — idle flap + speech energy. ---
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

    if (rig.wingL && rig.restWingL) {
      q.setFromAxisAngle(WING_AXIS, wingsDown * WING_L_FACTOR);
      rig.wingL.quaternion.copy(rig.restWingL).multiply(q);
    }
    if (rig.wingR && rig.restWingR) {
      q.setFromAxisAngle(WING_AXIS, wingsDown * WING_R_FACTOR);
      rig.wingR.quaternion.copy(rig.restWingR).multiply(q);
    }
  });

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

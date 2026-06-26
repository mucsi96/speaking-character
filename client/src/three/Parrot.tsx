import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

const MODEL_URL = '/models/coco.glb';

// Named AnimationClips exported from Blender (Animation Mode = "NLA Tracks").
// `jaw_close` / `wings_down` are 1-second clips we scrub by hand for lip-sync
// and flapping. `celebrate` / `wrong` are full-body reaction clips (0–36 frames)
// we play once, start to finish, for correct / incorrect code answers.
const JAW_CLIP = 'jaw_close';
const WINGS_CLIP = 'wings_down';
const CELEBRATE_CLIP = 'celebrate';
const WRONG_CLIP = 'wrong';
// The idle drivers we scrub each frame; muted while a reaction clip owns the body.
const IDLE_CLIPS = [JAW_CLIP, WINGS_CLIP];
// Play the celebrate/wrong reactions at 1/5 speed for a calmer, slower motion.
const REACTION_TIME_SCALE = 0.2;

/**
 * The real "Coco" parrot exported from Blender (`coco.glb`). Instead of driving
 * bones by hand, we play the two baked idle clips *paused* at full weight and
 * scrub each clip's playhead from a 0→1 signal:
 *
 * - `jaw_close` — scrubbed from the narration amplitude for lip-sync. The clip
 *   runs rest/open (t=0) → closed (t=end), so we scrub `1 - mouthOpen`: closed in
 *   silence, opening as the voice gets louder. (Drop the `1 -` if your clip is
 *   authored the other way round.)
 * - `wings_down` — scrubbed from a gentle idle flap plus the speech energy, so
 *   the wings always move a little and flap harder while it talks.
 *
 * On top of that, the `celebrate` / `wrong` clips play as one-shots when the kids
 * answer a code: while one runs we mute the idle scrub so the reaction owns the
 * whole body, then report back to the store when it finishes.
 */
export function Parrot() {
  const root = useParrotPresence();
  const { scene, animations } = useGLTF(MODEL_URL);
  // Clone so multiple mounts / HMR don't mutate the cached source scene.
  // IMPORTANT: SkeletonUtils.clone, not scene.clone(true) — the parrot is a
  // SkinnedMesh, and a plain Object3D.clone() leaves the cloned mesh bound to
  // the original skeleton, so the mixer's bone animation never reaches the body.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, model);

  const phase = useShow((s) => s.phase);

  // True while a `celebrate`/`wrong` clip is playing, so the per-frame idle
  // scrub stands down and lets the reaction drive the whole body.
  const reacting = useRef(false);

  // Log which clips the loaded model actually carries, so it's obvious from the
  // console whether `celebrate` / `wrong` made it into this export of coco.glb.
  useEffect(() => {
    console.log(
      '[Parrot] discovered animation clips:',
      animations.map((c) => c.name)
    );
  }, [animations]);

  // Start both idle clips playing but paused at full weight. We set each action's
  // `time` every frame; drei's useAnimations runs mixer.update, which applies the
  // posed (paused) clips to the bones.
  useEffect(() => {
    for (const name of IDLE_CLIPS) {
      const action = actions[name];
      if (!action) continue;
      action.reset();
      action.play();
      action.setEffectiveWeight(1);
      action.paused = true;
      action.time = 0;
    }
  }, [actions]);

  // Play a one-shot reaction clip for the correct (`celebrate`) / wrong (`wrong`)
  // answer. This is purely visual — the matching praise/try-again speech in
  // useNarration owns the phase transition, so the show advances correctly even
  // when an older model lacks these clips.
  useEffect(() => {
    const clipName =
      phase === 'celebrating'
        ? CELEBRATE_CLIP
        : phase === 'rejecting'
        ? WRONG_CLIP
        : null;
    if (!clipName) return;

    const action = actions[clipName];
    if (!action) {
      console.warn(
        `[Parrot] reaction clip "${clipName}" not found in model — re-export coco.glb with this NLA track to see the animation.`
      );
      return; // model doesn't carry this clip (older export)
    }

    const restoreIdle = () => {
      reacting.current = false;
      for (const name of IDLE_CLIPS) actions[name]?.setEffectiveWeight(1);
    };

    reacting.current = true;
    // Mute the idle scrub so the reaction clip is the only thing posing the body.
    for (const name of IDLE_CLIPS) actions[name]?.setEffectiveWeight(0);

    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(REACTION_TIME_SCALE);
    action.paused = false;
    action.play();

    // When the short clip ends, hand the body back so lip-sync resumes for the
    // rest of the spoken line.
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if (e.action === action) restoreIdle();
    };
    mixer.addEventListener('finished', onFinished);

    return () => {
      mixer.removeEventListener('finished', onFinished);
      action.stop();
      restoreIdle();
    };
  }, [phase, actions, mixer]);

  // Smoothed "is speaking" envelope that drives how hard the wings flap.
  const speakEnergy = useRef(0);

  useFrame((state, delta) => {
    // While a reaction clip owns the body, leave the idle scrub alone.
    if (reacting.current) return;

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
    // Flap 5x slower while speaking for a calmer wing motion.
    const speakFlap = energy * (0.5 + 0.5 * Math.sin((t * (4 + energy * 10)) / 5));
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

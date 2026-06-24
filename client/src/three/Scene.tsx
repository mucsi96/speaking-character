import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Suspense } from 'react';
import { Island } from './Island';
import { Parrot } from './Parrot';
import { LipSyncDriver } from './LipSyncDriver';

/**
 * The full 3D stage: a procedural pirate island with the talking `coco.glb`
 * parrot, framed for a TV. The parrot loads under Suspense.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.4, 6], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0b1f3a']} />
      <Sky sunPosition={[5, 3, 2]} turbidity={6} rayleigh={1.5} />

      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#bfe3ff', '#3a2a14', 0.7]} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Island />
      <Suspense fallback={null}>
        <Parrot />
      </Suspense>

      <LipSyncDriver />
    </Canvas>
  );
}

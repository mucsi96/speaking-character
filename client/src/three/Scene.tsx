import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Suspense } from 'react';
import { Island, ProceduralIsland } from './Island';
import { Parrot } from './Parrot';
import { ProceduralParrot } from './ProceduralParrot';
import { LipSyncDriver } from './LipSyncDriver';
import { ModelErrorBoundary } from './ModelErrorBoundary';

/**
 * The full 3D stage: a pirate island with the talking parrot, framed for a TV.
 * Both GLB assets degrade gracefully to procedural placeholders if missing.
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

      <Suspense fallback={null}>
        <ModelErrorBoundary label="island" fallback={<ProceduralIsland />}>
          <Island />
        </ModelErrorBoundary>

        <ModelErrorBoundary label="parrot" fallback={<ProceduralParrot />}>
          <Parrot />
        </ModelErrorBoundary>
      </Suspense>

      <LipSyncDriver />
    </Canvas>
  );
}

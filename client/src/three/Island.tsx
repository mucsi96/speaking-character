import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

const MODEL_URL = '/models/island.glb';

/**
 * The pirate island stage from Sketchfab, used as the environment the parrot
 * stands on. Position/scale are conservative defaults — tweak `scale`/`position`
 * here to frame your specific model nicely.
 */
export function Island() {
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={[0, -1.1, 0]} scale={1}>
      <primitive object={cloned} />
    </group>
  );
}

/**
 * Simple placeholder island (sandy disc + water plane) shown when island.glb
 * is not present, so the scene never looks empty.
 */
export function ProceduralIsland() {
  return (
    <group position={[0, -1.1, 0]}>
      {/* Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#1f7fb8" />
      </mesh>
      {/* Sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#e9d8a6" />
      </mesh>
      {/* A little palm trunk + leaves for flavour */}
      <mesh position={[1.8, 0.7, -1.2]}>
        <cylinderGeometry args={[0.12, 0.18, 1.6, 8]} />
        <meshStandardMaterial color="#8d6748" />
      </mesh>
      <mesh position={[1.8, 1.5, -1.2]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#2a9d4a" />
      </mesh>
    </group>
  );
}

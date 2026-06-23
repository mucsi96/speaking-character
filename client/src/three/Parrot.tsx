import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useShow } from '../store';
import { useParrotPresence } from './useParrotPresence';

/**
 * Cartoon pirate parrot built entirely from geometry primitives. Classic red
 * macaw with an eye patch and a tricorn-ish hat; the lower beak opens with the
 * narration amplitude (useShow().mouthOpen).
 */
export function Parrot() {
  const root = useParrotPresence();
  const lowerBeak = useRef<THREE.Group>(null);

  useFrame(() => {
    const mouth = useShow.getState().mouthOpen;
    if (lowerBeak.current) {
      lowerBeak.current.rotation.x = 0.05 + mouth * 0.5;
    }
  });

  const red = '#d62828';
  const redDark = '#9d1414';
  const yellow = '#ffd23f';
  const beak = '#2b2b2b';

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Tail feathers */}
      <group position={[0, -0.2, -0.5]} rotation={[0.5, 0, 0]}>
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, x * 1.2]}>
            <boxGeometry args={[0.12, 0.9, 0.05]} />
            <meshStandardMaterial color={i === 1 ? '#1d70b8' : yellow} />
          </mesh>
        ))}
      </group>

      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.55, 0.7, 12, 24]} />
        <meshStandardMaterial color={red} />
      </mesh>
      {/* Lighter belly */}
      <mesh position={[0, -0.1, 0.42]} scale={[0.7, 0.9, 0.5]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={yellow} />
      </mesh>

      {/* Wings */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.55, 0.05, 0]}
          rotation={[0, 0, side * 0.3]}
          scale={[0.25, 0.6, 0.5]}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={redDark} />
        </mesh>
      ))}

      {/* Head */}
      <group position={[0, 0.85, 0.05]}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 28, 28]} />
          <meshStandardMaterial color={red} />
        </mesh>

        {/* Eyes */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.22, 0.12, 0.4]}>
            <mesh>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        ))}

        {/* Pirate eye patch over the left eye */}
        <group position={[-0.22, 0.12, 0.41]}>
          <mesh>
            <circleGeometry args={[0.16, 24]} />
            <meshStandardMaterial color="#0a0a0a" side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* Eye patch strap */}
        <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.5, 0.02, 8, 40, Math.PI]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>

        {/* Beak */}
        <group position={[0, -0.05, 0.5]}>
          {/* Upper beak (fixed) */}
          <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]} position={[0, 0.05, 0.05]}>
            <coneGeometry args={[0.22, 0.4, 16]} />
            <meshStandardMaterial color={beak} />
          </mesh>
          {/* Lower beak (animated) */}
          <group ref={lowerBeak} position={[0, -0.02, 0]}>
            <mesh rotation={[Math.PI / 2 - 0.2, 0, 0]} position={[0, -0.08, 0.04]}>
              <coneGeometry args={[0.17, 0.28, 16]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
        </group>

        {/* Pirate hat */}
        <group position={[0, 0.48, -0.02]}>
          <mesh rotation={[-0.15, 0, 0]}>
            <cylinderGeometry args={[0.52, 0.58, 0.08, 24]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.42, 0.4, 24]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          {/* Skull dot */}
          <mesh position={[0, 0.12, 0.4]}>
            <circleGeometry args={[0.1, 20]} />
            <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* Feet */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, -0.95, 0.1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
          <meshStandardMaterial color={yellow} />
        </mesh>
      ))}
    </group>
  );
}

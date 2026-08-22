import { RigidBody } from '@react-three/rapier';

export function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[500, 500, 1]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.95} metalness={0} />
      </mesh>
    </RigidBody>
  );
}

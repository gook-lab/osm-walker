import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { useGame } from 'ecctrl';
import * as THREE from 'three';
import { CHARACTER_CONFIG } from '@/constants';
import { useCharacter, useSetPlayerPosition } from '@/stores';
import { getStandardMaterial } from '@/utils/materialPool';

/**
 * 플레이어 캐릭터 컴포넌트
 * ecctrl을 사용하여 WASD 이동 구현
 */
export function Character() {
  const setPlayerPosition = useSetPlayerPosition();
  const frameCount = useRef(0);

  // 카메라 위치를 스토어에 업데이트 (30프레임마다)
  useFrame(({ camera }) => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return;

    setPlayerPosition({
      x: camera.position.x,
      z: camera.position.z,
    });
  });

  return (
    <Ecctrl
      // 시작 위치 (땅 위에서 시작)
      position={[0, 1, 0]}
      // 이동 설정
      maxVelLimit={CHARACTER_CONFIG.walkSpeed}
      sprintMult={CHARACTER_CONFIG.runSpeed / CHARACTER_CONFIG.walkSpeed}
      // 물리 설정
      capsuleRadius={0.3}
      capsuleHalfHeight={0.4}
      floatHeight={0}
      // 점프 비활성화
      jumpVel={CHARACTER_CONFIG.jumpEnabled ? 4 : 0}
      // 카메라 설정
      camInitDis={-15}
      camMaxDis={-20}
      camMinDis={-5}
      // 회전
      turnSpeed={15}
      turnVelMultiplier={0.5}
      // 모드 설정
      mode="CameraBasedMovement"
      // 자동 균형 비활성화
      autoBalance={false}
    >
      {/* 커스터마이징 가능한 캐릭터 메쉬 (애니메이션 포함) */}
      <AnimatedCharacterMesh />
    </Ecctrl>
  );
}

/**
 * 애니메이션이 적용된 캐릭터 메쉬
 * 걷기 시 다리/팔 스윙 + 몸 흔들림
 */
function AnimatedCharacterMesh() {
  const character = useCharacter();
  const { skinColor, hairColor, clothColor, shoeColor } = character;
  const blushColor = '#FFB6C1';

  // 머티리얼 풀링 - 같은 색상의 파츠들이 머티리얼 공유
  const materials = useMemo(() => ({
    skin: getStandardMaterial({ color: skinColor }),
    hair: getStandardMaterial({ color: hairColor }),
    cloth: getStandardMaterial({ color: clothColor }),
    shoe: getStandardMaterial({ color: shoeColor }),
    eyeBlack: getStandardMaterial({ color: '#1a1a1a' }),
    eyeWhite: getStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.5 }),
    blush: getStandardMaterial({ color: blushColor, transparent: true, opacity: 0.6 }),
    mouth: getStandardMaterial({ color: '#E88888' }),
  }), [skinColor, hairColor, clothColor, shoeColor]);

  // 애니메이션용 refs
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // 애니메이션 시간
  const animTime = useRef(0);

  // ecctrl에서 이동 상태 감지
  const curAnimation = useGame(state => state.curAnimation);

  useFrame((_, delta) => {
    // 이동 감지 (ecctrl 애니메이션 상태 기반)
    const moving = curAnimation === 'walk' || curAnimation === 'run';

    if (moving) {
      // 걷기 속도 (빠른 템포)
      animTime.current += delta * 10;
    } else {
      // 정지 시 서서히 원위치로
      animTime.current *= 0.9;
    }

    const t = animTime.current;
    const swing = Math.sin(t) * 0.4; // 스윙 강도

    // 다리 애니메이션 (교차 스윙)
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = swing;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -swing;
    }

    // 팔 애니메이션 (다리와 반대로)
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -swing * 0.6;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = swing * 0.6;
    }

    // 몸 흔들림 (작은 상하/좌우 움직임)
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.abs(Math.sin(t * 2)) * 0.03;
      bodyRef.current.rotation.z = Math.sin(t) * 0.03;
    }
  });

  return (
    <group>
      {/* === 하체 (애니메이션 적용) === */}
      {/* 왼쪽 다리 그룹 */}
      <group ref={leftLegRef} position={[-0.12, 0.25, 0]}>
        <mesh position={[0, -0.1, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        {/* 왼쪽 신발 */}
        <mesh position={[0, -0.23, 0.03]} material={materials.shoe}>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
        </mesh>
      </group>

      {/* 오른쪽 다리 그룹 */}
      <group ref={rightLegRef} position={[0.12, 0.25, 0]}>
        <mesh position={[0, -0.1, 0]} material={materials.skin}>
          <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        </mesh>
        {/* 오른쪽 신발 */}
        <mesh position={[0, -0.23, 0.03]} material={materials.shoe}>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
        </mesh>
      </group>

      {/* === 상체 그룹 (흔들림 적용) === */}
      <group ref={bodyRef}>
        {/* 몸통 (옷) */}
        <mesh position={[0, 0.5, 0]} castShadow material={materials.cloth}>
          <capsuleGeometry args={[0.22, 0.35, 8, 16]} />
        </mesh>

        {/* === 팔 (애니메이션 적용) === */}
        {/* 왼쪽 팔 그룹 */}
        <group ref={leftArmRef} position={[-0.32, 0.6, 0]}>
          <mesh position={[0, -0.1, 0]} rotation={[0, 0, 0.3]} material={materials.skin}>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
          </mesh>
        </group>

        {/* 오른쪽 팔 그룹 */}
        <group ref={rightArmRef} position={[0.32, 0.6, 0]}>
          <mesh position={[0, -0.1, 0]} rotation={[0, 0, -0.3]} material={materials.skin}>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
          </mesh>
        </group>

        {/* === 머리 === */}
        <mesh position={[0, 1.05, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.38, 16, 16]} />
        </mesh>

        {/* === 머리카락 === */}
        <mesh position={[0, 1.25, 0.2]} material={materials.hair}>
          <sphereGeometry args={[0.3, 8, 8]} />
        </mesh>
        <mesh position={[0, 1.15, -0.15]} material={materials.hair}>
          <sphereGeometry args={[0.4, 8, 8]} />
        </mesh>
        <mesh position={[-0.28, 1.0, 0]} material={materials.hair}>
          <sphereGeometry args={[0.18, 8, 8]} />
        </mesh>
        <mesh position={[0.28, 1.0, 0]} material={materials.hair}>
          <sphereGeometry args={[0.18, 8, 8]} />
        </mesh>

        {/* === 얼굴 === */}
        {/* 눈 (왼쪽) */}
        <mesh position={[-0.12, 1.05, 0.32]} material={materials.eyeBlack}>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
        <mesh position={[-0.1, 1.08, 0.38]} material={materials.eyeWhite}>
          <sphereGeometry args={[0.025, 6, 6]} />
        </mesh>

        {/* 눈 (오른쪽) */}
        <mesh position={[0.12, 1.05, 0.32]} material={materials.eyeBlack}>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
        <mesh position={[0.14, 1.08, 0.38]} material={materials.eyeWhite}>
          <sphereGeometry args={[0.025, 6, 6]} />
        </mesh>

        {/* 볼터치 */}
        <mesh position={[-0.25, 0.95, 0.28]} material={materials.blush}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>
        <mesh position={[0.25, 0.95, 0.28]} material={materials.blush}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>

        {/* 입 (작은 미소) */}
        <mesh position={[0, 0.92, 0.35]} rotation={[0.2, 0, 0]} material={materials.mouth}>
          <torusGeometry args={[0.04, 0.015, 8, 16, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}

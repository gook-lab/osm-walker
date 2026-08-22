import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import * as THREE from 'three';
import { usePOIs, useRoads } from '@/stores';
import type { Road } from '@/types';

// 에셋 경로
const ASSETS = {
  buildings: [
    '/models/buildings/Building_01.glb',
    '/models/buildings/Building_02.glb',
    '/models/buildings/Building_03.glb',
    '/models/buildings/Building_04.glb',
    '/models/buildings/Building_05.glb',
  ],
  houses: [
    '/models/houses/Building_01.glb',
    '/models/houses/Building_02.glb',
    '/models/houses/Building_03.glb',
    '/models/houses/Building_04.glb',
    '/models/houses/Building_05.glb',
  ],
  kiosk: '/models/props/kiosk_v3_fbx/kiosk_v3_fbx.fbx',
  sign: '/models/imported/scene.gltf',
  // 새로 추가된 에셋
  cars: '/models/cars/LowPolyCars.glb',
  lamp: '/models/props/basic_lamp/fbxLamp.fbx',
  guardrail: {
    obj: '/models/props/Guardrail_Geo_Piskas/OBJ/guardrail_without_proxy.obj',
    mtl: '/models/props/Guardrail_Geo_Piskas/OBJ/guardrail_without_proxy.mtl',
  },
  busStop: '/models/props/bus_stop.glb',
};

/**
 * 씬에 배치되는 3D 에셋들
 */
export function SceneAssets() {
  const pois = usePOIs();

  // 데이터가 있으면 POI 에셋도 표시
  const hasData = pois.length > 0;

  return (
    <group name="scene-assets">
      {/* 샘플 빌딩 에셋 */}
      <Suspense fallback={null}>
        <SampleBuildingAssets />
      </Suspense>

      {/* 가로등 (프로시저럴) */}
      <ProceduralStreetLamps />

      {/* 버스정류장 */}
      <Suspense fallback={null}>
        <BusStops />
      </Suspense>

      {/* 광고 표지판 */}
      <Suspense fallback={null}>
        <AdvertisingSigns />
      </Suspense>

      {/* 주택 모델 테스트 */}
      <Suspense fallback={null}>
        <HouseModels />
      </Suspense>

      {/* 차량 (InstancedMesh) */}
      <Suspense fallback={null}>
        <InstancedCars />
      </Suspense>

      {/* 가드레일 (InstancedMesh) */}
      <Suspense fallback={null}>
        <InstancedGuardrails />
      </Suspense>

      {/* POI가 있으면 해당 위치에 에셋 배치 (카페/레스토랑에 키오스크) */}
      {hasData && (
        <Suspense fallback={null}>
          <POIAssets />
        </Suspense>
      )}
    </group>
  );
}

/**
 * 샘플 빌딩 3D 모델
 */
function SampleBuildingAssets() {
  const { scene: scene1 } = useGLTF(ASSETS.buildings[0]!);
  const { scene: scene2 } = useGLTF(ASSETS.buildings[1]!);
  const { scene: scene3 } = useGLTF(ASSETS.buildings[2]!);

  const buildings = useMemo(() => {
    return [
      { scene: scene1, position: [-25, 0, -30] as [number, number, number], scale: 0.008 },
      { scene: scene2, position: [30, 0, -25] as [number, number, number], scale: 0.008 },
      { scene: scene3, position: [-30, 0, 25] as [number, number, number], scale: 0.01 },
    ];
  }, [scene1, scene2, scene3]);

  return (
    <>
      {buildings.map((b, i) => (
        <GLTFModel key={i} scene={b.scene} position={b.position} scale={b.scale} />
      ))}
    </>
  );
}

// GLB 프리로드 (buildings)
useGLTF.preload(ASSETS.buildings[0]!);
useGLTF.preload(ASSETS.buildings[1]!);
useGLTF.preload(ASSETS.buildings[2]!);

/**
 * 프로시저럴 가로등 (InstancedMesh 최적화)
 */
function ProceduralStreetLamps() {
  const roads = useRoads();

  const lampPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];

    const defaultPositions: Array<[number, number, number]> = [
      [-15, 0, -10], [15, 0, -10],
      [-15, 0, 10], [15, 0, 10],
      [-15, 0, 30], [15, 0, 30],
      [0, 0, -30], [0, 0, 50],
    ];

    if (roads.length > 0) {
      for (const road of roads.slice(0, 8)) {
        if (road.points.length < 2) continue;
        const start = road.points[0];
        const end = road.points[road.points.length - 1];
        if (start) positions.push([start.x + road.width + 1, 0, start.z]);
        if (end) positions.push([end.x + road.width + 1, 0, end.z]);
      }
    } else {
      positions.push(...defaultPositions);
    }

    return positions.slice(0, 16);
  }, [roads]);

  return <InstancedStreetLamps positions={lampPositions} />;
}

/**
 * 가로등 InstancedMesh 컴포넌트
 * 기둥, 등받침, 전구, 글로우를 각각 InstancedMesh로 렌더링
 */
function InstancedStreetLamps({ positions }: { positions: Array<[number, number, number]> }) {
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const mountRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  const count = positions.length;

  // 지오메트리를 useMemo로 캐싱
  const geometries = useMemo(() => ({
    pole: new THREE.CylinderGeometry(0.08, 0.12, 5, 6),
    mount: new THREE.CylinderGeometry(0.15, 0.08, 0.3, 6),
    bulb: new THREE.SphereGeometry(0.25, 8, 8),
    glow: new THREE.SphereGeometry(0.4, 8, 8),
  }), []);

  // 머티리얼을 useMemo로 캐싱
  const materials = useMemo(() => ({
    pole: new THREE.MeshStandardMaterial({ color: '#4a5568', metalness: 0.7, roughness: 0.3 }),
    mount: new THREE.MeshStandardMaterial({ color: '#2d3748', metalness: 0.8, roughness: 0.2 }),
    bulb: new THREE.MeshStandardMaterial({
      color: '#FFE5B4',
      emissive: new THREE.Color('#FFE5B4'),
      emissiveIntensity: 0.8
    }),
    glow: new THREE.MeshBasicMaterial({ color: '#FFE5B4', transparent: true, opacity: 0.3 }),
  }), []);

  // 인스턴스 매트릭스 설정
  useEffect(() => {
    if (!poleRef.current || !mountRef.current || !bulbRef.current || !glowRef.current) return;

    const matrix = new THREE.Matrix4();

    positions.forEach((pos, i) => {
      // 기둥: y = 2.5
      matrix.setPosition(pos[0], pos[1] + 2.5, pos[2]);
      poleRef.current!.setMatrixAt(i, matrix);

      // 등 받침: y = 5
      matrix.setPosition(pos[0], pos[1] + 5, pos[2]);
      mountRef.current!.setMatrixAt(i, matrix);

      // 전구: y = 5.3
      matrix.setPosition(pos[0], pos[1] + 5.3, pos[2]);
      bulbRef.current!.setMatrixAt(i, matrix);

      // 글로우: y = 5.3
      glowRef.current!.setMatrixAt(i, matrix);
    });

    poleRef.current.instanceMatrix.needsUpdate = true;
    mountRef.current.instanceMatrix.needsUpdate = true;
    bulbRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  // 메모리 정리
  useEffect(() => {
    const geos = geometries;
    const mats = materials;
    return () => {
      geos.pole.dispose();
      geos.mount.dispose();
      geos.bulb.dispose();
      geos.glow.dispose();
      mats.pole.dispose();
      mats.mount.dispose();
      mats.bulb.dispose();
      mats.glow.dispose();
    };
  }, [geometries, materials]);

  if (count === 0) return null;

  return (
    <group name="instanced-street-lamps">
      {/* 기둥 인스턴스 */}
      <instancedMesh
        ref={poleRef}
        args={[geometries.pole, materials.pole, count]}
        frustumCulled={false}
      />
      {/* 등 받침 인스턴스 */}
      <instancedMesh
        ref={mountRef}
        args={[geometries.mount, materials.mount, count]}
        frustumCulled={false}
      />
      {/* 전구 인스턴스 */}
      <instancedMesh
        ref={bulbRef}
        args={[geometries.bulb, materials.bulb, count]}
        frustumCulled={false}
      />
      {/* 글로우 인스턴스 */}
      <instancedMesh
        ref={glowRef}
        args={[geometries.glow, materials.glow, count]}
        frustumCulled={false}
      />
    </group>
  );
}

/**
 * 버스정류장 (3D 모델)
 */
function BusStops() {
  const { scene } = useGLTF(ASSETS.busStop);
  const roads = useRoads();

  const busStopPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rot: number }> = [];

    // 기본 위치 (도로 데이터 없을 때)
    const defaultPositions: Array<{ pos: [number, number, number]; rot: number }> = [
      { pos: [-8, 0, 5], rot: 0 },
      { pos: [10, 0, -8], rot: Math.PI / 2 },
      { pos: [-5, 0, 20], rot: Math.PI },
    ];

    if (roads.length > 0) {
      // 도로 근처에 버스정류장 배치
      for (const road of roads.slice(0, 3)) {
        if (road.points.length < 2) continue;
        const midIdx = Math.floor(road.points.length / 2);
        const midPoint = road.points[midIdx];
        if (midPoint) {
          positions.push({
            pos: [midPoint.x + road.width + 2, 0, midPoint.z],
            rot: Math.atan2(
              (road.points[midIdx + 1]?.z ?? midPoint.z) - midPoint.z,
              (road.points[midIdx + 1]?.x ?? midPoint.x) - midPoint.x
            ),
          });
        }
      }
    }

    return positions.length > 0 ? positions : defaultPositions;
  }, [roads]);

  return (
    <>
      {busStopPositions.map((item, i) => (
        <BusStopModel key={i} scene={scene} position={item.pos} rotation={item.rot} />
      ))}
    </>
  );
}

// 버스정류장 GLB 프리로드
useGLTF.preload(ASSETS.busStop);

/**
 * 버스정류장 3D 모델
 */
function BusStopModel({
  scene,
  position,
  rotation,
}: {
  scene: THREE.Group;
  position: [number, number, number];
  rotation: number;
}) {
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={[0, rotation, 0]}
      scale={[0.015, 0.015, 0.015]}
    />
  );
}

/**
 * 광고 표지판 (GLTF 모델)
 */
function AdvertisingSigns() {
  const { scene } = useGLTF(ASSETS.sign);
  const roads = useRoads();

  const signPositions = useMemo(() => {
    // 기본 위치 (도로 데이터 없을 때)
    const defaultPositions: Array<{ pos: [number, number, number]; rot: number }> = [
      { pos: [15, 0, 15], rot: 0 },
      { pos: [-20, 0, -10], rot: Math.PI / 4 },
      { pos: [25, 0, -20], rot: -Math.PI / 3 },
      { pos: [-10, 0, 30], rot: Math.PI / 2 },
    ];

    if (roads.length > 0) {
      const positions: Array<{ pos: [number, number, number]; rot: number }> = [];
      // 도로 시작/끝점 근처에 표지판 배치
      for (const road of roads.slice(0, 4)) {
        if (road.points.length < 2) continue;
        const start = road.points[0];
        if (start) {
          positions.push({
            pos: [start.x + road.width + 3, 0, start.z],
            rot: Math.random() * Math.PI * 2,
          });
        }
      }
      return positions.length > 0 ? positions : defaultPositions;
    }

    return defaultPositions;
  }, [roads]);

  return (
    <>
      {signPositions.map((item, i) => (
        <GLTFModel
          key={i}
          scene={scene}
          position={item.pos}
          rotation={[0, item.rot, 0]}
          scale={1.5}
        />
      ))}
    </>
  );
}

// GLTF 프리로드
useGLTF.preload(ASSETS.sign);

/**
 * 주택 모델 (테스트용)
 */
function HouseModels() {
  const { scene: house1 } = useGLTF(ASSETS.houses[0]!);
  const { scene: house2 } = useGLTF(ASSETS.houses[1]!);
  const { scene: house3 } = useGLTF(ASSETS.houses[2]!);
  const { scene: house4 } = useGLTF(ASSETS.houses[3]!);
  const { scene: house5 } = useGLTF(ASSETS.houses[4]!);

  const houses = useMemo(() => {
    return [
      { scene: house1, position: [20, 0, 10] as [number, number, number], scale: 0.1, rot: 0 },
      { scene: house2, position: [-25, 0, 15] as [number, number, number], scale: 0.1, rot: Math.PI / 2 },
      { scene: house3, position: [35, 0, -15] as [number, number, number], scale: 0.1, rot: Math.PI },
      { scene: house4, position: [-15, 0, -25] as [number, number, number], scale: 0.1, rot: -Math.PI / 4 },
      { scene: house5, position: [5, 0, 40] as [number, number, number], scale: 0.1, rot: Math.PI / 3 },
    ];
  }, [house1, house2, house3, house4, house5]);

  return (
    <>
      {houses.map((h, i) => (
        <GLTFModel
          key={`house-${i}`}
          scene={h.scene}
          position={h.position}
          rotation={[0, h.rot, 0]}
          scale={h.scale}
        />
      ))}
    </>
  );
}

// GLB 프리로드 (houses)
useGLTF.preload(ASSETS.houses[0]!);
useGLTF.preload(ASSETS.houses[1]!);
useGLTF.preload(ASSETS.houses[2]!);
useGLTF.preload(ASSETS.houses[3]!);
useGLTF.preload(ASSETS.houses[4]!);

/**
 * GLTF 모델 렌더링 헬퍼
 */
interface GLTFModelProps {
  scene: THREE.Group;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: number;
}

function GLTFModel({ scene, position, rotation = [0, 0, 0], scale }: GLTFModelProps) {
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    />
  );
}

/**
 * POI 위치에 에셋 배치
 */
function POIAssets() {
  const pois = usePOIs();
  const kioskFbx = useLoader(FBXLoader, ASSETS.kiosk);

  // 카페/레스토랑 POI에 키오스크 배치
  const kioskPositions = useMemo(() => {
    return pois
      .filter(poi => poi.category === 'cafe' || poi.category === 'restaurant')
      .slice(0, 10) // 최대 10개
      .map(poi => ({
        pos: [poi.position.x + 1.5, 0, poi.position.z + 1.5] as [number, number, number],
        rot: Math.random() * Math.PI * 2, // 랜덤 회전
      }));
  }, [pois]);

  return (
    <>
      {kioskPositions.map((item, i) => (
        <FBXModel
          key={i}
          fbx={kioskFbx}
          position={item.pos}
          rotation={[0, item.rot, 0]}
          scale={0.005}
        />
      ))}
    </>
  );
}

/**
 * FBX 모델 렌더링 헬퍼
 */
interface FBXModelProps {
  fbx: THREE.Group;
  position: readonly [number, number, number] | [number, number, number];
  rotation?: readonly [number, number, number] | [number, number, number];
  scale: number;
}

function FBXModel({ fbx, position, rotation = [0, 0, 0], scale }: FBXModelProps) {
  const clonedScene = useMemo(() => {
    const clone = fbx.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 성능 최적화: 그림자 비활성화
        child.castShadow = false;
        child.receiveShadow = true;
        // 머티리얼 과노출 방지
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
              mat.toneMapped = true;
              // 너무 밝은 색상 조정
              if (mat.color && mat.color.r > 0.9 && mat.color.g > 0.9 && mat.color.b > 0.9) {
                mat.color.multiplyScalar(0.7);
              }
            }
          });
        }
      }
    });
    return clone;
  }, [fbx]);

  return (
    <primitive
      object={clonedScene}
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      scale={[scale, scale, scale]}
    />
  );
}

/**
 * 도로 위 차량 배치 (InstancedMesh 최적화)
 * GLB 모델의 각 메시를 InstancedMesh로 렌더링
 */
function InstancedCars() {
  const roads = useRoads();
  const { scene } = useGLTF(ASSETS.cars);
  const instancedMeshRefs = useRef<THREE.InstancedMesh[]>([]);

  // 차량 배치 위치 계산: 도로를 따라 배치
  const carPlacements = useMemo(() => {
    const placements: Array<{ position: THREE.Vector3; rotation: number }> = [];

    // 기본 위치 (도로 데이터 없을 때)
    const defaultPlacements = [
      { position: new THREE.Vector3(-5, 0, -5), rotation: 0 },
      { position: new THREE.Vector3(10, 0, 8), rotation: Math.PI / 2 },
      { position: new THREE.Vector3(-12, 0, 15), rotation: Math.PI },
      { position: new THREE.Vector3(20, 0, -10), rotation: -Math.PI / 4 },
      { position: new THREE.Vector3(0, 0, 25), rotation: Math.PI / 3 },
      { position: new THREE.Vector3(-18, 0, -20), rotation: Math.PI / 6 },
    ];

    if (roads.length === 0) {
      return defaultPlacements;
    }

    // 도로를 따라 차량 배치
    for (const road of roads.slice(0, 10)) {
      if (road.points.length < 2) continue;

      // 도로 길이에 따라 차량 수 결정 (15m당 1대)
      const roadLength = calculateRoadLength(road);
      const carCount = Math.max(1, Math.floor(roadLength / 15));

      for (let i = 0; i < carCount && placements.length < 20; i++) {
        const t = (i + 0.5) / carCount;
        const pointIndex = Math.floor(t * (road.points.length - 1));
        const point = road.points[pointIndex];
        const nextPoint = road.points[Math.min(pointIndex + 1, road.points.length - 1)];

        if (point && nextPoint) {
          // 도로 방향 계산
          const direction = Math.atan2(nextPoint.z - point.z, nextPoint.x - point.x);
          // 도로 중앙에서 약간 오프셋
          const offset = (Math.random() - 0.5) * road.width * 0.3;
          const perpendicular = direction + Math.PI / 2;

          placements.push({
            position: new THREE.Vector3(
              point.x + Math.cos(perpendicular) * offset,
              0,
              point.z + Math.sin(perpendicular) * offset
            ),
            rotation: direction + (Math.random() > 0.5 ? 0 : Math.PI), // 양방향
          });
        }
      }
    }

    return placements.length > 0 ? placements : defaultPlacements;
  }, [roads]);

  // 메시 데이터 추출 및 InstancedMesh 설정
  const meshData = useMemo(() => {
    const data: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }> = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry && child.material) {
        data.push({
          geometry: child.geometry.clone(),
          material: Array.isArray(child.material)
            ? child.material.map(m => m.clone())
            : child.material.clone(),
        });
      }
    });

    return data.slice(0, 5); // 최대 5개 메시만 사용 (성능)
  }, [scene]);

  const count = carPlacements.length;

  // 인스턴스 매트릭스 설정
  useEffect(() => {
    if (instancedMeshRefs.current.length === 0 || count === 0) return;

    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3(0.5, 0.5, 0.5); // 차량 스케일
    const quaternion = new THREE.Quaternion();

    carPlacements.forEach((placement, i) => {
      quaternion.setFromEuler(new THREE.Euler(0, placement.rotation, 0));
      matrix.compose(placement.position, quaternion, scale);

      instancedMeshRefs.current.forEach(mesh => {
        if (mesh) {
          mesh.setMatrixAt(i, matrix);
        }
      });
    });

    instancedMeshRefs.current.forEach(mesh => {
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }, [carPlacements, count]);

  // 메모리 정리
  useEffect(() => {
    const data = meshData;
    return () => {
      data.forEach(({ geometry, material }) => {
        geometry.dispose();
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      });
    };
  }, [meshData]);

  if (count === 0 || meshData.length === 0) return null;

  return (
    <group name="instanced-cars">
      {meshData.map((data, idx) => (
        <instancedMesh
          key={idx}
          ref={(el) => {
            if (el) instancedMeshRefs.current[idx] = el;
          }}
          args={[
            data.geometry,
            Array.isArray(data.material) ? data.material[0] : data.material,
            count
          ]}
          frustumCulled
          receiveShadow
        />
      ))}
    </group>
  );
}

// GLB 프리로드
useGLTF.preload(ASSETS.cars);

/**
 * 도로 측면 가드레일 배치 (InstancedMesh 최적화)
 * OBJ 모델 로드 및 반복 배치
 */
function InstancedGuardrails() {
  const roads = useRoads();
  const [guardrailGeometry, setGuardrailGeometry] = useState<THREE.BufferGeometry | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // MTL + OBJ 로드
  useEffect(() => {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(ASSETS.guardrail.mtl, (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(ASSETS.guardrail.obj, (obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            setGuardrailGeometry(child.geometry.clone());
          }
        });
      });
    }, undefined, () => {
      // MTL 로드 실패시 OBJ만 로드
      const objLoader = new OBJLoader();
      objLoader.load(ASSETS.guardrail.obj, (obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            setGuardrailGeometry(child.geometry.clone());
          }
        });
      });
    });
  }, []);

  // 가드레일 배치 위치 계산: 주요 도로 양쪽에 배치
  const guardrailPlacements = useMemo(() => {
    const placements: Array<{ position: THREE.Vector3; rotation: number }> = [];

    // 기본 위치 (도로 데이터 없을 때)
    const defaultPlacements: Array<{ position: THREE.Vector3; rotation: number }> = [];
    for (let i = 0; i < 8; i++) {
      defaultPlacements.push({
        position: new THREE.Vector3(-20 + i * 5, 0, -15),
        rotation: 0,
      });
      defaultPlacements.push({
        position: new THREE.Vector3(-20 + i * 5, 0, 15),
        rotation: Math.PI,
      });
    }

    if (roads.length === 0) {
      return defaultPlacements;
    }

    // 주요 도로(primary, secondary)에만 가드레일 배치
    const mainRoads = roads.filter(r => r.type === 'primary' || r.type === 'secondary');

    for (const road of mainRoads.slice(0, 5)) {
      if (road.points.length < 2) continue;

      // 3m 간격으로 가드레일 배치
      const roadLength = calculateRoadLength(road);
      const railCount = Math.max(2, Math.floor(roadLength / 3));

      for (let i = 0; i < railCount && placements.length < 50; i++) {
        const t = i / railCount;
        const pointIndex = Math.floor(t * (road.points.length - 1));
        const point = road.points[pointIndex];
        const nextPoint = road.points[Math.min(pointIndex + 1, road.points.length - 1)];

        if (point && nextPoint) {
          const direction = Math.atan2(nextPoint.z - point.z, nextPoint.x - point.x);
          const perpendicular = direction + Math.PI / 2;
          const offset = road.width / 2 + 0.5; // 도로 가장자리 + 약간의 여유

          // 양쪽에 배치
          placements.push({
            position: new THREE.Vector3(
              point.x + Math.cos(perpendicular) * offset,
              0,
              point.z + Math.sin(perpendicular) * offset
            ),
            rotation: direction,
          });
          placements.push({
            position: new THREE.Vector3(
              point.x - Math.cos(perpendicular) * offset,
              0,
              point.z - Math.sin(perpendicular) * offset
            ),
            rotation: direction + Math.PI,
          });
        }
      }
    }

    return placements.length > 0 ? placements : defaultPlacements;
  }, [roads]);

  // 머티리얼
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8a8a8a',
      metalness: 0.7,
      roughness: 0.3,
    });
  }, []);

  const count = guardrailPlacements.length;

  // 인스턴스 매트릭스 설정
  useEffect(() => {
    if (!instancedMeshRef.current || count === 0) return;

    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3(0.01, 0.01, 0.01); // 가드레일 스케일 조정
    const quaternion = new THREE.Quaternion();

    guardrailPlacements.forEach((placement, i) => {
      quaternion.setFromEuler(new THREE.Euler(0, placement.rotation, 0));
      matrix.compose(placement.position, quaternion, scale);
      instancedMeshRef.current!.setMatrixAt(i, matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [guardrailPlacements, count, guardrailGeometry]);

  // 메모리 정리
  useEffect(() => {
    const geo = guardrailGeometry;
    const mat = material;
    return () => {
      geo?.dispose();
      mat.dispose();
    };
  }, [guardrailGeometry, material]);

  if (!guardrailGeometry || count === 0) return null;

  return (
    <group name="instanced-guardrails">
      <instancedMesh
        ref={instancedMeshRef}
        args={[guardrailGeometry, material, count]}
        frustumCulled
        receiveShadow
      />
    </group>
  );
}

/**
 * 도로 길이 계산 유틸리티
 */
function calculateRoadLength(road: Road): number {
  let length = 0;
  for (let i = 0; i < road.points.length - 1; i++) {
    const p1 = road.points[i];
    const p2 = road.points[i + 1];
    if (p1 && p2) {
      length += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
    }
  }
  return length;
}

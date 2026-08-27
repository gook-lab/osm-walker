import { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBuildings } from '@/stores';
import { Building, getBuildingColor } from './Building';
import type { Building as BuildingType } from '@/types';

// 성능 설정
const RENDER_DISTANCE = 80; // 렌더링 거리 (미터)
const DETAIL_DISTANCE = 40; // 상세 건물 거리
const CHUNK_SIZE = 5; // 한 번에 로드할 건물 수 (줄임)
const LOAD_INTERVAL = 100; // 청크 로드 간격 (ms) (늘림)

// 높이 그룹 정의 (5m 단위) - 컴포넌트 외부에 정의하여 안정적인 참조 유지
const HEIGHT_BUCKETS = [5, 10, 15, 20, 25, 30, 40, 50, 100] as const;

/**
 * 모든 건물을 렌더링하는 컨테이너 컴포넌트
 * 점진적 로딩 + 거리 기반 컬링
 */
export function Buildings() {
  const allBuildings = useBuildings();
  const { camera } = useThree();
  const [loadedCount, setLoadedCount] = useState(0);
  const [visibleBuildings, setVisibleBuildings] = useState<BuildingType[]>([]);
  const frameCount = useRef(0);

  // 점진적 로딩: 건물을 청크 단위로 로드
  useEffect(() => {
    if (allBuildings.length === 0) {
      setLoadedCount(0);
      setVisibleBuildings([]);
      return;
    }

    // 거리순 정렬 (카메라 위치 기준)
    const cameraPos = camera.position;
    const sortedBuildings = [...allBuildings].sort((a, b) => {
      const centerA = getBuildingCenter(a);
      const centerB = getBuildingCenter(b);
      const distA = Math.sqrt(
        Math.pow(centerA.x - cameraPos.x, 2) + Math.pow(centerA.z - cameraPos.z, 2)
      );
      const distB = Math.sqrt(
        Math.pow(centerB.x - cameraPos.x, 2) + Math.pow(centerB.z - cameraPos.z, 2)
      );
      return distA - distB;
    });

    // 청크 단위로 점진적 로드
    let currentCount = 0;
    setLoadedCount(0);

    // 재귀 setTimeout 은 반드시 정리한다. 안 하면 언마운트·의존성 변경 뒤에도
    // 체인이 계속 돌면서 사라진 컴포넌트에 setState 를 부른다.
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const loadNextChunk = () => {
      if (cancelled) return;
      currentCount = Math.min(currentCount + CHUNK_SIZE, sortedBuildings.length);
      setLoadedCount(currentCount);

      if (currentCount < sortedBuildings.length) {
        timerId = setTimeout(loadNextChunk, LOAD_INTERVAL);
      }
    };

    // 첫 청크는 즉시 로드
    loadNextChunk();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      setLoadedCount(0);
    };
  }, [allBuildings, camera.position]);

  // 매 프레임 가시 건물 업데이트 (90프레임마다 - 성능 최적화)
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 90 !== 0) return;

    const cameraPos = camera.position;
    const loadedBuildings = allBuildings.slice(0, loadedCount);

    // 거리 기반 필터링
    const visible = loadedBuildings.filter(building => {
      const center = getBuildingCenter(building);
      const distance = Math.sqrt(
        Math.pow(center.x - cameraPos.x, 2) + Math.pow(center.z - cameraPos.z, 2)
      );
      return distance < RENDER_DISTANCE;
    });

    // 변경이 있을 때만 업데이트 (불필요한 리렌더 방지)
    if (visible.length !== visibleBuildings.length ||
        visible.some((b, i) => b.id !== visibleBuildings[i]?.id)) {
      setVisibleBuildings(visible);
    }
  });

  // 로딩 진행 상황
  const loadProgress = allBuildings.length > 0
    ? Math.round((loadedCount / allBuildings.length) * 100)
    : 0;

  // 가까운 건물과 먼 건물 분리 (Hook은 조건부 반환 전에 호출해야 함)
  const { closeBuildings, farBuildings } = useMemo(() => {
    const close: BuildingType[] = [];
    const far: BuildingType[] = [];

    visibleBuildings.forEach(building => {
      const center = getBuildingCenter(building);
      if (isWithinDistance(center, camera.position, DETAIL_DISTANCE)) {
        close.push(building);
      } else {
        far.push(building);
      }
    });

    return { closeBuildings: close, farBuildings: far };
  }, [visibleBuildings, camera.position]);

  // 건물 데이터가 없으면 샘플 건물 표시
  if (allBuildings.length === 0) {
    return <SampleBuildings />;
  }

  return (
    <group name="buildings">
      {/* 상세 건물 (가까운 것) - 개별 렌더링 */}
      {closeBuildings.map(building => (
        <Building key={building.id} building={building} />
      ))}

      {/* 먼 거리 건물 - InstancedMesh로 일괄 렌더링 */}
      {farBuildings.length > 0 && (
        <SimplifiedBuildingsInstanced buildings={farBuildings} />
      )}

      {/* 로딩 인디케이터 */}
      {loadProgress < 100 && (
        <LoadingIndicator progress={loadProgress} />
      )}
    </group>
  );
}

/**
 * 먼 거리용 간소화된 건물들 (InstancedMesh 최적화)
 * 건물들을 높이 그룹별로 InstancedMesh로 렌더링
 */
function SimplifiedBuildingsInstanced({ buildings }: { buildings: BuildingType[] }) {
  const instancedMeshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());

  // 건물을 높이 버킷별로 그룹핑
  const groupedBuildings = useMemo(() => {
    const groups = new Map<number, BuildingType[]>();

    buildings.forEach(building => {
      // 가장 가까운 높이 버킷 찾기
      const bucket = HEIGHT_BUCKETS.find(h => building.height <= h) || HEIGHT_BUCKETS[HEIGHT_BUCKETS.length - 1]!;
      if (!groups.has(bucket)) {
        groups.set(bucket, []);
      }
      groups.get(bucket)!.push(building);
    });

    return groups;
  }, [buildings]);

  // 각 높이 그룹에 대한 지오메트리 생성
  const geometries = useMemo(() => {
    const geos = new Map<number, THREE.BoxGeometry>();
    HEIGHT_BUCKETS.forEach(height => {
      // 기본 크기 8x8, 높이는 버킷값
      geos.set(height, new THREE.BoxGeometry(8, height, 8));
    });
    return geos;
  }, []);

  // 공유 머티리얼
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B5D8FF',
      roughness: 0.9,
      metalness: 0.05,
    });
  }, []);

  // 인스턴스 매트릭스 업데이트
  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    groupedBuildings.forEach((buildingsInGroup, heightBucket) => {
      const mesh = instancedMeshRefs.current.get(String(heightBucket));
      if (!mesh) return;

      buildingsInGroup.forEach((building, i) => {
        const center = getBuildingCenter(building);
        const bbox = getBoundingBox(building);

        // 스케일 계산 (건물 실제 크기 / 기본 지오메트리 크기)
        const scaleX = bbox.width / 8;
        const scaleY = building.height / heightBucket;
        const scaleZ = bbox.depth / 8;

        scale.set(scaleX, scaleY, scaleZ);
        matrix.makeScale(scale.x, scale.y, scale.z);
        matrix.setPosition(center.x, building.height / 2, center.z);

        mesh.setMatrixAt(i, matrix);

        // 건물별 색상 적용
        const buildingColor = building.color || getBuildingColor(building.type);
        color.set(buildingColor);
        mesh.setColorAt(i, color);
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [groupedBuildings]);

  // 메모리 정리
  useEffect(() => {
    const geos = geometries;
    const mat = material;
    return () => {
      geos.forEach(geo => geo.dispose());
      mat.dispose();
    };
  }, [geometries, material]);

  return (
    <group name="simplified-buildings-instanced">
      {Array.from(groupedBuildings.entries()).map(([heightBucket, buildingsInGroup]) => {
        const geometry = geometries.get(heightBucket);
        if (!geometry || buildingsInGroup.length === 0) return null;

        return (
          <instancedMesh
            key={heightBucket}
            ref={(mesh) => {
              if (mesh) instancedMeshRefs.current.set(String(heightBucket), mesh);
            }}
            args={[geometry, material, buildingsInGroup.length]}
            frustumCulled={true}
            receiveShadow
          />
        );
      })}
    </group>
  );
}

// 건물 바운딩 박스 계산
function getBoundingBox(building: BuildingType): { width: number; depth: number } {
  if (building.footprint.length === 0) return { width: 8, depth: 8 };

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  building.footprint.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  });

  return {
    width: Math.max(maxX - minX, 1),
    depth: Math.max(maxZ - minZ, 1),
  };
}

/**
 * 로딩 인디케이터
 */
function LoadingIndicator({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 2;
    }
  });

  return (
    <group position={[0, 10, 0]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[2, 0.3, 8, 16, Math.PI * 2 * (progress / 100)]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// 유틸리티 함수
function getBuildingCenter(building: BuildingType): { x: number; z: number } {
  if (building.footprint.length === 0) return { x: 0, z: 0 };
  const sumX = building.footprint.reduce((acc, p) => acc + p.x, 0);
  const sumZ = building.footprint.reduce((acc, p) => acc + p.z, 0);
  return {
    x: sumX / building.footprint.length,
    z: sumZ / building.footprint.length,
  };
}

function isWithinDistance(
  point: { x: number; z: number },
  camera: THREE.Vector3,
  distance: number
): boolean {
  const dx = point.x - camera.x;
  const dz = point.z - camera.z;
  return dx * dx + dz * dz < distance * distance;
}

/**
 * 검색 전 샘플 건물들 (InstancedMesh 최적화)
 */
function SampleBuildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const sampleBuildings = useMemo(() => [
    { position: [0, 0, -20] as const, size: [8, 15, 8] as const, color: '#B5D8FF' },
    { position: [-15, 0, -10] as const, size: [6, 9, 6] as const, color: '#FFB5BA' },
    { position: [15, 0, -15] as const, size: [5, 12, 5] as const, color: '#FFE5B5' },
    { position: [-10, 0, 10] as const, size: [7, 6, 7] as const, color: '#D4F5D4' },
    { position: [12, 0, 8] as const, size: [4, 18, 4] as const, color: '#B5D8FF' },
    { position: [-20, 0, -25] as const, size: [5, 8, 5] as const, color: '#FFB5BA' },
    { position: [20, 0, -30] as const, size: [6, 10, 6] as const, color: '#E8E8E8' },
    { position: [0, 0, 25] as const, size: [10, 7, 10] as const, color: '#FFE5B5' },
  ], []);

  const count = sampleBuildings.length;

  // 단위 박스 지오메트리 (스케일로 크기 조절)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.1,
  }), []);

  // 인스턴스 매트릭스 및 색상 설정
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    sampleBuildings.forEach((building, i) => {
      const [width, height, depth] = building.size;
      const [x, , z] = building.position;

      position.set(x, height / 2, z);
      scale.set(width, height, depth);

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);

      color.set(building.color);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [sampleBuildings]);

  // 메모리 정리
  useEffect(() => {
    const geo = geometry;
    const mat = material;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geometry, material]);

  return (
    <group name="sample-buildings">
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        receiveShadow
        frustumCulled={false}
      />
    </group>
  );
}

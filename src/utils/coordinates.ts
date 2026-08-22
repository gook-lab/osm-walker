import type { WGS84, LocalXZ } from '@/types';

/**
 * WGS84 좌표를 로컬 XZ 좌표로 변환
 * 중심점을 원점(0, 0)으로 하는 미터 단위 좌표계
 *
 * @param point 변환할 좌표
 * @param center 중심점 (원점이 될 좌표)
 * @returns 로컬 XZ 좌표 (미터 단위)
 */
export function wgs84ToLocalXZ(point: WGS84, center: WGS84): LocalXZ {
  // 1도 위도 ≈ 111,320m
  const metersPerDegreeLat = 111320;
  // 경도는 위도에 따라 다름
  const metersPerDegreeLng =
    111320 * Math.cos((center.lat * Math.PI) / 180);

  // 중심점 기준 상대 좌표 (미터)
  const x = (point.lng - center.lng) * metersPerDegreeLng;
  const z = -(point.lat - center.lat) * metersPerDegreeLat; // Y축 반전 (북쪽이 -Z)

  return { x, z };
}

/**
 * 로컬 XZ 좌표를 WGS84로 역변환
 */
export function localXZToWGS84(point: LocalXZ, center: WGS84): WGS84 {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng =
    111320 * Math.cos((center.lat * Math.PI) / 180);

  return {
    lat: center.lat - point.z / metersPerDegreeLat,
    lng: center.lng + point.x / metersPerDegreeLng,
  };
}

/**
 * 두 WGS84 좌표 사이의 거리 (미터)
 */
export function distanceWGS84(a: WGS84, b: WGS84): number {
  const R = 6371000; // 지구 반지름 (미터)
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}

/**
 * 두 LocalXZ 좌표 사이의 거리 (미터)
 */
export function distanceLocalXZ(a: LocalXZ, b: LocalXZ): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

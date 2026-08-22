/**
 * WGS84 좌표계 (위도/경도)
 * API에서 받아오는 원본 좌표 형식
 */
export interface WGS84 {
  readonly lat: number;
  readonly lng: number;
}

/**
 * Three.js 로컬 좌표계 (X-Z 평면)
 * 검색 중심점을 원점(0, 0)으로 하는 미터 단위
 */
export interface LocalXZ {
  readonly x: number;
  readonly z: number;
}

/**
 * Three.js Vector3 형태의 위치
 */
export interface Position3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * 경계 상자 (Bounding Box)
 */
export interface BoundingBox {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

import type { LocalXZ } from './coordinates';

/**
 * 도로 타입
 */
export type RoadType =
  | 'primary'     // 주요 도로
  | 'secondary'   // 보조 도로
  | 'tertiary'    // 3차 도로
  | 'residential' // 주거지 도로
  | 'pedestrian'  // 보행자 전용
  | 'footway';    // 인도

/**
 * 도로 인터페이스
 */
export interface Road {
  readonly id: string;
  readonly type: RoadType;
  readonly name?: string;
  readonly points: readonly LocalXZ[];
  readonly width: number;
}

/**
 * OSM 태그에서 도로 타입 추출
 */
export function getRoadType(tags: Record<string, string>): RoadType | null {
  const highway = tags['highway'];
  if (!highway) return null;

  switch (highway) {
    case 'primary':
    case 'primary_link':
      return 'primary';
    case 'secondary':
    case 'secondary_link':
      return 'secondary';
    case 'tertiary':
    case 'tertiary_link':
      return 'tertiary';
    case 'residential':
    case 'living_street':
      return 'residential';
    case 'pedestrian':
      return 'pedestrian';
    case 'footway':
    case 'path':
      return 'footway';
    default:
      return null;
  }
}

/**
 * 도로 타입별 너비 (미터)
 */
export function getRoadWidth(type: RoadType): number {
  switch (type) {
    case 'primary':
      return 12;
    case 'secondary':
      return 10;
    case 'tertiary':
      return 8;
    case 'residential':
      return 6;
    case 'pedestrian':
      return 4;
    case 'footway':
      return 2;
  }
}

/**
 * 도로 타입별 색상
 */
export function getRoadColor(type: RoadType): string {
  switch (type) {
    case 'primary':
      return '#4a4a5a';
    case 'secondary':
      return '#3a3a4a';
    case 'tertiary':
      return '#3a3a4a';
    case 'residential':
      return '#2a2a3a';
    case 'pedestrian':
      return '#5a5a6a';
    case 'footway':
      return '#6a6a7a';
  }
}

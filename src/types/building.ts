import type { LocalXZ } from './coordinates';

/**
 * 건물 타입 (OSM building 태그 기반)
 */
export type BuildingType =
  // 주거
  | 'residential'
  | 'apartments'
  | 'house'
  | 'dormitory'
  // 상업/서비스
  | 'commercial'
  | 'retail'
  | 'office'
  // 교육
  | 'school'
  | 'university'
  | 'kindergarten'
  // 산업
  | 'industrial'
  | 'warehouse'
  // 공공/기타
  | 'hospital'
  | 'church'
  | 'civic'
  | 'default';

/**
 * 건물 데이터
 */
export interface Building {
  readonly id: string;
  readonly type: BuildingType;
  readonly footprint: readonly LocalXZ[];
  readonly height: number;
  readonly name?: string;
  readonly color?: string;
}

/**
 * OSM Building 태그에서 타입 추출
 */
export function getBuildingType(tags: Record<string, string>): BuildingType {
  const buildingTag = tags['building'];
  const amenityTag = tags['amenity'];

  // 먼저 amenity 태그 확인 (더 구체적인 정보)
  if (amenityTag) {
    switch (amenityTag) {
      case 'school':
        return 'school';
      case 'university':
      case 'college':
        return 'university';
      case 'kindergarten':
        return 'kindergarten';
      case 'hospital':
      case 'clinic':
        return 'hospital';
      case 'place_of_worship':
        return 'church';
      case 'townhall':
      case 'community_centre':
      case 'library':
        return 'civic';
    }
  }

  if (!buildingTag) return 'default';

  switch (buildingTag) {
    // 주거
    case 'residential':
    case 'house':
    case 'detached':
    case 'terrace':
    case 'semidetached_house':
      return 'residential';
    case 'apartments':
      return 'apartments';
    case 'dormitory':
      return 'dormitory';

    // 교육
    case 'school':
      return 'school';
    case 'university':
    case 'college':
      return 'university';
    case 'kindergarten':
      return 'kindergarten';

    // 상업
    case 'commercial':
    case 'office':
      return 'commercial';
    case 'retail':
    case 'shop':
    case 'supermarket':
    case 'kiosk':
      return 'retail';

    // 산업
    case 'industrial':
    case 'factory':
      return 'industrial';
    case 'warehouse':
      return 'warehouse';

    // 공공
    case 'hospital':
      return 'hospital';
    case 'church':
    case 'chapel':
    case 'cathedral':
      return 'church';
    case 'civic':
    case 'public':
    case 'government':
      return 'civic';

    default:
      return 'default';
  }
}

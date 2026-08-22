import type { WGS84, LocalXZ } from './coordinates';

/**
 * POI 카테고리
 */
export type POICategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'subway'
  | 'bus_stop'
  | 'park'
  | 'shop'
  | 'default';

/**
 * 기본 POI 인터페이스
 */
interface BasePOI {
  readonly id: string;
  readonly name?: string;
  readonly position: LocalXZ;
  readonly originalPosition: WGS84;
}

/**
 * 음식점 POI
 */
export interface RestaurantPOI extends BasePOI {
  readonly category: 'restaurant';
  readonly cuisine?: string;
  readonly openingHours?: string;
}

/**
 * 카페 POI
 */
export interface CafePOI extends BasePOI {
  readonly category: 'cafe';
  readonly openingHours?: string;
}

/**
 * 지하철역 POI
 */
export interface SubwayPOI extends BasePOI {
  readonly category: 'subway';
  readonly lines?: string[];
}

/**
 * 버스 정류장 POI
 */
export interface BusStopPOI extends BasePOI {
  readonly category: 'bus_stop';
  readonly routes?: string[];
}

/**
 * 공원 POI
 */
export interface ParkPOI extends BasePOI {
  readonly category: 'park';
}

/**
 * 기본 POI (분류되지 않은 것들)
 */
export interface DefaultPOI extends BasePOI {
  readonly category: 'default' | 'bar' | 'shop';
}

/**
 * 모든 POI 타입의 유니온
 */
export type POI =
  | RestaurantPOI
  | CafePOI
  | SubwayPOI
  | BusStopPOI
  | ParkPOI
  | DefaultPOI;

/**
 * OSM 태그에서 POI 카테고리 추출
 */
export function getPOICategory(tags: Record<string, string>): POICategory {
  if (tags['railway'] === 'station' || tags['railway'] === 'subway_entrance') {
    return 'subway';
  }
  if (tags['highway'] === 'bus_stop' || tags['amenity'] === 'bus_station') {
    return 'bus_stop';
  }
  if (tags['leisure'] === 'park') {
    return 'park';
  }
  if (tags['amenity'] === 'restaurant' || tags['amenity'] === 'fast_food') {
    return 'restaurant';
  }
  if (tags['amenity'] === 'cafe') {
    return 'cafe';
  }
  if (tags['amenity'] === 'bar' || tags['amenity'] === 'pub') {
    return 'bar';
  }
  if (tags['shop']) {
    return 'shop';
  }
  return 'default';
}

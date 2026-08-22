import type { Building, POI, Road, WGS84, LocalXZ } from '@/types';
import { getBuildingType, getPOICategory, getRoadType, getRoadWidth } from '@/types';
import type { OverpassResponse, OSMNode, OSMWay } from '@/lib/schemas';
import { wgs84ToLocalXZ } from './coordinates';
import { BUILDING_COLORS } from '@/constants';

/**
 * Overpass 응답에서 건물 데이터 추출
 */
export function parseBuildings(
  response: OverpassResponse,
  center: WGS84,
): Building[] {
  // 노드 ID → 좌표 맵 생성 (기존 방식 지원)
  const nodeMap = new Map<number, WGS84>();
  for (const element of response.elements) {
    if (element.type === 'node') {
      const node = element as OSMNode;
      nodeMap.set(node.id, { lat: node.lat, lng: node.lon });
    }
  }

  // Way를 Building으로 변환
  const buildings: Building[] = [];

  for (const element of response.elements) {
    if (element.type === 'way') {
      const way = element as OSMWay;

      // 건물 태그가 있는 경우만 처리
      if (!way.tags?.['building']) continue;

      // 노드 좌표 수집 (out geom 형식 우선)
      const footprint: LocalXZ[] = [];

      if (way.geometry && way.geometry.length > 0) {
        // out geom 형식: geometry 배열에 좌표 직접 포함
        for (const point of way.geometry) {
          const wgs84: WGS84 = { lat: point.lat, lng: point.lon };
          footprint.push(wgs84ToLocalXZ(wgs84, center));
        }
      } else if (way.nodes) {
        // 기존 방식: 노드 ID 참조
        for (const nodeId of way.nodes) {
          const nodePos = nodeMap.get(nodeId);
          if (nodePos) {
            footprint.push(wgs84ToLocalXZ(nodePos, center));
          }
        }
      }

      // 최소 3개 노드 필요 (삼각형 이상)
      if (footprint.length < 3) continue;

      // 건물 높이 계산
      const height = calculateBuildingHeight(way.tags ?? {});
      const type = getBuildingType(way.tags ?? {});
      const color = BUILDING_COLORS[type] || BUILDING_COLORS.default;

      buildings.push({
        id: `building-${way.id}`,
        type,
        footprint,
        height,
        name: way.tags?.['name'],
        color,
      });
    }
  }

  return buildings;
}

/**
 * Overpass 응답에서 POI 데이터 추출
 */
export function parsePOIs(response: OverpassResponse, center: WGS84): POI[] {
  const pois: POI[] = [];

  for (const element of response.elements) {
    if (element.type === 'node') {
      const node = element as OSMNode;

      // 태그가 있고 POI로 분류 가능한 경우만 처리
      if (!node.tags || Object.keys(node.tags).length === 0) continue;

      const category = getPOICategory(node.tags);
      if (category === 'default' && !node.tags['name']) continue;

      const originalPosition: WGS84 = { lat: node.lat, lng: node.lon };
      const position = wgs84ToLocalXZ(originalPosition, center);

      const basePoi = {
        id: `poi-${node.id}`,
        name: node.tags['name'],
        position,
        originalPosition,
      };

      // 카테고리별 POI 생성
      switch (category) {
        case 'restaurant':
          pois.push({
            ...basePoi,
            category: 'restaurant',
            cuisine: node.tags['cuisine'],
            openingHours: node.tags['opening_hours'],
          });
          break;
        case 'cafe':
          pois.push({
            ...basePoi,
            category: 'cafe',
            openingHours: node.tags['opening_hours'],
          });
          break;
        case 'subway':
          pois.push({
            ...basePoi,
            category: 'subway',
            lines: node.tags['line']?.split(';'),
          });
          break;
        case 'bus_stop':
          pois.push({
            ...basePoi,
            category: 'bus_stop',
            routes: node.tags['route_ref']?.split(';'),
          });
          break;
        case 'park':
          pois.push({
            ...basePoi,
            category: 'park',
          });
          break;
        case 'bar':
          pois.push({
            ...basePoi,
            category: 'bar',
          });
          break;
        case 'shop':
          pois.push({
            ...basePoi,
            category: 'shop',
          });
          break;
        default:
          pois.push({
            ...basePoi,
            category: 'default',
          });
      }
    }
  }

  return pois;
}

/**
 * 건물 높이 계산 (미터)
 */
function calculateBuildingHeight(tags: Record<string, string>): number {
  // height 태그가 있으면 사용
  if (tags['height']) {
    const height = parseFloat(tags['height']);
    if (!isNaN(height)) return height;
  }

  // building:levels 태그가 있으면 층수 * 3m
  if (tags['building:levels']) {
    const levels = parseInt(tags['building:levels'], 10);
    if (!isNaN(levels)) return levels * 3;
  }

  // 건물 타입별 기본 높이
  const buildingType = tags['building'];
  const amenityType = tags['amenity'];

  // amenity 기반 높이
  switch (amenityType) {
    case 'school':
      return 12; // 4층
    case 'university':
    case 'college':
      return 18; // 6층
    case 'kindergarten':
      return 6; // 2층
    case 'hospital':
      return 24; // 8층
    case 'place_of_worship':
      return 15; // 5층 (첨탑 포함)
  }

  // building 타입 기반 높이
  switch (buildingType) {
    case 'house':
    case 'detached':
      return 6; // 2층
    case 'residential':
      return 12; // 4층
    case 'apartments':
    case 'dormitory':
      return 18; // 6층
    case 'commercial':
    case 'office':
      return 24; // 8층
    case 'retail':
    case 'shop':
    case 'kiosk':
      return 6; // 2층
    case 'industrial':
    case 'warehouse':
      return 9; // 3층
    case 'school':
      return 12; // 4층
    case 'university':
    case 'college':
      return 18; // 6층
    case 'hospital':
      return 24; // 8층
    case 'church':
    case 'chapel':
      return 15; // 5층
    case 'civic':
    case 'public':
      return 12; // 4층
    default:
      return 9; // 기본 3층
  }
}

/**
 * Overpass 응답에서 도로 데이터 추출
 */
export function parseRoads(response: OverpassResponse, center: WGS84): Road[] {
  const roads: Road[] = [];

  for (const element of response.elements) {
    if (element.type === 'way') {
      const way = element as OSMWay;

      // 도로 태그가 있는 경우만 처리
      const roadType = getRoadType(way.tags ?? {});
      if (!roadType) continue;

      // 좌표 수집
      const points: LocalXZ[] = [];

      if (way.geometry && way.geometry.length > 0) {
        for (const point of way.geometry) {
          const wgs84: WGS84 = { lat: point.lat, lng: point.lon };
          points.push(wgs84ToLocalXZ(wgs84, center));
        }
      }

      // 최소 2개 점 필요
      if (points.length < 2) continue;

      roads.push({
        id: `road-${way.id}`,
        type: roadType,
        name: way.tags?.['name'],
        points,
        width: getRoadWidth(roadType),
      });
    }
  }

  return roads;
}

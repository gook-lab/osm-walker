import type { WGS84, BoundingBox } from '@/types';
import { parseOverpassResponse, type OverpassResponse } from './schemas';
import { DEFAULT_RADIUS } from '@/constants';

// 여러 Overpass 서버 (빠른 순서)
const OVERPASS_SERVERS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

/**
 * 중심점에서 bounding box 계산
 */
export function calculateBbox(
  center: WGS84,
  radius: number = DEFAULT_RADIUS,
): BoundingBox {
  // 1도 위도 ≈ 111,320m
  const latDelta = radius / 111320;
  // 경도는 위도에 따라 다름
  const lngDelta = radius / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return {
    south: center.lat - latDelta,
    west: center.lng - lngDelta,
    north: center.lat + latDelta,
    east: center.lng + lngDelta,
  };
}

/**
 * Overpass QL 쿼리 생성
 */
function buildQuery(bbox: BoundingBox): string {
  const { south, west, north, east } = bbox;
  const bboxStr = `${south},${west},${north},${east}`;

  // 건물 + 도로 + POI 쿼리
  return `
[out:json][timeout:45];
(
  way["building"](${bboxStr});
  way["highway"~"primary|secondary|tertiary|residential|pedestrian|footway"](${bboxStr});
  node["amenity"~"restaurant|cafe|bar|fast_food"](${bboxStr});
  node["railway"="station"](${bboxStr});
  node["railway"="subway_entrance"](${bboxStr});
  node["highway"="bus_stop"](${bboxStr});
  node["shop"](${bboxStr});
);
out geom;
  `.trim();
}

/**
 * 단일 서버에 요청 시도
 */
async function tryFetch(
  server: string,
  query: string,
  signal: AbortSignal,
): Promise<Response> {
  const response = await fetch(server, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    signal,
  });
  return response;
}

/**
 * Overpass API에서 지도 데이터 가져오기 (여러 서버 시도)
 */
export async function fetchMapData(
  center: WGS84,
  radius: number = DEFAULT_RADIUS,
): Promise<OverpassResponse> {
  const bbox = calculateBbox(center, radius);
  const query = buildQuery(bbox);

  let lastError: Error | null = null;

  for (const server of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

    try {
      console.log(`Trying Overpass server: ${server}`);
      const response = await tryFetch(server, query, controller.signal);
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API 요청 한도 초과. 잠시 후 다시 시도해주세요.');
        }
        if (response.status === 504) {
          // 다음 서버 시도
          console.warn(`Server ${server} timed out, trying next...`);
          continue;
        }
        throw new Error(`Overpass API 오류: ${response.status}`);
      }

      const data = await response.json();
      return parseOverpassResponse(data);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn(`Server ${server} timed out, trying next...`);
        lastError = new Error('서버 응답 시간 초과');
        continue;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      // 다른 서버 시도
      continue;
    }
  }

  throw lastError ?? new Error('모든 Overpass 서버가 응답하지 않습니다.');
}

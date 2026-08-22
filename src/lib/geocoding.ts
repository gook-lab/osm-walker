import type { WGS84 } from '@/types';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

/**
 * Rate limiter: Nominatim은 1 req/sec 제한
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1초

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Nominatim 검색 결과
 */
export interface GeocodingResult {
  displayName: string;
  position: WGS84;
  boundingBox: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  type: string;
}

/**
 * 텍스트 쿼리를 좌표로 변환
 */
export async function geocode(query: string): Promise<GeocodingResult | null> {
  if (!query.trim()) {
    return null;
  }

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  const response = await rateLimitedFetch(`${NOMINATIM_API}?${params}`);

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const result = data[0];
  const [south, north, west, east] = result.boundingbox.map(Number);

  return {
    displayName: result.display_name,
    position: {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    },
    boundingBox: { south, north, west, east },
    type: result.type,
  };
}

/**
 * 좌표를 주소로 변환 (역지오코딩)
 */
export async function reverseGeocode(
  position: WGS84,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: position.lat.toString(),
    lon: position.lng.toString(),
    format: 'json',
  });

  const response = await rateLimitedFetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.display_name || null;
}

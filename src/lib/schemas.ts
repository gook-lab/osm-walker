/**
 * OSM 데이터 타입 정의 (Zod 없이 타입 안전성 유지)
 */

export interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export type OSMElement = OSMNode | OSMWay;

export interface OverpassResponse {
  version?: number;
  generator?: string;
  elements: OSMElement[];
}

/**
 * 응답 검증 함수 (간단한 런타임 검증)
 */
export function parseOverpassResponse(data: unknown): OverpassResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid Overpass response: not an object');
  }

  const response = data as Record<string, unknown>;

  if (!Array.isArray(response.elements)) {
    throw new Error('Invalid Overpass response: elements is not an array');
  }

  // 기본적인 구조 검증 후 타입 단언
  return {
    version: typeof response.version === 'number' ? response.version : undefined,
    generator: typeof response.generator === 'string' ? response.generator : undefined,
    elements: response.elements.filter((el): el is OSMElement => {
      if (!el || typeof el !== 'object') return false;
      const element = el as Record<string, unknown>;
      return element.type === 'node' || element.type === 'way';
    }),
  };
}

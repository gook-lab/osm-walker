import type { WGS84 } from '@/types';

/**
 * 기본 위치: 광화문
 */
export const DEFAULT_LOCATION: WGS84 = {
  lat: 37.576,
  lng: 126.977,
} as const;

/**
 * 기본 검색 반경 (미터)
 */
export const DEFAULT_RADIUS = 200; // 200m로 축소 (서버 부하 감소)

/**
 * 건물 색상 팔레트 (타입별 벽 색상)
 */
export const BUILDING_COLORS: Record<string, string> = {
  // 주거 시설
  residential: '#FAE5D3', // 웜 베이지
  apartments: '#E8E8E8', // 모던 그레이
  dormitory: '#D5E8D4', // 소프트 그린
  house: '#FDEBD0', // 크림

  // 교육 시설
  school: '#FFF5E6', // 웜 화이트
  university: '#FDEBD0', // 아이보리
  kindergarten: '#FCF3CF', // 레몬 크림

  // 상업 시설
  commercial: '#D4E6F1', // 스카이 블루
  office: '#BDC3C7', // 실버 그레이
  retail: '#FFE5B4', // 피치

  // 산업 시설
  industrial: '#ABB2B9', // 스틸 그레이
  warehouse: '#D5D8DC', // 라이트 그레이

  // 공공 시설
  hospital: '#FFFFFF', // 화이트
  church: '#F7F9F9', // 스노우
  civic: '#EBF5FB', // 아이스 블루

  // 기본
  default: '#E8E8E8',
} as const;

/**
 * POI 마커 색상
 */
export const POI_COLORS = {
  restaurant: '#FF6B6B',
  cafe: '#A0522D',
  bar: '#9B59B6',
  subway: '#3498DB',
  bus_stop: '#2ECC71',
  park: '#27AE60',
  shop: '#F39C12',
  default: '#95A5A6',
} as const;

/**
 * 캐릭터 설정
 */
export const CHARACTER_CONFIG = {
  walkSpeed: 5, // 실제의 3-4배
  runSpeed: 10,
  jumpEnabled: false,
} as const;

/**
 * 카메라 설정
 */
export const CAMERA_CONFIG = {
  distance: 15,
  height: 10,
  fov: 50,
} as const;

/**
 * 좌표 변환 테스트
 *
 * README 는 "좌표계는 셋, 변환 지점은 하나" 를 핵심 설계로 내세운다.
 * 그 주장을 실제로 지키는지 여기서 확인한다 — 문서에만 적힌 규칙은
 * 아무도 안 지킨다.
 */
import { describe, it, expect } from 'vitest';
import {
  wgs84ToLocalXZ,
  localXZToWGS84,
  distanceWGS84,
  distanceLocalXZ,
} from './coordinates';

const 강남역 = { lat: 37.4979, lng: 127.0276 };

describe('wgs84ToLocalXZ', () => {
  it('중심점 자신은 원점이다', () => {
    const p = wgs84ToLocalXZ(강남역, 강남역);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it('북쪽은 -Z 다 (Three.js 씬 규약)', () => {
    // 위도가 커지면 북쪽. 씬에서는 -Z 방향이어야 한다.
    const 북 = wgs84ToLocalXZ({ lat: 강남역.lat + 0.001, lng: 강남역.lng }, 강남역);
    expect(북.z).toBeLessThan(0);
    expect(북.x).toBeCloseTo(0, 6);
  });

  it('동쪽은 +X 다', () => {
    const 동 = wgs84ToLocalXZ({ lat: 강남역.lat, lng: 강남역.lng + 0.001 }, 강남역);
    expect(동.x).toBeGreaterThan(0);
    expect(동.z).toBeCloseTo(0, 6);
  });

  it('1 unit = 1 m 다 — 위도 0.001도는 약 111m', () => {
    const p = wgs84ToLocalXZ({ lat: 강남역.lat + 0.001, lng: 강남역.lng }, 강남역);
    expect(Math.abs(p.z)).toBeCloseTo(111.32, 1);
  });

  it('경도 간격은 위도에 따라 줄어든다 (cos 보정)', () => {
    const 적도 = { lat: 0, lng: 0 };
    const 고위도 = { lat: 60, lng: 0 };
    const a = wgs84ToLocalXZ({ lat: 0, lng: 0.01 }, 적도);
    const b = wgs84ToLocalXZ({ lat: 60, lng: 0.01 }, 고위도);
    // cos(60°) = 0.5 이므로 고위도의 같은 경도차는 절반 거리다
    expect(b.x / a.x).toBeCloseTo(0.5, 2);
  });
});

describe('localXZToWGS84', () => {
  it('왕복 변환이 원래 좌표로 돌아온다', () => {
    const 원본 = { lat: 37.5013, lng: 127.0396 };
    const 왕복 = localXZToWGS84(wgs84ToLocalXZ(원본, 강남역), 강남역);
    expect(왕복.lat).toBeCloseTo(원본.lat, 9);
    expect(왕복.lng).toBeCloseTo(원본.lng, 9);
  });

  it('원점은 중심점으로 되돌아온다', () => {
    const p = localXZToWGS84({ x: 0, z: 0 }, 강남역);
    expect(p.lat).toBeCloseTo(강남역.lat, 12);
    expect(p.lng).toBeCloseTo(강남역.lng, 12);
  });
});

describe('거리', () => {
  it('같은 점 사이 거리는 0 이다', () => {
    expect(distanceWGS84(강남역, 강남역)).toBeCloseTo(0, 6);
    expect(distanceLocalXZ({ x: 0, z: 0 }, { x: 0, z: 0 })).toBeCloseTo(0, 6);
  });

  it('WGS84 거리와 로컬 거리가 근사한다 (500m 반경 안에서)', () => {
    // 이 앱은 중심 500m 만 다룬다. 그 범위에서 평면 근사가 유효해야
    // 씬 좌표로 계산한 거리를 그대로 써도 된다.
    const 목표 = { lat: 강남역.lat + 0.002, lng: 강남역.lng + 0.002 };
    const 구면 = distanceWGS84(강남역, 목표);
    const 평면 = distanceLocalXZ({ x: 0, z: 0 }, wgs84ToLocalXZ(목표, 강남역));
    expect(Math.abs(구면 - 평면) / 구면).toBeLessThan(0.01); // 오차 1% 미만
  });

  it('거리는 방향에 무관하다', () => {
    const a = { lat: 37.49, lng: 127.02 };
    const b = { lat: 37.51, lng: 127.04 };
    expect(distanceWGS84(a, b)).toBeCloseTo(distanceWGS84(b, a), 6);
  });
});

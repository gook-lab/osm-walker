# 3D Map Explorer

**한국어** | [English](README.en.md)

> **About (EN)** — A browser-based 3D map explorer. It pulls real building
> footprints, roads and POIs from OpenStreetMap around any searched location and
> extrudes them into a cute low-poly world you walk through as a chibi character.
> Built with React 19, React Three Fiber and Rapier physics.

실제 지도 데이터로 만든 귀여운 로우폴리 3D 월드를 치비 캐릭터로 걸어다니며 탐험하는 웹 앱입니다.

검색한 좌표 주변 500m의 OpenStreetMap 데이터(건물 폴리곤·도로·POI)를 받아
Three.js 씬으로 압출(extrude)해서, 물리 기반 캐릭터 컨트롤러로 그 위를 돌아다니는 것입니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | React 19 + TypeScript (strict) |
| 빌드 | Vite |
| 3D | Three.js · React Three Fiber 9 · Drei 10 |
| 물리 / 캐릭터 | @react-three/rapier 2 · ecctrl |
| 포스트프로세싱 | @react-three/postprocessing |
| 상태 | Zustand 5 (슬라이스 분리) |
| 검증 | Zod 4 (외부 API 응답 스키마) |
| 스타일 | Tailwind CSS 4 |
| 지도 데이터 | OpenStreetMap Overpass API + 지오코딩 |

## 실행

```bash
npm install
npm run dev      # 개발 서버 http://localhost:3000
npm run build    # 프로덕션 빌드 (tsc -b && vite build)
npm run lint     # ESLint
npm run test     # Vitest
npm run convert:models   # 3D 모델 최적화 (Draco/meshopt 압축)
```

기본 진입 위치는 **광화문 (37.576, 126.977)**, 로딩 범위는 반경 500m입니다.

## 프로젝트 구조

```
src/
├── components/
│   ├── 3d/          Three.js 씬 — GameCanvas, World, Character, Ground,
│   │                Buildings/Building(압출), Roads, POIs/POIMarker,
│   │                NavigationLine, WeatherEffects, Effects(포스트프로세싱),
│   │                ModelLoader / FBXModelLoader, LoadingScene
│   └── ui/          React 오버레이 — SearchBar, Minimap, POIInfoPanel,
│                    CharacterCustomizer, WeatherControl, PerformanceMonitor
├── stores/          Zustand — slices/{map, character, search, weather}
├── lib/             외부 연동 — overpass.ts(OSM 쿼리), geocoding.ts, schemas.ts(Zod)
├── utils/           coordinates.ts(좌표 변환), osmParser.ts, materialPool.ts
├── types/           coordinates / building / road / poi
├── constants/       기본 위치·바운딩박스·튜닝 상수
└── hooks/           useSearch
scripts/             convert-models.js, convert-3ds.js (glTF 파이프라인)
```

경로 별칭: `@/*` → `./src/*`

## 핵심 설계

### 1. 공통 좌표계 — 타입 3계층 · 변환 유틸 일원화

지도 프로젝트에서 버그의 대부분은 좌표계 혼동에서 납니다. 그래서 세 좌표계를
**타입으로 분리**하고, 변환은 `utils/coordinates.ts` 한 곳에서만 하도록 했습니다.

| 좌표계 | 타입 | 설명 |
|---|---|---|
| WGS84 | `{ lat, lng }` | API에서 오는 원본 위경도 |
| LocalXZ | `{ x, z }` | Three.js 씬 좌표. 원점 = 검색 중심, **1 unit = 1 m** |
| Screen | NDC `-1 ~ 1` | 레이캐스팅용 |

### 2. 외부 API 응답 검증 — Zod 스키마 경계

Overpass/지오코딩 응답은 스키마가 느슨하고 자주 빕니다. `lib/schemas.ts`에서
파싱 단계에 검증하면, 씬 레이어에는 항상 정상 형태만 들어가도록 합니다.

### 3. 렌더 비용 관리

건물은 개별 메시가 아니라 압출 후 재질을 `materialPool`에서 공유합니다.
모델은 `scripts/convert-models.js`로 Draco/meshopt 압축을 거쳐 로드하고,
`PerformanceMonitor`로 프레임 예산을 눈으로 확인하면서 튜닝하는 식입니다.

## 참고 문서

- `CLAUDE.md` — 작업 규칙 (좌표계 규약, 폴더 컨벤션)
- `plans/feat-cute-3d-map-explorer.md` — 초기 기획
- `FREE_3D_ASSETS.md` — 사용 가능한 무료 3D 에셋 목록

## 라이선스

**Source-available — 오픈소스는 아닙니다.** 코드를 읽을 수 있게 공개했을 뿐,
사용 권한을 준 것은 아닙니다. 다른 프로젝트에 가져다 쓰거나 재배포·상업적 이용을
하려면 사전 서면 허락이 필요합니다. 전문은 [LICENSE](LICENSE), 한국어 안내는 [LICENSE.ko.md](LICENSE.ko.md) 참조.

지도 데이터는 **OpenStreetMap contributors (ODbL)**, 3D 모델은 각 에셋의 라이선스를
따르고 있습니다 (`FREE_3D_ASSETS.md` 참조).

# 3D Map Explorer

귀여운 로우폴리 3D 월드에서 치비 캐릭터로 탐험하는 React WebGL 앱

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 6
- **3D**: React Three Fiber 9 + Drei 10 + Rapier 2
- **Character**: ecctrl
- **State**: Zustand 5
- **Validation**: Zod 4
- **Styling**: Tailwind CSS 4

## Commands

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # Vitest
```

## Folder Structure

```
src/
├── components/
│   ├── 3d/           # Three.js 컴포넌트
│   │   ├── GameCanvas.tsx
│   │   ├── World.tsx
│   │   ├── Character.tsx
│   │   ├── Ground.tsx
│   │   └── Environment.tsx
│   └── ui/           # React UI 컴포넌트
├── stores/           # Zustand 스토어
├── hooks/            # 커스텀 훅
├── utils/            # 유틸리티 함수
├── types/            # TypeScript 타입
├── lib/              # API 클라이언트
├── constants/        # 상수
└── assets/           # 에셋 (3D 모델 등)
```

## Coordinate Systems

맵 프로젝트에서 가장 흔한 버그 원인은 좌표 혼동입니다.

1. **WGS84**: API에서 오는 원본 좌표
   - 타입: `{ lat: number; lng: number }`
   - 예: `{ lat: 37.498, lng: 127.028 }`

2. **LocalXZ**: Three.js 씬 좌표
   - 타입: `{ x: number; z: number }`
   - Origin = 검색 중심점
   - 1 unit = 1 meter

3. **Screen**: 레이캐스팅용 NDC
   - 범위: -1 ~ 1

변환: WGS84 → LocalXZ는 `utils/coordinates.ts`에서만 수행

## Settings

- **기본 위치**: 광화문 (37.576, 126.977)
- **Bounding Box**: 500m 반경
- **점프**: 비활성화

## Path Aliases

`@/*` → `./src/*`

## 응답 언어

한글로 응답

## 문서 규약

사람이 읽는 문서(`README*.md`, `docs/**/*.md`)는 guk-lab 공통 규약을 따른다.
정본은 `~/sonix/toy/guk-lab-docs` — 복사하지 않고 가리킨다.

- 톤: `guk-lab-docs/STYLE.md` — 본문 습니다체, 헤드 요약·표 셀은 명사형,
  헤딩은 기술 명사구, 수치에는 측정 시점 병기.
- 다이어그램: `guk-lab-docs/harness/skills/doc-diagrams/SKILL.md` —
  `docs/diagrams/<name>.mmd` 가 정본, 색은 의미(core/view/store/external/tool),
  점선은 런타임 밖 경로에만.
- 브랜치·PR: `guk-lab-docs/playbooks/branching.md` — main 직접 커밋 금지,
  develop 에 쌓고 PR 로 합친다.
- `README.md` 를 고치면 `README.en.md` 도 같은 커밋에서 고친다.

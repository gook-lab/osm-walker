# 무료 3D 에셋 가이드

이 프로젝트에서 사용할 수 있는 무료 3D 에셋 사이트 모음입니다.

## 추천 사이트

### 1. Kenney.nl (강력 추천)
- URL: https://kenney.nl/assets
- 특징: 고품질 로우폴리 게임 에셋, CC0 라이센스 (완전 무료)
- 추천 팩:
  - City Kit (Roads): 도로 타일
  - City Kit (Suburban): 주거 건물
  - City Kit (Commercial): 상업 건물
  - Minigolf Kit: 귀여운 소품들
  - Nature Kit: 나무, 풀, 바위

### 2. Quaternius
- URL: https://quaternius.com
- 특징: 로우폴리 게임 에셋 팩, CC0 라이센스
- 추천 팩:
  - Ultimate City Pack: 도시 건물 + 차량
  - Ultimate Food Pack: 음식점 소품
  - Ultimate Nature Pack: 자연 오브젝트

### 3. Poly Pizza
- URL: https://poly.pizza
- 특징: 다양한 무료 로우폴리 모델
- 검색 키워드: "low poly building", "cute character"

### 4. OpenGameArt
- URL: https://opengameart.org
- 특징: 오픈소스 게임 에셋
- 3D Models 카테고리에서 검색

### 5. Sketchfab
- URL: https://sketchfab.com/features/free-3d-models
- 특징: 고품질 모델, 일부 무료 (라이센스 확인 필요)

## 사용 방법

### 1. GLTF/GLB 파일 다운로드
대부분의 사이트에서 GLTF 또는 GLB 형식으로 다운로드 가능합니다.

### 2. 프로젝트에 추가
\`\`\`
public/
  models/
    building_shop.glb
    building_apartment.glb
    tree.glb
    character.glb
\`\`\`

### 3. 코드에서 사용
\`\`\`tsx
import { ModelLoader } from '@/components/3d/ModelLoader';

// 건물 모델
<ModelLoader url="/models/building_shop.glb" position={[10, 0, 5]} scale={2} />

// 캐릭터 모델
<ModelLoader url="/models/character.glb" position={[0, 0, 0]} scale={0.5} />
\`\`\`

### 4. 모델 프리로딩 (선택사항)
\`\`\`tsx
import { preloadModel } from '@/components/3d/ModelLoader';

// 앱 시작 시 미리 로드
preloadModel('/models/building_shop.glb');
preloadModel('/models/character.glb');
\`\`\`

## 권장 워크플로우

1. **Kenney.nl**에서 City Kit 다운로드
2. Blender에서 필요한 모델만 추출 및 GLB로 내보내기
3. \`public/models/\` 폴더에 저장
4. \`ModelLoader\` 컴포넌트로 로드

## 라이센스 주의사항

- **CC0 (퍼블릭 도메인)**: 자유롭게 사용 가능
- **CC-BY**: 저작자 표시 필요
- **CC-BY-NC**: 비상업적 사용만 가능

Kenney.nl과 Quaternius는 CC0이므로 가장 안전합니다.

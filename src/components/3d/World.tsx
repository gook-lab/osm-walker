import { Physics } from '@react-three/rapier';
import { Ground } from './Ground';
import { Environment } from './Environment';
import { Character } from './Character';
import { Buildings } from './Buildings';
import { Roads } from './Roads';
import { POIs } from './POIs';
import { Effects } from './Effects';
import { WeatherEffects } from './WeatherEffects';
import { NavigationLine } from './NavigationLine';
import { SceneAssets } from './SceneAssets';

export function World() {
  return (
    <>
      <Physics debug={false} gravity={[0, -20, 0]}>
        <Environment />
        <Ground />
        <Roads />
        <Buildings />
        <POIs />
        <NavigationLine />
        <Character />
      </Physics>

      {/* 3D 에셋 (빌딩, 차량, 가로등 등) */}
      <SceneAssets />

      {/* 날씨 효과 */}
      <WeatherEffects />

      {/* 포스트프로세싱 효과 */}
      <Effects />
    </>
  );
}

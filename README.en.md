# 3D Map Explorer

[한국어](README.md) · **English**

A web app that lets you walk around and explore a cute low-poly 3D world made from real map data, playing as a chibi character.

It fetches OpenStreetMap data (buildings, roads, POIs) within a 500m radius of a searched location, extrudes them into a Three.js scene, and lets you roam around with a physics-based character controller.

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite |
| 3D | Three.js · React Three Fiber 9 · Drei 10 |
| Physics / Character | @react-three/rapier 2 · ecctrl |
| Post-processing | @react-three/postprocessing |
| State | Zustand 5 (slice-based) |
| Validation | Zod 4 (external API response schemas) |
| Styling | Tailwind CSS 4 |
| Map Data | OpenStreetMap Overpass API + geocoding |

## Running

```bash
npm install
npm run dev      # dev server http://localhost:3000
npm run build    # production build (tsc -b && vite build)
npm run lint     # ESLint
npm run test     # Vitest
npm run convert:models   # optimize 3D models (Draco/meshopt compression)
```

The default entry point is **Gwanghwamun (37.576, 126.977)**, and the loading radius is 500m.

## Project Structure

```
src/
├── components/
│   ├── 3d/          Three.js scene — GameCanvas, World, Character, Ground,
│   │                Buildings/Building(extrusion), Roads, POIs/POIMarker,
│   │                NavigationLine, WeatherEffects, Effects(post-processing),
│   │                ModelLoader / FBXModelLoader, LoadingScene
│   └── ui/          React overlay — SearchBar, Minimap, POIInfoPanel,
│                    CharacterCustomizer, WeatherControl, PerformanceMonitor
├── stores/          Zustand — slices/{map, character, search, weather}
├── lib/             external APIs — overpass.ts(OSM query), geocoding.ts, schemas.ts(Zod)
├── utils/           coordinates.ts(coordinate conversion), osmParser.ts, materialPool.ts
├── types/           coordinates / building / road / poi
├── constants/       default location, bounding box, tuning constants
└── hooks/           useSearch
scripts/             convert-models.js, convert-3ds.js (glTF pipeline)
```

Path aliases: `@/*` → `./src/*`

## Design

### 1. Three coordinate systems, one transformation point

Most bugs in map projects stem from coordinate system confusion. So we separate three coordinate systems **by type** and do conversions in only one place: `utils/coordinates.ts`.

| System | Type | Description |
|---|---|---|
| WGS84 | `{ lat, lng }` | raw lat/lng from the API |
| LocalXZ | `{ x, z }` | Three.js scene coordinates. origin = search center, **1 unit = 1 m** |
| Screen | NDC `-1 ~ 1` | for raycasting |

### 2. External data is validated at the gate with Zod

Overpass/geocoding responses have loose schemas and often arrive incomplete. We validate them in `lib/schemas.ts` at the parsing stage, so the scene layer always sees well-formed data.

### 3. Managing render costs

Buildings aren't individual meshes — we extrude them once and share materials from `materialPool`. Models go through Draco/meshopt compression via `scripts/convert-models.js` before loading, and we check our frame budget with `PerformanceMonitor`, tuning as we go.

## Reference

- `CLAUDE.md` — working rules (coordinate conventions, folder structure)
- `plans/feat-cute-3d-map-explorer.md` — initial design doc
- `FREE_3D_ASSETS.md` — list of usable free 3D assets

## License

**Source-available — not open source.** We've made the code readable, but you don't have permission to use it. If you want to use it in another project, redistribute it, or use it commercially, you'll need written permission first. Full text: [LICENSE](LICENSE), Korean guidance: [LICENSE.ko.md](LICENSE.ko.md).

Map data is **OpenStreetMap contributors (ODbL)**, and 3D models follow their respective licenses (see `FREE_3D_ASSETS.md`).

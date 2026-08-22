// Coordinates
export type {
  WGS84,
  LocalXZ,
  Position3D,
  BoundingBox,
} from './coordinates';

// Building
export type { BuildingType, Building } from './building';
export { getBuildingType } from './building';

// POI
export type {
  POICategory,
  RestaurantPOI,
  CafePOI,
  SubwayPOI,
  BusStopPOI,
  ParkPOI,
  DefaultPOI,
  POI,
} from './poi';
export { getPOICategory } from './poi';

// Road
export type { RoadType, Road } from './road';
export { getRoadType, getRoadWidth, getRoadColor } from './road';

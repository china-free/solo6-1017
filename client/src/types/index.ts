export type RECATCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Coordinate {
  lat: number;
  lng: number;
  alt?: number;
}

export interface Runway {
  id: string;
  name: string;
  start: Coordinate;
  end: Coordinate;
  heading: number;
  length: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coordinate: Coordinate;
  altitude?: number;
  speedLimit?: number;
}

export interface Route {
  id: string;
  name: string;
  type: 'arrival' | 'departure';
  runwayId: string;
  waypoints: Waypoint[];
}

export interface FlightPlan {
  id: string;
  flightId: string;
  aircraftType: string;
  aircraftCategory: RECATCategory;
  origin: string;
  destination: string;
  eta: string;
}

export interface WeatherCondition {
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  humidity: number;
  pressure: number;
}

export interface WakeVortexZone {
  id: string;
  flightId: string;
  center: Coordinate;
  radius: number;
  intensity: number;
  height: number;
  createdAt: string;
  dissipatedAt?: string;
}

export interface ScheduledFlight {
  flightPlan: FlightPlan;
  sequenceNumber: number;
  assignedRunwayId: string;
  assignedRouteId: string;
  scheduledLandingTime: string;
  requiredSeparation: number;
  separationFromPrevious: number;
  separationAdjusted: boolean;
  adjustmentReason?: string;
  trajectory: Coordinate[];
  wakeZones: WakeVortexZone[];
}

export interface RunwayOccupancy {
  id: string;
  runwayId: string;
  flightId: string;
  startTime: string;
  endTime: string;
  operationType: 'landing' | 'takeoff';
}

export interface SchedulingResult {
  scheduledFlights: ScheduledFlight[];
  runwayOccupancies: RunwayOccupancy[];
  totalFlights: number;
  averageDelay: number;
  maxDelay: number;
  runwayUtilization: Record<string, number>;
  weatherCondition: WeatherCondition;
}

export interface SchedulingResponse {
  success: boolean;
  data: {
    standard: SchedulingResult;
    optimized: SchedulingResult;
    validation: {
      valid: boolean;
      conflicts: string[];
    };
    capacityImprovement: {
      flightsScheduled: number;
      delayReduction: number;
      capacityIncreasePercent: string;
    };
  };
}

export interface AirportConfig {
  icaoCode: string;
  name: string;
  center: Coordinate;
  runways: Runway[];
  routes: Route[];
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  startTime: string;
  endTime: string;
}

export const recatCategoryColors: Record<RECATCategory, string> = {
  F: '#FF4D4F',
  E: '#FA8C16',
  D: '#FAAD14',
  C: '#52C41A',
  B: '#1890FF',
  A: '#722ED1'
};

export const recatCategoryNames: Record<RECATCategory, string> = {
  F: '超重型',
  E: '重型',
  D: '中大型',
  C: '中型',
  B: '中小型',
  A: '轻型'
};

export const getWakeIntensityColor = (intensity: number): [number, number, number, number] => {
  if (intensity > 0.7) return [255, 77, 79, 200];
  if (intensity > 0.5) return [250, 140, 22, 180];
  if (intensity > 0.3) return [250, 173, 20, 160];
  if (intensity > 0.1) return [82, 196, 26, 140];
  return [24, 144, 255, 100];
};

export const getAltitudeColor = (altitude: number): [number, number, number, number] => {
  const normalized = Math.min(1, altitude / 6000);
  const r = Math.floor(24 + normalized * 231);
  const g = Math.floor(144 - normalized * 100);
  const b = Math.floor(255 - normalized * 200);
  return [r, g, b, 255];
};

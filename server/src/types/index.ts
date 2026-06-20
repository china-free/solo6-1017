export type RECATCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface AircraftType {
  icaoCode: string;
  model: string;
  recatCategory: RECATCategory;
  maxTakeoffWeight: number;
  approachSpeed: number;
  wakeVortexStrength: number;
}

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
  eta: Date;
  etd?: Date;
  routeId?: string;
}

export interface WeatherCondition {
  timestamp: Date;
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
  createdAt: Date;
  dissipatedAt?: Date;
}

export interface ScheduledFlight {
  flightPlan: FlightPlan;
  sequenceNumber: number;
  assignedRunwayId: string;
  assignedRouteId: string;
  scheduledLandingTime: Date;
  scheduledTakeoffTime?: Date;
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
  startTime: Date;
  endTime: Date;
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

export interface SeparationMatrix {
  [leadingCategory: string]: {
    [followingCategory: string]: number;
  };
}

export interface AirportConfig {
  icaoCode: string;
  name: string;
  center: Coordinate;
  runways: Runway[];
  routes: Route[];
}

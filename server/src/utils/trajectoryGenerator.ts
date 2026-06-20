import { Coordinate, Route, Runway } from '../types';

export const generateApproachTrajectory = (
  route: Route,
  runway: Runway,
  startTime: Date,
  approachSpeed: number = 130
): Coordinate[] => {
  const trajectory: Coordinate[] = [];
  const waypoints = route.waypoints;
  
  if (waypoints.length < 2) return trajectory;
  
  const totalPoints = 100;
  const timeStep = 1;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i].coordinate;
    const end = waypoints[i + 1].coordinate;
    const startAlt = waypoints[i].altitude || 3000;
    const endAlt = waypoints[i + 1].altitude || 3000;
    
    const segmentPoints = Math.floor(totalPoints / (waypoints.length - 1));
    
    for (let j = 0; j < segmentPoints; j++) {
      const ratio = j / segmentPoints;
      trajectory.push({
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
        alt: startAlt + (endAlt - startAlt) * ratio
      });
    }
  }
  
  const lastWaypoint = waypoints[waypoints.length - 1].coordinate;
  const lastAltitude = waypoints[waypoints.length - 1].altitude || 500;
  
  const runwayEnd = runway.end;
  const runwayStart = runway.start;
  
  const finalApproachPoints = 30;
  for (let i = 0; i <= finalApproachPoints; i++) {
    const ratio = i / finalApproachPoints;
    const glideSlopeAltitude = lastAltitude * (1 - ratio);
    trajectory.push({
      lat: lastWaypoint.lat + (runwayStart.lat - lastWaypoint.lat) * ratio,
      lng: lastWaypoint.lng + (runwayStart.lng - lastWaypoint.lng) * ratio,
      alt: Math.max(0, glideSlopeAltitude)
    });
  }
  
  const touchdownPoints = 10;
  for (let i = 1; i <= touchdownPoints; i++) {
    const ratio = i / touchdownPoints;
    trajectory.push({
      lat: runwayStart.lat + (runwayEnd.lat - runwayStart.lat) * ratio,
      lng: runwayStart.lng + (runwayEnd.lng - runwayStart.lng) * ratio,
      alt: 0
    });
  }
  
  return trajectory;
};

export const generateDepartureTrajectory = (
  route: Route,
  runway: Runway,
  startTime: Date,
  climbSpeed: number = 250
): Coordinate[] => {
  const trajectory: Coordinate[] = [];
  const waypoints = route.waypoints;
  
  const runwayStart = runway.start;
  const runwayEnd = runway.end;
  
  const takeoffPoints = 15;
  for (let i = 0; i < takeoffPoints; i++) {
    const ratio = i / takeoffPoints;
    const climbAlt = i < takeoffPoints * 0.7 ? 0 : (i - takeoffPoints * 0.7) / (takeoffPoints * 0.3) * 500;
    trajectory.push({
      lat: runwayStart.lat + (runwayEnd.lat - runwayStart.lat) * ratio,
      lng: runwayStart.lng + (runwayEnd.lng - runwayStart.lng) * ratio,
      alt: climbAlt
    });
  }
  
  if (waypoints.length > 0) {
    const firstWaypoint = waypoints[0].coordinate;
    const firstAltitude = waypoints[0].altitude || 2000;
    
    const climbPoints = 40;
    const currentAlt = 500;
    for (let i = 1; i <= climbPoints; i++) {
      const ratio = i / climbPoints;
      trajectory.push({
        lat: runwayEnd.lat + (firstWaypoint.lat - runwayEnd.lat) * ratio,
        lng: runwayEnd.lng + (firstWaypoint.lng - runwayEnd.lng) * ratio,
        alt: currentAlt + (firstAltitude - currentAlt) * ratio
      });
    }
    
    const routePoints = 50;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i].coordinate;
      const end = waypoints[i + 1].coordinate;
      const startAlt = waypoints[i].altitude || 2000;
      const endAlt = waypoints[i + 1].altitude || 3000;
      
      const segmentPoints = Math.floor(routePoints / (waypoints.length - 1));
      
      for (let j = 0; j < segmentPoints; j++) {
        const ratio = j / segmentPoints;
        trajectory.push({
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio,
          alt: startAlt + (endAlt - startAlt) * ratio
        });
      }
    }
  }
  
  return trajectory;
};

export const getTrajectoryPointAtTime = (
  trajectory: Coordinate[],
  startTime: Date,
  currentTime: Date,
  totalDuration: number = 120
): Coordinate | null => {
  const elapsed = (currentTime.getTime() - startTime.getTime()) / 1000;
  
  if (elapsed < 0 || elapsed > totalDuration) return null;
  
  const progress = Math.min(1, elapsed / totalDuration);
  const index = Math.floor(progress * (trajectory.length - 1));
  
  return trajectory[Math.min(index, trajectory.length - 1)] || null;
};

export const calculateDistance = (
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number => {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateBearing = (
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number => {
  const y = Math.sin((p2.lng * Math.PI) / 180 - (p1.lng * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180);
  const x = Math.cos((p1.lat * Math.PI) / 180) * Math.sin((p2.lat * Math.PI) / 180) -
    Math.sin((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.cos((p2.lng * Math.PI) / 180 - (p1.lng * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export const calculateRunwayHeading = (runway: Runway): number => {
  return calculateBearing(runway.start, runway.end);
};

export const getFlightPhase = (
  trajectory: Coordinate[],
  currentIndex: number
): 'climb' | 'cruise' | 'descent' | 'approach' | 'landing' | 'takeoff' => {
  const progress = currentIndex / trajectory.length;
  
  if (progress < 0.2) return 'takeoff';
  if (progress < 0.4) return 'climb';
  if (progress < 0.6) return 'cruise';
  if (progress < 0.8) return 'descent';
  if (progress < 0.95) return 'approach';
  return 'landing';
};

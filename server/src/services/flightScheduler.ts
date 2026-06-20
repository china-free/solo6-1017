import {
  FlightPlan,
  ScheduledFlight,
  RunwayOccupancy,
  SchedulingResult,
  WeatherCondition,
  AirportConfig,
  Runway,
  Route,
  WakeVortexZone
} from '../types';
import { calculateRequiredSeparation } from '../utils/separationCalculator';
import { generateApproachTrajectory, calculateRunwayHeading } from '../utils/trajectoryGenerator';
import { generateWakeVortexZones } from '../utils/wakeDissipation';
import { getRECATCategory, getApproachSpeed } from '../data/aircraftTypes';

interface SchedulingOptions {
  prioritizeDelay?: number;
  enableWakeDissipation?: boolean;
  maxRetries?: number;
}

const LANDING_ROLL_TIME = 30;
const MIN_TAKEOFF_ROLL_TIME = 45;

export const scheduleFlights = (
  flightPlans: FlightPlan[],
  airportConfig: AirportConfig,
  weather: WeatherCondition,
  options: SchedulingOptions = {}
): SchedulingResult => {
  const {
    prioritizeDelay = 300,
    enableWakeDissipation = true,
    maxRetries = 3
  } = options;

  const sortedPlans = [...flightPlans].sort((a, b) => a.eta.getTime() - b.eta.getTime());

  const optimizedOrder = optimizeFlightOrder(sortedPlans);

  const scheduledFlights: ScheduledFlight[] = [];
  const runwayOccupancies: RunwayOccupancy[] = [];
  const activeWakeZones: WakeVortexZone[] = [];

  const runwayLastUse: Record<string, Date> = {};
  let previousFlightByRunway: Record<string, ScheduledFlight | null> = {};

  airportConfig.runways.forEach(runway => {
    runwayLastUse[runway.id] = new Date(0);
    previousFlightByRunway[runway.id] = null;
  });

  for (let retry = 0; retry < maxRetries; retry++) {
    let allScheduled = true;

    for (const flightPlan of optimizedOrder) {
      if (scheduledFlights.some(sf => sf.flightPlan.id === flightPlan.id)) continue;

      const availableRunways = findAvailableRunways(
        flightPlan,
        airportConfig.runways,
        airportConfig.routes,
        scheduledFlights,
        weather
      );

      let bestScheduled = false;

      for (const { runway, route } of availableRunways) {
        const result = tryScheduleFlight(
          flightPlan,
          runway,
          route,
          previousFlightByRunway[runway.id],
          weather,
          activeWakeZones,
          prioritizeDelay,
          enableWakeDissipation,
          airportConfig
        );

        if (result.success && result.scheduledFlight) {
          scheduledFlights.push(result.scheduledFlight);
          runwayOccupancies.push(...result.occupancies);
          activeWakeZones.push(...result.scheduledFlight.wakeZones);

          runwayLastUse[runway.id] = result.scheduledFlight.scheduledLandingTime;
          previousFlightByRunway[runway.id] = result.scheduledFlight;
          bestScheduled = true;
          break;
        }
      }

      if (!bestScheduled) {
        allScheduled = false;
      }
    }

    if (allScheduled) break;
  }

  const finalScheduled = scheduledFlights.sort(
    (a, b) => a.scheduledLandingTime.getTime() - b.scheduledLandingTime.getTime()
  );

  finalScheduled.forEach((flight, index) => {
    flight.sequenceNumber = index + 1;
  });

  const delays = finalScheduled.map(sf =>
    (sf.scheduledLandingTime.getTime() - sf.flightPlan.eta.getTime()) / 1000
  );
  const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
  const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;

  const runwayUtilization: Record<string, number> = {};
  const timeWindow = 3600;

  for (const runway of airportConfig.runways) {
    const runwayOcc = runwayOccupancies.filter(ro => ro.runwayId === runway.id);
    const totalOccupied = runwayOcc.reduce((sum, occ) => {
      return sum + (occ.endTime.getTime() - occ.startTime.getTime()) / 1000;
    }, 0);
    runwayUtilization[runway.id] = Math.min(100, (totalOccupied / timeWindow) * 100);
  }

  return {
    scheduledFlights: finalScheduled,
    runwayOccupancies,
    totalFlights: finalScheduled.length,
    averageDelay: avgDelay,
    maxDelay,
    runwayUtilization,
    weatherCondition: weather
  };
};

const optimizeFlightOrder = (flightPlans: FlightPlan[]): FlightPlan[] => {
  const byCategory: Record<string, FlightPlan[]> = {
    F: [], E: [], D: [], C: [], B: [], A: []
  };

  flightPlans.forEach(fp => {
    const cat = getRECATCategory(fp.aircraftType);
    byCategory[cat].push(fp);
  });

  const result: FlightPlan[] = [];
  const categories: ('F' | 'E' | 'D' | 'C' | 'B' | 'A')[] = ['F', 'E', 'D', 'C', 'B', 'A'];

  for (const category of categories) {
    while (byCategory[category].length > 0) {
      const heavy = byCategory[category].shift();
      if (heavy) result.push(heavy);

      for (let i = categories.length - 1; i >= 0; i--) {
        const lightCat = categories[i];
        if (lightCat === category) continue;

        if (byCategory[lightCat].length > 0) {
          const light = byCategory[lightCat].shift();
          if (light) result.push(light);
          break;
        }
      }
    }
  }

  return result;
};

const findAvailableRunways = (
  flightPlan: FlightPlan,
  runways: Runway[],
  routes: Route[],
  scheduledFlights: ScheduledFlight[],
  weather: WeatherCondition
): Array<{ runway: Runway; route: Route }> => {
  const result: Array<{ runway: Runway; route: Route }> = [];

  for (const runway of runways) {
    const arrivalRoutes = routes.filter(r => r.type === 'arrival' && r.runwayId === runway.id);

    for (const route of arrivalRoutes) {
      result.push({ runway, route });
    }
  }

  return result;
};

interface ScheduleAttemptResult {
  success: boolean;
  scheduledFlight?: ScheduledFlight;
  occupancies: RunwayOccupancy[];
}

const tryScheduleFlight = (
  flightPlan: FlightPlan,
  runway: Runway,
  route: Route,
  previousFlight: ScheduledFlight | null,
  weather: WeatherCondition,
  activeWakeZones: WakeVortexZone[],
  maxDelay: number,
  enableWakeDissipation: boolean,
  airportConfig: AirportConfig
): ScheduleAttemptResult => {
  const category = getRECATCategory(flightPlan.aircraftType);
  const approachSpeed = getApproachSpeed(flightPlan.aircraftType);
  const runwayHeading = calculateRunwayHeading(runway);

  let scheduledTime = new Date(flightPlan.eta);

  let requiredSeparation = 0;
  let separationFromPrevious = 0;
  let separationAdjusted = false;
  let adjustmentReason = '';

  if (previousFlight) {
    const prevCategory = getRECATCategory(previousFlight.flightPlan.aircraftType);

    const separationResult = calculateRequiredSeparation(
      prevCategory,
      category,
      previousFlight.flightPlan.aircraftType,
      flightPlan.aircraftType,
      weather,
      runwayHeading
    );

    requiredSeparation = enableWakeDissipation
      ? separationResult.adjustedSeparation
      : separationResult.standardSeparation;

    separationFromPrevious = requiredSeparation;
    separationAdjusted = separationResult.adjusted;
    adjustmentReason = separationResult.adjustmentReason;

    const earliestPossible = new Date(
      previousFlight.scheduledLandingTime.getTime() + requiredSeparation * 1000
    );

    if (earliestPossible > scheduledTime) {
      scheduledTime = earliestPossible;
    }
  }

  const delay = (scheduledTime.getTime() - flightPlan.eta.getTime()) / 1000;
  if (delay > maxDelay) {
    return { success: false, occupancies: [] };
  }

  const trajectory = generateApproachTrajectory(route, runway, scheduledTime, approachSpeed);

  const wakeZones = generateWakeVortexZones(
    flightPlan.flightId,
    trajectory,
    flightPlan.aircraftType,
    weather,
    scheduledTime
  );

  const landingStartTime = new Date(scheduledTime.getTime() + (trajectory.length - 40) * 1000 / 60);
  const landingEndTime = new Date(landingStartTime.getTime() + LANDING_ROLL_TIME * 1000);

  const occupancies: RunwayOccupancy[] = [{
    id: `${flightPlan.id}-occupancy`,
    runwayId: runway.id,
    flightId: flightPlan.flightId,
    startTime: landingStartTime,
    endTime: landingEndTime,
    operationType: 'landing'
  }];

  const scheduledFlight: ScheduledFlight = {
    flightPlan,
    sequenceNumber: 0,
    assignedRunwayId: runway.id,
    assignedRouteId: route.id,
    scheduledLandingTime: scheduledTime,
    requiredSeparation,
    separationFromPrevious,
    separationAdjusted,
    adjustmentReason,
    trajectory,
    wakeZones
  };

  return {
    success: true,
    scheduledFlight,
    occupancies
  };
};

export const validateSchedule = (
  scheduledFlights: ScheduledFlight[],
  weather: WeatherCondition
): { valid: boolean; conflicts: string[] } => {
  const conflicts: string[] = [];

  for (let i = 1; i < scheduledFlights.length; i++) {
    const current = scheduledFlights[i];
    const previous = scheduledFlights[i - 1];

    if (current.assignedRunwayId !== previous.assignedRunwayId) continue;

    const timeDiff = (current.scheduledLandingTime.getTime() - previous.scheduledLandingTime.getTime()) / 1000;

    const currentCat = getRECATCategory(current.flightPlan.aircraftType);
    const prevCat = getRECATCategory(previous.flightPlan.aircraftType);

    if (timeDiff < current.separationFromPrevious) {
      conflicts.push(
        `航班 ${current.flightPlan.flightId} 与前机 ${previous.flightPlan.flightId} 间隔不足: ` +
        `实际 ${timeDiff.toFixed(0)}s < 要求 ${current.separationFromPrevious}s`
      );
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts
  };
};

export const calculateCapacityImprovement = (
  standardResult: SchedulingResult,
  optimizedResult: SchedulingResult
): {
  flightsScheduled: number;
  delayReduction: number;
  capacityIncrease: number;
} => {
  return {
    flightsScheduled: optimizedResult.totalFlights,
    delayReduction: standardResult.averageDelay - optimizedResult.averageDelay,
    capacityIncrease: optimizedResult.totalFlights - standardResult.totalFlights
  };
};

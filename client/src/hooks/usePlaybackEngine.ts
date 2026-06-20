import { useMemo } from 'react';
import {
  ScheduledFlight,
  SchedulingResult,
  PlaybackState,
  RunwayOccupancy
} from '../types';

export interface FlightRenderData {
  flight: ScheduledFlight;
  position: [number, number, number];
  trajectoryProgress: number;
  visiblePointCount: number;
}

export interface WakeZoneRenderData {
  id: string;
  flightId: string;
  center: [number, number, number];
  radius: number;
  intensity: number;
  height: number;
}

export interface GanttTimeInfo {
  currentMs: number;
  minTime: number;
  maxTime: number;
  totalDuration: number;
  positionPercent: number;
  activeOccupancyIds: Set<string>;
  runways: string[];
  runwayIndices: Map<string, number>;
  occupancies: Array<RunwayOccupancy & {
    runwayIndex: number;
    startMs: number;
    endMs: number;
  }>;
}

export interface PlaybackEngineResult {
  currentMs: number;
  totalDurationSeconds: number;
  activeFlights: ScheduledFlight[];
  flightRenderData: FlightRenderData[];
  activeWakeZones: WakeZoneRenderData[];
  ganttTimeInfo: GanttTimeInfo | null;
  getTrajectoryProgress: (flight: ScheduledFlight) => number;
  getFlightPosition: (flight: ScheduledFlight) => [number, number, number];
}

const calculateTrajectoryProgress = (
  flight: ScheduledFlight,
  currentMs: number
): number => {
  const landingMs = new Date(flight.scheduledLandingTime).getTime();
  const approachStart = landingMs - 120000;
  const approachEnd = landingMs + 60000;

  if (currentMs < approachStart) return 0;
  if (currentMs > approachEnd) return 1;

  return (currentMs - approachStart) / (approachEnd - approachStart);
};

const calculateFlightPosition = (
  flight: ScheduledFlight,
  currentMs: number
): [number, number, number] => {
  const progress = calculateTrajectoryProgress(flight, currentMs);
  const index = Math.floor(progress * (flight.trajectory.length - 1));
  const point = flight.trajectory[Math.min(index, flight.trajectory.length - 1)];

  if (!point) {
    const firstPoint = flight.trajectory[0];
    return [firstPoint.lng, firstPoint.lat, firstPoint.alt || 0];
  }

  return [point.lng, point.lat, (point.alt || 0) + 200];
};

const buildGanttTimeInfo = (
  schedulingResult: SchedulingResult | null,
  currentMs: number
): GanttTimeInfo | null => {
  if (!schedulingResult || schedulingResult.runwayOccupancies.length === 0) {
    return null;
  }

  const runwayMap = new Map<string, number>();
  schedulingResult.runwayOccupancies.forEach(occ => {
    if (!runwayMap.has(occ.runwayId)) {
      runwayMap.set(occ.runwayId, runwayMap.size);
    }
  });

  const runways = Array.from(runwayMap.keys());

  let minTime = Infinity;
  let maxTime = -Infinity;

  schedulingResult.runwayOccupancies.forEach(occ => {
    const start = new Date(occ.startTime).getTime();
    const end = new Date(occ.endTime).getTime();
    minTime = Math.min(minTime, start);
    maxTime = Math.max(maxTime, end);
  });

  if (minTime === Infinity) return null;

  const timePadding = (maxTime - minTime) * 0.1;
  minTime -= timePadding;
  maxTime += timePadding;

  const totalDuration = maxTime - minTime;
  const positionPercent = ((currentMs - minTime) / totalDuration) * 100;

  const activeOccupancyIds = new Set<string>();
  const occupancies = schedulingResult.runwayOccupancies.map(occ => {
    const startMs = new Date(occ.startTime).getTime();
    const endMs = new Date(occ.endTime).getTime();
    if (currentMs >= startMs && currentMs <= endMs) {
      activeOccupancyIds.add(occ.id);
    }
    return {
      ...occ,
      runwayIndex: runwayMap.get(occ.runwayId)!,
      startMs,
      endMs
    };
  });

  return {
    currentMs,
    minTime,
    maxTime,
    totalDuration,
    positionPercent,
    activeOccupancyIds,
    runways,
    runwayIndices: runwayMap,
    occupancies
  };
};

export const usePlaybackEngine = (
  playbackState: PlaybackState,
  schedulingResult: SchedulingResult | null
): PlaybackEngineResult => {
  const { startTime, currentTime, endTime } = playbackState;

  const currentMs = useMemo(() => {
    if (!startTime) return 0;
    return new Date(startTime).getTime() + currentTime * 1000;
  }, [startTime, currentTime]);

  const totalDurationSeconds = useMemo(() => {
    if (!startTime || !endTime) return 0;
    return (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
  }, [startTime, endTime]);

  const getTrajectoryProgress = useMemo(() => {
    return (flight: ScheduledFlight) => calculateTrajectoryProgress(flight, currentMs);
  }, [currentMs]);

  const getFlightPosition = useMemo(() => {
    return (flight: ScheduledFlight) => calculateFlightPosition(flight, currentMs);
  }, [currentMs]);

  const activeFlights = useMemo((): ScheduledFlight[] => {
    if (!schedulingResult || !startTime) return [];

    return schedulingResult.scheduledFlights.filter(flight => {
      const landingTime = new Date(flight.scheduledLandingTime).getTime();
      const approachStart = landingTime - 120000;
      const approachEnd = landingTime + 60000;
      return currentMs >= approachStart && currentMs <= approachEnd;
    });
  }, [schedulingResult, startTime, currentMs]);

  const flightRenderData = useMemo((): FlightRenderData[] => {
    return activeFlights.map(flight => {
      const trajectoryProgress = calculateTrajectoryProgress(flight, currentMs);
      const visiblePointCount = Math.floor(flight.trajectory.length * trajectoryProgress);
      const position = calculateFlightPosition(flight, currentMs);

      return {
        flight,
        position,
        trajectoryProgress,
        visiblePointCount
      };
    });
  }, [activeFlights, currentMs]);

  const activeWakeZones = useMemo((): WakeZoneRenderData[] => {
    if (!schedulingResult || !startTime) return [];

    const zones: WakeZoneRenderData[] = [];

    for (const flight of schedulingResult.scheduledFlights) {
      for (const zone of flight.wakeZones) {
        const createdAt = new Date(zone.createdAt).getTime();
        const dissipatedAt = zone.dissipatedAt
          ? new Date(zone.dissipatedAt).getTime()
          : createdAt + 120000;

        if (currentMs >= createdAt && currentMs <= dissipatedAt) {
          const elapsed = (currentMs - createdAt) / (dissipatedAt - createdAt);
          const intensity = zone.intensity * (1 - elapsed);

          if (intensity > 0.05) {
            zones.push({
              id: zone.id,
              flightId: zone.flightId,
              center: [zone.center.lng, zone.center.lat, zone.center.alt || 1000],
              radius: zone.radius,
              intensity,
              height: zone.height
            });
          }
        }
      }
    }

    return zones;
  }, [schedulingResult, startTime, currentMs]);

  const ganttTimeInfo = useMemo((): GanttTimeInfo | null => {
    return buildGanttTimeInfo(schedulingResult, currentMs);
  }, [schedulingResult, currentMs]);

  return {
    currentMs,
    totalDurationSeconds,
    activeFlights,
    flightRenderData,
    activeWakeZones,
    ganttTimeInfo,
    getTrajectoryProgress,
    getFlightPosition
  };
};

export default usePlaybackEngine;

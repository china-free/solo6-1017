import { useState, useCallback } from 'react';
import {
  FlightPlan,
  AirportConfig,
  WeatherCondition,
  SchedulingResult,
  ScheduledFlight,
  RunwayOccupancy,
  ViewState,
  PlaybackState
} from '../types';
import {
  getAirportConfig,
  getWeather,
  calculateSchedule,
  uploadFlightPlan,
  getFlightPlans,
  clearFlightPlans
} from '../services/api';

export const useAtcStore = () => {
  const [airportConfig, setAirportConfig] = useState<AirportConfig | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [flightPlans, setFlightPlans] = useState<FlightPlan[]>([]);
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null);
  const [standardResult, setStandardResult] = useState<SchedulingResult | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<ScheduledFlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'none' | 'runway' | 'route'>('none');
  const [showWakeZones, setShowWakeZones] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);

  const [viewState, setViewState] = useState<ViewState>({
    longitude: 116.6031,
    latitude: 40.0799,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    startTime: '',
    endTime: ''
  });

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [airportRes, weatherRes, plansRes] = await Promise.all([
        getAirportConfig(),
        getWeather(),
        getFlightPlans()
      ]);

      if (airportRes.success) {
        setAirportConfig(airportRes.data);
      }
      if (weatherRes.success) {
        setWeather(weatherRes.data);
      }
      if (plansRes.success) {
        setFlightPlans(plansRes.data.flightPlans);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadCSV = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await uploadFlightPlan(file);
      if (result.success) {
        setFlightPlans(result.data.flightPlans);
        return result;
      }
      throw new Error(result.message || '上传失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPlans = useCallback(async () => {
    try {
      await clearFlightPlans();
      setFlightPlans([]);
      setSchedulingResult(null);
      setStandardResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空失败');
    }
  }, []);

  const runScheduling = useCallback(async () => {
    if (!airportConfig || !weather) return null;

    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateSchedule({
        airportConfig,
        weather
      });

      if (result.success) {
        setSchedulingResult(result.data.optimized);
        setStandardResult(result.data.standard);

        if (result.data.optimized.scheduledFlights.length > 0) {
          const times = result.data.optimized.scheduledFlights.map(
            f => new Date(f.scheduledLandingTime).getTime()
          );
          setPlaybackState(prev => ({
            ...prev,
            startTime: new Date(Math.min(...times)).toISOString(),
            endTime: new Date(Math.max(...times) + 600000).toISOString(),
            currentTime: 0
          }));
        }

        return result.data;
      }
      throw new Error('调度计算失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '调度计算失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [airportConfig, weather]);

  const updateRunway = useCallback((runway: AirportConfig['runways'][0]) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      const runways = prev.runways.map(r =>
        r.id === runway.id ? runway : r
      );
      return { ...prev, runways };
    });
  }, []);

  const addRunway = useCallback((runway: AirportConfig['runways'][0]) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        runways: [...prev.runways, runway]
      };
    });
  }, []);

  const deleteRunway = useCallback((runwayId: string) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        runways: prev.runways.filter(r => r.id !== runwayId),
        routes: prev.routes.filter(r => r.runwayId !== runwayId)
      };
    });
  }, []);

  const updateRoute = useCallback((route: AirportConfig['routes'][0]) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      const routes = prev.routes.map(r =>
        r.id === route.id ? route : r
      );
      return { ...prev, routes };
    });
  }, []);

  const addRoute = useCallback((route: AirportConfig['routes'][0]) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        routes: [...prev.routes, route]
      };
    });
  }, []);

  const deleteRoute = useCallback((routeId: string) => {
    setAirportConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        routes: prev.routes.filter(r => r.id !== routeId)
      };
    });
  }, []);

  const updateWeatherCondition = useCallback((newWeather: Partial<WeatherCondition>) => {
    setWeather(prev => prev ? { ...prev, ...newWeather } : prev);
  }, []);

  const getFlightsAtTime = useCallback((currentTime: number): ScheduledFlight[] => {
    if (!schedulingResult) return [];

    const timeMs = new Date(playbackState.startTime).getTime() + currentTime * 1000;

    return schedulingResult.scheduledFlights.filter(flight => {
      const landingTime = new Date(flight.scheduledLandingTime).getTime();
      const approachStart = landingTime - 120000;
      const approachEnd = landingTime + 60000;
      return timeMs >= approachStart && timeMs <= approachEnd;
    });
  }, [schedulingResult, playbackState.startTime]);

  const getActiveWakeZonesAtTime = useCallback((currentTime: number) => {
    if (!schedulingResult) return [];

    const timeMs = new Date(playbackState.startTime).getTime() + currentTime * 1000;
    const currentDate = new Date(timeMs);

    const zones: {
      id: string;
      flightId: string;
      center: [number, number, number];
      radius: number;
      intensity: number;
      height: number;
    }[] = [];

    for (const flight of schedulingResult.scheduledFlights) {
      for (const zone of flight.wakeZones) {
        const createdAt = new Date(zone.createdAt).getTime();
        const dissipatedAt = zone.dissipatedAt ? new Date(zone.dissipatedAt).getTime() : createdAt + 120000;

        if (timeMs >= createdAt && timeMs <= dissipatedAt) {
          const elapsed = (timeMs - createdAt) / (dissipatedAt - createdAt);
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
  }, [schedulingResult, playbackState.startTime]);

  return {
    airportConfig,
    weather,
    flightPlans,
    schedulingResult,
    standardResult,
    selectedFlight,
    isLoading,
    error,
    viewState,
    playbackState,
    editorMode,
    showWakeZones,
    showTrajectories,
    setViewState,
    setPlaybackState,
    setSelectedFlight,
    setEditorMode,
    setShowWakeZones,
    setShowTrajectories,
    loadInitialData,
    uploadCSV,
    clearPlans,
    runScheduling,
    updateRunway,
    addRunway,
    deleteRunway,
    updateRoute,
    addRoute,
    deleteRoute,
    updateWeatherCondition,
    getFlightsAtTime,
    getActiveWakeZonesAtTime
  };
};

export type AtcStoreType = ReturnType<typeof useAtcStore>;

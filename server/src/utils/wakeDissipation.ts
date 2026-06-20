import { WeatherCondition, WakeVortexZone, RECATCategory } from '../types';
import { aircraftTypes } from '../data/aircraftTypes';

const WIND_CROSSWIND_THRESHOLD = 5;
const WIND_TAILWIND_THRESHOLD = 3;

export const getWakeVortexDecayRate = (
  weather: WeatherCondition,
  aircraftCategory: RECATCategory
): number => {
  const baseDecay = 0.02;
  
  const categoryFactor: Record<RECATCategory, number> = {
    F: 1.5,
    E: 1.3,
    D: 1.1,
    C: 1.0,
    B: 0.8,
    A: 0.6
  };
  
  const windSpeedFactor = 1 + (weather.windSpeed / 20);
  const temperatureFactor = 1 + ((weather.temperature - 15) / 50);
  const humidityFactor = 1 - (weather.humidity / 300);
  
  return baseDecay * categoryFactor[aircraftCategory] * windSpeedFactor * temperatureFactor * humidityFactor;
};

export const calculateWakeDissipationTime = (
  weather: WeatherCondition,
  aircraftCategory: RECATCategory,
  initialIntensity: number = 1.0,
  safeThreshold: number = 0.1
): number => {
  const decayRate = getWakeVortexDecayRate(weather, aircraftCategory);
  const dissipationTime = Math.log(initialIntensity / safeThreshold) / decayRate;
  return Math.max(30, Math.min(dissipationTime, 300));
};

export const getCrosswindComponent = (
  windSpeed: number,
  windDirection: number,
  runwayHeading: number
): number => {
  const windRad = (windDirection * Math.PI) / 180;
  const runwayRad = (runwayHeading * Math.PI) / 180;
  const angleDiff = windRad - runwayRad;
  return Math.abs(windSpeed * Math.sin(angleDiff));
};

export const getHeadwindComponent = (
  windSpeed: number,
  windDirection: number,
  runwayHeading: number
): number => {
  const windRad = (windDirection * Math.PI) / 180;
  const runwayRad = (runwayHeading * Math.PI) / 180;
  const angleDiff = windRad - runwayRad;
  return windSpeed * Math.cos(angleDiff);
};

export const getSeparationAdjustmentFactor = (
  weather: WeatherCondition,
  runwayHeading: number,
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory
): { factor: number; adjusted: boolean; reason: string } => {
  const crosswind = getCrosswindComponent(weather.windSpeed, weather.windDirection, runwayHeading);
  const headwind = getHeadwindComponent(weather.windSpeed, weather.windDirection, runwayHeading);
  
  if (crosswind > WIND_CROSSWIND_THRESHOLD) {
    const reductionFactor = Math.max(0.6, 1 - (crosswind - WIND_CROSSWIND_THRESHOLD) * 0.05);
    return {
      factor: reductionFactor,
      adjusted: true,
      reason: `强侧风 ${crosswind.toFixed(1)}m/s 加速尾流消散，间隔缩减 ${((1 - reductionFactor) * 100).toFixed(0)}%`
    };
  }
  
  if (headwind < -WIND_TAILWIND_THRESHOLD) {
    const reductionFactor = Math.max(0.7, 1 - (Math.abs(headwind) - WIND_TAILWIND_THRESHOLD) * 0.03);
    return {
      factor: reductionFactor,
      adjusted: true,
      reason: `顺风 ${Math.abs(headwind).toFixed(1)}m/s 加速尾流移动，间隔缩减 ${((1 - reductionFactor) * 100).toFixed(0)}%`
    };
  }
  
  if (weather.windSpeed > 10) {
    const reductionFactor = Math.max(0.8, 1 - (weather.windSpeed - 10) * 0.02);
    return {
      factor: reductionFactor,
      adjusted: true,
      reason: `大风 ${weather.windSpeed.toFixed(1)}m/s 加速尾流消散，间隔缩减 ${((1 - reductionFactor) * 100).toFixed(0)}%`
    };
  }
  
  if (leadingCategory === 'A' || leadingCategory === 'B') {
    return {
      factor: 0.9,
      adjusted: true,
      reason: '前机为轻型/中小型飞机，尾流较弱，间隔缩减 10%'
    };
  }
  
  if (followingCategory === 'F' || followingCategory === 'E') {
    return {
      factor: 0.95,
      adjusted: true,
      reason: '后机为重型/超重型飞机，抗尾流能力强，间隔缩减 5%'
    };
  }
  
  return {
    factor: 1.0,
    adjusted: false,
    reason: '标准气象条件，使用标准间隔'
  };
};

export const generateWakeVortexZones = (
  flightId: string,
  trajectory: { lat: number; lng: number; alt?: number }[],
  aircraftType: string,
  weather: WeatherCondition,
  startTime: Date
): WakeVortexZone[] => {
  const aircraft = aircraftTypes[aircraftType];
  const category = aircraft?.recatCategory || 'C';
  const wakeStrength = aircraft?.wakeVortexStrength || 0.5;
  const dissipationTime = calculateWakeDissipationTime(weather, category, wakeStrength);
  
  const zones: WakeVortexZone[] = [];
  const sampleInterval = Math.max(1, Math.floor(trajectory.length / 10));
  
  for (let i = 0; i < trajectory.length; i += sampleInterval) {
    const point = trajectory[i];
    const timeOffset = (i / trajectory.length) * 60;
    const zoneCreatedAt = new Date(startTime.getTime() + timeOffset * 1000);
    
    zones.push({
      id: `${flightId}-wake-${i}`,
      flightId,
      center: {
        lat: point.lat,
        lng: point.lng,
        alt: point.alt || 1000
      },
      radius: 500 + wakeStrength * 300,
      intensity: wakeStrength,
      height: 300 + wakeStrength * 200,
      createdAt: zoneCreatedAt,
      dissipatedAt: new Date(zoneCreatedAt.getTime() + dissipationTime * 1000)
    });
  }
  
  return zones;
};

export const getWakeIntensityAtTime = (
  zone: WakeVortexZone,
  currentTime: Date
): number => {
  if (currentTime < zone.createdAt) return 0;
  if (zone.dissipatedAt && currentTime > zone.dissipatedAt) return 0;
  
  const elapsed = (currentTime.getTime() - zone.createdAt.getTime()) / 1000;
  const totalLifetime = zone.dissipatedAt 
    ? (zone.dissipatedAt.getTime() - zone.createdAt.getTime()) / 1000
    : 120;
  
  const decayFactor = Math.max(0, 1 - elapsed / totalLifetime);
  return zone.intensity * decayFactor;
};

export const checkWakeConflict = (
  position: { lat: number; lng: number; alt?: number },
  activeZones: WakeVortexZone[],
  currentTime: Date,
  safeIntensity: number = 0.1
): { hasConflict: boolean; zones: WakeVortexZone[] } => {
  const conflictingZones: WakeVortexZone[] = [];
  
  for (const zone of activeZones) {
    const intensity = getWakeIntensityAtTime(zone, currentTime);
    if (intensity < safeIntensity) continue;
    
    const distance = calculateHorizontalDistance(position, zone.center);
    const verticalDistance = Math.abs((position.alt || 0) - (zone.center.alt || 0));
    
    if (distance < zone.radius && verticalDistance < zone.height) {
      conflictingZones.push(zone);
    }
  }
  
  return {
    hasConflict: conflictingZones.length > 0,
    zones: conflictingZones
  };
};

const calculateHorizontalDistance = (
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

import { RECATCategory, WeatherCondition } from '../types';
import { getRECATEuSeparation, getTimeBasedSeparation } from '../data/recatEu';
import { getApproachSpeed } from '../data/aircraftTypes';
import { getSeparationAdjustmentFactor } from './wakeDissipation';

export interface SeparationResult {
  standardSeparation: number;
  adjustedSeparation: number;
  timeBasedSeparation: number;
  distanceBasedSeparation: number;
  adjusted: boolean;
  adjustmentReason: string;
  adjustmentFactor: number;
}

export const calculateRequiredSeparation = (
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory,
  leadingAircraftType: string,
  followingAircraftType: string,
  weather: WeatherCondition,
  runwayHeading: number
): SeparationResult => {
  const distanceSeparation = getRECATEuSeparation(leadingCategory, followingCategory);
  const timeSeparation = getTimeBasedSeparation(leadingCategory, followingCategory);
  
  const leadingSpeed = getApproachSpeed(leadingAircraftType);
  const followingSpeed = getApproachSpeed(followingAircraftType);
  
  let timeFromDistance = (distanceSeparation / 1852) / ((followingSpeed - leadingSpeed) / 3600);
  if (timeFromDistance < 60) timeFromDistance = 60;
  
  const standardTimeSeparation = Math.max(timeSeparation * 60, timeFromDistance);
  
  const adjustment = getSeparationAdjustmentFactor(
    weather,
    runwayHeading,
    leadingCategory,
    followingCategory
  );
  
  const adjustedTimeSeparation = standardTimeSeparation * adjustment.factor;
  
  return {
    standardSeparation: Math.round(standardTimeSeparation),
    adjustedSeparation: Math.round(adjustedTimeSeparation),
    timeBasedSeparation: Math.round(timeSeparation * 60),
    distanceBasedSeparation: Math.round(timeFromDistance),
    adjusted: adjustment.adjusted,
    adjustmentReason: adjustment.reason,
    adjustmentFactor: adjustment.factor
  };
};

export const calculateDistanceSeparation = (
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory
): number => {
  return getRECATEuSeparation(leadingCategory, followingCategory);
};

export const calculateFinalApproachSeparation = (
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory,
  altitude: number
): number => {
  const baseSeparation = getRECATEuSeparation(leadingCategory, followingCategory);
  
  const altitudeFactor = altitude < 1000 ? 1.2 : altitude < 2000 ? 1.1 : 1.0;
  
  return Math.round(baseSeparation * altitudeFactor);
};

export const getCategoryWeight = (category: RECATCategory): number => {
  const weights: Record<RECATCategory, number> = {
    F: 6,
    E: 5,
    D: 4,
    C: 3,
    B: 2,
    A: 1
  };
  return weights[category];
};

export const isSameOrHeavier = (cat1: RECATCategory, cat2: RECATCategory): boolean => {
  return getCategoryWeight(cat1) >= getCategoryWeight(cat2);
};

export const getOptimalSequencePairing = (
  categories: RECATCategory[]
): RECATCategory[] => {
  const sorted = [...categories].sort((a, b) => getCategoryWeight(b) - getCategoryWeight(a));
  
  const result: RECATCategory[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;
    
    result.push(sorted[i]);
    used.add(i);
    
    for (let j = sorted.length - 1; j > i; j--) {
      if (used.has(j)) continue;
      
      const separation = getRECATEuSeparation(sorted[i], sorted[j]);
      if (separation <= 100) {
        result.push(sorted[j]);
        used.add(j);
        break;
      }
    }
  }
  
  for (let i = 0; i < sorted.length; i++) {
    if (!used.has(i)) {
      result.push(sorted[i]);
    }
  }
  
  return result;
};

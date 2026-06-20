import { SeparationMatrix, RECATCategory } from '../types';

export const recatEuMatrix: SeparationMatrix = {
  F: { F: 90, E: 120, D: 120, C: 150, B: 180, A: 180 },
  E: { F: 90, E: 90, D: 100, C: 120, B: 150, A: 150 },
  D: { F: 90, E: 90, D: 90, C: 100, B: 120, A: 120 },
  C: { F: 90, E: 90, D: 90, C: 90, B: 100, A: 120 },
  B: { F: 80, E: 80, D: 80, C: 80, B: 80, A: 100 },
  A: { F: 60, E: 60, D: 60, C: 60, B: 60, A: 60 }
};

export const recatEuDescriptions: Record<RECATCategory, string> = {
  F: '超重型 - Maximum takeoff weight > 136,000 kg (e.g., A380, B747)',
  E: '重型 - Maximum takeoff weight > 136,000 kg (e.g., B777, A350)',
  D: '中大型 - Maximum takeoff weight 70,000-136,000 kg (e.g., B787, A330)',
  C: '中型 - Maximum takeoff weight 13,600-70,000 kg (e.g., B737, A320)',
  B: '中小型 - Maximum takeoff weight 7,000-13,600 kg (e.g., E190, CRJ9)',
  A: '轻型 - Maximum takeoff weight ≤ 7,000 kg (e.g., CRJ2, ATR42)'
};

export const getRECATEuSeparation = (
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory
): number => {
  const separation = recatEuMatrix[leadingCategory]?.[followingCategory];
  if (separation === undefined) {
    return 90;
  }
  return separation;
};

export const recatEuTimeBasedMatrix: SeparationMatrix = {
  F: { F: 1.5, E: 2.0, D: 2.0, C: 2.5, B: 3.0, A: 3.0 },
  E: { F: 1.5, E: 1.5, D: 1.7, C: 2.0, B: 2.5, A: 2.5 },
  D: { F: 1.5, E: 1.5, D: 1.5, C: 1.7, B: 2.0, A: 2.0 },
  C: { F: 1.5, E: 1.5, D: 1.5, C: 1.5, B: 1.7, A: 2.0 },
  B: { F: 1.3, E: 1.3, D: 1.3, C: 1.3, B: 1.3, A: 1.7 },
  A: { F: 1.0, E: 1.0, D: 1.0, C: 1.0, B: 1.0, A: 1.0 }
};

export const getTimeBasedSeparation = (
  leadingCategory: RECATCategory,
  followingCategory: RECATCategory
): number => {
  return recatEuTimeBasedMatrix[leadingCategory]?.[followingCategory] || 1.5;
};

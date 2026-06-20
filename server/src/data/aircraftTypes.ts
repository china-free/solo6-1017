import { AircraftType, RECATCategory } from '../types';

export const aircraftTypes: Record<string, AircraftType> = {
  A380: {
    icaoCode: 'A388',
    model: 'Airbus A380-800',
    recatCategory: 'F',
    maxTakeoffWeight: 560000,
    approachSpeed: 135,
    wakeVortexStrength: 1.0
  },
  B744: {
    icaoCode: 'B744',
    model: 'Boeing 747-400',
    recatCategory: 'F',
    maxTakeoffWeight: 396890,
    approachSpeed: 145,
    wakeVortexStrength: 0.95
  },
  B748: {
    icaoCode: 'B748',
    model: 'Boeing 747-8',
    recatCategory: 'F',
    maxTakeoffWeight: 447700,
    approachSpeed: 150,
    wakeVortexStrength: 0.98
  },
  AN124: {
    icaoCode: 'A124',
    model: 'Antonov An-124',
    recatCategory: 'F',
    maxTakeoffWeight: 405000,
    approachSpeed: 135,
    wakeVortexStrength: 0.95
  },
  B77W: {
    icaoCode: 'B77W',
    model: 'Boeing 777-300ER',
    recatCategory: 'E',
    maxTakeoffWeight: 351534,
    approachSpeed: 140,
    wakeVortexStrength: 0.85
  },
  B77L: {
    icaoCode: 'B77L',
    model: 'Boeing 777-200LR',
    recatCategory: 'E',
    maxTakeoffWeight: 347450,
    approachSpeed: 138,
    wakeVortexStrength: 0.83
  },
  A359: {
    icaoCode: 'A359',
    model: 'Airbus A350-900',
    recatCategory: 'E',
    maxTakeoffWeight: 280000,
    approachSpeed: 140,
    wakeVortexStrength: 0.80
  },
  A35K: {
    icaoCode: 'A35K',
    model: 'Airbus A350-1000',
    recatCategory: 'E',
    maxTakeoffWeight: 316000,
    approachSpeed: 142,
    wakeVortexStrength: 0.82
  },
  B789: {
    icaoCode: 'B789',
    model: 'Boeing 787-9',
    recatCategory: 'D',
    maxTakeoffWeight: 254000,
    approachSpeed: 135,
    wakeVortexStrength: 0.70
  },
  B788: {
    icaoCode: 'B788',
    model: 'Boeing 787-8',
    recatCategory: 'D',
    maxTakeoffWeight: 227930,
    approachSpeed: 130,
    wakeVortexStrength: 0.68
  },
  A333: {
    icaoCode: 'A333',
    model: 'Airbus A330-300',
    recatCategory: 'D',
    maxTakeoffWeight: 242000,
    approachSpeed: 135,
    wakeVortexStrength: 0.69
  },
  A332: {
    icaoCode: 'A332',
    model: 'Airbus A330-200',
    recatCategory: 'D',
    maxTakeoffWeight: 233000,
    approachSpeed: 132,
    wakeVortexStrength: 0.67
  },
  B763: {
    icaoCode: 'B763',
    model: 'Boeing 767-300ER',
    recatCategory: 'D',
    maxTakeoffWeight: 186880,
    approachSpeed: 130,
    wakeVortexStrength: 0.65
  },
  B753: {
    icaoCode: 'B753',
    model: 'Boeing 757-300',
    recatCategory: 'C',
    maxTakeoffWeight: 123830,
    approachSpeed: 135,
    wakeVortexStrength: 0.55
  },
  B752: {
    icaoCode: 'B752',
    model: 'Boeing 757-200',
    recatCategory: 'C',
    maxTakeoffWeight: 115665,
    approachSpeed: 130,
    wakeVortexStrength: 0.52
  },
  B739: {
    icaoCode: 'B739',
    model: 'Boeing 737-900ER',
    recatCategory: 'C',
    maxTakeoffWeight: 85130,
    approachSpeed: 140,
    wakeVortexStrength: 0.45
  },
  B738: {
    icaoCode: 'B738',
    model: 'Boeing 737-800',
    recatCategory: 'C',
    maxTakeoffWeight: 79010,
    approachSpeed: 135,
    wakeVortexStrength: 0.43
  },
  B737: {
    icaoCode: 'B737',
    model: 'Boeing 737-700',
    recatCategory: 'C',
    maxTakeoffWeight: 70080,
    approachSpeed: 130,
    wakeVortexStrength: 0.40
  },
  A321: {
    icaoCode: 'A321',
    model: 'Airbus A321-200',
    recatCategory: 'C',
    maxTakeoffWeight: 93500,
    approachSpeed: 135,
    wakeVortexStrength: 0.44
  },
  A320: {
    icaoCode: 'A320',
    model: 'Airbus A320-200',
    recatCategory: 'C',
    maxTakeoffWeight: 78000,
    approachSpeed: 130,
    wakeVortexStrength: 0.41
  },
  A319: {
    icaoCode: 'A319',
    model: 'Airbus A319-100',
    recatCategory: 'C',
    maxTakeoffWeight: 75500,
    approachSpeed: 128,
    wakeVortexStrength: 0.39
  },
  A318: {
    icaoCode: 'A318',
    model: 'Airbus A318-100',
    recatCategory: 'B',
    maxTakeoffWeight: 68000,
    approachSpeed: 125,
    wakeVortexStrength: 0.35
  },
  B712: {
    icaoCode: 'B712',
    model: 'Boeing 717-200',
    recatCategory: 'B',
    maxTakeoffWeight: 54885,
    approachSpeed: 128,
    wakeVortexStrength: 0.32
  },
  E190: {
    icaoCode: 'E190',
    model: 'Embraer ERJ-190',
    recatCategory: 'B',
    maxTakeoffWeight: 51800,
    approachSpeed: 125,
    wakeVortexStrength: 0.30
  },
  E175: {
    icaoCode: 'E175',
    model: 'Embraer ERJ-175',
    recatCategory: 'B',
    maxTakeoffWeight: 40370,
    approachSpeed: 120,
    wakeVortexStrength: 0.28
  },
  CRJ9: {
    icaoCode: 'CRJ9',
    model: 'Bombardier CRJ-900',
    recatCategory: 'B',
    maxTakeoffWeight: 38330,
    approachSpeed: 120,
    wakeVortexStrength: 0.27
  },
  CRJ2: {
    icaoCode: 'CRJ2',
    model: 'Bombardier CRJ-200',
    recatCategory: 'A',
    maxTakeoffWeight: 24041,
    approachSpeed: 120,
    wakeVortexStrength: 0.20
  },
  AT72: {
    icaoCode: 'AT72',
    model: 'ATR 72-500',
    recatCategory: 'A',
    maxTakeoffWeight: 23000,
    approachSpeed: 115,
    wakeVortexStrength: 0.18
  },
  AT45: {
    icaoCode: 'AT45',
    model: 'ATR 42-500',
    recatCategory: 'A',
    maxTakeoffWeight: 18600,
    approachSpeed: 110,
    wakeVortexStrength: 0.15
  },
  DHC8: {
    icaoCode: 'DH8D',
    model: 'Bombardier Dash 8 Q400',
    recatCategory: 'A',
    maxTakeoffWeight: 29300,
    approachSpeed: 120,
    wakeVortexStrength: 0.22
  }
};

export const getAircraftType = (code: string): AircraftType | undefined => {
  return aircraftTypes[code];
};

export const getRECATCategory = (aircraftCode: string): RECATCategory => {
  const aircraft = aircraftTypes[aircraftCode];
  return aircraft?.recatCategory || 'C';
};

export const getApproachSpeed = (aircraftCode: string): number => {
  const aircraft = aircraftTypes[aircraftCode];
  return aircraft?.approachSpeed || 130;
};

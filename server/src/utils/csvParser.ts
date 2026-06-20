import { parse } from 'csv-parse/sync';
import { FlightPlan, RECATCategory } from '../types';
import { getRECATCategory } from '../data/aircraftTypes';

export interface CSVRow {
  flightId: string;
  aircraftType: string;
  destination: string;
  eta: string;
  origin: string;
  [key: string]: string;
}

export const parseFlightPlanCSV = (csvContent: string): FlightPlan[] => {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as CSVRow[];

  const flightPlans: FlightPlan[] = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    if (!row.flightId || !row.aircraftType || !row.eta) {
      throw new Error(`行 ${i + 1}: 缺少必要字段 (flightId, aircraftType, eta)`);
    }

    const eta = parseTimeString(row.eta, baseDate);
    if (isNaN(eta.getTime())) {
      throw new Error(`行 ${i + 1}: 无效的时间格式 "${row.eta}"，请使用 HH:mm:ss 格式`);
    }

    const category = getRECATCategory(row.aircraftType);

    flightPlans.push({
      id: `fp-${Date.now()}-${i}`,
      flightId: row.flightId.trim(),
      aircraftType: row.aircraftType.trim(),
      aircraftCategory: category,
      origin: row.origin?.trim() || 'UNKNOWN',
      destination: row.destination?.trim() || 'UNKNOWN',
      eta
    });
  }

  return flightPlans;
};

const parseTimeString = (timeStr: string, baseDate: Date): Date => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    const dateMatch = timeStr.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/);
    if (dateMatch) {
      return new Date(timeStr);
    }
    return new Date(NaN);
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  const result = new Date(baseDate);
  result.setHours(hours, minutes, seconds, 0);

  return result;
};

export const generateSampleCSV = (): string => {
  const headers = ['flightId', 'aircraftType', 'destination', 'eta', 'origin'];
  const sampleData = [
    ['CA1234', 'B738', 'ZBAA', '08:30:00', 'ZSPD'],
    ['MU5678', 'A320', 'ZBAA', '08:32:00', 'ZSSS'],
    ['CZ9012', 'A333', 'ZBAA', '08:35:00', 'ZGGG'],
    ['HU3456', 'B789', 'ZBAA', '08:38:00', 'ZUUU'],
    ['CA5566', 'A380', 'ZBAA', '08:45:00', 'EGLL'],
    ['MU7788', 'B77W', 'ZBAA', '08:50:00', 'KLAX'],
    ['CA8899', 'E190', 'ZBAA', '08:55:00', 'ZSNJ'],
    ['CZ1122', 'CRJ2', 'ZBAA', '09:00:00', 'ZYTX'],
    ['MU3344', 'B748', 'ZBAA', '09:05:00', 'RKSI'],
    ['CA6677', 'A359', 'ZBAA', '09:10:00', 'EDDF']
  ];

  return [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');
};

export const validateAircraftType = (type: string): boolean => {
  return getRECATCategory(type) !== undefined;
};

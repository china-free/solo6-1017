import axios from 'axios';
import {
  FlightPlan,
  AirportConfig,
  WeatherCondition,
  SchedulingResponse,
  SchedulingResult
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

export const uploadFlightPlan = async (file: File): Promise<{
  success: boolean;
  message: string;
  data: {
    count: number;
    flightPlans: FlightPlan[];
  };
}> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/flights/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const downloadSampleCSV = async (): Promise<void> => {
  const response = await api.get('/flights/sample-csv', {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sample_flights.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const getFlightPlans = async (): Promise<{
  success: boolean;
  data: {
    count: number;
    flightPlans: FlightPlan[];
  };
}> => {
  const response = await api.get('/flights/plans');
  return response.data;
};

export const clearFlightPlans = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await api.delete('/flights/plans');
  return response.data;
};

export const calculateSchedule = async (options?: {
  airportConfig?: AirportConfig;
  weather?: WeatherCondition;
  schedulingOptions?: {
    prioritizeDelay?: number;
    enableWakeDissipation?: boolean;
    maxRetries?: number;
  };
}): Promise<SchedulingResponse> => {
  const response = await api.post('/flights/schedule', {
    airportConfig: options?.airportConfig,
    weather: options?.weather,
    options: options?.schedulingOptions
  });

  return response.data;
};

export const getAirportConfig = async (): Promise<{
  success: boolean;
  data: AirportConfig;
}> => {
  const response = await api.get('/flights/airport-config');
  return response.data;
};

export const updateAirportConfig = async (config: AirportConfig): Promise<{
  success: boolean;
  message: string;
  data: AirportConfig;
}> => {
  const response = await api.post('/flights/airport-config', config);
  return response.data;
};

export const getWeather = async (): Promise<{
  success: boolean;
  data: WeatherCondition;
}> => {
  const response = await api.get('/flights/weather');
  return response.data;
};

export const updateWeather = async (weather: Partial<WeatherCondition>): Promise<{
  success: boolean;
  message: string;
  data: WeatherCondition;
}> => {
  const response = await api.post('/flights/weather', weather);
  return response.data;
};

export const parseCSVContent = (content: string): FlightPlan[] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const flightIdIndex = headers.indexOf('flightId');
  const aircraftTypeIndex = headers.indexOf('aircraftType');
  const etaIndex = headers.indexOf('eta');
  const originIndex = headers.indexOf('origin');
  const destinationIndex = headers.indexOf('destination');

  const plans: FlightPlan[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 3) continue;

    plans.push({
      id: `fp-${i}`,
      flightId: values[flightIdIndex] || '',
      aircraftType: values[aircraftTypeIndex] || '',
      aircraftCategory: 'C',
      origin: values[originIndex] || 'UNKNOWN',
      destination: values[destinationIndex] || 'UNKNOWN',
      eta: values[etaIndex] || ''
    });
  }

  return plans;
};

export const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
};

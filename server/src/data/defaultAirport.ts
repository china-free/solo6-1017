import { AirportConfig } from '../types';

export const defaultAirport: AirportConfig = {
  icaoCode: 'ZBAA',
  name: '北京首都国际机场',
  center: {
    lat: 40.0799,
    lng: 116.6031
  },
  runways: [
    {
      id: 'rwy-18L',
      name: '18L/36R',
      start: { lat: 40.0950, lng: 116.5860 },
      end: { lat: 40.0500, lng: 116.5980 },
      heading: 180,
      length: 3800
    },
    {
      id: 'rwy-18R',
      name: '18R/36L',
      start: { lat: 40.0980, lng: 116.6120 },
      end: { lat: 40.0530, lng: 116.6240 },
      heading: 180,
      length: 3800
    },
    {
      id: 'rwy-01',
      name: '01/19',
      start: { lat: 40.0600, lng: 116.5700 },
      end: { lat: 40.1000, lng: 116.5800 },
      heading: 10,
      length: 3200
    }
  ],
  routes: [
    {
      id: 'arr-18L-A',
      name: 'STAR-18L-A',
      type: 'arrival',
      runwayId: 'rwy-18L',
      waypoints: [
        {
          id: 'wp-1',
          name: 'WULIN',
          coordinate: { lat: 40.3500, lng: 116.8000 },
          altitude: 6000,
          speedLimit: 250
        },
        {
          id: 'wp-2',
          name: 'GOTAM',
          coordinate: { lat: 40.2500, lng: 116.7500 },
          altitude: 4500,
          speedLimit: 220
        },
        {
          id: 'wp-3',
          name: 'NIMBA',
          coordinate: { lat: 40.1800, lng: 116.7000 },
          altitude: 3000,
          speedLimit: 200
        },
        {
          id: 'wp-4',
          name: 'IKELA',
          coordinate: { lat: 40.1200, lng: 116.6500 },
          altitude: 1500,
          speedLimit: 180
        },
        {
          id: 'wp-5',
          name: 'RWY18L',
          coordinate: { lat: 40.0950, lng: 116.5860 },
          altitude: 500,
          speedLimit: 160
        }
      ]
    },
    {
      id: 'arr-18R-A',
      name: 'STAR-18R-A',
      type: 'arrival',
      runwayId: 'rwy-18R',
      waypoints: [
        {
          id: 'wp-1',
          name: 'WULIN',
          coordinate: { lat: 40.3500, lng: 116.8500 },
          altitude: 6000,
          speedLimit: 250
        },
        {
          id: 'wp-2',
          name: 'GOTAM',
          coordinate: { lat: 40.2500, lng: 116.8000 },
          altitude: 4500,
          speedLimit: 220
        },
        {
          id: 'wp-3',
          name: 'NIMBA',
          coordinate: { lat: 40.1800, lng: 116.7500 },
          altitude: 3000,
          speedLimit: 200
        },
        {
          id: 'wp-4',
          name: 'IKELA',
          coordinate: { lat: 40.1200, lng: 116.7000 },
          altitude: 1500,
          speedLimit: 180
        },
        {
          id: 'wp-5',
          name: 'RWY18R',
          coordinate: { lat: 40.0980, lng: 116.6120 },
          altitude: 500,
          speedLimit: 160
        }
      ]
    },
    {
      id: 'arr-01-A',
      name: 'STAR-01-A',
      type: 'arrival',
      runwayId: 'rwy-01',
      waypoints: [
        {
          id: 'wp-1',
          name: 'DATONG',
          coordinate: { lat: 40.5000, lng: 116.4000 },
          altitude: 6000,
          speedLimit: 250
        },
        {
          id: 'wp-2',
          name: 'ZHANGJ',
          coordinate: { lat: 40.3000, lng: 116.4500 },
          altitude: 4500,
          speedLimit: 220
        },
        {
          id: 'wp-3',
          name: 'PINGGU',
          coordinate: { lat: 40.1800, lng: 116.5000 },
          altitude: 3000,
          speedLimit: 200
        },
        {
          id: 'wp-4',
          name: 'SHUNYI',
          coordinate: { lat: 40.1000, lng: 116.5300 },
          altitude: 1500,
          speedLimit: 180
        },
        {
          id: 'wp-5',
          name: 'RWY01',
          coordinate: { lat: 40.0600, lng: 116.5700 },
          altitude: 500,
          speedLimit: 160
        }
      ]
    },
    {
      id: 'dep-18L-B',
      name: 'SID-18L-B',
      type: 'departure',
      runwayId: 'rwy-18L',
      waypoints: [
        {
          id: 'wp-1',
          name: 'RWY18L',
          coordinate: { lat: 40.0950, lng: 116.5860 },
          altitude: 1000,
          speedLimit: 200
        },
        {
          id: 'wp-2',
          name: 'IKELA',
          coordinate: { lat: 40.1500, lng: 116.6500 },
          altitude: 3000,
          speedLimit: 220
        },
        {
          id: 'wp-3',
          name: 'NIMBA',
          coordinate: { lat: 40.2500, lng: 116.7500 },
          altitude: 5000,
          speedLimit: 250
        }
      ]
    },
    {
      id: 'dep-18R-B',
      name: 'SID-18R-B',
      type: 'departure',
      runwayId: 'rwy-18R',
      waypoints: [
        {
          id: 'wp-1',
          name: 'RWY18R',
          coordinate: { lat: 40.0980, lng: 116.6120 },
          altitude: 1000,
          speedLimit: 200
        },
        {
          id: 'wp-2',
          name: 'IKELA',
          coordinate: { lat: 40.1500, lng: 116.7000 },
          altitude: 3000,
          speedLimit: 220
        },
        {
          id: 'wp-3',
          name: 'NIMBA',
          coordinate: { lat: 40.2500, lng: 116.8000 },
          altitude: 5000,
          speedLimit: 250
        }
      ]
    }
  ]
};

export const sampleWeather = {
  timestamp: new Date(),
  windSpeed: 8,
  windDirection: 180,
  temperature: 22,
  humidity: 65,
  pressure: 1013
};

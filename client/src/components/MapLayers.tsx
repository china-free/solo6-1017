import { Layer } from '@deck.gl/core';
import {
  ScatterplotLayer,
  LineLayer,
  PolygonLayer,
  TextLayer,
  PathLayer
} from '@deck.gl/layers';
import { ColumnLayer } from '@deck.gl/layers';
import { AirportConfig, ScheduledFlight, recatCategoryColors, getWakeIntensityColor, getAltitudeColor } from '../types';
import { generateSyntheticTerrain } from '../utils/terrainGenerator';

interface MapLayersProps {
  airportConfig: AirportConfig;
  activeFlights: ScheduledFlight[];
  activeWakeZones: Array<{
    id: string;
    flightId: string;
    center: [number, number, number];
    radius: number;
    intensity: number;
    height: number;
  }>;
  currentTime: number;
  startTime: string;
  showWakeZones: boolean;
  showTrajectories: boolean;
  selectedFlight: ScheduledFlight | null;
  editorMode: 'none' | 'runway' | 'route';
  editorUpdateTrigger?: number;
  onMapClick?: (coord: { lat: number; lng: number }) => void;
}

const MapLayers = (props: MapLayersProps): Layer[] => {
  const {
    airportConfig,
    activeFlights,
    activeWakeZones,
    currentTime,
    startTime,
    showWakeZones,
    showTrajectories,
    selectedFlight,
    editorMode,
    editorUpdateTrigger = 0
  } = props;

  const layers: Layer[] = [];

  const terrainData = generateSyntheticTerrain(airportConfig.center, 5, 5);
  layers.push(
    new ColumnLayer({
      id: 'terrain-layer',
      data: terrainData,
      diskResolution: 4,
      radius: 100,
      angle: 0,
      offset: [0, 0],
      coverage: 1,
      elevationScale: 1,
      extruded: true,
      getPosition: (d: any) => [d.lng, d.lat, d.elevation],
      getFillColor: (d: any) => {
        const elev = d.elevation;
        if (elev > 500) return [100, 80, 60, 180];
        if (elev > 200) return [140, 120, 80, 180];
        if (elev > 50) return [160, 150, 100, 180];
        return [140, 160, 120, 180];
      },
      updateTriggers: {
        getFillColor: [airportConfig.center.lat, airportConfig.center.lng]
      }
    })
  );

  const runwayPolygons = airportConfig.runways.map(runway => {
    const dx = runway.end.lng - runway.start.lng;
    const dy = runway.end.lat - runway.start.lat;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len * 0.0015;
    const perpY = dx / len * 0.0015;

    return {
      id: runway.id,
      name: runway.name,
      polygon: [
        [runway.start.lng + perpX, runway.start.lat + perpY],
        [runway.end.lng + perpX, runway.end.lat + perpY],
        [runway.end.lng - perpX, runway.end.lat - perpY],
        [runway.start.lng - perpX, runway.start.lat - perpY]
      ],
      data: runway
    };
  });

  layers.push(
    new PolygonLayer({
      id: 'runway-polygons',
      data: runwayPolygons,
      filled: true,
      stroked: true,
      lineWidthMinPixels: 2,
      getPolygon: (d: any) => d.polygon,
      getFillColor: [80, 80, 80, 230],
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      pickable: true,
      onClick: (info) => {
        if (editorMode === 'none' && props.onMapClick) {
          props.onMapClick({ lat: info.coordinate[1], lng: info.coordinate[0] });
        }
      },
      updateTriggers: {
        getPolygon: [airportConfig.runways]
      }
    })
  );

  const runwayMarkings = airportConfig.runways.flatMap(runway => {
    const markings = [];
    const dx = runway.end.lng - runway.start.lng;
    const dy = runway.end.lat - runway.start.lat;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len * 0.0008;
    const perpY = dx / len * 0.0008;

    for (let i = 0; i < 10; i++) {
      const ratio = (i + 1) / 11;
      const x = runway.start.lng + dx * ratio;
      const y = runway.start.lat + dy * ratio;
      markings.push({
        path: [
          [x + perpX, y + perpY],
          [x - perpX, y - perpY]
        ]
      });
    }
    return markings;
  });

  layers.push(
    new PathLayer({
      id: 'runway-markings',
      data: runwayMarkings,
      getPath: (d: any) => d.path,
      getColor: [255, 255, 255, 200],
      getWidth: 3,
      widthMinPixels: 3,
      updateTriggers: {
        getPath: [airportConfig.runways]
      }
    })
  );

  const runwayLabels = airportConfig.runways.map(runway => ({
    text: runway.name,
    position: [
      (runway.start.lng + runway.end.lng) / 2,
      (runway.start.lat + runway.end.lat) / 2,
      10
    ],
    data: runway
  }));

  layers.push(
    new TextLayer({
      id: 'runway-labels',
      data: runwayLabels,
      getPosition: (d: any) => d.position,
      getText: (d: any) => d.text,
      getSize: 14,
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      getColor: [255, 255, 255, 255],
      getBackgroundColor: [0, 0, 0, 180],
      getPadding: [4, 6],
      updateTriggers: {
        getPosition: [airportConfig.runways]
      }
    })
  );

  const routePaths = airportConfig.routes.map(route => ({
    id: route.id,
    name: route.name,
    type: route.type,
    path: route.waypoints.map(wp => [wp.coordinate.lng, wp.coordinate.lat, wp.altitude || 1000]),
    color: route.type === 'arrival' ? [24, 144, 255, 180] : [82, 196, 26, 180],
    data: route
  }));

  layers.push(
    new PathLayer({
      id: 'route-paths',
      data: routePaths,
      getPath: (d: any) => d.path,
      getColor: (d: any) => d.color,
      getWidth: 2,
      widthMinPixels: 2,
      opacity: 0.6,
      updateTriggers: {
        getPath: [airportConfig.routes]
      }
    })
  );

  const waypointData = airportConfig.routes.flatMap(route =>
    route.waypoints.map(wp => ({
      id: wp.id,
      name: wp.name,
      position: [wp.coordinate.lng, wp.coordinate.lat, wp.altitude || 1000],
      altitude: wp.altitude || 0
    }))
  );

  layers.push(
    new ScatterplotLayer({
      id: 'waypoints',
      data: waypointData,
      getPosition: (d: any) => d.position,
      getRadius: 200,
      getFillColor: [250, 173, 20, 200],
      stroked: true,
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      updateTriggers: {
        getPosition: [airportConfig.routes]
      }
    })
  );

  layers.push(
    new TextLayer({
      id: 'waypoint-labels',
      data: waypointData,
      getPosition: (d: any) => [d.position[0], d.position[1], d.position[2] + 100],
      getText: (d: any) => d.name,
      getSize: 12,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getColor: [250, 173, 20, 255],
      getBackgroundColor: [0, 0, 0, 150],
      getPadding: [2, 4],
      updateTriggers: {
        getPosition: [airportConfig.routes]
      }
    })
  );

  if (showTrajectories) {
    const trajectoryData = activeFlights.map(flight => {
      const category = flight.flightPlan.aircraftCategory;
      const colorHex = recatCategoryColors[category];
      const color = [
        parseInt(colorHex.slice(1, 3), 16),
        parseInt(colorHex.slice(3, 5), 16),
        parseInt(colorHex.slice(5, 7), 16),
        200
      ];

      const trajectoryProgress = getTrajectoryProgress(flight, currentTime, startTime);
      const visiblePoints = Math.floor(flight.trajectory.length * trajectoryProgress);

      return {
        id: flight.flightPlan.flightId,
        path: flight.trajectory.slice(0, visiblePoints).map(p => [p.lng, p.lat, p.alt || 0]),
        color,
        data: flight,
        isSelected: selectedFlight?.flightPlan.flightId === flight.flightPlan.flightId
      };
    });

    layers.push(
      new PathLayer({
        id: 'flight-trajectories',
        data: trajectoryData,
        getPath: (d: any) => d.path,
        getColor: (d: any) => d.color,
        getWidth: (d: any) => d.isSelected ? 4 : 2,
        widthMinPixels: 2,
        opacity: 0.8,
        updateTriggers: {
          getPath: [currentTime, startTime, activeFlights]
        }
      })
    );
  }

  const flightPositions = activeFlights.map(flight => {
    const category = flight.flightPlan.aircraftCategory;
    const colorHex = recatCategoryColors[category];
    const color = [
      parseInt(colorHex.slice(1, 3), 16),
      parseInt(colorHex.slice(3, 5), 16),
      parseInt(colorHex.slice(5, 7), 16),
      255
    ];

    const position = getFlightPosition(flight, currentTime, startTime);

    return {
      id: flight.flightPlan.flightId,
      position,
      color,
      size: 40,
      data: flight,
      type: 'flight',
      isSelected: selectedFlight?.flightPlan.flightId === flight.flightPlan.flightId
    };
  });

  layers.push(
    new ScatterplotLayer({
      id: 'aircraft-markers',
      data: flightPositions,
      getPosition: (d: any) => d.position,
      getRadius: (d: any) => d.isSelected ? 600 : 400,
      getFillColor: (d: any) => d.color,
      stroked: true,
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      pickable: true,
      onClick: (info) => {
        if (info.object && info.object.type === 'flight') {
          console.log('Flight clicked:', info.object.data.flightPlan.flightId);
        }
      },
      updateTriggers: {
        getPosition: [currentTime, startTime, activeFlights]
      }
    })
  );

  const flightLabels = flightPositions.map(f => ({
    id: `${f.id}-label`,
    text: f.data.flightPlan.flightId,
    position: [f.position[0], f.position[1], f.position[2] + 300],
    color: f.color,
    isSelected: f.isSelected
  }));

  layers.push(
    new TextLayer({
      id: 'flight-labels',
      data: flightLabels,
      getPosition: (d: any) => d.position,
      getText: (d: any) => d.text,
      getSize: (d: any) => d.isSelected ? 16 : 12,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getColor: [255, 255, 255, 255],
      getBackgroundColor: (d: any) => [...d.color.slice(0, 3), 200],
      getPadding: [4, 6],
      updateTriggers: {
        getPosition: [currentTime, startTime, activeFlights]
      }
    })
  );

  if (showWakeZones && activeWakeZones.length > 0) {
    layers.push(
      new ColumnLayer({
        id: 'wake-vortex-zones',
        data: activeWakeZones,
        diskResolution: 32,
        radius: (d: any) => d.radius,
        angle: 0,
        extruded: true,
        coverage: 1,
        elevationScale: 1,
        getPosition: (d: any) => d.center,
        getFillColor: (d: any) => getWakeIntensityColor(d.intensity),
        getElevation: (d: any) => d.height,
        opacity: 0.5,
        updateTriggers: {
          getPosition: [currentTime, startTime],
          getFillColor: [currentTime, startTime]
        }
      })
    );
  }

  if (selectedFlight) {
    const selectedTrajectory = {
      id: 'selected-trajectory',
      path: selectedFlight.trajectory.map(p => [p.lng, p.lat, p.alt || 0]),
      color: [255, 77, 79, 255]
    };

    layers.push(
      new PathLayer({
        id: 'selected-flight-trajectory',
        data: [selectedTrajectory],
        getPath: (d: any) => d.path,
        getColor: (d: any) => d.color,
        getWidth: 4,
        widthMinPixels: 4,
        opacity: 1
      })
    );
  }

  if (editorMode === 'runway') {
    const runwayState = (window as any).__runwayEditingState;
    if (runwayState?.start) {
      const previewPoints = [runwayState.start];
      if (runwayState.end) previewPoints.push(runwayState.end);

      layers.push(
        new ScatterplotLayer({
          id: 'editor-runway-points',
          data: previewPoints.map((p, i) => ({
            position: [p.lng, p.lat, 50],
            type: i === 0 ? 'start' : 'end'
          })),
          getPosition: (d: any) => d.position,
          getRadius: 300,
          getFillColor: (d: any) => d.type === 'start' ? [82, 196, 26, 255] : [24, 144, 255, 255],
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          updateTriggers: {
            getPosition: [editorUpdateTrigger]
          }
        })
      );

      if (runwayState.start && runwayState.end) {
        layers.push(
          new PathLayer({
            id: 'editor-runway-preview',
            data: [{
              path: [
                [runwayState.start.lng, runwayState.start.lat, 50],
                [runwayState.end.lng, runwayState.end.lat, 50]
              ]
            }],
            getPath: (d: any) => d.path,
            getColor: [250, 173, 20, 200],
            getWidth: 4,
            widthMinPixels: 4,
            updateTriggers: {
              getPath: [editorUpdateTrigger]
            }
          })
        );
      }
    }
  }

  if (editorMode === 'route') {
    const routeState = (window as any).__routeEditingState;
    if (routeState?.waypoints && routeState.waypoints.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'editor-route-points',
          data: routeState.waypoints.map((p: any, i: number) => ({
            position: [p.lng, p.lat, 100],
            index: i
          })),
          getPosition: (d: any) => d.position,
          getRadius: 250,
          getFillColor: (d: any) => d.index === 0 ? [82, 196, 26, 255] : [24, 144, 255, 255],
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          updateTriggers: {
            getPosition: [editorUpdateTrigger]
          }
        })
      );

      if (routeState.waypoints.length > 1) {
        layers.push(
          new PathLayer({
            id: 'editor-route-preview',
            data: [{
              path: routeState.waypoints.map((p: any) => [p.lng, p.lat, 100])
            }],
            getPath: (d: any) => d.path,
            getColor: [250, 173, 20, 200],
            getWidth: 3,
            widthMinPixels: 3,
            updateTriggers: {
              getPath: [editorUpdateTrigger]
            }
          })
        );
      }
    }
  }

  return layers;
};

function getTrajectoryProgress(
  flight: ScheduledFlight,
  currentTime: number,
  startTime: string
): number {
  if (!startTime) return 0;

  const startMs = new Date(startTime).getTime();
  const currentMs = startMs + currentTime * 1000;
  const landingMs = new Date(flight.scheduledLandingTime).getTime();

  const approachStart = landingMs - 120000;
  const approachEnd = landingMs + 60000;

  if (currentMs < approachStart) return 0;
  if (currentMs > approachEnd) return 1;

  return (currentMs - approachStart) / (approachEnd - approachStart);
}

function getFlightPosition(
  flight: ScheduledFlight,
  currentTime: number,
  startTime: string
): [number, number, number] {
  const progress = getTrajectoryProgress(flight, currentTime, startTime);
  const index = Math.floor(progress * (flight.trajectory.length - 1));
  const point = flight.trajectory[Math.min(index, flight.trajectory.length - 1)];

  if (!point) {
    const firstPoint = flight.trajectory[0];
    return [firstPoint.lng, firstPoint.lat, firstPoint.alt || 0];
  }

  return [point.lng, point.lat, (point.alt || 0) + 200];
}

export default MapLayers;

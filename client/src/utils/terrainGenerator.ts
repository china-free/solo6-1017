export const generateSyntheticTerrain = (
  center: { lat: number; lng: number },
  gridSize: number,
  spacingKm: number
): Array<{ lat: number; lng: number; elevation: number }> => {
  const points: Array<{ lat: number; lng: number; elevation: number }> = [];
  const halfGrid = Math.floor(gridSize / 2);
  const latStep = spacingKm / 111;
  const lngStep = spacingKm / (111 * Math.cos(center.lat * Math.PI / 180));

  const noiseScale = 0.1;
  const baseElevation = 50;

  for (let x = -halfGrid; x <= halfGrid; x++) {
    for (let y = -halfGrid; y <= halfGrid; y++) {
      const lat = center.lat + y * latStep;
      const lng = center.lng + x * lngStep;

      const noise1 = Math.sin(lat * noiseScale * 10) * Math.cos(lng * noiseScale * 10);
      const noise2 = Math.sin(lat * noiseScale * 20 + 1) * Math.cos(lng * noiseScale * 20 + 1) * 0.5;
      const noise3 = Math.sin(lat * noiseScale * 5 + 2) * Math.cos(lng * noiseScale * 5 + 2) * 2;

      const combinedNoise = (noise1 + noise2 + noise3) / 3;
      const elevation = baseElevation + combinedNoise * 150;

      points.push({
        lat,
        lng,
        elevation: Math.max(0, elevation)
      });
    }
  }

  return points;
};

export const getTerrainElevation = (
  lat: number,
  lng: number,
  terrainData: Array<{ lat: number; lng: number; elevation: number }>
): number => {
  if (terrainData.length === 0) return 0;

  let nearest = terrainData[0];
  let minDist = Infinity;

  for (const point of terrainData) {
    const dist = Math.sqrt(Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  return nearest.elevation;
};

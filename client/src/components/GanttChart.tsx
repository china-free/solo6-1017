import { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { AtcStoreType } from '../store/useAtcStore';
import { recatCategoryColors, recatCategoryNames } from '../types';
import { formatTime } from '../services/api';

const { Text } = Typography;

interface GanttChartProps {
  store: AtcStoreType;
}

const GanttChart = ({ store }: GanttChartProps) => {
  const { schedulingResult, selectedFlight, setSelectedFlight } = store;

  const chartData = useMemo(() => {
    if (!schedulingResult) return [];

    const runwayMap = new Map<string, number>();
    schedulingResult.runwayOccupancies.forEach(occ => {
      if (!runwayMap.has(occ.runwayId)) {
        runwayMap.set(occ.runwayId, runwayMap.size);
      }
    });

    const runways = Array.from(runwayMap.keys());

    let minTime = Infinity;
    let maxTime = -Infinity;

    schedulingResult.runwayOccupancies.forEach(occ => {
      const start = new Date(occ.startTime).getTime();
      const end = new Date(occ.endTime).getTime();
      minTime = Math.min(minTime, start);
      maxTime = Math.max(maxTime, end);
    });

    if (minTime === Infinity) return [];

    const timePadding = (maxTime - minTime) * 0.1;
    minTime -= timePadding;
    maxTime += timePadding;

    return {
      runways,
      minTime,
      maxTime,
      occupancies: schedulingResult.runwayOccupancies.map(occ => ({
        ...occ,
        runwayIndex: runwayMap.get(occ.runwayId)!,
        startMs: new Date(occ.startTime).getTime(),
        endMs: new Date(occ.endTime).getTime()
      }))
    };
  }, [schedulingResult]);

  if (!schedulingResult || schedulingResult.runwayOccupancies.length === 0) {
    return null;
  }

  const { runways, minTime, maxTime, occupancies } = chartData;
  const chartHeight = 40 + runways.length * 40;
  const totalDuration = maxTime - minTime;

  const runwayNames = runways.map(id => {
    const runway = store.airportConfig?.runways.find(r => r.id === id);
    return runway?.name || id;
  });

  const timeTicks = [];
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    const time = minTime + (totalDuration * i) / tickCount;
    timeTicks.push({
      time,
      label: formatTime(new Date(time).toISOString()),
      position: (i / tickCount) * 100
    });
  }

  return (
    <div className="gantt-panel">
      <Card
        title="跑道占用时间表"
        size="small"
        bodyStyle={{ padding: '12px 16px', height: 240 }}
      >
        <div style={{ position: 'relative', width: '100%', height: chartHeight }}>
          <svg
            width="100%"
            height={chartHeight}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {runwayNames.map((name, index) => (
              <g key={name}>
                <rect
                  x={0}
                  y={30 + index * 40}
                  width="100%"
                  height={35}
                  fill={index % 2 === 0 ? '#fafafa' : '#ffffff'}
                />
                <text
                  x={8}
                  y={52 + index * 40}
                  fontSize={12}
                  fill="#595959"
                  fontWeight="500"
                >
                  {name}
                </text>
                <line
                  x1={0}
                  y1={30 + (index + 1) * 40}
                  x2="100%"
                  y2={30 + (index + 1) * 40}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
              </g>
            ))}

            {timeTicks.map((tick, index) => (
              <g key={index}>
                <line
                  x1={`${tick.position}%`}
                  y1={25}
                  x2={`${tick.position}%`}
                  y2={chartHeight}
                  stroke="#e8e8e8"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <text
                  x={`${tick.position}%`}
                  y={18}
                  fontSize={11}
                  fill="#8c8c8c"
                  textAnchor="middle"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {occupancies.map(occ => {
              const scheduledFlight = schedulingResult.scheduledFlights.find(
                f => f.flightPlan.flightId === occ.flightId
              );
              const category = scheduledFlight?.flightPlan.aircraftCategory || 'C';
              const color = recatCategoryColors[category];
              const isSelected = selectedFlight?.flightPlan.flightId === occ.flightId;

              const x = ((occ.startMs - minTime) / totalDuration) * 100;
              const width = ((occ.endMs - occ.startMs) / totalDuration) * 100;
              const y = 32 + occ.runwayIndex * 40;

              return (
                <g
                  key={occ.id}
                  className="gantt-task"
                  onClick={() => {
                    if (scheduledFlight) {
                      setSelectedFlight(scheduledFlight);
                    }
                  }}
                >
                  <rect
                    x={`${x}%`}
                    y={y}
                    width={`${Math.max(width, 2)}%`}
                    height={30}
                    rx={4}
                    ry={4}
                    fill={color}
                    opacity={isSelected ? 1 : 0.85}
                    stroke={isSelected ? '#fff' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    style={{
                      cursor: 'pointer',
                      filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                    }}
                  />
                  <text
                    x={`${x + width / 2}%`}
                    y={y + 20}
                    fontSize={11}
                    fill="#fff"
                    fontWeight="500"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {occ.flightId}
                  </text>
                  <text
                    x={`${x + width / 2}%`}
                    y={y + 28}
                    fontSize={9}
                    fill="rgba(255,255,255,0.9)"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {formatTime(occ.startTime)}
                  </text>
                </g>
              );
            })}

            {store.playbackState.startTime && (() => {
              const currentMs = new Date(store.playbackState.startTime).getTime() + 
                store.playbackState.currentTime * 1000;
              const position = ((currentMs - minTime) / totalDuration) * 100;
              return (
                <line
                  x1={`${position}%`}
                  y1={25}
                  x2={`${position}%`}
                  y2={chartHeight}
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}
          </svg>
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid #f0f0f0',
          flexWrap: 'wrap'
        }}>
          {Object.entries(recatCategoryColors).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: color
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {cat} - {recatCategoryNames[cat as keyof typeof recatCategoryNames]}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GanttChart;

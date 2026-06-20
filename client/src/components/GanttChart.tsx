import { useMemo } from 'react';
import { Card, Typography, Tooltip } from 'antd';
import { AtcStoreType } from '../store/useAtcStore';
import { recatCategoryColors, recatCategoryNames } from '../types';
import { formatTime } from '../services/api';

const { Text } = Typography;

interface GanttChartProps {
  store: AtcStoreType;
}

const GanttChart = ({ store }: GanttChartProps) => {
  const { schedulingResult, selectedFlight, setSelectedFlight, playbackState } = store;
  const { startTime, currentTime } = playbackState;

  const chartData = useMemo(() => {
    if (!schedulingResult) return null;

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

    if (minTime === Infinity) return null;

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

  const currentMs = useMemo(() => {
    if (!startTime) return null;
    return new Date(startTime).getTime() + currentTime * 1000;
  }, [startTime, currentTime]);

  const timeLinePosition = useMemo(() => {
    if (!chartData || currentMs === null) return null;
    const { minTime, maxTime } = chartData;
    const totalDuration = maxTime - minTime;
    return ((currentMs - minTime) / totalDuration) * 100;
  }, [chartData, currentMs]);

  const activeOccupancies = useMemo(() => {
    if (!chartData || currentMs === null) return new Set<string>();
    const active = new Set<string>();
    chartData.occupancies.forEach(occ => {
      if (currentMs >= occ.startMs && currentMs <= occ.endMs) {
        active.add(occ.id);
      }
    });
    return active;
  }, [chartData, currentMs]);

  if (!schedulingResult || schedulingResult.runwayOccupancies.length === 0 || !chartData) {
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
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>跑道占用时间表</span>
            {currentMs !== null && (
              <Tooltip title="当前回放时间">
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: '#ff4d4f',
                    marginRight: 6,
                    animation: 'pulse 1.5s infinite'
                  }} />
                  {formatTime(new Date(currentMs).toISOString())}
                </Text>
              </Tooltip>
            )}
          </div>
        }
        size="small"
        bodyStyle={{ padding: '12px 16px', height: 240 }}
      >
        <div style={{ position: 'relative', width: '100%', height: chartHeight }}>
          <svg
            width="100%"
            height={chartHeight}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4f" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#ff4d4f" stopOpacity="0.3"/>
              </linearGradient>
            </defs>

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
              const isActive = activeOccupancies.has(occ.id);

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
                  {isActive && (
                    <rect
                      x={`${x}%`}
                      y={y - 3}
                      width={`${Math.max(width, 2)}%`}
                      height={36}
                      rx={6}
                      ry={6}
                      fill="none"
                      stroke="#ff4d4f"
                      strokeWidth={3}
                      strokeDasharray="6,3"
                      style={{
                        pointerEvents: 'none',
                        filter: 'url(#glow)',
                        animation: 'dash 1.5s linear infinite'
                      }}
                    />
                  )}
                  
                  <rect
                    x={`${x}%`}
                    y={y}
                    width={`${Math.max(width, 2)}%`}
                    height={30}
                    rx={4}
                    ry={4}
                    fill={color}
                    opacity={isActive ? 1 : (isSelected ? 0.9 : 0.75)}
                    stroke={isActive ? '#fff' : (isSelected ? '#fff' : 'transparent')}
                    strokeWidth={isActive ? 2 : (isSelected ? 2 : 0)}
                    style={{
                      cursor: 'pointer',
                      filter: isActive 
                        ? 'drop-shadow(0 4px 8px rgba(255,77,79,0.4))' 
                        : (isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'),
                      transition: 'all 0.2s ease'
                    }}
                  />
                  
                  <text
                    x={`${x + width / 2}%`}
                    y={y + 20}
                    fontSize={isActive ? 12 : 11}
                    fill="#fff"
                    fontWeight={isActive ? '700' : '500'}
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    {occ.flightId}
                  </text>
                  
                  {width > 8 && (
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
                  )}
                </g>
              );
            })}

            {timeLinePosition !== null && (
              <g style={{ pointerEvents: 'none' }}>
                <polygon
                  points={`${timeLinePosition}%,15 ${timeLinePosition - 6},5 ${timeLinePosition + 6},5`}
                  fill="#ff4d4f"
                  filter="url(#glow)"
                />
                
                <line
                  x1={`${timeLinePosition}%`}
                  y1={15}
                  x2={`${timeLinePosition}%`}
                  y2={chartHeight}
                  stroke="url(#timelineGradient)"
                  strokeWidth={3}
                />
                
                <rect
                  x={`calc(${timeLinePosition}% - 35px)`}
                  y={0}
                  width={70}
                  height={20}
                  rx={4}
                  ry={4}
                  fill="#ff4d4f"
                  fillOpacity={0.95}
                />
                
                <text
                  x={`${timeLinePosition}%`}
                  y={14}
                  fontSize={10}
                  fill="#fff"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatTime(new Date(currentMs!).toISOString())}
                </text>
              </g>
            )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                border: '2px dashed #ff4d4f',
                background: 'transparent'
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              当前占用
            </Text>
          </div>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
};

export default GanttChart;

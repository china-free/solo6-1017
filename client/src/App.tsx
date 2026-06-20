import { useEffect, useRef, useState } from 'react';
import { Layout, message } from 'antd';
import DeckGL from '@deck.gl/react';
import { MapViewState, PickingInfo } from '@deck.gl/core';
import { useAtcStore } from './store/useAtcStore';
import MapLayers from './components/MapLayers';
import ControlPanel from './components/ControlPanel';
import GanttChart from './components/GanttChart';
import PlaybackControls from './components/PlaybackControls';
import Toolbar from './components/Toolbar';
import FlightInfoPanel from './components/FlightInfoPanel';
import WeatherPanel from './components/WeatherPanel';
import LegendPanel from './components/LegendPanel';
import RunwayEditor from './components/RunwayEditor';
import RouteEditor from './components/RouteEditor';
import { ScheduledFlight } from './types';

const { Content } = Layout;

function App() {
  const store = useAtcStore();
  const {
    airportConfig,
    isLoading,
    error,
    viewState,
    playbackState,
    editorMode,
    totalDurationSeconds,
    activeFlights,
    activeWakeZones,
    loadInitialData,
    setViewState,
    setSelectedFlight,
    setPlaybackState
  } = store;

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const [editorUpdateTrigger, setEditorUpdateTrigger] = useState(0);
  const lastEditorTriggerRef = useRef<number>(0);
  const totalDurationRef = useRef(totalDurationSeconds);

  useEffect(() => {
    totalDurationRef.current = totalDurationSeconds;
  }, [totalDurationSeconds]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!playbackState.isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setPlaybackState(prev => {
        const totalDuration = totalDurationRef.current;
        const newTime = prev.currentTime + delta * prev.speed * 60;
        if (totalDuration > 0 && newTime >= totalDuration) {
          return { ...prev, currentTime: totalDuration, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });

      const currentTrigger = (window as any).__editorUpdateTrigger;
      if (currentTrigger !== undefined && currentTrigger !== lastEditorTriggerRef.current) {
        lastEditorTriggerRef.current = currentTrigger;
        setEditorUpdateTrigger(currentTrigger);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState.isPlaying, setPlaybackState]);

  const handleViewStateChange = (params: { viewState: MapViewState }) => {
    setViewState(params.viewState as any);
  };

  const handleClick = (info: PickingInfo) => {
    if (info.object && info.object.type === 'flight') {
      setSelectedFlight(info.object.data as ScheduledFlight);
    } else if (info.object && info.object.type === 'runway') {
      message.info(`跑道: ${info.object.data.name}`);
    } else if (editorMode === 'none') {
      setSelectedFlight(null);
    }
  };

  const handleDoubleClick = () => {
    if (editorMode === 'route') {
      RouteEditor.handleDoubleClick(store);
    }
  };

  if (!airportConfig) {
    return (
      <Layout style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Content>加载中...</Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: '100vh', position: 'relative' }}>
      <DeckGL
        viewState={viewState as any}
        controller={editorMode === 'none'}
        onViewStateChange={handleViewStateChange}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        layers={MapLayers({
          store,
          editorUpdateTrigger,
          onMapClick: (coord) => {
            if (editorMode === 'runway') {
              RunwayEditor.handleMapClick(coord, store);
            } else if (editorMode === 'route') {
              RouteEditor.handleMapClick(coord, store);
            }
          }
        })}
      >
        {editorMode !== 'none' && (
          <div className="editing-overlay" />
        )}
      </DeckGL>

      <Toolbar store={store} />

      <ControlPanel store={store} />

      {store.schedulingResult && (
        <GanttChart store={store} />
      )}

      {store.schedulingResult && playbackState.startTime && (
        <PlaybackControls store={store} />
      )}

      {store.selectedFlight && (
        <FlightInfoPanel flight={store.selectedFlight} onClose={() => setSelectedFlight(null)} />
      )}

      {store.weather && (
        <WeatherPanel store={store} />
      )}

      <LegendPanel />

      <RunwayEditor />
      <RouteEditor />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.9)',
          padding: '24px 48px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          处理中...
        </div>
      )}
    </Layout>
  );
}

export default App;

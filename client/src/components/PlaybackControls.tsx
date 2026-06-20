import { Card, Button, Slider, Space, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { AtcStoreType } from '../store/useAtcStore';
import { formatTime } from '../services/api';

const { Text } = Typography;

interface PlaybackControlsProps {
  store: AtcStoreType;
}

const PlaybackControls = ({ store }: PlaybackControlsProps) => {
  const { playbackState, setPlaybackState } = store;
  const { isPlaying, currentTime, speed, startTime, endTime } = playbackState;

  const startMs = startTime ? new Date(startTime).getTime() : 0;
  const endMs = endTime ? new Date(endTime).getTime() : 0;
  const totalDuration = (endMs - startMs) / 1000;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const currentDisplayTime = startMs + currentTime * 1000;

  const handleTogglePlay = () => {
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleReset = () => {
    setPlaybackState(prev => ({ ...prev, currentTime: 0, isPlaying: false }));
  };

  const handleStepBackward = () => {
    setPlaybackState(prev => ({
      ...prev,
      currentTime: Math.max(0, prev.currentTime - 30),
      isPlaying: false
    }));
  };

  const handleStepForward = () => {
    setPlaybackState(prev => ({
      ...prev,
      currentTime: Math.min(totalDuration, prev.currentTime + 30),
      isPlaying: false
    }));
  };

  const handleSliderChange = (value: number) => {
    setPlaybackState(prev => ({
      ...prev,
      currentTime: (value / 100) * totalDuration,
      isPlaying: false
    }));
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 1, 2, 5, 10];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackState(prev => ({ ...prev, speed: speeds[nextIndex] }));
  };

  return (
    <div className="playback-controls">
      <Card
        size="small"
        bodyStyle={{ padding: '12px 24px' }}
        style={{ minWidth: 500 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {startTime ? formatTime(startTime) : '--:--:--'}
            </Text>
            <Text strong style={{ fontSize: 14 }}>
              {formatTime(new Date(currentDisplayTime).toISOString())}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {endTime ? formatTime(endTime) : '--:--:--'}
            </Text>
          </div>

          <Slider
            value={progress}
            onChange={handleSliderChange}
            tooltip={{
              formatter: (value) => {
                if (!value) return '0%';
                const time = startMs + (value / 100) * totalDuration * 1000;
                return formatTime(new Date(time).toISOString());
              }
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              size="small"
            />
            <Button
              icon={<StepBackwardOutlined />}
              onClick={handleStepBackward}
              size="small"
            />
            <Button
              type="primary"
              shape="circle"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleTogglePlay}
              size="large"
              style={{ width: 48, height: 48 }}
            />
            <Button
              icon={<StepForwardOutlined />}
              onClick={handleStepForward}
              size="small"
            />
            <Button
              onClick={handleSpeedChange}
              size="small"
              style={{ minWidth: 60 }}
            >
              {speed}x
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PlaybackControls;

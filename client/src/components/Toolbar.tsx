import { Button, Space, Tooltip } from 'antd';
import {
  PlusOutlined,
  RoadOutlined,
  LineChartOutlined,
  StopOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { AtcStoreType } from '../store/useAtcStore';

interface ToolbarProps {
  store: AtcStoreType;
}

const Toolbar = ({ store }: ToolbarProps) => {
  const { editorMode, setEditorMode, setViewState, airportConfig } = store;

  const handleResetView = () => {
    if (airportConfig) {
      setViewState({
        longitude: airportConfig.center.lng,
        latitude: airportConfig.center.lat,
        zoom: 11,
        pitch: 45,
        bearing: 0
      });
    }
  };

  const handleToggleRunwayEditor = () => {
    setEditorMode(editorMode === 'runway' ? 'none' : 'runway');
  };

  const handleToggleRouteEditor = () => {
    setEditorMode(editorMode === 'route' ? 'none' : 'route');
  };

  return (
    <div className="toolbar">
      <Space direction="vertical" size="small">
        <Tooltip title="重置视图">
          <Button
            icon={<FullscreenOutlined />}
            onClick={handleResetView}
            size="large"
          />
        </Tooltip>

        <Tooltip title={editorMode === 'runway' ? '退出编辑' : '编辑跑道'}>
          <Button
            icon={<RoadOutlined />}
            type={editorMode === 'runway' ? 'primary' : 'default'}
            onClick={handleToggleRunwayEditor}
            size="large"
            danger={editorMode === 'runway'}
          />
        </Tooltip>

        <Tooltip title={editorMode === 'route' ? '退出编辑' : '编辑航线'}>
          <Button
            icon={<LineChartOutlined />}
            type={editorMode === 'route' ? 'primary' : 'default'}
            onClick={handleToggleRouteEditor}
            size="large"
            danger={editorMode === 'route'}
          />
        </Tooltip>

        {editorMode !== 'none' && (
          <Tooltip title="取消编辑">
            <Button
              icon={<StopOutlined />}
              onClick={() => setEditorMode('none')}
              size="large"
              danger
            />
          </Tooltip>
        )}
      </Space>

      {editorMode !== 'none' && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#fff2e8',
          border: '1px solid #ffbb96',
          borderRadius: 4,
          fontSize: 12,
          color: '#d46b08',
          width: 200
        }}>
          <strong>编辑模式: {editorMode === 'runway' ? '跑道' : '航线'}</strong>
          <br />
          点击地图添加点位，双击完成编辑
        </div>
      )}
    </div>
  );
};

export default Toolbar;

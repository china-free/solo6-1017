import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Space, InputNumber } from 'antd';
import { DeleteOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Coordinate, Route, Waypoint } from '../types';
import { AtcStoreType } from '../store/useAtcStore';

interface EditingState {
  step: 'select-runway' | 'adding-points' | 'form';
  waypoints: Coordinate[];
  selectedRunwayId?: string;
}

let editingState: EditingState | null = null;
let currentStore: AtcStoreType | null = null;
let onStateChange: (() => void) | null = null;

declare global {
  interface Window {
    __routeEditingState?: EditingState | null;
  }
}

const exposeState = () => {
  window.__routeEditingState = editingState;
  if (window.__editorUpdateTrigger !== undefined) {
    window.__editorUpdateTrigger = Date.now();
  }
};

const RouteEditor = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [localState, setLocalState] = useState<EditingState | null>(editingState);

  useEffect(() => {
    onStateChange = () => {
      setLocalState(editingState);
      if (editingState?.step === 'form') {
        setVisible(true);
      }
    };
    return () => {
      onStateChange = null;
    };
  }, []);

  const handleCancel = () => {
    editingState = null;
    setVisible(false);
    setLocalState(null);
    if (currentStore) {
      currentStore.setEditorMode('none');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!editingState || !editingState.selectedRunwayId || editingState.waypoints.length < 2) {
        message.error('请至少添加2个航点');
        return;
      }

      const waypoints: Waypoint[] = editingState.waypoints.map((coord, index) => ({
        id: `wp-${Date.now()}-${index}`,
        name: `WP${index + 1}`,
        coordinate: coord,
        altitude: index < editingState!.waypoints.length - 1 ? values.altitudes?.[index] || 1500 : 0,
        speedLimit: 250
      }));

      const newRoute: Route = {
        id: `route-${Date.now()}`,
        name: values.name,
        type: values.type,
        runwayId: editingState.selectedRunwayId,
        waypoints
      };

      if (currentStore) {
        currentStore.addRoute(newRoute);
        message.success('航线创建成功');
      }

      handleCancel();
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    if (!editingState) return;
    editingState.waypoints.splice(index, 1);
    if (onStateChange) onStateChange();
  };

  if (!visible || !currentStore?.airportConfig) return null;

  const defaultAltitudes = editingState.waypoints.map((_, i) => 
    i < editingState.waypoints.length - 1 ? 1500 : 0
  );

  return (
    <Modal
      title="创建航线"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="航线名称"
          name="name"
          rules={[{ required: true, message: '请输入航线名称' }]}
          initialValue={`ROUTE-${Date.now().toString().slice(-4)}`}
        >
          <Input placeholder="如：STAR-18L" />
        </Form.Item>

        <Form.Item
          label="航线类型"
          name="type"
          rules={[{ required: true, message: '请选择航线类型' }]}
          initialValue="arrival"
        >
          <Select>
            <Select.Option value="arrival">进港航线</Select.Option>
            <Select.Option value="departure">离港航线</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="关联跑道"
          initialValue={editingState.selectedRunwayId}
        >
          <Select disabled>
            {currentStore.airportConfig.runways.map(r => (
              <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
            航点列表 ({editingState.waypoints.length})
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {editingState.waypoints.map((wp, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: index === 0 ? '#e6f7ff' : 
                             index === editingState.waypoints.length - 1 ? '#f6ffed' : '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 4,
                  fontSize: 12
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {index === 0 ? '起点' : index === editingState.waypoints.length - 1 ? '跑道入口' : `航点 ${index}`}
                  </div>
                  <div style={{ color: '#666', fontSize: 11 }}>
                    {wp.lat.toFixed(6)}, {wp.lng.toFixed(6)}
                  </div>
                </div>
                {index > 0 && index < editingState.waypoints.length - 1 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => handleRemoveWaypoint(index)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form.Item label="各航点高度 (米)" name="altitudes" initialValue={defaultAltitudes}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {editingState.waypoints.slice(0, -1).map((_, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, width: 60 }}>航点 {index + 1}:</span>
                <InputNumber 
                  style={{ flex: 1 }} 
                  min={0} 
                  max={12000}
                  defaultValue={1500}
                />
              </div>
            ))}
          </div>
        </Form.Item>

        <div style={{ fontSize: 12, color: '#999' }}>
          提示：在地图上点击添加航点，双击完成添加
        </div>
      </Form>
    </Modal>
  );
};

RouteEditor.handleMapClick = (coord: { lat: number; lng: number }, store: AtcStoreType) => {
  currentStore = store;

  if (!editingState) {
    if (!store.airportConfig || store.airportConfig.runways.length === 0) {
      message.error('请先创建跑道');
      return;
    }
    editingState = {
      step: 'adding-points',
      waypoints: [],
      selectedRunwayId: store.airportConfig.runways[0].id
    };
  }

  const point: Coordinate = {
    lat: coord.lat,
    lng: coord.lng,
    alt: 0
  };

  editingState.waypoints.push(point);
  message.info(`已添加航点 ${editingState.waypoints.length}，继续点击添加更多，或双击完成`);

  exposeState();

  if (onStateChange) {
    onStateChange();
  }
};

RouteEditor.handleDoubleClick = (store: AtcStoreType) => {
  if (!editingState || editingState.waypoints.length < 2) {
    message.error('请至少添加2个航点');
    return;
  }

  if (!store.airportConfig || store.airportConfig.runways.length === 0) {
    message.error('请先创建跑道');
    return;
  }

  const runway = store.airportConfig.runways[0];
  const midPoint: Coordinate = {
    lat: (runway.start.lat + runway.end.lat) / 2,
    lng: (runway.start.lng + runway.end.lng) / 2,
    alt: 0
  };
  editingState.waypoints.push(midPoint);
  editingState.step = 'form';
  editingState.selectedRunwayId = runway.id;

  message.info('航点添加完成，请填写航线信息');

  exposeState();

  if (onStateChange) {
    onStateChange();
  }
};

RouteEditor.reset = () => {
  editingState = null;
  currentStore = null;
};

interface RouteListProps {
  store: AtcStoreType;
}

export const RouteList = ({ store }: RouteListProps) => {
  const { airportConfig, deleteRoute, setEditorMode } = store;

  if (!airportConfig) return null;

  const handleDelete = (routeId: string, routeName: string) => {
    if (confirm(`确定要删除航线 ${routeName} 吗？`)) {
      deleteRoute(routeId);
      message.success('航线已删除');
    }
  };

  const getRunwayName = (runwayId: string) => {
    return airportConfig.runways.find(r => r.id === runwayId)?.name || '未知';
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>航线列表 ({airportConfig.routes.length})</span>
        <Button 
          type="link" 
          size="small" 
          onClick={() => setEditorMode('route')}
          style={{ padding: 0 }}
        >
          + 添加航线
        </Button>
      </div>
      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
        {airportConfig.routes.length === 0 ? (
          <div style={{ fontSize: 12, color: '#999', padding: '8px 0' }}>
            暂无航线，点击上方按钮添加
          </div>
        ) : (
          airportConfig.routes.map(route => (
            <div 
              key={route.id}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '6px 8px',
                background: route.type === 'arrival' ? '#e6f7ff' : '#fff7e6',
                borderRadius: 4,
                marginBottom: 4,
                fontSize: 12
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {route.name}
                  <span style={{ 
                    marginLeft: 6, 
                    fontSize: 10, 
                    padding: '1px 4px', 
                    borderRadius: 2,
                    background: route.type === 'arrival' ? '#91d5ff' : '#ffd591',
                    color: '#000'
                  }}>
                    {route.type === 'arrival' ? '进港' : '离港'}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: 11 }}>
                  跑道: {getRunwayName(route.runwayId)} | {route.waypoints.length} 个航点
                </div>
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(route.id, route.name)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RouteEditor;

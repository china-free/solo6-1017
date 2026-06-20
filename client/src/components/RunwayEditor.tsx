import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Coordinate, Runway } from '../types';
import { AtcStoreType } from '../store/useAtcStore';

interface EditingState {
  step: 'start' | 'end' | 'form';
  start?: Coordinate;
  end?: Coordinate;
}

let editingState: EditingState | null = null;
let currentStore: AtcStoreType | null = null;
let onStateChange: (() => void) | null = null;

declare global {
  interface Window {
    __runwayEditingState?: EditingState | null;
    __editorUpdateTrigger?: number;
  }
}

const exposeState = () => {
  window.__runwayEditingState = editingState;
  window.__editorUpdateTrigger = Date.now();
};

const calculateHeading = (start: Coordinate, end: Coordinate): number => {
  const dLng = (end.lng - start.lng) * Math.PI / 180;
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let heading = Math.atan2(y, x) * 180 / Math.PI;
  heading = (heading + 360) % 360;
  
  return heading;
};

const calculateDistance = (start: Coordinate, end: Coordinate): number => {
  const R = 6371000;
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLng = (end.lng - start.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RunwayEditor = () => {
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

  useEffect(() => {
    if (editingState?.step === 'form') {
      const heading = editingState.start && editingState.end 
        ? calculateHeading(editingState.start, editingState.end) 
        : 0;
      const reverseHeading = (heading + 180) % 360;
      const runwayNumber = Math.round(heading / 10);
      const reverseNumber = Math.round(reverseHeading / 10);
      const defaultName = `${runwayNumber.toString().padStart(2, '0')}/${reverseNumber.toString().padStart(2, '0')}`;
      form.setFieldsValue({ name: defaultName });
    }
  }, [visible, form]);

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
      
      if (!editingState?.start || !editingState?.end) {
        message.error('请先在地图上选择跑道位置');
        return;
      }

      const heading = calculateHeading(editingState.start, editingState.end);
      const length = calculateDistance(editingState.start, editingState.end);

      const newRunway: Runway = {
        id: `runway-${Date.now()}`,
        name: values.name,
        start: editingState.start,
        end: editingState.end,
        heading,
        length
      };

      if (currentStore) {
        currentStore.addRunway(newRunway);
        message.success('跑道创建成功');
      }

      handleCancel();
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      title="创建跑道"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={400}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="跑道名称"
          name="name"
          rules={[{ required: true, message: '请输入跑道名称' }]}
        >
          <Input placeholder="如：18L/36R" />
        </Form.Item>
        {editingState?.start && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              起点: {editingState.start.lat.toFixed(6)}, {editingState.start.lng.toFixed(6)}
            </div>
          </div>
        )}
        {editingState?.end && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              终点: {editingState.end.lat.toFixed(6)}, {editingState.end.lng.toFixed(6)}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              长度: {(calculateDistance(editingState.start, editingState.end) / 1000).toFixed(2)} km
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, color: '#999' }}>
          提示：点击地图上两个点来定义跑道的两个端点
        </div>
      </Form>
    </Modal>
  );
};

RunwayEditor.handleMapClick = (coord: { lat: number; lng: number }, store: AtcStoreType) => {
  currentStore = store;

  if (!editingState) {
    editingState = { step: 'start' };
  }

  const point: Coordinate = {
    lat: coord.lat,
    lng: coord.lng,
    alt: 0
  };

  if (editingState.step === 'start') {
    editingState.start = point;
    editingState.step = 'end';
    message.info('已选择起点，请点击选择跑道终点');
  } else if (editingState.step === 'end') {
    editingState.end = point;
    editingState.step = 'form';
    message.info('已选择终点，请填写跑道信息');
  }

  exposeState();

  if (onStateChange) {
    onStateChange();
  }
};

RunwayEditor.reset = () => {
  editingState = null;
  currentStore = null;
};

interface RunwayListProps {
  store: AtcStoreType;
}

export const RunwayList = ({ store }: RunwayListProps) => {
  const { airportConfig, deleteRunway, setEditorMode } = store;

  if (!airportConfig) return null;

  const handleDelete = (runwayId: string, runwayName: string) => {
    if (confirm(`确定要删除跑道 ${runwayName} 吗？相关的航线也会被删除。`)) {
      deleteRunway(runwayId);
      message.success('跑道已删除');
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>跑道列表 ({airportConfig.runways.length})</span>
        <Button 
          type="link" 
          size="small" 
          onClick={() => setEditorMode('runway')}
          style={{ padding: 0 }}
        >
          + 添加跑道
        </Button>
      </div>
      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
        {airportConfig.runways.length === 0 ? (
          <div style={{ fontSize: 12, color: '#999', padding: '8px 0' }}>
            暂无跑道，点击上方按钮添加
          </div>
        ) : (
          airportConfig.runways.map(runway => (
            <div 
              key={runway.id}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '6px 8px',
                background: '#f5f5f5',
                borderRadius: 4,
                marginBottom: 4,
                fontSize: 12
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{runway.name}</div>
                <div style={{ color: '#666', fontSize: 11 }}>
                  航向: {runway.heading.toFixed(0)}° | 长度: {(runway.length / 1000).toFixed(2)}km
                </div>
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(runway.id, runway.name)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RunwayEditor;

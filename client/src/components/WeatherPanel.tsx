import { useState } from 'react';
import { Card, Slider, InputNumber, Row, Col, Button, Form, Typography, message } from 'antd';
import { CloudOutlined, EnvironmentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { AtcStoreType } from '../store/useAtcStore';
import { updateWeather } from '../services/api';

const { Text } = Typography;

interface WeatherPanelProps {
  store: AtcStoreType;
}

const WeatherPanel = ({ store }: WeatherPanelProps) => {
  const { weather, updateWeatherCondition } = store;
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const handleApplyWeather = async (values: any) => {
    try {
      const result = await updateWeather(values);
      if (result.success) {
        updateWeatherCondition(result.data);
        message.success('气象数据已更新');
        setEditing(false);
      }
    } catch (error) {
      message.error('更新气象数据失败');
    }
  };

  if (!weather) return null;

  const windArrowRotation = weather.windDirection - 180;

  return (
    <div className="weather-panel">
      <Card
        size="small"
        title={
          <span>
            <CloudOutlined style={{ marginRight: 4 }} />
            气象条件
          </span>
        }
        extra={
          <Button
            type="link"
            size="small"
            onClick={() => {
              if (!editing) {
                form.setFieldsValue({
                  windSpeed: weather.windSpeed,
                  windDirection: weather.windDirection,
                  temperature: weather.temperature,
                  humidity: weather.humidity
                });
              }
              setEditing(!editing);
            }}
          >
            {editing ? '取消' : '编辑'}
          </Button>
        }
      >
        {!editing ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '2px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  position: 'relative'
                }}
              >
                <EnvironmentOutlined
                  style={{
                    fontSize: 24,
                    color: '#1890ff',
                    transform: `rotate(${windArrowRotation}deg)`
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {weather.windSpeed} m/s
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {weather.windDirection}° 风向
                </div>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">气温</span>
              <span className="stat-value">{weather.temperature}°C</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">湿度</span>
              <span className="stat-value">{weather.humidity}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">气压</span>
              <span className="stat-value">{weather.pressure} hPa</span>
            </div>

            {weather.windSpeed > 5 && (
              <div style={{
                marginTop: 12,
                padding: '6px 10px',
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: 4,
                fontSize: 11
              }}>
                <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                <Text type="warning">
                  风力较大，尾流消散加速，可缩减间隔
                </Text>
              </div>
            )}
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            size="small"
            onFinish={handleApplyWeather}
          >
            <Form.Item
              label="风速 (m/s)"
              name="windSpeed"
              rules={[{ required: true, message: '请输入风速' }]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Slider
                  min={0}
                  max={30}
                  step={0.5}
                  style={{ flex: 1 }}
                />
                <InputNumber
                  min={0}
                  max={30}
                  step={0.5}
                  style={{ width: 80 }}
                />
              </div>
            </Form.Item>

            <Form.Item
              label="风向 (°)"
              name="windDirection"
              rules={[{ required: true, message: '请输入风向' }]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Slider
                  min={0}
                  max={360}
                  step={5}
                  style={{ flex: 1 }}
                />
                <InputNumber
                  min={0}
                  max={360}
                  step={5}
                  style={{ width: 80 }}
                />
              </div>
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="气温 (°C)"
                  name="temperature"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={-20} max={45} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="湿度 (%)"
                  name="humidity"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="small">
                应用气象数据
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default WeatherPanel;

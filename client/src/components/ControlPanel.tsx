import { useState, useRef } from 'react';
import {
  Card,
  Upload,
  Button,
  List,
  Tag,
  Space,
  Divider,
  Statistic,
  Row,
  Col,
  Switch,
  message,
  Typography
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { AtcStoreType } from '../store/useAtcStore';
import { recatCategoryColors, recatCategoryNames } from '../types';
import { formatTime, formatDuration, downloadSampleCSV } from '../services/api';
import { RunwayList } from './RunwayEditor';
import { RouteList } from './RouteEditor';

const { Title, Text } = Typography;

interface ControlPanelProps {
  store: AtcStoreType;
}

const ControlPanel = ({ store }: ControlPanelProps) => {
  const {
    flightPlans,
    schedulingResult,
    standardResult,
    isLoading,
    showWakeZones,
    showTrajectories,
    setShowWakeZones,
    setShowTrajectories,
    uploadCSV,
    clearPlans,
    runScheduling
  } = store;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv',
    showUploadList: false,
    beforeUpload: async (file) => {
      try {
        await uploadCSV(file as File);
        message.success(`成功导入 ${flightPlans.length} 条航班计划`);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '上传失败');
      }
      return false;
    }
  };

  const handleRunScheduling = async () => {
    if (flightPlans.length === 0) {
      message.warning('请先上传航班计划');
      return;
    }
    try {
      const result = await runScheduling();
      if (result) {
        message.success(
          `调度完成：${result.optimized.totalFlights} 个航班，` +
          `平均延误 ${formatDuration(result.optimized.averageDelay)}，` +
          `容量提升 ${result.capacityImprovement.capacityIncreasePercent}%`
        );
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '调度失败');
    }
  };

  const handleDownloadSample = () => {
    downloadSampleCSV();
    message.success('示例CSV已下载');
  };

  return (
    <div className="control-panel">
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>空管调度控制</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 12 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload {...uploadProps}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={isLoading}
              block
            >
              上传航班计划 (CSV)
            </Button>
          </Upload>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadSample}
            block
          >
            下载示例CSV
          </Button>

          <Divider style={{ margin: '12px 0' }} />

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunScheduling}
            loading={isLoading}
            disabled={flightPlans.length === 0}
            block
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            计算进近序列
          </Button>

          <Button
            icon={<ClearOutlined />}
            onClick={clearPlans}
            disabled={flightPlans.length === 0}
            block
            danger
          >
            清空数据
          </Button>

          <Divider style={{ margin: '12px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示尾流区域</Text>
              <Switch
                checked={showWakeZones}
                onChange={setShowWakeZones}
                size="small"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>显示飞行轨迹</Text>
              <Switch
                checked={showTrajectories}
                onChange={setShowTrajectories}
                size="small"
              />
            </div>
          </Space>
        </Space>
      </Card>

      <Card
        title="机场配置"
        size="small"
        style={{ marginBottom: 12 }}
      >
        <RunwayList store={store} />
        <RouteList store={store} />
      </Card>

      {schedulingResult && (
        <Card
          title="调度结果统计"
          size="small"
          style={{ marginBottom: 12 }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Statistic
                title="航班总数"
                value={schedulingResult.totalFlights}
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="平均延误"
                value={formatDuration(schedulingResult.averageDelay)}
                valueStyle={{ fontSize: 16 }}
                formatter={(value) => <span>{value}</span>}
              />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Row gutter={12}>
            <Col span={12}>
              <Statistic
                title="最大延误"
                value={formatDuration(schedulingResult.maxDelay)}
                valueStyle={{ fontSize: 16, color: '#faad14' }}
                formatter={(value) => <span>{value}</span>}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="容量提升"
                value={standardResult ? `${((schedulingResult.totalFlights - standardResult.totalFlights) / Math.max(1, standardResult.totalFlights) * 100).toFixed(1)}%` : '0%'}
                valueStyle={{ fontSize: 16, color: '#52c41a' }}
              />
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />
          <Title level={5} style={{ margin: '8px 0' }}>跑道利用率</Title>
          {Object.entries(schedulingResult.runwayUtilization).map(([runwayId, utilization]) => {
            const runway = store.airportConfig?.runways.find(r => r.id === runwayId);
            return (
              <div key={runwayId} className="stat-item">
                <span className="stat-label">{runway?.name || runwayId}</span>
                <span className="stat-value" style={{ color: utilization > 70 ? '#faad14' : '#52c41a' }}>
                  {utilization.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <Card
        title={`航班计划 (${flightPlans.length})`}
        size="small"
        style={{ maxHeight: 300, overflow: 'auto' }}
      >
        {flightPlans.length === 0 ? (
          <Text type="secondary">暂无航班计划，请上传CSV文件</Text>
        ) : (
          <List
            size="small"
            dataSource={flightPlans}
            renderItem={(plan) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{plan.flightId}</Text>
                      <Tag
                        color={recatCategoryColors[plan.aircraftCategory]}
                        style={{ margin: 0 }}
                      >
                        {recatCategoryNames[plan.aircraftCategory]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space size="small">
                      <Text type="secondary">{plan.aircraftType}</Text>
                      <Text type="secondary">|</Text>
                      <Text type="secondary">{plan.origin} → {plan.destination}</Text>
                    </Space>
                  }
                />
                <Text>{formatTime(plan.eta)}</Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default ControlPanel;

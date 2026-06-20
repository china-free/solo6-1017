import { Card, Tag, Button, Typography, Descriptions, Badge } from 'antd';
import { CloseOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { ScheduledFlight, recatCategoryColors, recatCategoryNames } from '../types';
import { formatTime, formatDuration } from '../services/api';

const { Text, Title } = Typography;

interface FlightInfoPanelProps {
  flight: ScheduledFlight;
  onClose: () => void;
}

const FlightInfoPanel = ({ flight, onClose }: FlightInfoPanelProps) => {
  const { flightPlan, scheduledLandingTime, requiredSeparation, separationFromPrevious, separationAdjusted, adjustmentReason, sequenceNumber, assignedRunwayId } = flight;

  const etaTime = new Date(flightPlan.eta).getTime();
  const scheduledTime = new Date(scheduledLandingTime).getTime();
  const delay = (scheduledTime - etaTime) / 1000;

  const runwayName = assignedRunwayId;

  return (
    <div className="flight-info-panel">
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <Text strong style={{ fontSize: 16 }}>{flightPlan.flightId}</Text>
              <Tag
                color={recatCategoryColors[flightPlan.aircraftCategory]}
                style={{ marginLeft: 8 }}
              >
                {recatCategoryNames[flightPlan.aircraftCategory]}
              </Tag>
            </span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              size="small"
            />
          </div>
        }
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="进近序列">
            <Tag color="#1890ff">#{sequenceNumber}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="机型">
            {flightPlan.aircraftType}
          </Descriptions.Item>

          <Descriptions.Item label="航线">
            {flightPlan.origin} → {flightPlan.destination}
          </Descriptions.Item>

          <Descriptions.Item label="分配跑道">
            {runwayName}
          </Descriptions.Item>

          <Descriptions.Item label="预计到达">
            {formatTime(flightPlan.eta)}
          </Descriptions.Item>

          <Descriptions.Item label="预计着陆">
            <Text strong>{formatTime(scheduledLandingTime)}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="延误">
            <Badge
              status={delay > 60 ? 'warning' : 'success'}
              text={
                <span style={{
                  color: delay > 60 ? '#faad14' : '#52c41a',
                  fontWeight: 500
                }}>
                  {formatDuration(delay)}
                </span>
              }
            />
          </Descriptions.Item>

          <Descriptions.Item label="前机间隔要求">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{separationFromPrevious}s</span>
              {separationAdjusted ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  动态调整
                </Tag>
              ) : (
                <Tag color="default">标准</Tag>
              )}
            </div>
          </Descriptions.Item>

          {separationAdjusted && adjustmentReason && (
            <Descriptions.Item label="调整原因">
              <Text type="success" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                {adjustmentReason}
              </Text>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="标准间隔">
            <Text delete type="secondary">{requiredSeparation}s</Text>
            {' → '}
            <Text strong style={{ color: '#52c41a' }}>{separationFromPrevious}s</Text>
            {' '}
            <Text type="success" style={{ fontSize: 11 }}>
              (缩减 {Math.round((1 - separationFromPrevious / requiredSeparation) * 100)}%)
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {separationAdjusted && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            fontSize: 12
          }}>
            <WarningOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            <Text type="success">
              尾流耗散动态调整生效，跑道容量提升
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FlightInfoPanel;

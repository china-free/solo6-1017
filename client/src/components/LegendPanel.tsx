import { Card, Typography } from 'antd';
import { recatCategoryColors, recatCategoryNames } from '../types';

const { Text } = Typography;

const LegendPanel = () => {
  return (
    <div className="legend-panel">
      <Card size="small" title="图例" bodyStyle={{ padding: '12px' }}>
        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          尾流强度
        </Text>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              height: 16,
              borderRadius: 4,
              background: 'linear-gradient(to right, #1890ff, #52c41a, #faad14, #fa8c16, #ff4d4f)',
              marginBottom: 4
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span>弱</span>
            <span>强</span>
          </div>
        </div>

        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          飞机类别
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(['F', 'E', 'D', 'C', 'B', 'A'] as const).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: recatCategoryColors[cat]
                }}
              />
              <Text style={{ fontSize: 11 }}>
                {cat} - {recatCategoryNames[cat]}
              </Text>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            航线类型
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 20,
                  height: 3,
                  backgroundColor: '#1890ff',
                  opacity: 0.8
                }}
              />
              <Text style={{ fontSize: 11 }}>进场航线</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 20,
                  height: 3,
                  backgroundColor: '#52c41a',
                  opacity: 0.8
                }}
              />
              <Text style={{ fontSize: 11 }}>离场航线</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LegendPanel;

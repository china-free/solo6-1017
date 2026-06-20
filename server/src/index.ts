import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import flightsRouter from './routes/flights';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRouter);
app.use('/api/flights', flightsRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   机场空管辅助分析平台 - 后端服务                        ║
║                                                          ║
║   服务地址: http://${HOST}:${PORT}                        ║
║   健康检查: http://${HOST}:${PORT}/api/health             ║
║                                                          ║
║   API 接口:                                               ║
║   POST /api/flights/upload     - 上传航班CSV             ║
║   POST /api/flights/schedule   - 计算调度序列            ║
║   GET  /api/flights/plans      - 获取航班计划            ║
║   GET  /api/flights/airport-config - 获取机场配置        ║
║   GET  /api/flights/weather    - 获取气象数据            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;

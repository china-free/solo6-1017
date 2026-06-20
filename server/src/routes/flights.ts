import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { parseFlightPlanCSV, generateSampleCSV } from '../utils/csvParser';
import { scheduleFlights, validateSchedule } from '../services/flightScheduler';
import { defaultAirport, sampleWeather } from '../data/defaultAirport';
import { WeatherCondition, AirportConfig, FlightPlan } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const schedulingRequestSchema = z.object({
  airportConfig: z.custom<AirportConfig>().optional(),
  weather: z.custom<WeatherCondition>().optional(),
  options: z.object({
    prioritizeDelay: z.number().optional(),
    enableWakeDissipation: z.boolean().optional(),
    maxRetries: z.number().optional()
  }).optional()
});

let currentFlightPlans: FlightPlan[] = [];

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const flightPlans = parseFlightPlanCSV(csvContent);

    currentFlightPlans = flightPlans;

    res.json({
      success: true,
      message: `成功解析 ${flightPlans.length} 条航班计划`,
      data: {
        count: flightPlans.length,
        flightPlans: flightPlans.map(fp => ({
          ...fp,
          eta: fp.eta.toISOString()
        }))
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '解析CSV文件失败'
    });
  }
});

router.get('/sample-csv', (req: Request, res: Response) => {
  const csv = generateSampleCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sample_flights.csv');
  res.send(csv);
});

router.post('/schedule', (req: Request, res: Response) => {
  try {
    const validation = schedulingRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: '请求参数无效',
        details: validation.error.errors
      });
    }

    const { airportConfig = defaultAirport, weather = sampleWeather, options } = validation.data;

    const flightPlans = currentFlightPlans.length > 0
      ? currentFlightPlans
      : parseFlightPlanCSV(generateSampleCSV());

    const standardResult = scheduleFlights(
      flightPlans,
      airportConfig,
      weather,
      { ...options, enableWakeDissipation: false }
    );

    const optimizedResult = scheduleFlights(
      flightPlans,
      airportConfig,
      weather,
      { ...options, enableWakeDissipation: true }
    );

    const validationResult = validateSchedule(optimizedResult.scheduledFlights, weather);

    const serializeDate = (date: Date) => date.toISOString();

    const serializeFlight = (flight: typeof optimizedResult.scheduledFlights[0]) => ({
      ...flight,
      flightPlan: {
        ...flight.flightPlan,
        eta: serializeDate(flight.flightPlan.eta)
      },
      scheduledLandingTime: serializeDate(flight.scheduledLandingTime),
      wakeZones: flight.wakeZones.map(zone => ({
        ...zone,
        createdAt: serializeDate(zone.createdAt),
        dissipatedAt: zone.dissipatedAt ? serializeDate(zone.dissipatedAt) : undefined
      }))
    });

    const serializeOccupancy = (occ: typeof optimizedResult.runwayOccupancies[0]) => ({
      ...occ,
      startTime: serializeDate(occ.startTime),
      endTime: serializeDate(occ.endTime)
    });

    res.json({
      success: true,
      data: {
        standard: {
          ...standardResult,
          scheduledFlights: standardResult.scheduledFlights.map(serializeFlight),
          runwayOccupancies: standardResult.runwayOccupancies.map(serializeOccupancy),
          weatherCondition: {
            ...standardResult.weatherCondition,
            timestamp: serializeDate(standardResult.weatherCondition.timestamp)
          }
        },
        optimized: {
          ...optimizedResult,
          scheduledFlights: optimizedResult.scheduledFlights.map(serializeFlight),
          runwayOccupancies: optimizedResult.runwayOccupancies.map(serializeOccupancy),
          weatherCondition: {
            ...optimizedResult.weatherCondition,
            timestamp: serializeDate(optimizedResult.weatherCondition.timestamp)
          }
        },
        validation: validationResult,
        capacityImprovement: {
          flightsScheduled: optimizedResult.totalFlights,
          delayReduction: standardResult.averageDelay - optimizedResult.averageDelay,
          capacityIncreasePercent: optimizedResult.totalFlights > 0
            ? ((optimizedResult.totalFlights - standardResult.totalFlights) / standardResult.totalFlights * 100).toFixed(1)
            : '0'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '调度计算失败'
    });
  }
});

router.get('/plans', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      count: currentFlightPlans.length,
      flightPlans: currentFlightPlans.map(fp => ({
        ...fp,
        eta: fp.eta.toISOString()
      }))
    }
  });
});

router.delete('/plans', (req: Request, res: Response) => {
  currentFlightPlans = [];
  res.json({
    success: true,
    message: '已清空所有航班计划'
  });
});

router.get('/airport-config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: defaultAirport
  });
});

router.post('/airport-config', (req: Request, res: Response) => {
  try {
    const config = req.body as AirportConfig;
    if (!config.icaoCode || !config.runways || !config.routes) {
      return res.status(400).json({
        success: false,
        error: '无效的机场配置'
      });
    }
    res.json({
      success: true,
      message: '机场配置已更新',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新机场配置失败'
    });
  }
});

router.get('/weather', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...sampleWeather,
      timestamp: sampleWeather.timestamp.toISOString()
    }
  });
});

router.post('/weather', (req: Request, res: Response) => {
  try {
    const weather = req.body as WeatherCondition;
    if (weather.windSpeed === undefined || weather.windDirection === undefined) {
      return res.status(400).json({
        success: false,
        error: '无效的气象数据'
      });
    }
    sampleWeather.timestamp = new Date();
    Object.assign(sampleWeather, weather);
    res.json({
      success: true,
      message: '气象数据已更新',
      data: {
        ...sampleWeather,
        timestamp: sampleWeather.timestamp.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新气象数据失败'
    });
  }
});

export default router;

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import 'express-async-errors';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';
import { SharedTableMatchingService as MatchingJobService } from './services/sharedTableMatchingService';
import { featureProcessingWorker } from './services/featureProcessingWorker';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import onboardingRoutes from './routes/onboarding';
import feedRoutes from './routes/feedRoutes';
import uploadRoutes from './routes/uploadRoutes';
import bookingsRoutes from './routes/bookings';
import dinnersRoutes from './routes/dinners';
import groupingRoutes from './routes/admin/grouping';
import gamificationRoutes from './routes/gamification';
import notificationRoutes from './routes/notifications';
import restaurantsRoutes from './routes/restaurants';
import connectionsRoutes from './routes/connections';
import analyticsRoutes from './routes/analytics';
import matchingRoutes from './routes/matching';
import featuresRoutes from './routes/features';
import paymentsRoutes from './routes/payments';
import webhooksRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:8081',
  'http://localhost:8082',
  'exp://localhost:8081',
];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (_err: Error | null, _allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parsing middleware - note: webhook routes need raw body
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/onboarding-simple', require('./routes/onboarding-simple').default);
app.use('/api/feed', feedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/dinners', dinnersRoutes);
app.use('/api/admin/grouping', groupingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Debug routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  const debugRoutes = require('./routes/debug').default;
  app.use('/api/debug', debugRoutes);
}
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/waitlist', require('./routes/waitlist').default);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server - listen on all interfaces for mobile development
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔐 Privy App ID: ${process.env.PRIVY_APP_ID}`);
  logger.info(`💬 Stream API Key: ${process.env.STREAM_API_KEY}`);
  logger.info(`💬 Stream API Secret: ${process.env.STREAM_API_SECRET ? '[set]' : '[missing]'}`);
  logger.info(`📲 Mobile access: http://192.168.1.5:${PORT}`);
  
  // Initialize matching job service
  MatchingJobService.initialize();
  logger.info(`🤝 Matching job service initialized`);
  
  // Start feature processing worker in production
  if (process.env.NODE_ENV === 'production') {
    featureProcessingWorker.start();
    logger.info(`⚙️ Feature processing worker started`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing server');
  MatchingJobService.shutdown();
  featureProcessingWorker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing server');
  MatchingJobService.shutdown();
  featureProcessingWorker.stop();
  process.exit(0);
});

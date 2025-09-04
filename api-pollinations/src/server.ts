import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PollinationsClient } from './lib/pollinationsClient';
import { imageRoutes } from './routes/image';
import { textRoutes } from './routes/text';
import { audioRoutes } from './routes/audio';
import { modelsRoutes } from './routes/models';
import { feedRoutes } from './routes/feed';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = (process.env as any)['PORT'] || 4000;

// Initialize Pollinations client
const pollinationsClient = new PollinationsClient();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (process.env as any)['NODE_ENV'] === 'production' ? false : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined'));

// Request ID middleware
app.use((req: any, _res, next) => {
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId: (req as any).requestId
  };
  res.json(health);
});

// Mount API routes
app.use('/v1/images', imageRoutes(pollinationsClient));
app.use('/v1/chat', textRoutes(pollinationsClient));
app.use('/v1/audio', audioRoutes(pollinationsClient));
app.use('/v1/models', modelsRoutes(pollinationsClient));
app.use('/v1/feed', feedRoutes(pollinationsClient));

// OpenAI SDK compatibility routes (without /v1 prefix)
app.use('/images', imageRoutes(pollinationsClient));
app.use('/chat', textRoutes(pollinationsClient));
app.use('/audio', audioRoutes(pollinationsClient));
app.use('/models', modelsRoutes(pollinationsClient));

// Legacy endpoints for backward compatibility - removed to avoid conflicts

// Error handling middleware
app.use((error: any, _req: any, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Pollinations API Proxy server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/v1`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
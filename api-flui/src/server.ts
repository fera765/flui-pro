import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { taskRoutes } from './routes/tasks';
import { advancedTaskRoutes } from './routes/advancedTasks';
import { streamRoutes } from './routes/stream';
import { createPluginRoutes } from './routes/plugins';
import { Orchestrator } from './core/orchestrator';
import { AdvancedOrchestrator } from './core/advancedOrchestrator';
import { Classifier } from './core/classifier';
import { Planner } from './core/planner';
import { Worker } from './core/worker';
import { Supervisor } from './core/supervisor';
import { PollinationsTool } from './tools/pollinationsTool';
import { PluginLoader } from './core/pluginLoader';

// Load environment variables
dotenv.config();

const app = express();
const PORT = (process.env as any)['PORT'] || 5000;

// Initialize core components
const pollinationsTool = new PollinationsTool();
const classifier = new Classifier();
const planner = new Planner();
const worker = new Worker(pollinationsTool);
const supervisor = new Supervisor();

const orchestratorConfig = {
  maxDepth: parseInt((process.env as any)['MAX_TASK_DEPTH'] || '5'),
  maxRetries: parseInt((process.env as any)['MAX_RETRIES'] || '3'),
  taskTimeoutMs: parseInt((process.env as any)['TASK_TIMEOUT_MS'] || '300000'),
  enableStreaming: true
};

const orchestrator = new Orchestrator(
  orchestratorConfig,
  classifier,
  planner,
  worker,
  supervisor
);

const advancedOrchestrator = new AdvancedOrchestrator(
  orchestratorConfig,
  classifier,
  planner,
  worker,
  supervisor
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env as any)['NODE_ENV'] === 'production' ? false : true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: any, _res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  req.requestId = requestId;
  
  console.log(JSON.stringify({
    requestId,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  }));
  
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  return res.json({
    status: 'healthy',
    service: 'API Flui - Autonomous AI Orchestrator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: (process.env as any)['NODE_ENV'] || 'development',
    config: {
      maxDepth: orchestratorConfig.maxDepth,
      maxRetries: orchestratorConfig.maxRetries,
      taskTimeoutMs: orchestratorConfig.taskTimeoutMs,
      enableStreaming: orchestratorConfig.enableStreaming
    }
  });
});

// Initialize plugin loader
const pluginLoader = new PluginLoader();

// API routes
app.use('/v1/tasks', taskRoutes(orchestrator));
app.use('/v1/advanced-tasks', advancedTaskRoutes(advancedOrchestrator));
app.use('/v1/stream', streamRoutes(orchestrator));
app.use('/v1', createPluginRoutes(pluginLoader));

// Root endpoint
app.get('/', (_req, res) => {
  return res.json({
    message: 'API Flui - Autonomous AI Orchestrator',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tasks: '/v1/tasks',
      advancedTasks: '/v1/advanced-tasks',
      stream: '/v1/stream',
      plugins: '/v1/plugins'
    },
    documentation: '/docs',
    status: 'running'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  return res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /v1/tasks',
      'GET /v1/tasks',
      'GET /v1/tasks/:id',
      'POST /v1/tasks/:id/execute',
      'POST /v1/tasks/:id/delegate',
      'POST /v1/tasks/:id/retry',
      'GET /v1/tasks/:id/status',
      'GET /v1/tasks/:id/events',
      'GET /v1/stream/:id'
    ]
  });
});

// Global error handler
app.use((error: any, _req: any, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  return res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    ...((process.env as any)['NODE_ENV'] === 'development' && { details: error.message })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Flui server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${(process.env as any)['NODE_ENV'] || 'development'}`);
  console.log(`🎯 OpenAI Base URL: ${(process.env as any)['OPENAI_BASE_URL'] || 'http://localhost:4000'}`);
});

export default app;
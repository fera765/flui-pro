"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const tasks_1 = require("./routes/tasks");
const advancedTasks_1 = require("./routes/advancedTasks");
const stream_1 = require("./routes/stream");
const plugins_1 = require("./routes/plugins");
const orchestrator_1 = require("./core/orchestrator");
const advancedOrchestrator_1 = require("./core/advancedOrchestrator");
const classifier_1 = require("./core/classifier");
const planner_1 = require("./core/planner");
const worker_1 = require("./core/worker");
const supervisor_1 = require("./core/supervisor");
const pollinationsTool_1 = require("./tools/pollinationsTool");
const pluginLoader_1 = require("./core/pluginLoader");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 5000;
const pollinationsTool = new pollinationsTool_1.PollinationsTool();
const classifier = new classifier_1.Classifier();
const planner = new planner_1.Planner();
const worker = new worker_1.Worker(pollinationsTool);
const supervisor = new supervisor_1.Supervisor();
const orchestratorConfig = {
    maxDepth: parseInt(process.env['MAX_TASK_DEPTH'] || '5'),
    maxRetries: parseInt(process.env['MAX_RETRIES'] || '3'),
    taskTimeoutMs: parseInt(process.env['TASK_TIMEOUT_MS'] || '300000'),
    enableStreaming: true
};
const orchestrator = new orchestrator_1.Orchestrator(orchestratorConfig, classifier, planner, worker, supervisor);
const advancedOrchestrator = new advancedOrchestrator_1.AdvancedOrchestrator(orchestratorConfig, classifier, planner, worker, supervisor);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['NODE_ENV'] === 'production' ? false : true,
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, _res, next) => {
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
app.get('/health', (_req, res) => {
    return res.json({
        status: 'healthy',
        service: 'API Flui - Autonomous AI Orchestrator',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
        config: {
            maxDepth: orchestratorConfig.maxDepth,
            maxRetries: orchestratorConfig.maxRetries,
            taskTimeoutMs: orchestratorConfig.taskTimeoutMs,
            enableStreaming: orchestratorConfig.enableStreaming
        }
    });
});
const pluginLoader = new pluginLoader_1.PluginLoader();
app.use('/v1/tasks', (0, tasks_1.taskRoutes)(orchestrator));
app.use('/v1/advanced-tasks', (0, advancedTasks_1.advancedTaskRoutes)(advancedOrchestrator));
app.use('/v1/stream', (0, stream_1.streamRoutes)(orchestrator));
app.use('/v1', (0, plugins_1.createPluginRoutes)(pluginLoader));
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
app.use((error, _req, res, _next) => {
    console.error('Global error handler:', error);
    return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        ...(process.env['NODE_ENV'] === 'development' && { details: error.message })
    });
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`🚀 API Flui server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`🎯 OpenAI Base URL: ${process.env['OPENAI_BASE_URL'] || 'http://localhost:4000'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map
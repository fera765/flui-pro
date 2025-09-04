"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const pollinationsClient_1 = require("./lib/pollinationsClient");
const image_1 = require("./routes/image");
const text_1 = require("./routes/text");
const audio_1 = require("./routes/audio");
const models_1 = require("./routes/models");
const feed_1 = require("./routes/feed");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 4000;
const pollinationsClient = new pollinationsClient_1.PollinationsClient();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['NODE_ENV'] === 'production' ? false : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, morgan_1.default)('combined'));
app.use((req, _res, next) => {
    req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    next();
});
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        requestId: req.requestId
    };
    res.json(health);
});
app.use('/v1/images', (0, image_1.imageRoutes)(pollinationsClient));
app.use('/v1/chat', (0, text_1.textRoutes)(pollinationsClient));
app.use('/v1/audio', (0, audio_1.audioRoutes)(pollinationsClient));
app.use('/v1/models', (0, models_1.modelsRoutes)(pollinationsClient));
app.use('/v1/feed', (0, feed_1.feedRoutes)(pollinationsClient));
app.use('/images', (0, image_1.imageRoutes)(pollinationsClient));
app.use((error, _req, res, _next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});
const server = app.listen(PORT, () => {
    console.log(`🚀 Pollinations API Proxy server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base: http://localhost:${PORT}/v1`);
});
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
exports.default = app;
//# sourceMappingURL=server.js.map
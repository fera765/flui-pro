import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container, registerServices, initializeTools } from './config/container-fixed';
import express from 'express';

console.log('🚀 Starting FLUI AutoCode-Forge...');

try {
  // Register all services
  registerServices();
  
  // Initialize tools
  initializeTools();

  // Import controllers to register them
  require('./controllers/HealthController');
  require('./autocode/api/AutoCodeController');

  // Import routes
  const autoCodeRoutes = require('./autocode/api/AutoCodeRoutes').default;
  const streamingRoutes = require('./autocode/streaming/StreamingRoutes').default;

  const server = new InversifyExpressServer(container);

  server.setConfig((app: express.Application) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // CORS configuration
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // AutoCode routes
    app.use('/autocode', autoCodeRoutes);
    
    // Streaming routes
    app.use('/autocode', streamingRoutes);
  });

  const app = server.build();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 FLUI AutoCode-Forge is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🎯 Create React project: POST http://localhost:${PORT}/autocode/task`);
    console.log(`✨ Ready to create React + TypeScript + TailwindCSS projects!`);
  });

} catch (error) {
  console.error('❌ Error starting server:', error);
  process.exit(1);
}
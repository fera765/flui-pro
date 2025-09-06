import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from './config/container';
import express from 'express';

// Import controllers to register them
import './controllers/HealthController';
import './autocode/api/AutoCodeController';

// Import routes
import autoCodeRoutes from './autocode/api/AutoCodeRoutes';

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
});

const app = server.build();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Flui Agent is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

export default app;
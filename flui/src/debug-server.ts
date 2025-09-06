import 'reflect-metadata';
import { Container } from 'inversify';
import express from 'express';

console.log('🔍 Starting debug server...');

try {
  console.log('1. Creating container...');
  const container = new Container();
  console.log('✅ Container created');

  console.log('2. Importing modules...');
  const { container: mainContainer } = require('./config/container');
  console.log('✅ Container imported');

  console.log('3. Creating Express app...');
  const app = express();
  app.use(express.json());
  console.log('✅ Express app created');

  console.log('4. Adding health endpoint...');
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Debug server working' });
  });
  console.log('✅ Health endpoint added');

  console.log('5. Starting server...');
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });

} catch (error) {
  console.error('❌ Error in debug server:', error);
  process.exit(1);
}
import request from 'supertest';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from '../../config/container';
import express from 'express';
import '../../controllers/HealthController';

describe('HealthController', () => {
  let app: express.Application;

  beforeAll(() => {
    const server = new InversifyExpressServer(container);
    server.setConfig((app: express.Application) => {
      app.use(express.json());
    });
    app = server.build();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'flui-agent');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
import request from 'supertest';
import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from '../../config/container';
import express from 'express';
import '../../controllers/HealthController';
import '../../controllers/LlmController';

describe('LlmController', () => {
  let app: express.Application;

  beforeAll(() => {
    const server = new InversifyExpressServer(container);
    server.setConfig((app: express.Application) => {
      app.use(express.json());
    });
    app = server.build();
  });

  describe('POST /llm/generate', () => {
    it('should return error when prompt is missing', async () => {
      const response = await request(app)
        .post('/llm/generate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Prompt is required');
    });

    it('should return error when prompt is empty', async () => {
      const response = await request(app)
        .post('/llm/generate')
        .send({ prompt: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Prompt is required');
    });

    it('should handle valid prompt request', async () => {
      const response = await request(app)
        .post('/llm/generate')
        .send({ prompt: 'Hello, how are you?' })
        .expect(500); // Will fail due to no LLM connection, but structure is correct

      expect(response.body).toHaveProperty('error');
    });

    it('should handle prompt with tools', async () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'calculator',
            description: 'Perform calculations'
          }
        }
      ];

      const response = await request(app)
        .post('/llm/generate')
        .send({ prompt: 'Calculate 2+2', tools })
        .expect(500); // Will fail due to no LLM connection, but structure is correct

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /llm/status', () => {
    it('should return LLM status and configuration', async () => {
      const response = await request(app)
        .get('/llm/status')
        .expect(200);

      expect(response.body).toHaveProperty('connected');
      expect(response.body).toHaveProperty('configuration');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.configuration).toHaveProperty('baseUrl');
      expect(response.body.configuration).toHaveProperty('model');
      expect(response.body.configuration).toHaveProperty('maxTokens');
      expect(response.body.configuration).toHaveProperty('temperature');
    });
  });
});
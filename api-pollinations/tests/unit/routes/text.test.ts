import request from 'supertest';
import express from 'express';
import { textRoutes } from '../../../src/routes/text';
import { PollinationsClient } from '../../../src/lib/pollinationsClient';

// Mock PollinationsClient
const mockClient = {
  generateText: jest.fn(),
  openaiCompatibleChat: jest.fn()
} as unknown as PollinationsClient;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/v1/chat', textRoutes(mockClient));

describe('Text Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/chat/chat/completions', () => {
    it('should handle chat completions with streaming', async () => {
      const mockStreamResponse = {
        choices: [
          {
            delta: { content: 'Hello' },
            finish_reason: null
          }
        ]
      };

      (mockClient.openaiCompatibleChat as jest.Mock).mockResolvedValue(mockStreamResponse);

      const response = await request(app)
        .post('/v1/chat/chat/completions')
        .send({
          model: 'openai',
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          stream: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
    });

    it('should handle chat completions without streaming', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Hello there!', role: 'assistant' },
            finish_reason: 'stop'
          }
        ]
      };

      (mockClient.openaiCompatibleChat as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/v1/chat/chat/completions')
        .send({
          model: 'openai',
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          stream: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle missing messages parameter', async () => {
      const response = await request(app)
        .post('/v1/chat/chat/completions')
        .send({
          model: 'openai'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Messages are required'
      });
    });

    it('should handle client errors', async () => {
      (mockClient.openaiCompatibleChat as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/v1/chat/chat/completions')
        .send({
          model: 'openai',
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });

  describe('GET /v1/chat/:prompt', () => {
    it('should generate text from prompt with JSON response', async () => {
      const mockResponse = 'Generated text response';
      (mockClient.generateText as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/v1/chat/Hello%20world')
        .query({
          model: 'openai',
          temperature: '0.7',
          json: 'true'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        response: mockResponse,
        prompt: 'Hello world',
        model: 'openai'
      });
      expect(mockClient.generateText).toHaveBeenCalledWith(
        'Hello world',
        {
          model: 'openai',
          stream: false,
          temperature: 0.7,
          json: true
        }
      );
    });

    it('should generate text from prompt with plain text response', async () => {
      const mockResponse = 'Generated text response';
      (mockClient.generateText as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/v1/chat/Hello%20world')
        .query({
          model: 'openai',
          temperature: '0.7'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toBe(mockResponse);
      expect(mockClient.generateText).toHaveBeenCalledWith(
        'Hello world',
        {
          model: 'openai',
          stream: false,
          temperature: 0.7
        }
      );
    });

    it('should handle client errors', async () => {
      (mockClient.generateText as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/v1/chat/Hello%20world');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });
});
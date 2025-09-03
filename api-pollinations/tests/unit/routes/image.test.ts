import request from 'supertest';
import express from 'express';
import { imageRoutes } from '../../../src/routes/image';
import { PollinationsClient } from '../../../src/lib/pollinationsClient';

// Mock PollinationsClient
jest.mock('../../../src/lib/pollinationsClient');
const MockedPollinationsClient = PollinationsClient as jest.MockedClass<typeof PollinationsClient>;

describe('Image Routes', () => {
  let app: express.Application;
  let mockClient: jest.Mocked<PollinationsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new MockedPollinationsClient() as jest.Mocked<PollinationsClient>;
    
    app = express();
    app.use(express.json());
    app.use('/v1/images', imageRoutes(mockClient));
  });

  describe('POST /v1/images/generations', () => {
    it('should generate image successfully', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const response = await request(app)
        .post('/v1/images/generations')
        .send({
          prompt: 'A beautiful sunset',
          n: 1,
          size: '1024x1024',
          model: 'dall-e-3'
        })
        .expect(200);

      expect(mockClient.generateImage).toHaveBeenCalledWith('A beautiful sunset', {
        width: 1024,
        height: 1024,
        model: 'flux'
      });

      expect(response.body).toEqual({
        created: expect.any(Number),
        data: [
          {
            url: expect.stringContaining('data:image/jpeg;base64,'),
            revised_prompt: 'A beautiful sunset'
          }
        ]
      });
    });

    it('should handle missing prompt', async () => {
      const response = await request(app)
        .post('/v1/images/generations')
        .send({
          size: '1024x1024'
        })
        .expect(400);

      expect(response.body.error).toBe('Prompt is required');
    });

    it('should handle invalid size format', async () => {
      const response = await request(app)
        .post('/v1/images/generations')
        .send({
          prompt: 'Test prompt',
          size: 'invalid-size'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid size format. Expected format: WIDTHxHEIGHT');
    });

    it('should handle Pollinations client errors', async () => {
      mockClient.generateImage.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/v1/images/generations')
        .send({
          prompt: 'Test prompt'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle different size formats correctly', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const sizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];

      for (const size of sizes) {
        mockClient.generateImage.mockClear();
        mockClient.generateImage.mockResolvedValue(mockImageBuffer);

        await request(app)
          .post('/v1/images/generations')
          .send({
            prompt: 'Test prompt',
            size
          })
          .expect(200);

        const [width, height] = size.split('x').map(Number);
        expect(mockClient.generateImage).toHaveBeenCalledWith('Test prompt', {
          width,
          height,
          model: 'flux'
        });
      }
    });

    it('should handle quality parameter mapping', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      await request(app)
        .post('/v1/images/generations')
        .send({
          prompt: 'Test prompt',
          quality: 'hd'
        })
        .expect(200);

      expect(mockClient.generateImage).toHaveBeenCalledWith('Test prompt', {
        width: 1024,
        height: 1024,
        model: 'flux',
        enhance: true
      });
    });
  });

  describe('GET /v1/images/generations/:prompt', () => {
    it('should generate image via GET request', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const response = await request(app)
        .get('/v1/images/generations/A%20beautiful%20sunset')
        .query({
          width: '1024',
          height: '768',
          model: 'flux'
        })
        .expect(200);

      expect(mockClient.generateImage).toHaveBeenCalledWith('A beautiful sunset', {
        width: 1024,
        height: 768,
        model: 'flux'
      });

      expect(response.body).toEqual({
        created: expect.any(Number),
        data: [
          {
            url: expect.stringContaining('data:image/jpeg;base64,'),
            revised_prompt: 'A beautiful sunset'
          }
        ]
      });
    });

    it('should handle URL decoding of prompt', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      await request(app)
        .get('/v1/images/generations/A%20beautiful%20sunset%20with%20clouds')
        .expect(200);

      expect(mockClient.generateImage).toHaveBeenCalledWith('A beautiful sunset with clouds', {
        width: 1024,
        height: 1024,
        model: 'flux'
      });
    });
  });
});
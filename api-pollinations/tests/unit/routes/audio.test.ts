import request from 'supertest';
import express from 'express';
import { audioRoutes } from '../../../src/routes/audio';
import { PollinationsClient } from '../../../src/lib/pollinationsClient';

// Mock PollinationsClient
const mockClient = {
  generateAudio: jest.fn(),
  speechToText: jest.fn()
} as unknown as PollinationsClient;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/v1/audio', audioRoutes(mockClient));

describe('Audio Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/audio/speech', () => {
    it('should generate audio from text', async () => {
      const mockAudioBuffer = Buffer.from('fake audio data');
      (mockClient.generateAudio as jest.Mock).mockResolvedValue(mockAudioBuffer);

      const response = await request(app)
        .post('/v1/audio/speech')
        .send({
          text: 'Hello world',
          voice: 'alloy',
          model: 'openai-audio'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        audio: mockAudioBuffer.toString('base64'),
        format: 'mp3',
        voice: 'alloy',
        model: 'openai-audio'
      });
      expect(mockClient.generateAudio).toHaveBeenCalledWith(
        'Hello world',
        'alloy',
        'openai-audio'
      );
    });

    it('should handle missing text parameter', async () => {
      const response = await request(app)
        .post('/v1/audio/speech')
        .send({
          voice: 'alloy'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Input text is required'
      });
    });

    it('should handle client errors', async () => {
      (mockClient.generateAudio as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/v1/audio/speech')
        .send({
          text: 'Hello world',
          voice: 'alloy'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });

  describe('GET /v1/audio/speech/:text', () => {
    it('should generate audio from text in URL', async () => {
      const mockAudioBuffer = Buffer.from('fake audio data');
      (mockClient.generateAudio as jest.Mock).mockResolvedValue(mockAudioBuffer);

      const response = await request(app)
        .get('/v1/audio/speech/Hello%20world')
        .query({
          voice: 'echo',
          model: 'openai-audio'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        audio: mockAudioBuffer.toString('base64'),
        format: 'mp3',
        voice: 'echo',
        model: 'openai-audio'
      });
      expect(mockClient.generateAudio).toHaveBeenCalledWith(
        'Hello world',
        'echo',
        'openai-audio'
      );
    });

    it('should handle client errors', async () => {
      (mockClient.generateAudio as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/v1/audio/speech/Hello%20world');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });

  describe('POST /v1/audio/transcriptions', () => {
    it('should transcribe audio to text', async () => {
      const mockTranscription = 'Hello world transcription';
      (mockClient.speechToText as jest.Mock).mockResolvedValue(mockTranscription);

      const response = await request(app)
        .post('/v1/audio/transcriptions')
        .send({
          audio: 'data:audio/mp3;base64,fake_audio_data',
          model: 'openai-audio'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        text: mockTranscription,
        model: 'openai-audio'
      });
      expect(mockClient.speechToText).toHaveBeenCalledWith(
        'fake_audio_data',
        'mp3'
      );
    });

    it('should handle missing audio parameter', async () => {
      const response = await request(app)
        .post('/v1/audio/transcriptions')
        .send({
          model: 'openai-audio'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Audio file is required'
      });
    });

    it('should handle invalid audio format', async () => {
      const response = await request(app)
        .post('/v1/audio/transcriptions')
        .send({
          audio: 'invalid_format',
          model: 'openai-audio'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Audio file is required'
      });
    });

    it('should handle client errors', async () => {
      (mockClient.speechToText as jest.Mock).mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/v1/audio/transcriptions')
        .send({
          audio: 'data:audio/mp3;base64,fake_audio_data'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error'
      });
    });
  });

  describe('POST /v1/audio/transcriptions/multipart', () => {
    it('should return not implemented', async () => {
      const response = await request(app)
        .post('/v1/audio/transcriptions/multipart');

      expect(response.status).toBe(501);
      expect(response.body).toEqual({
        error: 'Not implemented',
        message: 'Multipart form uploads not yet supported. Use base64 data instead.'
      });
    });
  });
});
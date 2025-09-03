import { PollinationsClient } from '../../src/lib/pollinationsClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PollinationsClient', () => {
  let client: PollinationsClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    (process.env as any)['POLLINATIONS_API_KEY'] = mockApiKey;
    client = new PollinationsClient();
  });

  afterEach(() => {
    delete (process.env as any)['POLLINATIONS_API_KEY'];
  });

  describe('constructor', () => {
    it('should initialize with default upstream URLs', () => {
      expect(client['imageBaseUrl']).toBe('https://image.pollinations.ai');
      expect(client['textBaseUrl']).toBe('https://text.pollinations.ai');
    });

    it('should initialize with custom upstream URLs', () => {
      const customClient = new PollinationsClient(
        'https://custom-image.example.com',
        'https://custom-text.example.com'
      );
      expect(customClient['imageBaseUrl']).toBe('https://custom-image.example.com');
      expect(customClient['textBaseUrl']).toBe('https://custom-text.example.com');
    });

    it('should throw error if API key is not provided', () => {
      delete (process.env as any)['POLLINATIONS_API_KEY'];
      expect(() => new PollinationsClient()).toThrow('POLLINATIONS_API_KEY is required');
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      const mockResponse = { data: 'image-data', status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.generateImage('test prompt', {
        width: 1024,
        height: 768,
        model: 'flux',
        seed: 42
      });

      expect(result).toBe('image-data');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://image.pollinations.ai/prompt/test%20prompt',
        {
          params: {
            width: 1024,
            height: 768,
            model: 'flux',
            seed: 42
          },
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Accept': 'image/*'
          },
          responseType: 'arraybuffer',
          timeout: 300000
        }
      );
    });

    it('should handle errors and retry', async () => {
      const errorResponse = { response: { status: 500, data: 'Internal Server Error' } };
      mockedAxios.get
        .mockRejectedValueOnce(errorResponse)
        .mockRejectedValueOnce(errorResponse)
        .mockResolvedValue({ data: 'success', status: 200 });

      const result = await client.generateImage('test prompt');

      expect(result).toBe('success');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const errorResponse = { response: { status: 500, data: 'Internal Server Error' } };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(client.generateImage('test prompt')).rejects.toThrow('Max retries exceeded');
      
      // The client will try 4 times (initial + 3 retries) before giving up
      // maxRetries = 3 means: initial(0) + retry(1) + retry(2) + retry(3) = 4 calls
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const mockResponse = { data: 'Generated text response', status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.generateText('test prompt', {
        model: 'openai',
        temperature: 0.7,
        stream: false
      });

      expect(result).toBe('Generated text response');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://text.pollinations.ai/test%20prompt',
        {
          params: {
            model: 'openai',
            temperature: 0.7,
            stream: false
          },
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Accept': 'text/plain'
          },
          timeout: 30000
        }
      );
    });

    it('should handle streaming text', async () => {
      const mockResponse = { data: 'streaming data', status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.generateText('test prompt', {
        stream: true
      });

      expect(result).toBe('streaming data');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://text.pollinations.ai/test%20prompt',
        expect.objectContaining({
          params: { stream: true },
          headers: expect.objectContaining({
            'Accept': 'text/event-stream'
          })
        })
      );
    });
  });

  describe('generateAudio', () => {
    it('should generate audio successfully', async () => {
      const mockResponse = { data: 'audio-data', status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.generateAudio('test text', {
        voice: 'nova',
        model: 'openai-audio'
      });

      expect(result).toBe('audio-data');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://text.pollinations.ai/test%20text',
        {
          params: {
            voice: 'nova',
            model: 'openai-audio'
          },
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Accept': 'audio/*'
          },
          responseType: 'arraybuffer',
          timeout: 300000
        }
      );
    });
  });

  describe('speechToText', () => {
    it('should transcribe audio successfully', async () => {
      const mockResponse = { 
        data: { 
          choices: [{ 
            message: { 
              content: 'Transcribed text' 
            } 
          }] 
        }, 
        status: 200 
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const audioData = 'base64-audio-data';
      const result = await client.speechToText(audioData, 'wav');

      expect(result).toBe('Transcribed text');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://text.pollinations.ai/openai',
        {
          model: 'openai-audio',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Transcribe this:' },
                {
                  type: 'input_audio',
                  input_audio: {
                    data: audioData,
                    format: 'wav'
                  }
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
    });
  });

  describe('getModels', () => {
    it('should get image models successfully', async () => {
      const mockResponse = { data: ['flux', 'kontext'], status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.getModels('image');

      expect(result).toEqual(['flux', 'kontext']);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://image.pollinations.ai/models',
        {
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );
    });

    it('should get text models successfully', async () => {
      const mockResponse = { data: ['openai', 'mistral'], status: 200 };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.getModels('text');

      expect(result).toEqual(['openai', 'mistral']);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://text.pollinations.ai/models',
        {
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );
    });
  });

  describe('openaiCompatibleChat', () => {
    it('should handle OpenAI-compatible chat requests', async () => {
      const mockResponse = { 
        data: { 
          choices: [{ 
            message: { 
              content: 'Assistant response' 
            } 
          }] 
        }, 
        status: 200 
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'Hello' }
      ];

      const result = await client.openaiCompatibleChat({
        model: 'openai',
        messages,
        temperature: 0.7
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://text.pollinations.ai/openai',
        {
          model: 'openai',
          messages,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when upstream is accessible', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await client.healthCheck();

      expect(result).toEqual({
        ok: true,
        upstream: 'ok',
        timestamp: expect.any(Date)
      });
    });

    it('should return unhealthy status when upstream is not accessible', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await client.healthCheck();

      expect(result).toEqual({
        ok: false,
        upstream: 'error',
        error: 'Network error',
        timestamp: expect.any(Date)
      });
    });
  });
});
import { OpenAIAdapter } from '../../src/lib/adapters/openaiAdapter';
import { PollinationsClient } from '../../src/lib/pollinationsClient';

// Mock PollinationsClient
jest.mock('../../src/lib/pollinationsClient');
const MockedPollinationsClient = PollinationsClient as jest.MockedClass<typeof PollinationsClient>;

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockClient: jest.Mocked<PollinationsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new MockedPollinationsClient() as jest.Mocked<PollinationsClient>;
    adapter = new OpenAIAdapter(mockClient);
  });

  describe('images.generate', () => {
    it('should adapt OpenAI image generation request to Pollinations format', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const openaiRequest = {
        prompt: 'A beautiful sunset',
        n: 1,
        size: '1024x1024' as const,
        model: 'dall-e-3',
        quality: 'standard' as const,
        response_format: 'url' as const
      };

      const result = await adapter.images.generate(openaiRequest);

      expect(mockClient.generateImage).toHaveBeenCalledWith('A beautiful sunset', {
        width: 1024,
        height: 1024,
        model: 'flux' // Default model mapping
      });

      expect(result).toEqual({
        created: expect.any(Number),
        data: [
          {
            url: expect.stringContaining('data:image/jpeg;base64,'),
            revised_prompt: 'A beautiful sunset'
          }
        ]
      });
    });

    it('should handle different size formats', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const sizes = [
        { input: '256x256' as const, expected: { width: 256, height: 256 } },
        { input: '512x512' as const, expected: { width: 512, height: 512 } },
        { input: '1024x1024' as const, expected: { width: 1024, height: 1024 } },
        { input: '1792x1024' as const, expected: { width: 1792, height: 1024 } },
        { input: '1024x1792' as const, expected: { width: 1024, height: 1792 } }
      ];

      for (const { input, expected } of sizes) {
        mockClient.generateImage.mockClear();
        mockClient.generateImage.mockResolvedValue(mockImageBuffer);

        await adapter.images.generate({
          prompt: 'Test prompt',
          size: input
        });

        expect(mockClient.generateImage).toHaveBeenCalledWith('Test prompt', {
          width: expected.width,
          height: expected.height,
          model: 'flux' // Default model is always added
        });
      }
    });

    it('should map OpenAI models to Pollinations models', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      const modelMappings = [
        { openai: 'dall-e-2' as const, pollinations: 'flux' },
        { openai: 'dall-e-3' as const, pollinations: 'flux' },
        { openai: 'unknown' as any, pollinations: 'flux' }
      ];

      for (const { openai, pollinations } of modelMappings) {
        mockClient.generateImage.mockClear();
        mockClient.generateImage.mockResolvedValue(mockImageBuffer);

        await adapter.images.generate({
          prompt: 'Test prompt',
          model: openai
        });

        expect(mockClient.generateImage).toHaveBeenCalledWith('Test prompt', {
          width: 1024, // Default size
          height: 1024, // Default size
          model: pollinations
        });
      }
    });

    it('should handle additional Pollinations-specific parameters', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      mockClient.generateImage.mockResolvedValue(mockImageBuffer);

      await adapter.images.generate({
        prompt: 'Test prompt',
        size: '1024x1024' as const,
        quality: 'hd' as const
      });

      expect(mockClient.generateImage).toHaveBeenCalledWith('Test prompt', {
        width: 1024,
        height: 1024,
        model: 'flux', // Default model
        enhance: true // HD quality maps to enhance
      });
    });
  });

  describe('chat.completions.create', () => {
    it('should adapt OpenAI chat completion request to Pollinations format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you?',
              role: 'assistant'
            },
            finish_reason: 'stop',
            index: 0
          }
        ],
        created: 1234567890,
        id: 'chatcmpl-123',
        model: 'openai',
        object: 'chat.completion',
        usage: {
          completion_tokens: 10,
          prompt_tokens: 5,
          total_tokens: 15
        }
      };

      mockClient.openaiCompatibleChat.mockResolvedValue(mockResponse);

      const openaiRequest = {
        model: 'gpt-4',
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant' },
          { role: 'user' as const, content: 'Hello' }
        ],
        temperature: 0.7,
        max_tokens: 100
      };

      const result = await adapter.chat.completions.create(openaiRequest);

      expect(mockClient.openaiCompatibleChat).toHaveBeenCalledWith({
        model: 'openai', // Map to Pollinations model
        messages: openaiRequest.messages,
        temperature: 0.7,
        max_tokens: 100
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle streaming responses', async () => {
      const mockStreamResponse = {
        choices: [
          {
            delta: { content: 'Hello' },
            finish_reason: null,
            index: 0
          }
        ],
        created: 1234567890,
        id: 'chatcmpl-123',
        model: 'openai',
        object: 'chat.completion.chunk'
      };

      mockClient.openaiCompatibleChat.mockResolvedValue(mockStreamResponse);

      const result = await adapter.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        stream: true
      });

      expect(mockClient.openaiCompatibleChat).toHaveBeenCalledWith({
        model: 'openai',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true
      });

      expect(result).toEqual(mockStreamResponse);
    });

    it('should map OpenAI models to Pollinations models', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test', role: 'assistant' } }]
      };

      mockClient.openaiCompatibleChat.mockResolvedValue(mockResponse);

      const modelMappings = [
        { openai: 'gpt-4' as const, pollinations: 'openai' },
        { openai: 'gpt-3.5-turbo' as const, pollinations: 'openai' },
        { openai: 'claude-3' as const, pollinations: 'claude-hybridspace' },
        { openai: 'unknown' as any, pollinations: 'openai' }
      ];

      for (const { openai, pollinations } of modelMappings) {
        mockClient.openaiCompatibleChat.mockClear();
        mockClient.openaiCompatibleChat.mockResolvedValue(mockResponse);

        await adapter.chat.completions.create({
          model: openai,
          messages: [{ role: 'user' as const, content: 'Test' }]
        });

        expect(mockClient.openaiCompatibleChat).toHaveBeenCalledWith({
          model: pollinations,
          messages: [{ role: 'user', content: 'Test' }]
        });
      }
    });
  });

  describe('audio.speech.create', () => {
    it('should adapt OpenAI audio speech request to Pollinations format', async () => {
      const mockAudioBuffer = Buffer.from('fake-audio-data');
      mockClient.generateAudio.mockResolvedValue(mockAudioBuffer);

      const openaiRequest = {
        model: 'tts-1',
        input: 'Hello, world!',
        voice: 'alloy' as const,
        response_format: 'mp3' as const,
        speed: 1.0
      };

      const result = await adapter.audio.speech.create(openaiRequest);

      expect(mockClient.generateAudio).toHaveBeenCalledWith('Hello, world!', {
        voice: 'alloy',
        model: 'openai-audio'
      });

      expect(result).toEqual(mockAudioBuffer);
    });

    it('should map OpenAI voices to Pollinations voices', async () => {
      const mockAudioBuffer = Buffer.from('fake-audio-data');
      mockClient.generateAudio.mockResolvedValue(mockAudioBuffer);

      const voiceMappings = [
        { openai: 'alloy' as const, pollinations: 'alloy' },
        { openai: 'echo' as const, pollinations: 'echo' },
        { openai: 'fable' as const, pollinations: 'fable' },
        { openai: 'onyx' as const, pollinations: 'onyx' },
        { openai: 'nova' as const, pollinations: 'nova' },
        { openai: 'shimmer' as const, pollinations: 'shimmer' }
      ];

      for (const { openai, pollinations } of voiceMappings) {
        mockClient.generateAudio.mockClear();
        mockClient.generateAudio.mockResolvedValue(mockAudioBuffer);

        await adapter.audio.speech.create({
          model: 'tts-1',
          input: 'Test',
          voice: openai
        });

        expect(mockClient.generateAudio).toHaveBeenCalledWith('Test', {
          voice: pollinations,
          model: 'openai-audio'
        });
      }
    });
  });

  describe('audio.transcriptions.create', () => {
    it('should adapt OpenAI audio transcription request to Pollinations format', async () => {
      const mockTranscription = 'This is the transcribed text';
      mockClient.speechToText.mockResolvedValue(mockTranscription);

      const openaiRequest = {
        file: Buffer.from('fake-audio-data'),
        model: 'whisper-1',
        prompt: 'Transcribe this audio',
        response_format: 'text' as const,
        temperature: 0.0,
        language: 'en'
      };

      const result = await adapter.audio.transcriptions.create(openaiRequest);

      expect(mockClient.speechToText).toHaveBeenCalledWith(
        expect.any(String), // base64 encoded audio
        'mp3' // default format
      );

      expect(result).toEqual(mockTranscription);
    });
  });

  describe('models.list', () => {
    it('should return OpenAI-compatible model list', async () => {
      const mockImageModels = ['flux', 'kontext'];
      const mockTextModels = ['openai', 'mistral', 'claude-hybridspace'];

      mockClient.getModels.mockResolvedValueOnce(mockImageModels);
      mockClient.getModels.mockResolvedValueOnce(mockTextModels);

      const result = await adapter.models.list();

      expect(mockClient.getModels).toHaveBeenCalledWith('image');
      expect(mockClient.getModels).toHaveBeenCalledWith('text');

      expect(result).toEqual({
        object: 'list',
        data: [
          { id: 'flux', object: 'model', created: expect.any(Number), owned_by: 'pollinations' },
          { id: 'kontext', object: 'model', created: expect.any(Number), owned_by: 'pollinations' },
          { id: 'openai', object: 'model', created: expect.any(Number), owned_by: 'pollinations' },
          { id: 'mistral', object: 'model', created: expect.any(Number), owned_by: 'pollinations' },
          { id: 'claude-hybridspace', object: 'model', created: expect.any(Number), owned_by: 'pollinations' }
        ]
      });
    });
  });

  describe('error handling', () => {
    it('should propagate Pollinations client errors', async () => {
      const error = new Error('Pollinations API error');
      mockClient.generateImage.mockRejectedValue(error);

      await expect(adapter.images.generate({
        prompt: 'Test prompt'
      })).rejects.toThrow('Pollinations API error');
    });

    it('should handle missing required parameters gracefully', async () => {
      await expect(adapter.images.generate({} as any)).rejects.toThrow();
    });
  });
});
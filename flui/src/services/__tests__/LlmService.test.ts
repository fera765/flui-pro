import { LlmService } from '../LlmService';
import { container } from '../../config/container';
import { ILlmService } from '../../interfaces/ILlmService';

describe('LlmService', () => {
  let llmService: ILlmService;

  beforeAll(() => {
    llmService = container.get<ILlmService>('ILlmService');
  });

  describe('generateResponse', () => {
    it('should generate a response for a simple prompt', async () => {
      const prompt = 'Hello, how are you?';
      
      const response = await llmService.generateResponse(prompt);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle empty prompt gracefully', async () => {
      const prompt = '';
      
      const response = await llmService.generateResponse(prompt);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should generate different responses for different prompts', async () => {
      const prompt1 = 'What is the weather like?';
      const prompt2 = 'Tell me a joke';
      
      const response1 = await llmService.generateResponse(prompt1);
      const response2 = await llmService.generateResponse(prompt2);
      
      expect(response1).not.toBe(response2);
      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });

  describe('generateResponseWithTools', () => {
    it('should generate response with tools parameter', async () => {
      const prompt = 'Help me with a calculation';
      const tools = [
        {
          type: 'function',
          function: {
            name: 'calculator',
            description: 'Perform mathematical calculations'
          }
        }
      ];
      
      const response = await llmService.generateResponseWithTools(prompt, tools);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should work without tools parameter', async () => {
      const prompt = 'Hello world';
      
      const response = await llmService.generateResponseWithTools(prompt);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('isConnected', () => {
    it('should return true when LLM is connected', async () => {
      const isConnected = await llmService.isConnected();
      
      expect(isConnected).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use custom base URL from environment', async () => {
      const prompt = 'Test connection';
      
      const response = await llmService.generateResponse(prompt);
      
      expect(response).toBeDefined();
      // This test ensures the service is using the custom base URL
      // by successfully connecting to our free LLM endpoint
    });

    it('should provide access to OpenAI client instance', () => {
      const openaiClient = llmService.getOpenAIClient();
      
      expect(openaiClient).toBeDefined();
      expect(openaiClient).toHaveProperty('chat');
      expect(openaiClient).toHaveProperty('completions');
    });

    it('should return correct base URL', () => {
      const baseUrl = llmService.getBaseUrl();
      
      expect(baseUrl).toBeDefined();
      expect(typeof baseUrl).toBe('string');
      expect(baseUrl).toContain('127.0.0.1:4000');
    });

    it('should return correct model', () => {
      const model = llmService.getModel();
      
      expect(model).toBeDefined();
      expect(typeof model).toBe('string');
      expect(model).toBe('gpt-3.5-turbo');
    });

    it('should return complete configuration', () => {
      const config = llmService.getConfiguration();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('apiKey');
    });
  });
});
import { PollinationsClient } from '../pollinationsClient';

export interface OpenAIImageGenerationRequest {
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  model?: string;
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  style?: 'vivid' | 'natural';
  user?: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | Array<any>;
    name?: string;
    tool_call_id?: string;
  }>;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  response_format?: { type: string };
  tools?: Array<any>;
  tool_choice?: any;
  seed?: number;
}

export interface OpenAIAudioSpeechRequest {
  model: string;
  input: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
  speed?: number;
}

export interface OpenAIAudioTranscriptionRequest {
  file: Buffer;
  model: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json';
  temperature?: number;
  language?: string;
}

export class OpenAIAdapter {
  private client: PollinationsClient;

  constructor(client: PollinationsClient) {
    this.client = client;
  }

  private mapOpenAIModelToPollinations(openaiModel: string, type: 'image' | 'text' | 'audio'): string {
    if (type === 'image') {
      // Map OpenAI image models to Pollinations models
      const imageModelMap: Record<string, string> = {
        'dall-e-2': 'flux',
        'dall-e-3': 'flux'
      };
      return imageModelMap[openaiModel] || 'flux';
    }

    if (type === 'text') {
      // Map OpenAI text models to Pollinations models
      const textModelMap: Record<string, string> = {
        'gpt-4': 'openai',
        'gpt-3.5-turbo': 'openai',
        'gpt-3.5-turbo-16k': 'openai',
        'claude-3': 'claude-hybridspace',
        'claude-3-sonnet': 'claude-hybridspace',
        'claude-3-haiku': 'claude-hybridspace'
      };
      return textModelMap[openaiModel] || 'openai';
    }

    if (type === 'audio') {
      // Map OpenAI audio models to Pollinations models
      const audioModelMap: Record<string, string> = {
        'tts-1': 'openai-audio',
        'tts-1-hd': 'openai-audio'
      };
      return audioModelMap[openaiModel] || 'openai-audio';
    }

    return 'openai';
  }

  private parseSize(size: string): { width: number; height: number } {
    const parts = size.split('x');
    if (parts.length !== 2) {
      throw new Error('Invalid size format');
    }
    
    const widthStr = parts[0]!;
    const heightStr = parts[1]!;
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);
    
    if (isNaN(width) || isNaN(height)) {
      throw new Error('Invalid size format');
    }
    
    return { width, height };
  }

  private bufferToBase64Url(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  images = {
    generate: async (request: OpenAIImageGenerationRequest) => {
      if (!request.prompt) {
        throw new Error('Prompt is required for image generation');
      }

      const size = request.size || '1024x1024';
      const { width, height } = this.parseSize(size);
      
      const pollinationsOptions: any = {
        width,
        height,
        model: this.mapOpenAIModelToPollinations(request.model || 'dall-e-3', 'image')
      };

      // Map quality to enhance parameter
      if (request.quality === 'hd') {
        pollinationsOptions.enhance = true;
      }

      const imageBuffer = await this.client.generateImage(request.prompt, pollinationsOptions);
      
      return {
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: this.bufferToBase64Url(imageBuffer),
            revised_prompt: request.prompt
          }
        ]
      };
    }
  };

  chat = {
    completions: {
      create: async (request: OpenAIChatCompletionRequest) => {
        if (!request.messages || request.messages.length === 0) {
          throw new Error('Messages are required for chat completion');
        }

        const pollinationsRequest: any = {
          model: this.mapOpenAIModelToPollinations(request.model, 'text'),
          messages: request.messages
        };

        // Only add defined parameters
        if (request.temperature !== undefined) pollinationsRequest.temperature = request.temperature;
        if (request.top_p !== undefined) pollinationsRequest.top_p = request.top_p;
        if (request.n !== undefined) pollinationsRequest.n = request.n;
        if (request.stream !== undefined) pollinationsRequest.stream = request.stream;
        if (request.max_tokens !== undefined) pollinationsRequest.max_tokens = request.max_tokens;
        if (request.presence_penalty !== undefined) pollinationsRequest.presence_penalty = request.presence_penalty;
        if (request.frequency_penalty !== undefined) pollinationsRequest.frequency_penalty = request.frequency_penalty;
        if (request.logit_bias !== undefined) pollinationsRequest.logit_bias = request.logit_bias;
        if (request.user !== undefined) pollinationsRequest.user = request.user;
        if (request.response_format !== undefined) pollinationsRequest.response_format = request.response_format;
        if (request.tools !== undefined) pollinationsRequest.tools = request.tools;
        if (request.tool_choice !== undefined) pollinationsRequest.tool_choice = request.tool_choice;
        if (request.seed !== undefined) pollinationsRequest.seed = request.seed;

        return await this.client.openaiCompatibleChat(pollinationsRequest);
      }
    }
  };

  audio = {
    speech: {
      create: async (request: OpenAIAudioSpeechRequest) => {
        if (!request.input) {
          throw new Error('Input text is required for audio generation');
        }

        const pollinationsOptions = {
          voice: request.voice,
          model: this.mapOpenAIModelToPollinations(request.model, 'audio')
        };

        return await this.client.generateAudio(request.input, pollinationsOptions);
      }
    },

    transcriptions: {
      create: async (request: OpenAIAudioTranscriptionRequest) => {
        if (!request.file) {
          throw new Error('Audio file is required for transcription');
        }

        // Convert buffer to base64
        const base64Audio = request.file.toString('base64');
        
        // Determine audio format (simplified - in production you'd detect from file headers)
        let format = 'mp3';
        if (request.file.length > 0) {
          // This is a simplified approach - in production you might want to detect format from file headers
          format = 'mp3';
        }

        return await this.client.speechToText(base64Audio, format);
      }
    }
  };

  models = {
    list: async () => {
      const [imageModels, textModels] = await Promise.all([
        this.client.getModels('image'),
        this.client.getModels('text')
      ]);

      const allModels = [...imageModels, ...textModels];
      const now = Math.floor(Date.now() / 1000);

      return {
        object: 'list',
        data: allModels.map(modelId => ({
          id: modelId,
          object: 'model',
          created: now,
          owned_by: 'pollinations'
        }))
      };
    }
  };
}
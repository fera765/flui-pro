import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

export interface ImageGenerationOptions {
  model?: string;
  seed?: number;
  width?: number;
  height?: number;
  image?: string;
  nologo?: boolean;
  private?: boolean;
  enhance?: boolean;
  safe?: boolean;
  referrer?: string;
}

export interface TextGenerationOptions {
  model?: string;
  seed?: number;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  json?: boolean;
  system?: string;
  stream?: boolean;
  private?: boolean;
  referrer?: string;
}

export interface AudioGenerationOptions {
  voice?: string;
  model?: string;
}

export interface OpenAIChatRequest {
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
  private?: boolean;
  referrer?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  upstream: 'ok' | 'error';
  error?: string;
  timestamp: Date;
}

export class PollinationsClient {
  private readonly imageBaseUrl: string;
  private readonly textBaseUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly retryBackoffMultiplier: number;

  constructor(
    imageBaseUrl?: string,
    textBaseUrl?: string
  ) {
    this.imageBaseUrl = imageBaseUrl || (process.env as any)['UPSTREAM_BASE_IMAGE'] || 'https://image.pollinations.ai';
    this.textBaseUrl = textBaseUrl || (process.env as any)['UPSTREAM_BASE_TEXT'] || 'https://text.pollinations.ai';
    this.apiKey = (process.env as any)['POLLINATIONS_API_KEY'] || '';
    this.maxRetries = parseInt((process.env as any)['MAX_RETRIES'] || '3');
    this.retryDelay = parseInt((process.env as any)['RETRY_DELAY_MS'] || '1000');
    this.retryBackoffMultiplier = parseFloat((process.env as any)['RETRY_BACKOFF_MULTIPLIER'] || '2');

    if (!this.apiKey) {
      throw new Error('POLLINATIONS_API_KEY is required');
    }
  }

  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      if (retryCount >= this.maxRetries) {
        throw new Error('Max retries exceeded');
      }

      // Only retry on 5xx errors
      if (error.response?.status >= 500) {
        const delay = this.retryDelay * Math.pow(this.retryBackoffMultiplier, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(requestFn, retryCount + 1);
      }

      throw error;
    }
  }

  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${this.imageBaseUrl}/prompt/${encodedPrompt}`;

    const config: AxiosRequestConfig = {
      params: options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'image/*'
      },
      responseType: 'arraybuffer',
      timeout: parseInt((process.env as any)['IMAGE_GENERATION_TIMEOUT_MS'] || '300000')
    };

    return this.makeRequestWithRetry(() => axios.get(url, config));
  }

  async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string> {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${this.textBaseUrl}/${encodedPrompt}`;

    const config: AxiosRequestConfig = {
      params: options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': options.stream ? 'text/event-stream' : 'text/plain'
      },
      timeout: parseInt((process.env as any)['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
    };

    return this.makeRequestWithRetry(() => axios.get(url, config));
  }

  async generateAudio(text: string, options: AudioGenerationOptions = {}): Promise<Buffer> {
    const encodedText = encodeURIComponent(text);
    const url = `${this.textBaseUrl}/${encodedText}`;

    const config: AxiosRequestConfig = {
      params: {
        model: 'openai-audio',
        voice: options.voice || 'alloy',
        ...options
      },
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'audio/*'
      },
      responseType: 'arraybuffer',
      timeout: parseInt((process.env as any)['AUDIO_GENERATION_TIMEOUT_MS'] || '300000')
    };

    return this.makeRequestWithRetry(() => axios.get(url, config));
  }

  async speechToText(audioData: string, format: string): Promise<string> {
    const url = `${this.textBaseUrl}/openai`;

    const payload = {
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
                format: format
              }
            }
          ]
        }
      ]
    };

    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: parseInt((process.env as any)['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
    };

    const response = await this.makeRequestWithRetry(() => axios.post(url, payload, config));
    return response.choices?.[0]?.message?.content || '';
  }

  async getModels(type: 'image' | 'text'): Promise<string[]> {
    const baseUrl = type === 'image' ? this.imageBaseUrl : this.textBaseUrl;
    const url = `${baseUrl}/models`;

    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      },
      timeout: parseInt((process.env as any)['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
    };

    return this.makeRequestWithRetry(() => axios.get(url, config));
  }

  async openaiCompatibleChat(request: OpenAIChatRequest): Promise<any> {
    const url = `${this.textBaseUrl}/openai`;

    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: parseInt((process.env as any)['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
    };

    return this.makeRequestWithRetry(() => axios.post(url, request, config));
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await axios.get(`${this.imageBaseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000
      });

      return {
        ok: true,
        upstream: 'ok',
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        ok: false,
        upstream: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}
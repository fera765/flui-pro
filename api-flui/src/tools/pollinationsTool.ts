import OpenAI from 'openai';

export interface ImageGenerationOptions {
  size?: string;
  model?: string;
  transparent?: boolean;
}

export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AudioGenerationOptions {
  voice?: string;
  model?: string;
}

export class PollinationsTool {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000',
      dangerouslyAllowBrowser: true
    });
  }

  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<string> {
    try {
      const response = await this.openai.images.generate({
        prompt,
        n: 1,
        size: (options.size as any) || '1024x1024',
        model: options.model || 'flux',
        response_format: 'b64_json'
      });

      if (response.data && response.data[0]?.b64_json) {
        return `data:image/png;base64,${response.data[0].b64_json}`;
      }

      throw new Error('No image data received');
    } catch (error: any) {
      // Try alternative route if the first one fails
      try {
        const altResponse = await fetch(`${this.openai.baseURL}/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openai.apiKey}`
          },
          body: JSON.stringify({
            prompt,
            size: options.size || '1024x1024',
            model: options.model || 'flux',
            n: 1
          })
        });

        if (altResponse.ok) {
          const data = await altResponse.json() as any;
          if (data.data && data.data[0]?.url) {
            return data.data[0].url;
          }
        }
      } catch (altError) {
        // Ignore alternative route errors
      }

      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || 'openai',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        stream: false
      });

      if (response.choices && response.choices[0]?.message?.content) {
        return response.choices[0].message.content;
      }

      throw new Error('No text response received');
    } catch (error: any) {
      // Try alternative route if the first one fails
      try {
        const altResponse = await fetch(`${this.openai.baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openai.apiKey}`
          },
          body: JSON.stringify({
            model: options.model || 'openai',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500
          })
        });

        if (altResponse.ok) {
          const data = await altResponse.json() as any;
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      } catch (altError) {
        // Ignore alternative route errors
      }

      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  async generateAudio(text: string, options: AudioGenerationOptions = {}): Promise<string> {
    try {
      const response = await this.openai.audio.speech.create({
        model: options.model || 'openai-audio',
        voice: (options.voice as any) || 'alloy',
        input: text,
        response_format: 'mp3'
      });

      // The response should be a base64 string
      if (typeof response === 'string') {
        return `data:audio/mp3;base64,${response}`;
      }

      // If it's a buffer, convert to base64
      if (response instanceof ArrayBuffer) {
        const buffer = Buffer.from(response);
        return `data:audio/mp3;base64,${buffer.toString('base64')}`;
      }

      throw new Error('Unexpected audio response format');
    } catch (error: any) {
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }

  async speechToText(audioData: string, options: { model?: string } = {}): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
      
      const response = await this.openai.audio.transcriptions.create({
        file: Buffer.from(base64Data, 'base64') as any,
        model: options.model || 'openai-audio',
        response_format: 'text'
      });

      if (typeof response === 'string') {
        return response;
      }

      throw new Error('Unexpected transcription response format');
    } catch (error: any) {
      throw new Error(`Speech to text failed: ${error.message}`);
    }
  }

  async listModels(): Promise<any[]> {
    try {
      const response = await this.openai.models.list();
      return response.data || [];
    } catch (error: any) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  async getModelInfo(modelId: string): Promise<any> {
    try {
      const response = await this.openai.models.retrieve(modelId);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }
}
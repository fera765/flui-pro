import { injectable } from 'inversify';
import OpenAI from 'openai';
import { ILlmService, LlmResponse, LlmConfiguration } from '../interfaces/ILlmService';
import dotenv from 'dotenv';

dotenv.config();

@injectable()
export class LlmService implements ILlmService {
  private readonly openai: OpenAI;
  private readonly configuration: LlmConfiguration;

  constructor() {
    this.configuration = this.createConfiguration();
    this.openai = this.createOpenAIClient();
  }

  private createConfiguration(): LlmConfiguration {
    const baseUrl = this.getEnvironmentVariable('OPENAI_BASE_URL') || 
                   this.getEnvironmentVariable('CUSTOM_BASE') || 
                   'http://127.0.0.1:4000/v1';
    
    const apiKey = this.getEnvironmentVariable('OPENAI_API_KEY') || 
                  'free-llm-no-key-required';
    
    return {
      baseUrl: this.normalizeBaseUrl(baseUrl),
      apiKey,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  private getEnvironmentVariable(key: string): string | undefined {
    return process.env[key];
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
  }

  private createOpenAIClient(): OpenAI {
    return new OpenAI({
      baseURL: this.configuration.baseUrl,
      apiKey: this.configuration.apiKey,
      timeout: 30000,
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    this.validatePrompt(prompt);
    
    try {
      const completion = await this.createCompletion(prompt);
      return this.extractResponseContent(completion);
    } catch (error) {
      throw this.createLlmError('generateResponse', error);
    }
  }

  async generateResponseWithTools(prompt: string, tools?: any[]): Promise<string> {
    this.validatePrompt(prompt);
    
    try {
      const completion = await this.createCompletionWithTools(prompt, tools);
      return this.extractResponseContent(completion);
    } catch (error) {
      throw this.createLlmError('generateResponseWithTools', error);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  getConfiguration(): LlmConfiguration {
    return { ...this.configuration };
  }

  private validatePrompt(prompt: string): void {
    if (typeof prompt !== 'string') {
      throw new Error('Prompt must be a string');
    }
  }

  private async createCompletion(prompt: string) {
    return await this.openai.chat.completions.create({
      model: this.configuration.model,
      messages: this.createUserMessage(prompt),
      max_tokens: this.configuration.maxTokens,
      temperature: this.configuration.temperature
    });
  }

  private async createCompletionWithTools(prompt: string, tools?: any[]) {
    return await this.openai.chat.completions.create({
      model: this.configuration.model,
      messages: this.createUserMessage(prompt),
      max_tokens: this.configuration.maxTokens,
      temperature: this.configuration.temperature,
      tools: tools || undefined
    });
  }

  private createUserMessage(prompt: string) {
    return [
      {
        role: 'user' as const,
        content: prompt
      }
    ];
  }

  private extractResponseContent(completion: any): string {
    return completion.choices[0]?.message?.content || 'No response generated';
  }

  private createLlmError(operation: string, error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Error(`Failed to ${operation}: ${errorMessage}`);
  }
}
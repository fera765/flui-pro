export interface ILlmService {
  generateResponse(prompt: string): Promise<string>;
  generateResponseWithTools(prompt: string, tools?: any[]): Promise<string>;
  isConnected(): Promise<boolean>;
  getConfiguration(): LlmConfiguration;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LlmConfiguration {
  baseUrl: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}
import { container } from '../config/container';
import { ILlmService } from '../interfaces/ILlmService';

/**
 * Exemplo de como usar o LlmService em qualquer lugar da aplicação
 * O service é uma instância configurada do SDK da OpenAI
 */
export class LlmUsageExample {
  private llmService: ILlmService;

  constructor() {
    this.llmService = container.get<ILlmService>('ILlmService');
  }

  /**
   * Exemplo de uso básico - gerar resposta simples
   */
  async generateSimpleResponse(prompt: string): Promise<string> {
    return await this.llmService.generateResponse(prompt);
  }

  /**
   * Exemplo de uso com ferramentas
   */
  async generateResponseWithTools(prompt: string, tools: any[]): Promise<string> {
    return await this.llmService.generateResponseWithTools(prompt, tools);
  }

  /**
   * Exemplo de acesso direto ao cliente OpenAI configurado
   */
  async useOpenAIClientDirectly(prompt: string): Promise<string> {
    const openaiClient = this.llmService.getOpenAIClient();
    
    // Usar o cliente OpenAI diretamente com a configuração customizada
    const completion = await openaiClient.chat.completions.create({
      model: this.llmService.getModel(),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }

  /**
   * Exemplo de verificação de status
   */
  async checkConnection(): Promise<boolean> {
    return await this.llmService.isConnected();
  }

  /**
   * Exemplo de acesso à configuração
   */
  getServiceInfo() {
    return {
      baseUrl: this.llmService.getBaseUrl(),
      model: this.llmService.getModel(),
      configuration: this.llmService.getConfiguration(),
      isConnected: false // Será atualizado quando checkConnection() for chamado
    };
  }
}
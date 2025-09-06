import { container } from '../config/container';
import { ILlmService } from '../interfaces/ILlmService';
import { IToolRegistry } from '../plugins/interfaces/ITool';

/**
 * Exemplo de como usar o LlmService com tools do Flui
 * Demonstra integração completa entre LLM e ferramentas do sistema
 */
export class LlmWithToolsExample {
  private llmService: ILlmService;
  private toolRegistry: IToolRegistry;

  constructor() {
    this.llmService = container.get<ILlmService>('ILlmService');
    this.toolRegistry = container.get<IToolRegistry>('IToolRegistry');
  }

  /**
   * Exemplo de uso básico com tools
   */
  async generateResponseWithTools(prompt: string): Promise<string> {
    const tools = this.toolRegistry.getToolsForOpenAI();
    
    return await this.llmService.generateResponseWithTools(prompt, tools);
  }

  /**
   * Exemplo de execução de tool específica
   */
  async executeSpecificTool(toolName: string, parameters: Record<string, any>): Promise<string> {
    return await this.toolRegistry.executeTool(toolName, parameters);
  }

  /**
   * Exemplo de listagem de tools disponíveis
   */
  getAvailableTools(): string[] {
    return this.toolRegistry.getRegisteredToolNames();
  }

  /**
   * Exemplo de verificação de status completo
   */
  async getSystemStatus(): Promise<{
    llmConnected: boolean;
    availableTools: string[];
    toolCount: number;
  }> {
    const llmConnected = await this.llmService.isConnected();
    const availableTools = this.getAvailableTools();
    
    return {
      llmConnected,
      availableTools,
      toolCount: availableTools.length
    };
  }

  /**
   * Exemplo de workflow completo: LLM + Tools
   */
  async executeWorkflow(prompt: string): Promise<{
    llmResponse: string;
    toolsUsed: string[];
    status: string;
  }> {
    try {
      // 1. Gerar resposta da LLM com tools disponíveis
      const llmResponse = await this.generateResponseWithTools(prompt);
      
      // 2. Listar tools que foram mencionadas na resposta
      const toolsUsed = this.extractToolsFromResponse(llmResponse);
      
      return {
        llmResponse,
        toolsUsed,
        status: 'success'
      };
    } catch (error) {
      return {
        llmResponse: '',
        toolsUsed: [],
        status: `error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private extractToolsFromResponse(response: string): string[] {
    const availableTools = this.getAvailableTools();
    const toolsUsed: string[] = [];
    
    for (const tool of availableTools) {
      if (response.toLowerCase().includes(tool.toLowerCase())) {
        toolsUsed.push(tool);
      }
    }
    
    return toolsUsed;
  }
}
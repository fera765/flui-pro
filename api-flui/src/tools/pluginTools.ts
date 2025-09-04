import { PluginFunction } from '../types/plugin';
import { PluginLoader } from '../core/pluginLoader';

export class PluginTools {
  private pluginLoader: PluginLoader;
  private pluginFunctions: Map<string, PluginFunction> = new Map();

  constructor(pluginLoader: PluginLoader) {
    this.pluginLoader = pluginLoader;
    this.loadPluginFunctions();
  }

  private loadPluginFunctions(): void {
    this.pluginFunctions = this.pluginLoader.getPluginFunctions();
  }

  getAvailableTools(): PluginFunction[] {
    return Array.from(this.pluginFunctions.values());
  }

  async executeTool(toolName: string, parameters: any, timeoutMs: number = 30000): Promise<any> {
    const tool = this.pluginFunctions.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    try {
      console.log(`🔧 Executing plugin tool: ${toolName} (timeout: ${timeoutMs}ms)`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Tool ${toolName} execution timeout (${timeoutMs}ms)`)), timeoutMs);
      });
      
      // Race between tool execution and timeout
      const result = await Promise.race([
        tool.execute(parameters),
        timeoutPromise
      ]);
      
      console.log(`✅ Plugin tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
      if ((error as Error).message.includes('timeout')) {
        console.error(`⏰ Plugin tool ${toolName} timed out after ${timeoutMs}ms`);
        throw new Error(`Tool execution timeout: ${toolName} took longer than ${timeoutMs}ms`);
      }
      console.error(`❌ Plugin tool ${toolName} failed:`, error);
      throw error;
    }
  }

  getToolSchema(toolName: string): any {
    const tool = this.pluginFunctions.get(toolName);
    
    if (!tool) {
      return null;
    }

    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.entries(tool.parameters)
            .filter(([_, param]: [string, any]) => param.required)
            .map(([key, _]) => key)
        }
      }
    };
  }

  getAllToolSchemas(): any[] {
    return Array.from(this.pluginFunctions.values()).map(tool => 
      this.getToolSchema(tool.name)
    );
  }

  refreshTools(): void {
    this.loadPluginFunctions();
  }
}
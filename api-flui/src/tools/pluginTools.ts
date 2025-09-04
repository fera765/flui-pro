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

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const tool = this.pluginFunctions.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    try {
      console.log(`🔧 Executing plugin tool: ${toolName}`);
      const result = await tool.execute(parameters);
      console.log(`✅ Plugin tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
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
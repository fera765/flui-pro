import { injectable } from 'inversify';
import { ITool, IToolExecutor, IToolRegistry } from '../interfaces/ITool';

@injectable()
export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ITool> = new Map();
  private executors: Map<string, IToolExecutor> = new Map();

  registerTool(tool: ITool, executor: IToolExecutor): void {
    this.tools.set(tool.name, tool);
    this.executors.set(tool.name, executor);
  }

  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, parameters: Record<string, any>): Promise<string> {
    const executor = this.executors.get(name);
    if (!executor) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      return await executor.execute(parameters);
    } catch (error) {
      throw new Error(`Tool execution failed for ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getToolsForOpenAI(): any[] {
    return this.getAllTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  isToolRegistered(name: string): boolean {
    return this.tools.has(name);
  }

  getRegisteredToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
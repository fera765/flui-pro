export interface ITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface IToolExecutor {
  execute(parameters: Record<string, any>): Promise<string>;
}

export interface IToolRegistry {
  registerTool(tool: ITool, executor: IToolExecutor): void;
  getTool(name: string): ITool | undefined;
  getAllTools(): ITool[];
  executeTool(name: string, parameters: Record<string, any>): Promise<string>;
}
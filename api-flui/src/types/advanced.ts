export interface Agent {
  id: string;
  name: string;
  role: string;
  persona: string;
  systemPrompt: string;
  tools: string[];
  maxDepth: number;
  currentDepth: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  prompt: string;
  context: string;
  systemPrompt: string;
  tools: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface TodoItem {
  id: string;
  description: string;
  type: 'agent' | 'tool';
  agentId?: string;
  toolName?: string;
  parameters?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface FluiContext {
  mainTask: string;
  mainTaskId: string;
  todos: TodoItem[];
  completedTasks: TodoItem[];
  currentAgent?: string;
  globalContext: string;
  collectedData: Record<string, any>;
  workingDirectory: string;
  generatedFiles: string[];
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  nextAction?: {
    type: 'delegate' | 'tool' | 'complete';
    target?: string;
    parameters?: any;
  };
  context?: string;
}

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  context?: string;
}
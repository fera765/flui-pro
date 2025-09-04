export interface ClassificationResult {
  type: 'conversation' | 'task';
  subtype?: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface Task {
  id: string;
  type: 'conversation' | 'task';
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  depth: number;
  retries: number;
  maxRetries: number;
  maxDepth: number;
  parentTaskId?: string;
  childTasks: string[];
  metadata: Record<string, any>;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'task_delegated' | 'task_retried';
  timestamp: Date;
  data: Record<string, any>;
}

export interface ConversationTask extends Task {
  type: 'conversation';
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface ImageGenerationTask extends Task {
  type: 'task';
  prompt: string;
  size?: string;
  model?: string;
}

export interface TextGenerationTask extends Task {
  type: 'task';
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompositeTask extends Task {
  type: 'task';
  subtasks: Array<{
    id: string;
    type: string;
    prompt: string;
    dependencies?: string[];
  }>;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface OrchestratorConfig {
  maxDepth: number;
  maxRetries: number;
  taskTimeoutMs: number;
  enableStreaming: boolean;
}

export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  currentTask?: string;
  status: 'idle' | 'busy' | 'offline';
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface SSEMessage {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}
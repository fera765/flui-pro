export interface TimeoutConfig {
  defaultTimeout: number; // ms
  pluginTimeout: number; // ms
  toolTimeout: number; // ms
  longRunningTimeout: number; // ms (para plugins como web scraping)
  maxRetries: number;
  retryDelay: number; // ms
}

export interface TaskTimeoutInfo {
  taskId: string;
  startTime: number;
  timeout: number;
  isLongRunning: boolean;
  retryCount: number;
  lastError?: string;
}

export interface ConcurrentTaskRequest {
  type: 'new_task' | 'status_check' | 'interrupt' | 'continue';
  originalTaskId?: string | undefined;
  newPrompt?: string | undefined;
  reason?: string | undefined;
}
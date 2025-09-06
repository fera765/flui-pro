export interface TimeoutConfig {
    defaultTimeout: number;
    pluginTimeout: number;
    toolTimeout: number;
    longRunningTimeout: number;
    maxRetries: number;
    retryDelay: number;
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
//# sourceMappingURL=timeout.d.ts.map
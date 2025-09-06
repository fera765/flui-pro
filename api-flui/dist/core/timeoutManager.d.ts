import { TimeoutConfig, TaskTimeoutInfo, ConcurrentTaskRequest } from '../types/timeout';
import { EventEmitter } from 'events';
export declare class TimeoutManager extends EventEmitter {
    private activeTasks;
    private timeouts;
    private config;
    constructor(config: TimeoutConfig);
    startTaskTimeout(taskId: string, isLongRunning?: boolean): void;
    updateTaskTimeout(taskId: string, newTimeout: number): void;
    completeTask(taskId: string): void;
    private handleTimeout;
    getTaskStatus(taskId: string): TaskTimeoutInfo | null;
    getActiveTasks(): TaskTimeoutInfo[];
    isLongRunningTask(taskId: string): boolean;
    analyzeConcurrentRequest(input: string, currentTaskId?: string): ConcurrentTaskRequest;
    detectErrorLoop(taskId: string, error: string): boolean;
    forceCompleteTask(taskId: string, reason: string): void;
}
//# sourceMappingURL=timeoutManager.d.ts.map
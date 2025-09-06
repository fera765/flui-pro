import { EventEmitter } from 'events';
import { TimeoutManager } from './timeoutManager';
import { Task } from '../types';
export declare class ConcurrentTaskManager extends EventEmitter {
    private activeTasks;
    private taskQueue;
    private timeoutManager;
    private maxConcurrentTasks;
    constructor(timeoutManager: TimeoutManager, maxConcurrentTasks?: number);
    addTask(task: Task, userInput?: string): Promise<{
        taskId: string;
        queued: boolean;
    }>;
    private executeTaskImmediately;
    private queueTask;
    private handleStatusCheck;
    private handleTaskInterruption;
    private handleNewConcurrentTask;
    private handleTaskContinuation;
    private handleTaskRetry;
    private handleTaskFailure;
    private handleTaskForceCompleted;
    private processNextQueuedTask;
    private detectLongRunningTask;
    private getCurrentActiveTaskId;
    getTaskStatus(taskId: string): {
        task: Task | null;
        timeoutInfo: any;
        queued: boolean;
    };
    getActiveTasks(): Task[];
    getQueueStatus(): {
        queued: number;
        active: number;
        maxConcurrent: number;
    };
}
//# sourceMappingURL=concurrentTaskManager.d.ts.map
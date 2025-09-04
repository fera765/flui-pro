import { Task, TaskResult, OrchestratorConfig } from '../types';
import { Classifier } from './classifier';
import { Planner } from './planner';
import { Worker } from './worker';
import { Supervisor } from './supervisor';
export interface TaskStatus {
    id: string;
    status: Task['status'];
    progress: number;
    estimatedCompletion: Date;
    metadata: Record<string, any>;
}
export interface TaskFilter {
    status?: Task['status'];
    type?: Task['type'];
    depth?: number;
}
export declare class Orchestrator {
    private config;
    private classifier;
    private planner;
    private worker;
    private supervisor;
    private tasks;
    private events;
    constructor(config: OrchestratorConfig, classifier: Classifier, planner: Planner, worker: Worker, supervisor: Supervisor);
    createTask(prompt: string): Promise<Task>;
    executeTask(taskId: string): Promise<TaskResult>;
    delegateTask(taskId: string): Promise<TaskResult>;
    retryTask(taskId: string): Promise<TaskResult>;
    getTask(taskId: string): Task | undefined;
    getTaskStatus(taskId: string): TaskStatus | null;
    listTasks(filter?: TaskFilter): Task[];
    getTaskEvents(taskId: string): any[];
    private updateTaskStatus;
    private updateTask;
    private calculateProgress;
    private estimateCompletion;
    private emitEvent;
}
//# sourceMappingURL=orchestrator.d.ts.map
import { TaskManager } from './taskManager';
import { LiveTester } from './liveTester';
import { MarkdownReporter } from './markdownReporter';
import { ContextPersistence } from './contextPersistence';
import { TaskOrchestratorResult, TaskCreationRequest, TaskModificationRequest, TaskQuestionRequest, TaskDownloadRequest, TaskInteractionResult, TaskStatusUpdate, TaskSummary, TaskListResult } from '../types/taskOrchestrator';
export declare class TaskOrchestrator {
    private taskManager;
    private liveTester;
    private markdownReporter;
    private contextPersistence;
    private activeTasks;
    constructor(taskManager: TaskManager, liveTester: LiveTester, markdownReporter: MarkdownReporter, contextPersistence: ContextPersistence);
    createPersistentTask(request: TaskCreationRequest): Promise<TaskOrchestratorResult>;
    executeTask(taskId: string): Promise<TaskOrchestratorResult>;
    interactWithTask(request: TaskQuestionRequest | TaskModificationRequest | TaskDownloadRequest): Promise<TaskInteractionResult>;
    listTasks(userId: string): Promise<TaskListResult>;
    getTaskStatus(taskId: string): Promise<TaskStatusUpdate>;
    pauseTask(taskId: string): Promise<TaskStatusUpdate>;
    resumeTask(taskId: string): Promise<TaskStatusUpdate>;
    completeTask(taskId: string): Promise<TaskOrchestratorResult>;
    deleteTask(taskId: string): Promise<TaskOrchestratorResult>;
    private detectTechnology;
    private detectLanguage;
    private simulateProjectCreation;
    private runTests;
    private startServer;
    private generateReport;
    private handleQuestion;
    private handleModification;
    private handleDownload;
    private calculateProgress;
    private calculateProgressFromContext;
    private getCurrentStep;
    private getStatusMessage;
    getTaskSummary(taskId: string): Promise<{
        success: boolean;
        summary?: TaskSummary;
        error?: string;
    }>;
    getTaskStatistics(): Promise<{
        success: boolean;
        statistics?: {
            totalTasks: number;
            activeTasks: number;
            completedTasks: number;
            errorTasks: number;
            totalExecutionTime: number;
            averageExecutionTime: number;
            totalFilesCreated: number;
            totalTestsPassed: number;
            totalTestsFailed: number;
        };
        error?: string;
    }>;
    cleanupCompletedTasks(): Promise<{
        success: boolean;
        cleanedCount?: number;
        error?: string;
    }>;
}
//# sourceMappingURL=taskOrchestrator.d.ts.map
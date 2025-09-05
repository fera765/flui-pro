import { EventEmitter } from 'events';
import { Intent, Project, ModificationRequest, DownloadRequest, ConversationContext, ProcessingResult } from '../types/dynamic';
export declare class CodeForgeOrchestrator extends EventEmitter {
    private tasks;
    private projects;
    private modificationRequests;
    private downloadRequests;
    private conversationContexts;
    private dynamicIntelligence;
    private codeForgeAgent;
    private dynamicTools;
    private workingDirectory;
    private taskOrchestrator;
    constructor(workingDirectory?: string);
    processUserInput(input: string, userId?: string): Promise<ProcessingResult>;
    handleUserAnswers(answers: Record<string, any>, userId: string): Promise<ProcessingResult>;
    executeProjectCreation(intent: Intent, userId: string): Promise<{
        success: boolean;
        project?: Project;
        error?: string;
        serverUrl?: string;
        downloadUrl?: string;
    }>;
    handleInteractiveMessage(message: string, userId: string): Promise<{
        success: boolean;
        response: string;
        modificationRequest?: ModificationRequest;
        downloadRequest?: DownloadRequest;
        error?: string;
    }>;
    executeModificationRequest(modificationId: string, userId: string): Promise<{
        success: boolean;
        modification?: ModificationRequest;
        error?: string;
    }>;
    executeDownloadRequest(downloadId: string, userId: string): Promise<{
        success: boolean;
        downloadRequest?: DownloadRequest;
        error?: string;
    }>;
    getProject(projectId: string): Project | undefined;
    getProjects(): Project[];
    getModificationRequest(modificationId: string): ModificationRequest | undefined;
    getDownloadRequest(downloadId: string): DownloadRequest | undefined;
    getConversationContext(userId: string): ConversationContext | undefined;
    private getOrCreateConversationContext;
    private buildInputFromAnswers;
    private setupEventHandlers;
    createPersistentTask(name: string, description: string, projectType: string, userId: string, initialPrompt: string): Promise<{
        success: boolean;
        taskId?: string;
        error?: string;
    }>;
    executePersistentTask(taskId: string): Promise<{
        success: boolean;
        reportPath?: string;
        liveUrl?: string;
        error?: string;
    }>;
    interactWithPersistentTask(taskId: string, interaction: string, userId: string): Promise<{
        success: boolean;
        response?: string;
        error?: string;
    }>;
    listPersistentTasks(userId: string): Promise<{
        success: boolean;
        tasks?: any[];
        error?: string;
    }>;
    getPersistentTaskStatus(taskId: string): Promise<{
        success: boolean;
        status?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=codeForgeOrchestrator.d.ts.map
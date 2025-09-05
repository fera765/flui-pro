import { Intent, Project, ModificationRequest, DownloadRequest, ValidationResult, DynamicTask } from '../types/dynamic';
import { AgentTask, AgentResponse, Tool } from '../types/advanced';
export declare class CodeForgeAgent {
    private eventEmitter;
    private dynamicIntelligence;
    private solutionArchitect;
    private validator;
    private tools;
    private currentProjects;
    private modificationRequests;
    private downloadRequests;
    constructor(availableTools: Tool[]);
    executeProjectCreation(intent: Intent, workingDirectory: string): Promise<{
        success: boolean;
        project?: Project;
        error?: string;
        serverUrl?: string;
        downloadUrl?: string;
    }>;
    handleModificationRequest(project: Project, modification: ModificationRequest): Promise<{
        success: boolean;
        modification?: ModificationRequest;
        error?: string;
    }>;
    handleDownloadRequest(project: Project, downloadRequest: DownloadRequest): Promise<{
        success: boolean;
        downloadRequest?: DownloadRequest;
        error?: string;
    }>;
    handleInteractiveMessage(project: Project, message: string): Promise<{
        success: boolean;
        response: string;
        modificationRequest?: ModificationRequest;
        downloadRequest?: DownloadRequest;
        error?: string;
    }>;
    executeDynamicTask(task: DynamicTask, project?: Project): Promise<AgentResponse>;
    executeTask(task: AgentTask, project?: Project): Promise<AgentResponse>;
    getProjectStatus(project: Project): Promise<{
        status: string;
        progress: number;
        currentTask?: string;
        errors: string[];
        warnings: string[];
    }>;
    validateProject(project: Project): Promise<ValidationResult>;
    private setupEventHandlers;
    private generateModificationTasks;
    private createModificationRequest;
    private createDownloadRequest;
    private createZipDownload;
    private createTarDownload;
    private createGitDownload;
    private generateStatusResponse;
    private executeAgentTask;
    private calculateProgress;
    private getCurrentTask;
}
//# sourceMappingURL=codeForgeAgent.d.ts.map
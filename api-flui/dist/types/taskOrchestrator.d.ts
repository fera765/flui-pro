export interface TaskOrchestratorResult {
    success: boolean;
    taskId?: string;
    reportPath?: string;
    liveUrl?: string;
    error?: string;
    metadata?: {
        executionTime: number;
        filesCreated: number;
        testsPassed: number;
        testsFailed: number;
        buildTime: number;
        serverStartTime: number;
    };
}
export interface TaskExecutionContext {
    taskId: string;
    userId: string;
    projectType: string;
    workingDirectory: string;
    conversationHistory: Message[];
    currentFeatures: string[];
    modifications: ModificationRequest[];
    testStatus: 'pending' | 'running' | 'passed' | 'failed';
    intent: Intent;
    solution?: SolutionArchitecture;
    serverUrl?: string;
    testResults: TestResult[];
    createdAt: Date;
    lastAccessed: Date;
}
export interface TaskExecutionOptions {
    autoStartServer?: boolean;
    autoRunTests?: boolean;
    generateReport?: boolean;
    keepAlive?: boolean;
    maxExecutionTime?: number;
    retryOnFailure?: boolean;
    maxRetries?: number;
    cleanupOnComplete?: boolean;
}
export interface TaskInteractionResult {
    success: boolean;
    response?: string;
    taskId?: string;
    status?: 'active' | 'paused' | 'completed' | 'error';
    error?: string;
    metadata?: {
        interactionType: 'question' | 'modification' | 'status' | 'download';
        processingTime: number;
    };
}
export interface TaskStatusUpdate {
    taskId: string;
    status: 'active' | 'paused' | 'completed' | 'error';
    progress?: number;
    currentStep?: string;
    message?: string;
    timestamp: Date;
}
export interface TaskSummary {
    taskId: string;
    name: string;
    description: string;
    projectType: string;
    status: 'active' | 'paused' | 'completed' | 'error';
    progress: number;
    createdAt: Date;
    lastAccessed: Date;
    serverUrl?: string;
    reportPath?: string;
    executionTime?: number;
    filesCreated?: number;
    testsPassed?: number;
    testsFailed?: number;
}
export interface TaskListResult {
    success: boolean;
    tasks?: TaskSummary[];
    totalCount?: number;
    activeCount?: number;
    completedCount?: number;
    errorCount?: number;
    error?: string;
}
export interface TaskCreationRequest {
    name: string;
    description: string;
    projectType: string;
    userId: string;
    initialPrompt: string;
    options?: TaskExecutionOptions;
}
export interface TaskModificationRequest {
    taskId: string;
    type: 'add_feature' | 'fix_bug' | 'modify_existing' | 'remove_feature';
    description: string;
    priority: 'low' | 'medium' | 'high';
    userId: string;
}
export interface TaskQuestionRequest {
    taskId: string;
    question: string;
    userId: string;
}
export interface TaskDownloadRequest {
    taskId: string;
    userId: string;
    includeNodeModules?: boolean;
    format?: 'zip' | 'tar' | 'folder';
}
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: {
        tokens?: number;
        model?: string;
        processingTime?: number;
    };
}
export interface ModificationRequest {
    id: string;
    projectId: string;
    type: 'add_feature' | 'fix_bug' | 'modify_existing' | 'remove_feature';
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    metadata?: {
        estimatedTime?: number;
        complexity?: 'low' | 'medium' | 'high';
        dependencies?: string[];
    };
}
export interface Intent {
    domain: string;
    technology?: string;
    language?: string;
    framework?: string;
    purpose?: string;
    complexity?: 'simple' | 'medium' | 'advanced';
    features?: string[];
    requirements?: string[];
}
export interface SolutionArchitecture {
    type: string;
    framework: string;
    language: string;
    buildTool: string;
    packageManager: string;
    dependencies: string[];
    devDependencies: string[];
    scripts: Record<string, string>;
    structure: ProjectStructure;
    validations: ValidationStep[];
    estimatedTime: number;
}
export interface ProjectStructure {
    directories: string[];
    files: string[];
    entryPoint: string;
    configFiles: string[];
}
export interface ValidationStep {
    name: string;
    command: string;
    expectedResult: string;
    timeout: number;
}
export interface TestResult {
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    output?: string;
    error?: string;
    timestamp: Date;
}
//# sourceMappingURL=taskOrchestrator.d.ts.map
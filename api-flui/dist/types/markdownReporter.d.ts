export interface MarkdownReport {
    title: string;
    summary: string;
    projectType: string;
    status: 'success' | 'error' | 'warning';
    executionTime: number;
    createdAt: Date;
    sections: ReportSection[];
    links: ReportLink[];
    metadata: ReportMetadata;
}
export interface ReportSection {
    id: string;
    title: string;
    content: string;
    type: 'overview' | 'structure' | 'features' | 'tests' | 'execution' | 'links' | 'next-steps';
    order: number;
    subsections?: ReportSubsection[];
}
export interface ReportSubsection {
    id: string;
    title: string;
    content: string;
    type: 'file-list' | 'command-list' | 'test-results' | 'feature-list' | 'link-list';
    data?: any;
}
export interface ReportLink {
    id: string;
    title: string;
    url: string;
    type: 'live-demo' | 'download' | 'documentation' | 'repository' | 'api-docs';
    description?: string;
    active: boolean;
    expiresAt?: Date;
}
export interface ReportMetadata {
    projectId: string;
    taskId: string;
    userId: string;
    agentExecutions: number;
    toolExecutions: number;
    callbackExecutions: number;
    filesCreated: number;
    filesModified: number;
    testsPassed: number;
    testsFailed: number;
    buildTime: number;
    serverStartTime: number;
    totalExecutionTime: number;
}
export interface ProjectStructure {
    directories: string[];
    files: ProjectFile[];
    entryPoint: string;
    configFiles: string[];
    totalSize: number;
}
export interface ProjectFile {
    name: string;
    path: string;
    size: number;
    type: 'source' | 'config' | 'asset' | 'documentation' | 'test';
    description?: string;
}
export interface TestResults {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    details: TestDetail[];
}
export interface TestDetail {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    output?: string;
}
export interface ExecutionSummary {
    buildStatus: 'success' | 'failed' | 'skipped';
    serverStatus: 'running' | 'stopped' | 'failed';
    testStatus: 'passed' | 'failed' | 'skipped';
    curlStatus: 'success' | 'failed' | 'skipped';
    totalTime: number;
    errors: string[];
    warnings: string[];
}
export interface MarkdownReporterOptions {
    includeIcons?: boolean;
    includeEmojis?: boolean;
    includeTimestamps?: boolean;
    includeMetadata?: boolean;
    includeTestDetails?: boolean;
    includeFileStructure?: boolean;
    includeExecutionSummary?: boolean;
    maxFileListItems?: number;
    maxTestDetails?: number;
    template?: 'default' | 'minimal' | 'detailed' | 'custom';
    customTemplate?: string;
}
export interface ReportGenerationResult {
    success: boolean;
    reportPath?: string;
    reportContent?: string;
    error?: string;
    metadata?: {
        sectionsGenerated: number;
        linksGenerated: number;
        processingTime: number;
    };
}
//# sourceMappingURL=markdownReporter.d.ts.map
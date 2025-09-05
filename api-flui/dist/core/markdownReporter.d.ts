import { ProjectStructure, TestResults, ExecutionSummary, MarkdownReporterOptions, ReportGenerationResult } from '../types/markdownReporter';
export declare class MarkdownReporter {
    private reportsDirectory;
    constructor(reportsDirectory: string);
    generateHTMLProjectReport(title: string, projectStructure: ProjectStructure, testResults: TestResults, executionSummary: ExecutionSummary, liveUrl: string, options?: MarkdownReporterOptions): Promise<ReportGenerationResult>;
    generateNodeJSProjectReport(title: string, projectStructure: ProjectStructure, testResults: TestResults, executionSummary: ExecutionSummary, liveUrl: string, options?: MarkdownReporterOptions): Promise<ReportGenerationResult>;
    generateContentProjectReport(title: string, projectStructure: ProjectStructure, testResults: TestResults, executionSummary: ExecutionSummary, options?: MarkdownReporterOptions): Promise<ReportGenerationResult>;
    generateCustomReport(data: any, options?: MarkdownReporterOptions): Promise<ReportGenerationResult>;
    generateReportFromTemplate(data: any, options?: MarkdownReporterOptions): Promise<ReportGenerationResult>;
    private generateHTMLReportContent;
    private generateNodeJSReportContent;
    private generateContentReportContent;
    private generateCustomReportContent;
    private processTemplate;
    private getStatusEmoji;
    private getStatusText;
    private formatFileSize;
    private countSections;
    private countLinks;
    private ensureDirectoryExists;
    listReports(): Promise<{
        success: boolean;
        reports?: string[];
        error?: string;
    }>;
    getReportContent(reportFileName: string): Promise<{
        success: boolean;
        content?: string;
        error?: string;
    }>;
    deleteReport(reportFileName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=markdownReporter.d.ts.map
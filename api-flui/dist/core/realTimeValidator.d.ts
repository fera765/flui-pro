import { SolutionArchitecture, ValidationResult, ValidationStepResult } from '../types/dynamic';
export declare class RealTimeValidator {
    validateProject(workingDirectory: string, solution: SolutionArchitecture): Promise<ValidationResult>;
    validateHtmlProject(workingDirectory: string): Promise<ValidationStepResult>;
    private validateContentProject;
    validateBuild(workingDirectory: string, buildTool: string, command: string): Promise<ValidationStepResult>;
    validateTests(workingDirectory: string, testTool: string, command: string): Promise<ValidationStepResult>;
    validateServer(workingDirectory: string, port: number, url: string, startCommand?: string): Promise<ValidationStepResult>;
    validateLinting(workingDirectory: string, lintTool: string, command: string): Promise<ValidationStepResult>;
    validateLogs(workingDirectory: string, logFile: string): Promise<ValidationStepResult>;
    private getDefaultPort;
    private getServerUrl;
}
//# sourceMappingURL=realTimeValidator.d.ts.map
import { FluiContext, TodoItem } from '../types/advanced';
export declare class AutoCorrectionSystem {
    private tools;
    private errorPatterns;
    constructor(workingDirectory: string);
    private initializeErrorPatterns;
    analyzeError(error: string, context: FluiContext): Promise<{
        diagnosis: string;
        solution: string;
        shouldRetry: boolean;
        retryDelay?: number;
    }>;
    private diagnoseError;
    private generateSolution;
    private shouldRetryError;
    private calculateRetryDelay;
    executeCorrection(solution: string, context: FluiContext): Promise<boolean>;
    private fixFilePermissions;
    private createMissingResources;
    private validateParameters;
    monitorLogs(context: FluiContext): Promise<void>;
    private extractErrors;
    retryFailedTodo(todo: TodoItem, context: FluiContext): Promise<boolean>;
}
//# sourceMappingURL=autoCorrection.d.ts.map
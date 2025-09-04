import { Task, TaskResult } from '../types';
export interface ReviewResult {
    approved: boolean;
    feedback?: string;
    suggestions?: string[];
    riskLevel: 'low' | 'medium' | 'high';
}
export declare class Supervisor {
    private readonly riskKeywords;
    private readonly contentFilters;
    reviewTask(task: Task): Promise<ReviewResult>;
    approveTask(task: Task): Promise<TaskResult>;
    rejectTask(task: Task): Promise<TaskResult>;
    private assessRisk;
    private checkContent;
    private checkComplexity;
    private generateFeedback;
    private generateSuggestions;
}
//# sourceMappingURL=supervisor.d.ts.map
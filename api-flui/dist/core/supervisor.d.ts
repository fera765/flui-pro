import { Task, TaskResult } from '../types';
export interface ReviewResult {
    approved: boolean;
    feedback?: string;
    suggestions?: string[];
    riskLevel: 'low' | 'medium' | 'high';
}
export declare class Supervisor {
    private pollinationsTool;
    constructor();
    reviewTask(task: Task): Promise<ReviewResult>;
    private createBasicReview;
    private isValidReview;
    approveTask(task: Task): Promise<TaskResult>;
    rejectTask(task: Task): Promise<TaskResult>;
}
//# sourceMappingURL=supervisor.d.ts.map
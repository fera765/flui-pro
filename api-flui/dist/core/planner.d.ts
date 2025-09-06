import { Task } from '../types';
export interface Plan {
    subtasks: Array<{
        id: string;
        type: string;
        prompt: string;
        dependencies: string[];
    }>;
    estimatedDuration: number;
    complexity: 'low' | 'medium' | 'high';
}
export declare class Planner {
    private pollinationsTool;
    constructor();
    createPlan(task: Task): Promise<Plan>;
    private createSimplePlan;
    private isValidPlan;
    validatePlan(plan: Plan): Promise<boolean>;
    private hasCircularDependency;
}
//# sourceMappingURL=planner.d.ts.map
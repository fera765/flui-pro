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
    createPlan(task: Task): Promise<Plan>;
    validatePlan(plan: Plan): Promise<boolean>;
    private createSequentialPlan;
    private createParallelPlan;
    private determineSubtaskType;
    private hasCircularDependency;
}
//# sourceMappingURL=planner.d.ts.map
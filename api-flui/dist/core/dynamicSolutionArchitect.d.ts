import { Intent, SolutionArchitecture, ContextAnalysis, DynamicTask } from '../types/dynamic';
import { DynamicIntelligence } from './dynamicIntelligence';
export declare class DynamicSolutionArchitect {
    private dynamicIntelligence;
    constructor(dynamicIntelligence: DynamicIntelligence);
    designSolution(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture>;
    generateDynamicTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]>;
}
//# sourceMappingURL=dynamicSolutionArchitect.d.ts.map
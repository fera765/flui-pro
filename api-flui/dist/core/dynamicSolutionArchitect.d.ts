import { Intent, SolutionArchitecture, ContextAnalysis, DynamicTask } from '../types/dynamic';
export declare class DynamicSolutionArchitect {
    designSolution(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture>;
    generateDynamicTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]>;
    getBuildTool(intent: Intent): string;
    getPackageManager(intent: Intent): string;
    getDependencies(intent: Intent): string[];
    getDevDependencies(intent: Intent): string[];
    getScripts(intent: Intent): Record<string, string>;
    getProjectStructure(intent: Intent): any;
    getValidations(intent: Intent): any[];
    getEstimatedTime(intent: Intent): number;
    private generateSetupTasks;
    private generateDependencyTasks;
    private generateConfigurationTasks;
    private generateImplementationTasks;
    private generateTestingTasks;
    private generateValidationTasks;
}
//# sourceMappingURL=dynamicSolutionArchitect.d.ts.map
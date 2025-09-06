import { ProcessingResult, Intent, Question, ContextAnalysis } from '../types/dynamic';
export declare class DynamicIntelligence {
    private contextAnalyzer;
    private questionGenerator;
    private solutionArchitect;
    constructor();
    processUserInput(input: string, workingDir?: string): Promise<ProcessingResult>;
    generateQuestions(intent: Intent): Promise<Question[]>;
    analyzeContext(workingDir: string): Promise<ContextAnalysis>;
    private isIntentComplete;
    private extractIntentWithLLM;
    private generateQuestionsWithLLM;
    private calculateConfidence;
}
//# sourceMappingURL=dynamicIntelligence.d.ts.map
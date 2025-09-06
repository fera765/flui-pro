import { KnowledgeManager } from './knowledgeManager';
export interface ClassificationResult {
    type: 'conversation' | 'task';
    subtype?: string;
    confidence: number;
    parameters: Record<string, any>;
}
export declare class Classifier {
    private pollinationsTool;
    private knowledgeManager;
    constructor(knowledgeManager: KnowledgeManager);
    classifyTask(prompt: string): Promise<ClassificationResult>;
    private isValidClassification;
    private getFallbackClassification;
}
//# sourceMappingURL=classifier.d.ts.map
import { Intent, Question, ConversationContext } from '../types/dynamic';
export declare class AdaptiveQuestionSystem {
    generateClarifyingQuestions(intent: Intent): Promise<Question[]>;
    processUserAnswers(intent: Intent, answers: Record<string, any>): Promise<Intent>;
    generateFollowUpQuestions(context: ConversationContext): Promise<Question[]>;
    suggestTechnologies(domain: string): Promise<string[]>;
    validateAnswers(questions: Question[], answers: Record<string, any>): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    private generateTechnologyQuestion;
    private generateLanguageQuestion;
    private generatePurposeQuestion;
    private generateComplexityQuestion;
    private generateFeaturesQuestion;
    private getTechnologyOptions;
    private getLanguageOptions;
    private getFeatureOptions;
    private normalizeTechnology;
    private normalizeLanguage;
    private normalizePurpose;
    private normalizeComplexity;
}
//# sourceMappingURL=adaptiveQuestionSystem.d.ts.map
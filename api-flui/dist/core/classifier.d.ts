export interface ClassificationResult {
    type: 'conversation' | 'task';
    subtype?: string;
    confidence: number;
    parameters: Record<string, any>;
}
export declare class Classifier {
    private readonly imageKeywords;
    private readonly textKeywords;
    private readonly audioKeywords;
    private readonly conversationKeywords;
    private readonly sizePattern;
    private readonly modelPattern;
    private readonly voicePattern;
    private readonly temperaturePattern;
    private readonly wordCountPattern;
    classifyTask(prompt: string): ClassificationResult;
    private isConversation;
    private isCompositeTask;
    private isImageGeneration;
    private isTextGeneration;
    private isAudioTask;
    private extractImageParameters;
    private extractTextParameters;
    private extractAudioParameters;
    private extractCompositeParameters;
}
//# sourceMappingURL=classifier.d.ts.map
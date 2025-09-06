import { MemoryRecall, SRIResult } from '../../types/emotionMemory';
export interface ContextMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export declare class ContextInjector {
    injectMemories(originalContext: string, memories: MemoryRecall[], relevanceThreshold?: number): SRIResult;
    stripContext(messages: ContextMessage[], contextWindow?: number): ContextMessage[];
    calculateTokenReduction(originalTokens: number, optimizedTokens: number): number;
    formatContext(messages: ContextMessage[], memories: string[]): string;
    private parseContextToMessages;
    estimateTokens(text: string): number;
    createInjectionSummary(memories: MemoryRecall[]): string;
    validateMemoryFormat(memory: string): boolean;
    extractMemoryComponents(memory: string): {
        context: string;
        outcome: string;
        description: string;
    } | null;
}
//# sourceMappingURL=contextInjector.d.ts.map
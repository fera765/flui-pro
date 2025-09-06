import { EpisodicMemory, EmotionVector, PolicyDelta, MemoryRecall, EmotionMemoryConfig } from '../../types/emotionMemory';
export declare class EpisodicStore {
    private memories;
    private config;
    constructor(config: EmotionMemoryConfig);
    storeMemory(emotionHash: string, emotionVector: EmotionVector, outcomeFlag: 'success' | 'failure' | 'partial', policyDelta: PolicyDelta, context: string, taskId: string, agentId?: string, domain?: string, complexity?: 'simple' | 'medium' | 'complex'): Promise<EpisodicMemory | null>;
    recallMemories(context: string, threshold?: number): Promise<MemoryRecall[]>;
    getMemoryByHash(emotionHash: string): Promise<EpisodicMemory | null>;
    getTotalMemories(): Promise<number>;
    private calculateEmotionIntensity;
    private calculateRelevance;
    private compressMemory;
    private cleanup;
    private applyMemoryDecay;
    private extractDomain;
    updateMemoryEffectiveness(emotionHash: string, wasHelpful: boolean): void;
    getMemoriesByDomain(domain: string): Promise<EpisodicMemory[]>;
    getMemoriesByAgent(agentId: string): Promise<EpisodicMemory[]>;
    getMostEffectiveMemories(limit?: number): Promise<EpisodicMemory[]>;
}
//# sourceMappingURL=episodicStore.d.ts.map
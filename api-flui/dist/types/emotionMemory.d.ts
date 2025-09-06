export interface EmotionVector {
    valence: number;
    arousal: number;
    dominance: number;
    confidence: number;
    surprise: number;
    fear: number;
    joy: number;
    anger: number;
    sadness: number;
    disgust: number;
    timestamp: Date;
}
export interface PolicyDelta {
    action: string;
    context: string;
    impact: number;
    description: string;
    category: 'safety' | 'quality' | 'efficiency' | 'user_experience' | 'compliance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    triggers: string[];
}
export interface EpisodicMemory {
    id: string;
    emotionHash: string;
    emotionVector: EmotionVector;
    outcomeFlag: 'success' | 'failure' | 'partial';
    policyDelta: PolicyDelta;
    context: string;
    taskId: string;
    agentId?: string | undefined;
    domain: string;
    complexity: 'simple' | 'medium' | 'complex';
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    effectiveness: number;
}
export interface MemoryRecall {
    emotionHash: string;
    policyDelta: PolicyDelta;
    relevance: number;
    memory: string;
}
export interface SRIResult {
    originalTokens: number;
    optimizedTokens: number;
    reductionPercentage: number;
    injectedMemories: MemoryRecall[];
    context: string;
}
export interface EmotionMemoryConfig {
    emotionThreshold: number;
    maxMemories: number;
    memoryDecay: number;
    contextWindow: number;
    hashLength: number;
}
//# sourceMappingURL=emotionMemory.d.ts.map
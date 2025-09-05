import { EpisodicStore } from './episodicStore';
import { EmotionHash } from './emotionHash';
import { ContextInjector, ContextMessage } from './contextInjector';
import { EmotionMemoryConfig, EmotionVector, SRIResult } from '../../types/emotionMemory';
export interface TaskResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata: Record<string, any>;
}
export interface MemoryStats {
    totalMemories: number;
    config: EmotionMemoryConfig;
    averageRelevance: number;
    topContexts: string[];
}
export declare class SRIProtocol {
    private episodicStore;
    private emotionHash;
    private contextInjector;
    private config;
    private metricsCollector;
    constructor(episodicStore: EpisodicStore, emotionHash: EmotionHash, contextInjector: ContextInjector, config: EmotionMemoryConfig);
    optimizeContext(fullContext: ContextMessage[], taskId: string, relevanceThreshold?: number): Promise<SRIResult>;
    optimizeContextForAgent(agentId: string, fullContext: ContextMessage[], taskId: string, relevanceThreshold?: number): Promise<SRIResult>;
    storeExperience(taskId: string, taskContext: string, taskResult: TaskResult): Promise<EmotionVector | null>;
    calculateEmotionFromResult(taskResult: TaskResult): EmotionVector;
    private generatePolicyDelta;
    private extractContextKeywords;
    private calculateEmotionIntensity;
    private contextToString;
    getMemoryStats(): Promise<MemoryStats>;
    clearMemories(): Promise<void>;
    exportMemories(): Promise<any[]>;
    importMemories(memories: any[]): Promise<void>;
    getPerformanceMetrics(): any;
    getAlerts(): any[];
    getAgentMetrics(agentId: string): any[];
    clearMetrics(): void;
}
//# sourceMappingURL=sriProtocol.d.ts.map
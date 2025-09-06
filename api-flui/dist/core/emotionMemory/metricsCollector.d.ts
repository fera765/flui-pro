import { SRIResult } from '../../types/emotionMemory';
export interface TokenMetrics {
    timestamp: Date;
    originalTokens: number;
    optimizedTokens: number;
    reductionPercentage: number;
    injectedMemories: number;
    taskId: string;
    agentId?: string | undefined;
    contextType: 'simple' | 'complex';
}
export interface PerformanceMetrics {
    totalRequests: number;
    averageReduction: number;
    totalTokensSaved: number;
    averageInjectedMemories: number;
    topPerformingAgents: Array<{
        agentId: string;
        averageReduction: number;
    }>;
    hourlyStats: Array<{
        hour: string;
        requests: number;
        averageReduction: number;
    }>;
}
export declare class MetricsCollector {
    private metrics;
    private readonly maxMetrics;
    recordMetrics(sriResult: SRIResult, taskId: string, agentId?: string, contextType?: 'simple' | 'complex'): void;
    getPerformanceMetrics(): PerformanceMetrics;
    getMetricsForRange(startDate: Date, endDate: Date): TokenMetrics[];
    getAgentMetrics(agentId: string): TokenMetrics[];
    clearMetrics(): void;
    exportMetrics(): string;
    getAlerts(): Array<{
        type: string;
        message: string;
        severity: 'low' | 'medium' | 'high';
    }>;
}
//# sourceMappingURL=metricsCollector.d.ts.map
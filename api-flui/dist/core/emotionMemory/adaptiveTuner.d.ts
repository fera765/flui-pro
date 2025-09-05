import { EmotionMemoryConfig } from '../../types/emotionMemory';
import { MetricsCollector } from './metricsCollector';
export interface TuningRecommendation {
    parameter: string;
    currentValue: number;
    recommendedValue: number;
    reason: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
}
export interface TuningHistory {
    timestamp: Date;
    parameter: string;
    oldValue: number;
    newValue: number;
    reason: string;
    performanceBefore: number;
    performanceAfter: number;
}
export declare class AdaptiveTuner {
    private config;
    private tuningHistory;
    private readonly maxHistory;
    constructor(config: EmotionMemoryConfig);
    analyzeAndRecommend(metricsCollector: MetricsCollector): TuningRecommendation[];
    applyRecommendations(recommendations: TuningRecommendation[]): EmotionMemoryConfig;
    private analyzeEmotionThreshold;
    private analyzeContextWindow;
    private analyzeMemoryDecay;
    recordTuning(parameter: string, oldValue: number, newValue: number, reason: string, performanceBefore: number, performanceAfter: number): void;
    getTuningHistory(): TuningHistory[];
    getTuningEffectiveness(): {
        parameter: string;
        effectiveness: number;
        trend: 'improving' | 'declining' | 'stable';
    }[];
    autoTune(metricsCollector: MetricsCollector): EmotionMemoryConfig;
}
//# sourceMappingURL=adaptiveTuner.d.ts.map
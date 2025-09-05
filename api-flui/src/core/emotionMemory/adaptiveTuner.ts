import { EmotionMemoryConfig } from '../../types/emotionMemory';
import { MetricsCollector, TokenMetrics } from './metricsCollector';

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

export class AdaptiveTuner {
  private tuningHistory: TuningHistory[] = [];
  private readonly maxHistory = 100;

  constructor(private config: EmotionMemoryConfig) {}

  /**
   * Analyze current performance and recommend tuning adjustments
   */
  analyzeAndRecommend(metricsCollector: MetricsCollector): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];
    const performanceMetrics = metricsCollector.getPerformanceMetrics();
    const recentMetrics = metricsCollector.getMetricsForRange(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );

    if (recentMetrics.length < 10) {
      return recommendations; // Not enough data
    }

    // Analyze emotion threshold
    const emotionThresholdRecommendation = this.analyzeEmotionThreshold(
      recentMetrics, 
      performanceMetrics
    );
    if (emotionThresholdRecommendation) {
      recommendations.push(emotionThresholdRecommendation);
    }

    // Analyze context window
    const contextWindowRecommendation = this.analyzeContextWindow(
      recentMetrics, 
      performanceMetrics
    );
    if (contextWindowRecommendation) {
      recommendations.push(contextWindowRecommendation);
    }

    // Analyze memory decay
    const memoryDecayRecommendation = this.analyzeMemoryDecay(
      recentMetrics, 
      performanceMetrics
    );
    if (memoryDecayRecommendation) {
      recommendations.push(memoryDecayRecommendation);
    }

    return recommendations;
  }

  /**
   * Apply tuning recommendations
   */
  applyRecommendations(recommendations: TuningRecommendation[]): EmotionMemoryConfig {
    const newConfig = { ...this.config };
    
    for (const rec of recommendations) {
      if (rec.confidence > 0.7) { // Only apply high-confidence recommendations
        switch (rec.parameter) {
          case 'emotionThreshold':
            newConfig.emotionThreshold = rec.recommendedValue;
            break;
          case 'contextWindow':
            newConfig.contextWindow = Math.round(rec.recommendedValue);
            break;
          case 'memoryDecay':
            newConfig.memoryDecay = rec.recommendedValue;
            break;
        }
      }
    }

    return newConfig;
  }

  /**
   * Analyze emotion threshold performance
   */
  private analyzeEmotionThreshold(
    recentMetrics: TokenMetrics[], 
    performanceMetrics: any
  ): TuningRecommendation | null {
    const avgReduction = performanceMetrics.averageReduction;
    const avgMemories = performanceMetrics.averageInjectedMemories;
    const currentThreshold = this.config.emotionThreshold;

    // If reduction is low and no memories are being injected, lower threshold
    if (avgReduction < 30 && avgMemories < 0.5) {
      const recommendedThreshold = Math.max(0.3, currentThreshold - 0.1);
      return {
        parameter: 'emotionThreshold',
        currentValue: currentThreshold,
        recommendedValue: recommendedThreshold,
        reason: `Low token reduction (${avgReduction.toFixed(1)}%) and no memories injected. Lowering threshold to increase memory storage.`,
        confidence: 0.8,
        impact: 'high'
      };
    }

    // If too many memories are being injected, raise threshold
    if (avgMemories > 5 && avgReduction < 20) {
      const recommendedThreshold = Math.min(0.9, currentThreshold + 0.1);
      return {
        parameter: 'emotionThreshold',
        currentValue: currentThreshold,
        recommendedValue: recommendedThreshold,
        reason: `Too many memories injected (${avgMemories.toFixed(1)}) with low reduction. Raising threshold to reduce noise.`,
        confidence: 0.7,
        impact: 'medium'
      };
    }

    return null;
  }

  /**
   * Analyze context window performance
   */
  private analyzeContextWindow(
    recentMetrics: TokenMetrics[], 
    performanceMetrics: any
  ): TuningRecommendation | null {
    const avgReduction = performanceMetrics.averageReduction;
    const currentWindow = this.config.contextWindow;

    // If reduction is very high, we might be losing important context
    if (avgReduction > 90) {
      const recommendedWindow = Math.min(5, currentWindow + 1);
      return {
        parameter: 'contextWindow',
        currentValue: currentWindow,
        recommendedValue: recommendedWindow,
        reason: `Very high token reduction (${avgReduction.toFixed(1)}%) might indicate loss of important context.`,
        confidence: 0.6,
        impact: 'medium'
      };
    }

    // If reduction is low, we might need to be more aggressive
    if (avgReduction < 20) {
      const recommendedWindow = Math.max(1, currentWindow - 1);
      return {
        parameter: 'contextWindow',
        currentValue: currentWindow,
        recommendedValue: recommendedWindow,
        reason: `Low token reduction (${avgReduction.toFixed(1)}%). Reducing context window for more aggressive optimization.`,
        confidence: 0.7,
        impact: 'high'
      };
    }

    return null;
  }

  /**
   * Analyze memory decay performance
   */
  private analyzeMemoryDecay(
    recentMetrics: TokenMetrics[], 
    performanceMetrics: any
  ): TuningRecommendation | null {
    const avgMemories = performanceMetrics.averageInjectedMemories;
    const currentDecay = this.config.memoryDecay;

    // If we have too many memories, increase decay
    if (avgMemories > 3) {
      const recommendedDecay = Math.min(0.99, currentDecay + 0.02);
      return {
        parameter: 'memoryDecay',
        currentValue: currentDecay,
        recommendedValue: recommendedDecay,
        reason: `High memory injection (${avgMemories.toFixed(1)}). Increasing decay to reduce memory accumulation.`,
        confidence: 0.6,
        impact: 'low'
      };
    }

    // If we have very few memories, decrease decay
    if (avgMemories < 0.5) {
      const recommendedDecay = Math.max(0.8, currentDecay - 0.02);
      return {
        parameter: 'memoryDecay',
        currentValue: currentDecay,
        recommendedValue: recommendedDecay,
        reason: `Low memory injection (${avgMemories.toFixed(1)}). Decreasing decay to retain memories longer.`,
        confidence: 0.7,
        impact: 'medium'
      };
    }

    return null;
  }

  /**
   * Record tuning action
   */
  recordTuning(
    parameter: string,
    oldValue: number,
    newValue: number,
    reason: string,
    performanceBefore: number,
    performanceAfter: number
  ): void {
    const tuning: TuningHistory = {
      timestamp: new Date(),
      parameter,
      oldValue,
      newValue,
      reason,
      performanceBefore,
      performanceAfter
    };

    this.tuningHistory.push(tuning);
    
    // Keep only recent history
    if (this.tuningHistory.length > this.maxHistory) {
      this.tuningHistory = this.tuningHistory.slice(-this.maxHistory);
    }
  }

  /**
   * Get tuning history
   */
  getTuningHistory(): TuningHistory[] {
    return [...this.tuningHistory];
  }

  /**
   * Get tuning effectiveness
   */
  getTuningEffectiveness(): { parameter: string; effectiveness: number; trend: 'improving' | 'declining' | 'stable' }[] {
    const effectiveness: { parameter: string; effectiveness: number; trend: 'improving' | 'declining' | 'stable' }[] = [];
    const parameters = ['emotionThreshold', 'contextWindow', 'memoryDecay'];

    for (const param of parameters) {
      const paramHistory = this.tuningHistory.filter(t => t.parameter === param);
      if (paramHistory.length < 2) continue;

      const recent = paramHistory.slice(-5); // Last 5 tunings
      const older = paramHistory.slice(-10, -5); // Previous 5 tunings

      if (recent.length === 0 || older.length === 0) continue;

      const recentAvg = recent.reduce((sum, t) => sum + t.performanceAfter, 0) / recent.length;
      const olderAvg = older.reduce((sum, t) => sum + t.performanceAfter, 0) / older.length;

      const effectivenessScore = recentAvg - olderAvg;
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (effectivenessScore > 5) trend = 'improving';
      else if (effectivenessScore < -5) trend = 'declining';

      effectiveness.push({
        parameter: param,
        effectiveness: effectivenessScore,
        trend
      });
    }

    return effectiveness;
  }

  /**
   * Auto-tune based on performance
   */
  autoTune(metricsCollector: MetricsCollector): EmotionMemoryConfig {
    const recommendations = this.analyzeAndRecommend(metricsCollector);
    const highConfidenceRecs = recommendations.filter(r => r.confidence > 0.7);
    
    if (highConfidenceRecs.length === 0) {
      return this.config;
    }

    const oldConfig = { ...this.config };
    const newConfig = this.applyRecommendations(highConfidenceRecs);

    // Record the tuning
    for (const rec of highConfidenceRecs) {
      this.recordTuning(
        rec.parameter,
        rec.currentValue,
        rec.recommendedValue,
        rec.reason,
        0, // We don't have before/after performance here
        0
      );
    }

    return newConfig;
  }
}
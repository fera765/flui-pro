"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveTuner = void 0;
class AdaptiveTuner {
    constructor(config) {
        this.config = config;
        this.tuningHistory = [];
        this.maxHistory = 100;
    }
    analyzeAndRecommend(metricsCollector) {
        const recommendations = [];
        const performanceMetrics = metricsCollector.getPerformanceMetrics();
        const recentMetrics = metricsCollector.getMetricsForRange(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());
        if (recentMetrics.length < 10) {
            return recommendations;
        }
        const emotionThresholdRecommendation = this.analyzeEmotionThreshold(recentMetrics, performanceMetrics);
        if (emotionThresholdRecommendation) {
            recommendations.push(emotionThresholdRecommendation);
        }
        const contextWindowRecommendation = this.analyzeContextWindow(recentMetrics, performanceMetrics);
        if (contextWindowRecommendation) {
            recommendations.push(contextWindowRecommendation);
        }
        const memoryDecayRecommendation = this.analyzeMemoryDecay(recentMetrics, performanceMetrics);
        if (memoryDecayRecommendation) {
            recommendations.push(memoryDecayRecommendation);
        }
        return recommendations;
    }
    applyRecommendations(recommendations) {
        const newConfig = { ...this.config };
        for (const rec of recommendations) {
            if (rec.confidence > 0.7) {
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
    analyzeEmotionThreshold(recentMetrics, performanceMetrics) {
        const avgReduction = performanceMetrics.averageReduction;
        const avgMemories = performanceMetrics.averageInjectedMemories;
        const currentThreshold = this.config.emotionThreshold;
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
    analyzeContextWindow(recentMetrics, performanceMetrics) {
        const avgReduction = performanceMetrics.averageReduction;
        const currentWindow = this.config.contextWindow;
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
    analyzeMemoryDecay(recentMetrics, performanceMetrics) {
        const avgMemories = performanceMetrics.averageInjectedMemories;
        const currentDecay = this.config.memoryDecay;
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
    recordTuning(parameter, oldValue, newValue, reason, performanceBefore, performanceAfter) {
        const tuning = {
            timestamp: new Date(),
            parameter,
            oldValue,
            newValue,
            reason,
            performanceBefore,
            performanceAfter
        };
        this.tuningHistory.push(tuning);
        if (this.tuningHistory.length > this.maxHistory) {
            this.tuningHistory = this.tuningHistory.slice(-this.maxHistory);
        }
    }
    getTuningHistory() {
        return [...this.tuningHistory];
    }
    getTuningEffectiveness() {
        const effectiveness = [];
        const parameters = ['emotionThreshold', 'contextWindow', 'memoryDecay'];
        for (const param of parameters) {
            const paramHistory = this.tuningHistory.filter(t => t.parameter === param);
            if (paramHistory.length < 2)
                continue;
            const recent = paramHistory.slice(-5);
            const older = paramHistory.slice(-10, -5);
            if (recent.length === 0 || older.length === 0)
                continue;
            const recentAvg = recent.reduce((sum, t) => sum + t.performanceAfter, 0) / recent.length;
            const olderAvg = older.reduce((sum, t) => sum + t.performanceAfter, 0) / older.length;
            const effectivenessScore = recentAvg - olderAvg;
            let trend = 'stable';
            if (effectivenessScore > 5)
                trend = 'improving';
            else if (effectivenessScore < -5)
                trend = 'declining';
            effectiveness.push({
                parameter: param,
                effectiveness: effectivenessScore,
                trend
            });
        }
        return effectiveness;
    }
    autoTune(metricsCollector) {
        const recommendations = this.analyzeAndRecommend(metricsCollector);
        const highConfidenceRecs = recommendations.filter(r => r.confidence > 0.7);
        if (highConfidenceRecs.length === 0) {
            return this.config;
        }
        const oldConfig = { ...this.config };
        const newConfig = this.applyRecommendations(highConfidenceRecs);
        for (const rec of highConfidenceRecs) {
            this.recordTuning(rec.parameter, rec.currentValue, rec.recommendedValue, rec.reason, 0, 0);
        }
        return newConfig;
    }
}
exports.AdaptiveTuner = AdaptiveTuner;
//# sourceMappingURL=adaptiveTuner.js.map
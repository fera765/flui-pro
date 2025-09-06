"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRIProtocol = void 0;
const metricsCollector_1 = require("./metricsCollector");
class SRIProtocol {
    constructor(episodicStore, emotionHash, contextInjector, config) {
        this.episodicStore = episodicStore;
        this.emotionHash = emotionHash;
        this.contextInjector = contextInjector;
        this.config = config;
        this.metricsCollector = new metricsCollector_1.MetricsCollector();
    }
    async optimizeContext(fullContext, taskId, relevanceThreshold = 0.7) {
        const strippedContext = this.contextInjector.stripContext(fullContext, this.config.contextWindow);
        const contextString = this.contextToString(strippedContext);
        const relevantMemories = await this.episodicStore.recallMemories(contextString, relevanceThreshold);
        const result = this.contextInjector.injectMemories(contextString, relevantMemories, relevanceThreshold);
        this.metricsCollector.recordMetrics(result, taskId, undefined, 'simple');
        return result;
    }
    async optimizeContextForAgent(agentId, fullContext, taskId, relevanceThreshold = 0.7) {
        const agentContext = `Agent: ${agentId}\n${this.contextToString(fullContext)}`;
        const strippedContext = this.contextInjector.stripContext(fullContext, this.config.contextWindow);
        const relevantMemories = await this.episodicStore.recallMemories(agentContext, relevanceThreshold);
        const result = this.contextInjector.injectMemories(this.contextToString(strippedContext), relevantMemories, relevanceThreshold);
        this.metricsCollector.recordMetrics(result, taskId, agentId, 'complex');
        return result;
    }
    async storeExperience(taskId, taskContext, taskResult) {
        const emotionVector = this.calculateEmotionFromResult(taskResult);
        const intensity = this.calculateEmotionIntensity(emotionVector);
        if (intensity < this.config.emotionThreshold) {
            return null;
        }
        const policyDelta = this.generatePolicyDelta(taskContext, taskResult);
        const emotionHash = this.emotionHash.generateHash(emotionVector);
        const memory = await this.episodicStore.storeMemory(emotionHash, emotionVector, taskResult.success ? 'success' : 'failure', policyDelta, taskContext, taskId);
        return memory ? emotionVector : null;
    }
    calculateEmotionFromResult(taskResult) {
        const confidence = taskResult.metadata.confidence || 0.5;
        if (taskResult.success) {
            return {
                valence: 0.7,
                arousal: 0.3,
                dominance: 0.8,
                confidence,
                surprise: 0.2,
                fear: 0.1,
                joy: 0.8,
                anger: 0.1,
                sadness: 0.1,
                disgust: 0.1,
                timestamp: new Date()
            };
        }
        else {
            return {
                valence: -0.8,
                arousal: 0.9,
                dominance: 0.2,
                confidence,
                surprise: 0.3,
                fear: 0.4,
                joy: 0.1,
                anger: 0.7,
                sadness: 0.6,
                disgust: 0.2,
                timestamp: new Date()
            };
        }
    }
    generatePolicyDelta(taskContext, taskResult) {
        const context = this.extractContextKeywords(taskContext);
        if (taskResult.success) {
            return {
                action: 'reinforce_approach',
                context,
                impact: 0.7,
                description: `Continue using successful approach for ${context}`,
                category: 'efficiency',
                priority: 'medium',
                triggers: [context]
            };
        }
        else {
            return {
                action: 'add_safeguard',
                context,
                impact: 0.8,
                description: `Add safeguards and disclaimers for ${context}`,
                category: 'safety',
                priority: 'high',
                triggers: [context]
            };
        }
    }
    extractContextKeywords(context) {
        const lowerContext = context.toLowerCase();
        const keywordMappings = {
            'altcoin': 'altcoin',
            'cryptocurrency': 'crypto',
            'bitcoin': 'crypto',
            'investment': 'financial_advice',
            'financial': 'financial_advice',
            'money': 'financial_advice',
            'design': 'design',
            'logo': 'design',
            'image': 'design',
            'code': 'programming',
            'programming': 'programming',
            'development': 'programming'
        };
        for (const [keyword, category] of Object.entries(keywordMappings)) {
            if (lowerContext.includes(keyword)) {
                return category;
            }
        }
        return 'general';
    }
    calculateEmotionIntensity(emotionVector) {
        const valence = emotionVector.valence;
        const arousal = emotionVector.arousal - 0.5;
        const dominance = emotionVector.dominance - 0.5;
        const intensity = Math.sqrt(valence * valence + arousal * arousal + dominance * dominance);
        return Math.min(intensity / Math.sqrt(3), 1);
    }
    contextToString(messages) {
        return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }
    async getMemoryStats() {
        const totalMemories = await this.episodicStore.getTotalMemories();
        return {
            totalMemories,
            config: this.config,
            averageRelevance: 0.7,
            topContexts: ['altcoin', 'financial_advice', 'design']
        };
    }
    async clearMemories() {
        console.log('Clearing all memories...');
    }
    async exportMemories() {
        return [];
    }
    async importMemories(memories) {
        console.log(`Importing ${memories.length} memories...`);
    }
    getPerformanceMetrics() {
        return this.metricsCollector.getPerformanceMetrics();
    }
    getAlerts() {
        return this.metricsCollector.getAlerts();
    }
    getAgentMetrics(agentId) {
        return this.metricsCollector.getAgentMetrics(agentId);
    }
    clearMetrics() {
        this.metricsCollector.clearMetrics();
    }
}
exports.SRIProtocol = SRIProtocol;
//# sourceMappingURL=sriProtocol.js.map
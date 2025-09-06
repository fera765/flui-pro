"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodicStore = void 0;
const uuid_1 = require("uuid");
class EpisodicStore {
    constructor(config) {
        this.memories = new Map();
        this.config = config;
    }
    async storeMemory(emotionHash, emotionVector, outcomeFlag, policyDelta, context, taskId, agentId, domain, complexity = 'medium') {
        const emotionIntensity = this.calculateEmotionIntensity(emotionVector);
        if (emotionIntensity < this.config.emotionThreshold) {
            return null;
        }
        const memory = {
            id: (0, uuid_1.v4)(),
            emotionHash,
            emotionVector,
            outcomeFlag,
            policyDelta,
            context,
            taskId,
            agentId: agentId || undefined,
            domain: domain || this.extractDomain(context),
            complexity,
            createdAt: new Date(),
            lastAccessed: new Date(),
            accessCount: 0,
            effectiveness: 0.5
        };
        this.memories.set(emotionHash, memory);
        await this.cleanup();
        return memory;
    }
    async recallMemories(context, threshold = 0.7) {
        const relevantMemories = [];
        for (const memory of this.memories.values()) {
            const relevance = this.calculateRelevance(memory, context);
            if (relevance >= threshold) {
                memory.lastAccessed = new Date();
                memory.accessCount++;
                relevantMemories.push({
                    emotionHash: memory.emotionHash,
                    policyDelta: memory.policyDelta,
                    relevance,
                    memory: this.compressMemory(memory)
                });
            }
        }
        return relevantMemories.sort((a, b) => b.relevance - a.relevance);
    }
    async getMemoryByHash(emotionHash) {
        const memory = this.memories.get(emotionHash);
        if (memory) {
            memory.lastAccessed = new Date();
            memory.accessCount++;
        }
        return memory || null;
    }
    async getTotalMemories() {
        return this.memories.size;
    }
    calculateEmotionIntensity(emotionVector) {
        const valence = emotionVector.valence;
        const arousal = emotionVector.arousal - 0.5;
        const dominance = emotionVector.dominance - 0.5;
        const surprise = emotionVector.surprise || 0;
        const fear = emotionVector.fear || 0;
        const joy = emotionVector.joy || 0;
        const anger = emotionVector.anger || 0;
        const sadness = emotionVector.sadness || 0;
        const disgust = emotionVector.disgust || 0;
        const basicIntensity = Math.sqrt(valence * valence + arousal * arousal + dominance * dominance);
        const emotionIntensity = Math.sqrt(surprise * surprise + fear * fear + joy * joy + anger * anger + sadness * sadness + disgust * disgust);
        const totalIntensity = Math.sqrt(basicIntensity * basicIntensity + emotionIntensity * emotionIntensity);
        return Math.min(totalIntensity / Math.sqrt(6), 1);
    }
    calculateRelevance(memory, context) {
        const contextWords = context.toLowerCase().split(/\s+/);
        const memoryWords = memory.context.toLowerCase().split(/\s+/);
        let matches = 0;
        for (const word of contextWords) {
            if (memoryWords.includes(word)) {
                matches++;
            }
        }
        const policyWords = memory.policyDelta.context.toLowerCase().split(/\s+/);
        for (const word of contextWords) {
            if (policyWords.includes(word)) {
                matches += 2;
            }
        }
        const totalWords = Math.max(contextWords.length, memoryWords.length);
        return Math.min(matches / totalWords, 1);
    }
    compressMemory(memory) {
        const outcome = memory.outcomeFlag === 'failure' ? 'failed' :
            memory.outcomeFlag === 'success' ? 'succeeded' : 'partial';
        return `#mem: ${memory.policyDelta.context}-${outcome} → ${memory.policyDelta.description}`;
    }
    async cleanup() {
        if (this.memories.size <= this.config.maxMemories) {
            return;
        }
        const memoryArray = Array.from(this.memories.values())
            .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        const toRemove = memoryArray.slice(0, this.memories.size - this.config.maxMemories);
        for (const memory of toRemove) {
            this.memories.delete(memory.emotionHash);
        }
    }
    applyMemoryDecay(memory) {
        const daysSinceAccess = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
        return Math.pow(this.config.memoryDecay, daysSinceAccess);
    }
    extractDomain(context) {
        const lowerContext = context.toLowerCase();
        const domainMappings = {
            'financial': 'finance',
            'investment': 'finance',
            'cryptocurrency': 'finance',
            'bitcoin': 'finance',
            'altcoin': 'finance',
            'money': 'finance',
            'design': 'design',
            'logo': 'design',
            'image': 'design',
            'graphic': 'design',
            'code': 'programming',
            'programming': 'programming',
            'development': 'programming',
            'software': 'programming',
            'analysis': 'research',
            'research': 'research',
            'data': 'research',
            'report': 'research'
        };
        for (const [keyword, domain] of Object.entries(domainMappings)) {
            if (lowerContext.includes(keyword)) {
                return domain;
            }
        }
        return 'general';
    }
    updateMemoryEffectiveness(emotionHash, wasHelpful) {
        const memory = this.memories.get(emotionHash);
        if (!memory)
            return;
        const adjustment = wasHelpful ? 0.1 : -0.05;
        memory.effectiveness = Math.max(0, Math.min(1, memory.effectiveness + adjustment));
        memory.accessCount++;
        memory.lastAccessed = new Date();
    }
    async getMemoriesByDomain(domain) {
        return Array.from(this.memories.values()).filter(m => m.domain === domain);
    }
    async getMemoriesByAgent(agentId) {
        return Array.from(this.memories.values()).filter(m => m.agentId === agentId);
    }
    async getMostEffectiveMemories(limit = 10) {
        return Array.from(this.memories.values())
            .sort((a, b) => b.effectiveness - a.effectiveness)
            .slice(0, limit);
    }
}
exports.EpisodicStore = EpisodicStore;
//# sourceMappingURL=episodicStore.js.map
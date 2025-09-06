"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeManager = void 0;
const uuid_1 = require("uuid");
class KnowledgeManager {
    constructor() {
        this.knowledgeSources = new Map();
        this.activeContext = null;
        this.loadDefaultKnowledge();
    }
    loadDefaultKnowledge() {
        console.log('🧠 Knowledge Manager: 100% Dynamic - No static knowledge loaded');
    }
    createKnowledgeSource(request) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const knowledgeSource = {
            id,
            title: request.title,
            content: request.content,
            category: request.category || 'general',
            tags: request.tags || [],
            priority: request.priority || 5,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        this.knowledgeSources.set(id, knowledgeSource);
        this.updateContext();
        return knowledgeSource;
    }
    getKnowledgeSource(id) {
        return this.knowledgeSources.get(id) || null;
    }
    getAllKnowledgeSources() {
        return Array.from(this.knowledgeSources.values())
            .sort((a, b) => b.priority - a.priority);
    }
    getActiveKnowledgeSources() {
        return this.getAllKnowledgeSources()
            .filter(source => source.isActive);
    }
    updateKnowledgeSource(id, request) {
        const existing = this.knowledgeSources.get(id);
        if (!existing) {
            return null;
        }
        const updated = {
            ...existing,
            ...request,
            updatedAt: new Date()
        };
        this.knowledgeSources.set(id, updated);
        this.updateContext();
        return updated;
    }
    deleteKnowledgeSource(id) {
        const deleted = this.knowledgeSources.delete(id);
        if (deleted) {
            this.updateContext();
        }
        return deleted;
    }
    getKnowledgeContext() {
        if (!this.activeContext) {
            this.updateContext();
        }
        return this.activeContext;
    }
    updateContext() {
        const activeSources = this.getActiveKnowledgeSources();
        this.activeContext = {
            sources: activeSources,
            totalSources: activeSources.length,
            lastUpdated: new Date()
        };
    }
    getContextualKnowledge(taskPrompt, maxSources = 5) {
        const activeSources = this.getActiveKnowledgeSources();
        const scoredSources = activeSources.map(source => {
            const promptLower = taskPrompt.toLowerCase();
            const contentLower = source.content.toLowerCase();
            const titleLower = source.title.toLowerCase();
            let score = 0;
            const words = promptLower.split(/\s+/);
            words.forEach(word => {
                if (word.length > 3 && contentLower.includes(word)) {
                    score += 2;
                }
                if (word.length > 3 && titleLower.includes(word)) {
                    score += 3;
                }
            });
            score += source.priority;
            return { source, score };
        });
        const topSources = scoredSources
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSources)
            .map(item => item.source);
        if (topSources.length === 0) {
            return "";
        }
        const knowledgeText = topSources
            .map(source => `**${source.title}** (${source.category}):\n${source.content}`)
            .join('\n\n');
        return `\n\n--- RELEVANT KNOWLEDGE SOURCES ---\n${knowledgeText}\n--- END KNOWLEDGE SOURCES ---\n\n`;
    }
    searchKnowledgeSources(query) {
        const queryLower = query.toLowerCase();
        return this.getActiveKnowledgeSources().filter(source => {
            return source.title.toLowerCase().includes(queryLower) ||
                source.content.toLowerCase().includes(queryLower) ||
                (source.tags && source.tags.some(tag => tag.toLowerCase().includes(queryLower))) ||
                (source.category && source.category.toLowerCase().includes(queryLower));
        });
    }
}
exports.KnowledgeManager = KnowledgeManager;
//# sourceMappingURL=knowledgeManager.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextInjector = void 0;
class ContextInjector {
    injectMemories(originalContext, memories, relevanceThreshold = 0.7) {
        const relevantMemories = memories.filter(m => m.relevance >= relevanceThreshold);
        const memoryStrings = relevantMemories.map(m => m.memory);
        const contextMessages = this.parseContextToMessages(originalContext);
        if (contextMessages.length === 0) {
            contextMessages.push({
                role: 'user',
                content: originalContext
            });
        }
        const finalContext = this.formatContext(contextMessages, memoryStrings);
        const originalTokens = Math.ceil(originalContext.length / 4);
        const optimizedTokens = Math.ceil(finalContext.length / 4);
        const reductionPercentage = this.calculateTokenReduction(originalTokens, optimizedTokens);
        return {
            originalTokens,
            optimizedTokens,
            reductionPercentage,
            injectedMemories: relevantMemories,
            context: finalContext
        };
    }
    stripContext(messages, contextWindow = 3) {
        if (messages.length <= contextWindow) {
            return messages;
        }
        return messages.slice(-contextWindow);
    }
    calculateTokenReduction(originalTokens, optimizedTokens) {
        if (originalTokens === 0)
            return 0;
        return Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);
    }
    formatContext(messages, memories) {
        let formatted = '';
        for (const message of messages) {
            formatted += `${message.role}: ${message.content}\n`;
        }
        if (memories.length > 0) {
            formatted += '\n## Relevant Memories:\n';
            for (const memory of memories) {
                formatted += `${memory}\n`;
            }
        }
        return formatted.trim();
    }
    parseContextToMessages(context) {
        const messages = [];
        const lines = context.split('\n');
        let currentMessage = null;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine)
                continue;
            if (trimmedLine.startsWith('user:') || trimmedLine.startsWith('assistant:') || trimmedLine.startsWith('system:')) {
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                const roleMatch = trimmedLine.match(/^(user|assistant|system):\s*(.*)$/);
                if (roleMatch && roleMatch[1] && roleMatch[2] !== undefined) {
                    currentMessage = {
                        role: roleMatch[1],
                        content: roleMatch[2]
                    };
                }
            }
            else if (currentMessage) {
                currentMessage.content += '\n' + trimmedLine;
            }
        }
        if (currentMessage) {
            messages.push(currentMessage);
        }
        return messages;
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    createInjectionSummary(memories) {
        if (memories.length === 0) {
            return 'No relevant memories found.';
        }
        const summary = memories.map(m => `${m.policyDelta.context} (${m.relevance.toFixed(2)}): ${m.policyDelta.description}`).join('; ');
        return `Injected ${memories.length} memories: ${summary}`;
    }
    validateMemoryFormat(memory) {
        return /^#mem:\s+\w+-\w+\s+→\s+.+$/.test(memory);
    }
    extractMemoryComponents(memory) {
        const match = memory.match(/^#mem:\s+(\w+)-(\w+)\s+→\s+(.+)$/);
        if (!match || !match[1] || !match[2] || !match[3])
            return null;
        return {
            context: match[1],
            outcome: match[2],
            description: match[3]
        };
    }
}
exports.ContextInjector = ContextInjector;
//# sourceMappingURL=contextInjector.js.map
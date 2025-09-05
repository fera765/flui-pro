import { MemoryRecall, SRIResult } from '../../types/emotionMemory';

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ContextInjector {
  /**
   * Inject relevant memories into context
   */
  injectMemories(
    originalContext: string,
    memories: MemoryRecall[],
    relevanceThreshold: number = 0.7
  ): SRIResult {
    // Filter memories by relevance threshold
    const relevantMemories = memories.filter(m => m.relevance >= relevanceThreshold);
    
    // Extract memory strings
    const memoryStrings = relevantMemories.map(m => m.memory);
    
    // Parse context to messages or create a simple user message
    const contextMessages = this.parseContextToMessages(originalContext);
    if (contextMessages.length === 0) {
      contextMessages.push({
        role: 'user',
        content: originalContext
      });
    }
    
    // Format final context
    const finalContext = this.formatContext(contextMessages, memoryStrings);
    
    // Calculate token estimates (rough approximation: 1 token ≈ 4 characters)
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

  /**
   * Strip context to keep only recent turns
   */
  stripContext(messages: ContextMessage[], contextWindow: number = 3): ContextMessage[] {
    if (messages.length <= contextWindow) {
      return messages;
    }
    
    return messages.slice(-contextWindow);
  }

  /**
   * Calculate token reduction percentage
   */
  calculateTokenReduction(originalTokens: number, optimizedTokens: number): number {
    if (originalTokens === 0) return 0;
    
    return Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);
  }

  /**
   * Format context with memories
   */
  formatContext(messages: ContextMessage[], memories: string[]): string {
    let formatted = '';
    
    // Add conversation history
    for (const message of messages) {
      formatted += `${message.role}: ${message.content}\n`;
    }
    
    // Add memories if any
    if (memories.length > 0) {
      formatted += '\n## Relevant Memories:\n';
      for (const memory of memories) {
        formatted += `${memory}\n`;
      }
    }
    
    return formatted.trim();
  }

  /**
   * Parse context string to message array
   */
  private parseContextToMessages(context: string): ContextMessage[] {
    const messages: ContextMessage[] = [];
    const lines = context.split('\n');
    
    let currentMessage: ContextMessage | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if line starts with role
      if (trimmedLine.startsWith('user:') || trimmedLine.startsWith('assistant:') || trimmedLine.startsWith('system:')) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }
        
        // Start new message
        const roleMatch = trimmedLine.match(/^(user|assistant|system):\s*(.*)$/);
        if (roleMatch && roleMatch[1] && roleMatch[2] !== undefined) {
          currentMessage = {
            role: roleMatch[1] as 'user' | 'assistant' | 'system',
            content: roleMatch[2]
          };
        }
      } else if (currentMessage) {
        // Continue current message
        currentMessage.content += '\n' + trimmedLine;
      }
    }
    
    // Add last message
    if (currentMessage) {
      messages.push(currentMessage);
    }
    
    return messages;
  }

  /**
   * Estimate tokens in text (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Create memory injection summary
   */
  createInjectionSummary(memories: MemoryRecall[]): string {
    if (memories.length === 0) {
      return 'No relevant memories found.';
    }
    
    const summary = memories.map(m => 
      `${m.policyDelta.context} (${m.relevance.toFixed(2)}): ${m.policyDelta.description}`
    ).join('; ');
    
    return `Injected ${memories.length} memories: ${summary}`;
  }

  /**
   * Validate memory format
   */
  validateMemoryFormat(memory: string): boolean {
    // Check if memory follows expected format: #mem: context-outcome → description
    return /^#mem:\s+\w+-\w+\s+→\s+.+$/.test(memory);
  }

  /**
   * Extract memory components
   */
  extractMemoryComponents(memory: string): { context: string; outcome: string; description: string } | null {
    const match = memory.match(/^#mem:\s+(\w+)-(\w+)\s+→\s+(.+)$/);
    if (!match || !match[1] || !match[2] || !match[3]) return null;
    
    return {
      context: match[1],
      outcome: match[2],
      description: match[3]
    };
  }
}
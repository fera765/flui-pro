import { injectable } from 'inversify';
import { IContextProcessor, EpisodicMemory } from '../interfaces/IEmotionMemory';

@injectable()
export class ContextProcessor implements IContextProcessor {
  
  async stripContext(context: string, keepTurns: number = 3): Promise<string> {
    const lines = context.split('\n');
    const conversationTurns = this.extractConversationTurns(lines);
    
    // Keep only the last N turns
    const recentTurns = conversationTurns.slice(-keepTurns);
    
    // Reconstruct context with only recent turns
    return recentTurns.join('\n');
  }

  async injectMemories(context: string, memories: EpisodicMemory[]): Promise<string> {
    if (memories.length === 0) {
      return context;
    }

    // Create memory injection section
    const memoryInjection = this.createMemoryInjection(memories);
    
    // Inject memories at the beginning of context
    return `${memoryInjection}\n\n${context}`;
  }

  calculateTokenReduction(originalContext: string, processedContext: string): number {
    const originalTokens = this.estimateTokenCount(originalContext);
    const processedTokens = this.estimateTokenCount(processedContext);
    
    if (originalTokens === 0) {
      return 0;
    }
    
    return ((originalTokens - processedTokens) / originalTokens) * 100;
  }

  private extractConversationTurns(lines: string[]): string[] {
    const turns: string[] = [];
    let currentTurn = '';
    
    for (const line of lines) {
      // Detect conversation turn boundaries
      if (this.isTurnBoundary(line)) {
        if (currentTurn.trim()) {
          turns.push(currentTurn.trim());
          currentTurn = '';
        }
      }
      currentTurn += line + '\n';
    }
    
    // Add the last turn if it exists
    if (currentTurn.trim()) {
      turns.push(currentTurn.trim());
    }
    
    return turns;
  }

  private isTurnBoundary(line: string): boolean {
    const trimmedLine = line.trim();
    
    // Common patterns that indicate turn boundaries
    const boundaryPatterns = [
      /^User:/i,
      /^Assistant:/i,
      /^System:/i,
      /^Human:/i,
      /^AI:/i,
      /^Bot:/i,
      /^---/,
      /^===/,
      /^###/,
      /^##/,
      /^#/
    ];
    
    return boundaryPatterns.some(pattern => pattern.test(trimmedLine));
  }

  private createMemoryInjection(memories: EpisodicMemory[]): string {
    const memoryLines: string[] = [];
    
    memoryLines.push('#mem: Emotional Memory Context');
    memoryLines.push('');
    
    for (const memory of memories) {
      const memoryLine = this.createMemoryLine(memory);
      memoryLines.push(memoryLine);
    }
    
    return memoryLines.join('\n');
  }

  private createMemoryLine(memory: EpisodicMemory): string {
    const { policyDelta, emotionHash } = memory;
    
    // Create compact memory representation
    const action = policyDelta.action.replace(/_/g, ' ');
    const context = policyDelta.context.replace(/_/g, ' ');
    
    // Format: #mem: context → action (hash: abcd1234)
    return `#mem: ${context} → ${action} (${emotionHash.substring(0, 8)})`;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simplified estimation - real tokenization would be more accurate
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract emotional context from text using simple heuristics
   * This would ideally be replaced with actual LLM-based emotion analysis
   */
  extractEmotionalContext(text: string): {
    valence: number;
    arousal: number;
    dominance: number;
    confidence: number;
    regret: number;
    satisfaction: number;
  } {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based emotion detection
    const positiveWords = ['good', 'great', 'excellent', 'success', 'happy', 'satisfied', 'positive'];
    const negativeWords = ['bad', 'terrible', 'failure', 'sad', 'angry', 'negative', 'disappointed'];
    const regretWords = ['regret', 'mistake', 'error', 'wrong', 'should have', 'wish'];
    const confidentWords = ['sure', 'certain', 'confident', 'definitely', 'absolutely'];
    const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'uncertain'];
    
    let valence = 0;
    let arousal = 0;
    let dominance = 0;
    let confidence = 0;
    let regret = 0;
    let satisfaction = 0;
    
    // Count emotion indicators
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const regretCount = regretWords.filter(word => lowerText.includes(word)).length;
    const confidentCount = confidentWords.filter(word => lowerText.includes(word)).length;
    const uncertainCount = uncertainWords.filter(word => lowerText.includes(word)).length;
    
    // Calculate emotion scores (normalized to 0-1 range)
    valence = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / 10));
    arousal = Math.min(1, (positiveCount + negativeCount + regretCount) / 10);
    dominance = Math.min(1, confidentCount / 5);
    confidence = Math.min(1, confidentCount / (confidentCount + uncertainCount + 1));
    regret = Math.min(1, regretCount / 5);
    satisfaction = Math.max(0, Math.min(1, (positiveCount - regretCount) / 10));
    
    return {
      valence,
      arousal,
      dominance,
      confidence,
      regret,
      satisfaction
    };
  }
}
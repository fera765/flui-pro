import { EpisodicStore } from './episodicStore';
import { EmotionHash } from './emotionHash';
import { ContextInjector, ContextMessage } from './contextInjector';
import { 
  EmotionMemoryConfig, 
  EmotionVector, 
  PolicyDelta, 
  SRIResult,
  MemoryRecall 
} from '../../types/emotionMemory';

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface MemoryStats {
  totalMemories: number;
  config: EmotionMemoryConfig;
  averageRelevance: number;
  topContexts: string[];
}

export class SRIProtocol {
  constructor(
    private episodicStore: EpisodicStore,
    private emotionHash: EmotionHash,
    private contextInjector: ContextInjector,
    private config: EmotionMemoryConfig
  ) {}

  /**
   * Main SRI Protocol: Strip-Recall-Inject
   */
  async optimizeContext(
    fullContext: ContextMessage[],
    taskId: string,
    relevanceThreshold: number = 0.7
  ): Promise<SRIResult> {
    // Step 1: Strip - Keep only recent turns
    const strippedContext = this.contextInjector.stripContext(
      fullContext, 
      this.config.contextWindow
    );

    // Step 2: Recall - Find relevant memories
    const contextString = this.contextToString(strippedContext);
    const relevantMemories = await this.episodicStore.recallMemories(
      contextString, 
      relevanceThreshold
    );

    // Step 3: Inject - Add memories to context
    const result = this.contextInjector.injectMemories(
      contextString,
      relevantMemories,
      relevanceThreshold
    );

    return result;
  }

  /**
   * Optimize context for specific agent
   */
  async optimizeContextForAgent(
    agentId: string,
    fullContext: ContextMessage[],
    taskId: string,
    relevanceThreshold: number = 0.7
  ): Promise<SRIResult> {
    // Add agent context to improve memory recall
    const agentContext = `Agent: ${agentId}\n${this.contextToString(fullContext)}`;
    
    // Strip context
    const strippedContext = this.contextInjector.stripContext(
      fullContext, 
      this.config.contextWindow
    );

    // Recall memories with agent context
    const relevantMemories = await this.episodicStore.recallMemories(
      agentContext, 
      relevanceThreshold
    );

    // Inject memories
    const result = this.contextInjector.injectMemories(
      this.contextToString(strippedContext),
      relevantMemories,
      relevanceThreshold
    );

    return result;
  }

  /**
   * Store experience from task execution
   */
  async storeExperience(
    taskId: string,
    taskContext: string,
    taskResult: TaskResult
  ): Promise<EmotionVector | null> {
    // Calculate emotion from task result
    const emotionVector = this.calculateEmotionFromResult(taskResult);
    
    // Check if emotion intensity exceeds threshold
    const intensity = this.calculateEmotionIntensity(emotionVector);
    if (intensity < this.config.emotionThreshold) {
      return null; // Don't store low-intensity emotions
    }

    // Generate policy delta based on task result
    const policyDelta = this.generatePolicyDelta(taskContext, taskResult);
    
    // Generate emotion hash
    const emotionHash = this.emotionHash.generateHash(emotionVector);
    
    // Store memory
    const memory = await this.episodicStore.storeMemory(
      emotionHash,
      emotionVector,
      taskResult.success ? 'success' : 'failure',
      policyDelta,
      taskContext,
      taskId
    );

    return memory ? emotionVector : null;
  }

  /**
   * Calculate emotion vector from task result
   */
  calculateEmotionFromResult(taskResult: TaskResult): EmotionVector {
    const confidence = taskResult.metadata.confidence || 0.5;
    
    if (taskResult.success) {
      // Positive emotion for success
      return {
        valence: 0.7, // Positive valence
        arousal: 0.3, // Low arousal (calm satisfaction)
        dominance: 0.8, // High dominance (feeling in control)
        confidence,
        timestamp: new Date()
      };
    } else {
      // Negative emotion for failure
      return {
        valence: -0.8, // Negative valence
        arousal: 0.9, // High arousal (frustration/excitement)
        dominance: 0.2, // Low dominance (feeling out of control)
        confidence,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate policy delta from task context and result
   */
  private generatePolicyDelta(taskContext: string, taskResult: TaskResult): PolicyDelta {
    const context = this.extractContextKeywords(taskContext);
    
    if (taskResult.success) {
      return {
        action: 'reinforce_approach',
        context,
        impact: 0.7,
        description: `Continue using successful approach for ${context}`
      };
    } else {
      return {
        action: 'add_safeguard',
        context,
        impact: 0.8,
        description: `Add safeguards and disclaimers for ${context}`
      };
    }
  }

  /**
   * Extract context keywords from task context
   */
  private extractContextKeywords(context: string): string {
    const lowerContext = context.toLowerCase();
    
    // Define keyword mappings
    const keywordMappings: Record<string, string> = {
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
    
    // Find matching keywords
    for (const [keyword, category] of Object.entries(keywordMappings)) {
      if (lowerContext.includes(keyword)) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Calculate emotion intensity
   */
  private calculateEmotionIntensity(emotionVector: EmotionVector): number {
    const valence = emotionVector.valence;
    const arousal = emotionVector.arousal - 0.5; // Center around 0
    const dominance = emotionVector.dominance - 0.5; // Center around 0
    
    const intensity = Math.sqrt(valence * valence + arousal * arousal + dominance * dominance);
    return Math.min(intensity / Math.sqrt(3), 1);
  }

  /**
   * Convert context messages to string
   */
  private contextToString(messages: ContextMessage[]): string {
    return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    const totalMemories = await this.episodicStore.getTotalMemories();
    
    return {
      totalMemories,
      config: this.config,
      averageRelevance: 0.7, // Placeholder - would need to calculate from actual memories
      topContexts: ['altcoin', 'financial_advice', 'design'] // Placeholder
    };
  }

  /**
   * Clear all memories (for testing)
   */
  async clearMemories(): Promise<void> {
    // This would need to be implemented in EpisodicStore
    // For now, just log the action
    console.log('Clearing all memories...');
  }

  /**
   * Export memories for backup
   */
  async exportMemories(): Promise<any[]> {
    // This would need to be implemented in EpisodicStore
    // For now, return empty array
    return [];
  }

  /**
   * Import memories from backup
   */
  async importMemories(memories: any[]): Promise<void> {
    // This would need to be implemented in EpisodicStore
    // For now, just log the action
    console.log(`Importing ${memories.length} memories...`);
  }
}
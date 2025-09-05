import { 
  EpisodicMemory, 
  EmotionVector, 
  PolicyDelta, 
  MemoryRecall, 
  EmotionMemoryConfig 
} from '../../types/emotionMemory';
import { v4 as uuidv4 } from 'uuid';

export class EpisodicStore {
  private memories: Map<string, EpisodicMemory> = new Map();
  private config: EmotionMemoryConfig;

  constructor(config: EmotionMemoryConfig) {
    this.config = config;
  }

  /**
   * Store a new episodic memory if emotion intensity exceeds threshold
   */
  async storeMemory(
    emotionHash: string,
    emotionVector: EmotionVector,
    outcomeFlag: 'success' | 'failure' | 'partial',
    policyDelta: PolicyDelta,
    context: string,
    taskId: string
  ): Promise<EpisodicMemory | null> {
    // Check if emotion intensity exceeds threshold
    const emotionIntensity = this.calculateEmotionIntensity(emotionVector);
    
    if (emotionIntensity < this.config.emotionThreshold) {
      return null; // Don't store low-intensity emotions
    }

    const memory: EpisodicMemory = {
      id: uuidv4(),
      emotionHash,
      emotionVector,
      outcomeFlag,
      policyDelta,
      context,
      taskId,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0
    };

    this.memories.set(emotionHash, memory);
    
    // Cleanup if we exceed max memories
    await this.cleanup();
    
    return memory;
  }

  /**
   * Recall memories relevant to the given context
   */
  async recallMemories(context: string, threshold: number = 0.7): Promise<MemoryRecall[]> {
    const relevantMemories: MemoryRecall[] = [];

    for (const memory of this.memories.values()) {
      const relevance = this.calculateRelevance(memory, context);
      
      if (relevance >= threshold) {
        // Update access statistics
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

    // Sort by relevance (highest first)
    return relevantMemories.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get a specific memory by its emotion hash
   */
  async getMemoryByHash(emotionHash: string): Promise<EpisodicMemory | null> {
    const memory = this.memories.get(emotionHash);
    
    if (memory) {
      memory.lastAccessed = new Date();
      memory.accessCount++;
    }
    
    return memory || null;
  }

  /**
   * Get total number of stored memories
   */
  async getTotalMemories(): Promise<number> {
    return this.memories.size;
  }

  /**
   * Calculate emotion intensity using VAD model
   */
  private calculateEmotionIntensity(emotionVector: EmotionVector): number {
    // Use Euclidean distance from neutral point (0, 0.5, 0.5)
    const valence = emotionVector.valence;
    const arousal = emotionVector.arousal - 0.5; // Center around 0
    const dominance = emotionVector.dominance - 0.5; // Center around 0
    
    const intensity = Math.sqrt(valence * valence + arousal * arousal + dominance * dominance);
    
    // Normalize to 0-1 range
    return Math.min(intensity / Math.sqrt(3), 1);
  }

  /**
   * Calculate relevance between memory and current context
   */
  private calculateRelevance(memory: EpisodicMemory, context: string): number {
    // Simple keyword-based relevance for now
    // In production, this could use semantic similarity (embeddings)
    const contextWords = context.toLowerCase().split(/\s+/);
    const memoryWords = memory.context.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of contextWords) {
      if (memoryWords.includes(word)) {
        matches++;
      }
    }
    
    // Also consider policy delta context
    const policyWords = memory.policyDelta.context.toLowerCase().split(/\s+/);
    for (const word of contextWords) {
      if (policyWords.includes(word)) {
        matches += 2; // Policy context is more important
      }
    }
    
    const totalWords = Math.max(contextWords.length, memoryWords.length);
    return Math.min(matches / totalWords, 1);
  }

  /**
   * Compress memory into a short description
   */
  private compressMemory(memory: EpisodicMemory): string {
    const outcome = memory.outcomeFlag === 'failure' ? 'failed' : 
                   memory.outcomeFlag === 'success' ? 'succeeded' : 'partial';
    
    return `#mem: ${memory.policyDelta.context}-${outcome} → ${memory.policyDelta.description}`;
  }

  /**
   * Cleanup old memories when limit is exceeded
   */
  private async cleanup(): Promise<void> {
    if (this.memories.size <= this.config.maxMemories) {
      return;
    }

    // Convert to array and sort by last accessed (oldest first)
    const memoryArray = Array.from(this.memories.values())
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Remove oldest memories
    const toRemove = memoryArray.slice(0, this.memories.size - this.config.maxMemories);
    
    for (const memory of toRemove) {
      this.memories.delete(memory.emotionHash);
    }
  }

  /**
   * Apply memory decay to reduce importance of old memories
   */
  private applyMemoryDecay(memory: EpisodicMemory): number {
    const daysSinceAccess = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    return Math.pow(this.config.memoryDecay, daysSinceAccess);
  }
}
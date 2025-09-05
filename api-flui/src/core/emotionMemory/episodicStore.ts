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
    taskId: string,
    agentId?: string,
    domain?: string,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
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
      agentId: agentId || undefined,
      domain: domain || this.extractDomain(context),
      complexity,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      effectiveness: 0.5 // Initial effectiveness
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
   * Calculate emotion intensity using expanded emotion model
   */
  private calculateEmotionIntensity(emotionVector: EmotionVector): number {
    // Use Euclidean distance from neutral point for VAD
    const valence = emotionVector.valence;
    const arousal = emotionVector.arousal - 0.5; // Center around 0
    const dominance = emotionVector.dominance - 0.5; // Center around 0
    
    // Include additional emotions
    const surprise = emotionVector.surprise || 0;
    const fear = emotionVector.fear || 0;
    const joy = emotionVector.joy || 0;
    const anger = emotionVector.anger || 0;
    const sadness = emotionVector.sadness || 0;
    const disgust = emotionVector.disgust || 0;
    
    // Calculate intensity from all emotions
    const basicIntensity = Math.sqrt(valence * valence + arousal * arousal + dominance * dominance);
    const emotionIntensity = Math.sqrt(surprise * surprise + fear * fear + joy * joy + anger * anger + sadness * sadness + disgust * disgust);
    
    // Combine both intensities
    const totalIntensity = Math.sqrt(basicIntensity * basicIntensity + emotionIntensity * emotionIntensity);
    
    // Normalize to 0-1 range
    return Math.min(totalIntensity / Math.sqrt(6), 1);
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

  /**
   * Extract domain from context
   */
  private extractDomain(context: string): string {
    const lowerContext = context.toLowerCase();
    
    const domainMappings: Record<string, string> = {
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

  /**
   * Update memory effectiveness based on usage
   */
  updateMemoryEffectiveness(emotionHash: string, wasHelpful: boolean): void {
    const memory = this.memories.get(emotionHash);
    if (!memory) return;

    // Update effectiveness based on whether it was helpful
    const adjustment = wasHelpful ? 0.1 : -0.05;
    memory.effectiveness = Math.max(0, Math.min(1, memory.effectiveness + adjustment));
    
    // Update access count and timestamp
    memory.accessCount++;
    memory.lastAccessed = new Date();
  }

  /**
   * Get memories by domain
   */
  async getMemoriesByDomain(domain: string): Promise<EpisodicMemory[]> {
    return Array.from(this.memories.values()).filter(m => m.domain === domain);
  }

  /**
   * Get memories by agent
   */
  async getMemoriesByAgent(agentId: string): Promise<EpisodicMemory[]> {
    return Array.from(this.memories.values()).filter(m => m.agentId === agentId);
  }

  /**
   * Get most effective memories
   */
  async getMostEffectiveMemories(limit: number = 10): Promise<EpisodicMemory[]> {
    return Array.from(this.memories.values())
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, limit);
  }
}
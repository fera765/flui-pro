import { injectable } from 'inversify';
import { EpisodicMemory, EmotionVector, PolicyDelta } from '../interfaces/IEmotionMemory';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class EpisodicMemoryStore {
  private memories: Map<string, EpisodicMemory> = new Map();
  private readonly storePath: string;

  constructor() {
    this.storePath = path.join(process.cwd(), 'project', 'emotion_memory.json');
    this.loadMemories();
  }

  async storeMemory(
    emotionHash: string,
    emotionVector: EmotionVector,
    policyDelta: PolicyDelta,
    context: string,
    outcome: boolean
  ): Promise<void> {
    const memory: EpisodicMemory = {
      id: this.generateMemoryId(),
      emotionHash,
      emotionVector,
      policyDelta,
      outcomeFlag: outcome,
      context: this.truncateContext(context),
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: 0
    };

    this.memories.set(emotionHash, memory);
    await this.saveMemories();
  }

  async getMemory(emotionHash: string): Promise<EpisodicMemory | null> {
    const memory = this.memories.get(emotionHash);
    if (memory) {
      // Update access statistics
      memory.accessCount++;
      memory.lastAccessed = Date.now();
      await this.saveMemories();
    }
    return memory || null;
  }

  async getRelevantMemories(threshold: number): Promise<EpisodicMemory[]> {
    const relevantMemories: EpisodicMemory[] = [];
    
    for (const memory of this.memories.values()) {
      const intensity = this.calculateEmotionalIntensity(memory.emotionVector);
      if (intensity >= threshold) {
        relevantMemories.push(memory);
      }
    }

    // Sort by emotional intensity (highest first)
    return relevantMemories.sort((a, b) => {
      const intensityA = this.calculateEmotionalIntensity(a.emotionVector);
      const intensityB = this.calculateEmotionalIntensity(b.emotionVector);
      return intensityB - intensityA;
    });
  }

  async updateAccessCount(emotionHash: string): Promise<void> {
    const memory = this.memories.get(emotionHash);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = Date.now();
      await this.saveMemories();
    }
  }

  async getAllMemories(): Promise<EpisodicMemory[]> {
    return Array.from(this.memories.values());
  }

  async clearMemories(): Promise<void> {
    this.memories.clear();
    await this.saveMemories();
  }

  async getMemoryStats(): Promise<{
    totalMemories: number;
    averageIntensity: number;
    mostAccessed: string | null;
    oldestMemory: number | null;
    newestMemory: number | null;
  }> {
    const memories = Array.from(this.memories.values());
    
    if (memories.length === 0) {
      return {
        totalMemories: 0,
        averageIntensity: 0,
        mostAccessed: null,
        oldestMemory: null,
        newestMemory: null
      };
    }

    const intensities = memories.map(m => this.calculateEmotionalIntensity(m.emotionVector));
    const averageIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;

    const mostAccessed = memories.reduce((max, memory) => 
      memory.accessCount > max.accessCount ? memory : max
    );

    const timestamps = memories.map(m => m.timestamp);
    const oldestMemory = Math.min(...timestamps);
    const newestMemory = Math.max(...timestamps);

    return {
      totalMemories: memories.length,
      averageIntensity,
      mostAccessed: mostAccessed.emotionHash,
      oldestMemory,
      newestMemory
    };
  }

  private calculateEmotionalIntensity(emotionVector: EmotionVector): number {
    const components = [
      emotionVector.valence,
      emotionVector.arousal,
      emotionVector.dominance,
      emotionVector.confidence,
      emotionVector.regret,
      emotionVector.satisfaction
    ];

    const sumOfSquares = components.reduce((sum, component) => sum + Math.pow(component, 2), 0);
    return Math.sqrt(sumOfSquares);
  }

  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private truncateContext(context: string, maxLength: number = 500): string {
    if (context.length <= maxLength) {
      return context;
    }
    return context.substring(0, maxLength) + '...';
  }

  private async loadMemories(): Promise<void> {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = await fs.promises.readFile(this.storePath, 'utf-8');
        const memoriesArray = JSON.parse(data);
        
        this.memories.clear();
        for (const memory of memoriesArray) {
          this.memories.set(memory.emotionHash, memory);
        }
      }
    } catch (error) {
      console.warn('Failed to load emotion memories:', error);
    }
  }

  private async saveMemories(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(this.storePath), { recursive: true });
      
      const memoriesArray = Array.from(this.memories.values());
      await fs.promises.writeFile(this.storePath, JSON.stringify(memoriesArray, null, 2));
    } catch (error) {
      console.error('Failed to save emotion memories:', error);
    }
  }
}
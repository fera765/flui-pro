import { injectable, inject } from 'inversify';
import { IEmotionMemory, EmotionVector, PolicyDelta, EpisodicMemory } from '../interfaces/IEmotionMemory';
import { IEmotionHashGenerator } from '../interfaces/IEmotionMemory';
import { IContextProcessor } from '../interfaces/IEmotionMemory';
import { EpisodicMemoryStore } from '../stores/EpisodicMemoryStore';
import { EmotionHashGenerator } from './EmotionHashGenerator';
import { ContextProcessor } from './ContextProcessor';

@injectable()
export class EmotionMemoryService implements IEmotionMemory {
  private readonly emotionHashGenerator: IEmotionHashGenerator;
  private readonly contextProcessor: IContextProcessor;
  private readonly memoryStore: EpisodicMemoryStore;

  constructor(
    @inject('IEmotionHashGenerator') emotionHashGenerator: IEmotionHashGenerator,
    @inject('IContextProcessor') contextProcessor: IContextProcessor,
    @inject('EpisodicMemoryStore') memoryStore: EpisodicMemoryStore
  ) {
    this.emotionHashGenerator = emotionHashGenerator;
    this.contextProcessor = contextProcessor;
    this.memoryStore = memoryStore;
  }

  async storeMemory(
    emotionVector: EmotionVector,
    policyDelta: PolicyDelta,
    context: string,
    outcome: boolean
  ): Promise<string> {
    // Generate emotion hash
    const emotionHash = this.emotionHashGenerator.generateHash(emotionVector);
    
    // Check if this emotion meets threshold for storage
    if (!this.emotionHashGenerator.meetsThreshold(emotionVector, 0.7)) {
      return emotionHash; // Return hash but don't store if below threshold
    }
    
    // Store in episodic memory
    await this.memoryStore.storeMemory(
      emotionHash,
      emotionVector,
      policyDelta,
      context,
      outcome
    );
    
    return emotionHash;
  }

  async recallDelta(emotionHash: string): Promise<string | null> {
    const memory = await this.memoryStore.getMemory(emotionHash);
    
    if (!memory) {
      return null;
    }
    
    // Create compact memory recall string
    const { policyDelta } = memory;
    const action = policyDelta.action.replace(/_/g, ' ');
    const context = policyDelta.context.replace(/_/g, ' ');
    
    return `#mem: ${context} → ${action}`;
  }

  async getRelevantMemories(threshold: number = 0.7): Promise<EpisodicMemory[]> {
    return await this.memoryStore.getRelevantMemories(threshold);
  }

  async updateAccessCount(emotionHash: string): Promise<void> {
    await this.memoryStore.updateAccessCount(emotionHash);
  }

  async stripContext(context: string, keepTurns: number = 3): Promise<string> {
    return await this.contextProcessor.stripContext(context, keepTurns);
  }

  async injectMemories(context: string, memories: EpisodicMemory[]): Promise<string> {
    return await this.contextProcessor.injectMemories(context, memories);
  }

  /**
   * Main SRI Protocol: Strip-Recall-Inject
   */
  async executeSRIProtocol(
    originalContext: string,
    threshold: number = 0.7,
    keepTurns: number = 3
  ): Promise<{
    processedContext: string;
    tokenReduction: number;
    memoriesInjected: number;
    relevantMemories: EpisodicMemory[];
  }> {
    // Step 1: Strip - Remove old context, keep only recent turns
    const strippedContext = await this.stripContext(originalContext, keepTurns);
    
    // Step 2: Recall - Get relevant memories above threshold
    const relevantMemories = await this.getRelevantMemories(threshold);
    
    // Step 3: Inject - Add memory deltas to context
    const processedContext = await this.injectMemories(strippedContext, relevantMemories);
    
    // Calculate token reduction
    const tokenReduction = this.contextProcessor.calculateTokenReduction(
      originalContext,
      processedContext
    );
    
    return {
      processedContext,
      tokenReduction,
      memoriesInjected: relevantMemories.length,
      relevantMemories
    };
  }

  /**
   * Analyze text and extract emotional context
   */
  async analyzeEmotionalContext(text: string): Promise<EmotionVector> {
    return this.contextProcessor.extractEmotionalContext(text);
  }

  /**
   * Create policy delta from analysis
   */
  async createPolicyDelta(
    action: string,
    context: string,
    intensity: number = 0.5
  ): Promise<PolicyDelta> {
    return {
      action,
      context,
      intensity,
      timestamp: Date.now()
    };
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    totalMemories: number;
    averageIntensity: number;
    mostAccessed: string | null;
    oldestMemory: number | null;
    newestMemory: number | null;
  }> {
    return await this.memoryStore.getMemoryStats();
  }

  /**
   * Clear all memories (for testing/reset)
   */
  async clearAllMemories(): Promise<void> {
    await this.memoryStore.clearMemories();
  }

  /**
   * Get all memories (for debugging/analysis)
   */
  async getAllMemories(): Promise<EpisodicMemory[]> {
    return await this.memoryStore.getAllMemories();
  }
}
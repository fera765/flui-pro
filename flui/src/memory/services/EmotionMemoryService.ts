import { injectable, inject } from 'inversify';
import { IEmotionMemory, EmotionVector, PolicyDelta, EpisodicMemory } from '../interfaces/IEmotionMemory';
import { IEmotionHashGenerator } from '../interfaces/IEmotionMemory';
import { IContextProcessor } from '../interfaces/IEmotionMemory';
import { EpisodicMemoryStore } from '../stores/EpisodicMemoryStore';
import { EmotionHashGenerator } from './EmotionHashGenerator';
import { ContextProcessor } from './ContextProcessor';
import { TemporalDecayService, DecayConfiguration } from './TemporalDecayService';
import { MemoryClusteringService, MemoryCluster, ClusteringConfiguration } from './MemoryClusteringService';
import { LLMEmotionAnalysisService, EmotionAnalysisResult, PolicyAnalysisResult } from './LLMEmotionAnalysisService';

@injectable()
export class EmotionMemoryService implements IEmotionMemory {
  private readonly emotionHashGenerator: IEmotionHashGenerator;
  private readonly contextProcessor: IContextProcessor;
  private readonly memoryStore: EpisodicMemoryStore;
  private readonly temporalDecayService: TemporalDecayService;
  private readonly clusteringService: MemoryClusteringService;
  private readonly llmAnalysisService: LLMEmotionAnalysisService;

  constructor(
    @inject('IEmotionHashGenerator') emotionHashGenerator: IEmotionHashGenerator,
    @inject('IContextProcessor') contextProcessor: IContextProcessor,
    @inject('EpisodicMemoryStore') memoryStore: EpisodicMemoryStore,
    @inject('TemporalDecayService') temporalDecayService: TemporalDecayService,
    @inject('MemoryClusteringService') clusteringService: MemoryClusteringService,
    @inject('LLMEmotionAnalysisService') llmAnalysisService: LLMEmotionAnalysisService
  ) {
    this.emotionHashGenerator = emotionHashGenerator;
    this.contextProcessor = contextProcessor;
    this.memoryStore = memoryStore;
    this.temporalDecayService = temporalDecayService;
    this.clusteringService = clusteringService;
    this.llmAnalysisService = llmAnalysisService;
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

  /**
   * Apply temporal decay to all memories
   */
  async applyTemporalDecay(config?: DecayConfiguration): Promise<{
    activeMemories: EpisodicMemory[];
    removedMemories: EpisodicMemory[];
    decayStats: any;
  }> {
    const allMemories = await this.memoryStore.getAllMemories();
    const decayResult = this.temporalDecayService.applyBulkDecay(allMemories, config);
    
    // Update store with active memories
    await this.memoryStore.clearMemories();
    for (const memory of decayResult.activeMemories) {
      await this.memoryStore.storeMemory(
        memory.emotionHash,
        memory.emotionVector,
        memory.policyDelta,
        memory.context,
        memory.outcomeFlag
      );
    }
    
    return decayResult;
  }

  /**
   * Cluster memories by emotional similarity
   */
  async clusterMemories(config?: ClusteringConfiguration): Promise<{
    clusters: MemoryCluster[];
    unclustered: EpisodicMemory[];
    clusteringStats: any;
  }> {
    const allMemories = await this.memoryStore.getAllMemories();
    return this.clusteringService.clusterMemories(allMemories, config);
  }

  /**
   * Find similar memories to a given memory
   */
  async findSimilarMemories(
    targetMemory: EpisodicMemory,
    threshold: number = 0.7
  ): Promise<{
    similar: EpisodicMemory[];
    similarities: Array<{ memory: EpisodicMemory; similarity: number }>;
  }> {
    const allMemories = await this.memoryStore.getAllMemories();
    return this.clusteringService.findSimilarMemories(targetMemory, allMemories, threshold);
  }

  /**
   * Analyze emotional context using LLM
   */
  async analyzeEmotionalContextWithLLM(text: string): Promise<EmotionAnalysisResult> {
    return await this.llmAnalysisService.analyzeEmotionalContext(text);
  }

  /**
   * Create policy delta using LLM analysis
   */
  async createPolicyDeltaWithLLM(
    text: string,
    context: string,
    outcome: boolean
  ): Promise<PolicyAnalysisResult> {
    return await this.llmAnalysisService.analyzeAndCreatePolicyDelta(text, context, outcome);
  }

  /**
   * Store memory with LLM-based analysis
   */
  async storeMemoryWithLLMAnalysis(
    text: string,
    context: string,
    outcome: boolean
  ): Promise<{
    emotionHash: string;
    emotionAnalysis: EmotionAnalysisResult;
    policyAnalysis: PolicyAnalysisResult;
  }> {
    // Analyze with LLM
    const emotionAnalysis = await this.llmAnalysisService.analyzeEmotionalContext(text);
    const policyAnalysis = await this.llmAnalysisService.analyzeAndCreatePolicyDelta(text, context, outcome);
    
    // Store memory
    const emotionHash = await this.storeMemory(
      emotionAnalysis.emotionVector,
      policyAnalysis.policyDelta,
      context,
      outcome
    );
    
    return {
      emotionHash,
      emotionAnalysis,
      policyAnalysis
    };
  }

  /**
   * Get comprehensive memory statistics
   */
  async getComprehensiveStats(): Promise<{
    basic: any;
    decay: any;
    clustering: any;
  }> {
    const basicStats = await this.memoryStore.getMemoryStats();
    const allMemories = await this.memoryStore.getAllMemories();
    
    const decayStats = this.temporalDecayService.calculateDecayStatistics(allMemories);
    const clusteringResult = await this.clusteringService.clusterMemories(allMemories);
    
    return {
      basic: basicStats,
      decay: decayStats,
      clustering: clusteringResult.clusteringStats
    };
  }

  /**
   * Optimize memory system (decay + clustering)
   */
  async optimizeMemorySystem(
    decayConfig?: DecayConfiguration,
    clusteringConfig?: ClusteringConfiguration
  ): Promise<{
    decayResult: any;
    clusteringResult: any;
    optimizationStats: {
      beforeOptimization: number;
      afterOptimization: number;
      memoryReduction: number;
    };
  }> {
    const beforeCount = (await this.memoryStore.getAllMemories()).length;
    
    // Apply temporal decay
    const decayResult = await this.applyTemporalDecay(decayConfig);
    
    // Apply clustering
    const clusteringResult = await this.clusterMemories(clusteringConfig);
    
    const afterCount = (await this.memoryStore.getAllMemories()).length;
    
    return {
      decayResult,
      clusteringResult,
      optimizationStats: {
        beforeOptimization: beforeCount,
        afterOptimization: afterCount,
        memoryReduction: beforeCount > 0 ? ((beforeCount - afterCount) / beforeCount) * 100 : 0
      }
    };
  }
}
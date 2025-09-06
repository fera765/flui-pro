export interface EmotionVector {
  valence: number;        // -1.0 to 1.0 (negative to positive)
  arousal: number;        // 0.0 to 1.0 (calm to excited)
  dominance: number;      // 0.0 to 1.0 (submissive to dominant)
  confidence: number;     // 0.0 to 1.0 (uncertain to certain)
  regret: number;         // 0.0 to 1.0 (no regret to high regret)
  satisfaction: number;   // 0.0 to 1.0 (unsatisfied to satisfied)
}

export interface PolicyDelta {
  action: string;         // What changed (e.g., "add_disclaimer")
  context: string;        // When to apply (e.g., "altcoin_analysis")
  intensity: number;      // How strong (0.0 to 1.0)
  timestamp: number;      // When it was learned
}

export interface EpisodicMemory {
  id: string;
  emotionHash: string;    // 8-byte BLAKE3 hash
  emotionVector: EmotionVector;
  policyDelta: PolicyDelta;
  outcomeFlag: boolean;   // Did this lead to success?
  context: string;        // Original context (for reference only)
  timestamp: number;
  accessCount: number;    // How many times accessed
  lastAccessed: number;   // Last access timestamp
}

export interface IEmotionMemory {
  storeMemory(emotionVector: EmotionVector, policyDelta: PolicyDelta, context: string, outcome: boolean): Promise<string>;
  recallDelta(emotionHash: string): Promise<string | null>;
  getRelevantMemories(threshold: number): Promise<EpisodicMemory[]>;
  updateAccessCount(emotionHash: string): Promise<void>;
  stripContext(context: string, keepTurns: number): Promise<string>;
  injectMemories(context: string, memories: EpisodicMemory[]): Promise<string>;
  executeSRIProtocol(originalContext: string, threshold?: number, keepTurns?: number): Promise<{
    processedContext: string;
    tokenReduction: number;
    memoriesInjected: number;
    relevantMemories: EpisodicMemory[];
  }>;
  analyzeEmotionalContext(text: string): Promise<EmotionVector>;
  createPolicyDelta(action: string, context: string, intensity?: number): Promise<PolicyDelta>;
  getMemoryStats(): Promise<{
    totalMemories: number;
    averageIntensity: number;
    mostAccessed: string | null;
    oldestMemory: number | null;
    newestMemory: number | null;
  }>;
  clearAllMemories(): Promise<void>;
  getAllMemories(): Promise<EpisodicMemory[]>;
  applyTemporalDecay(config?: any): Promise<{
    activeMemories: EpisodicMemory[];
    removedMemories: EpisodicMemory[];
    decayStats: any;
  }>;
  clusterMemories(config?: any): Promise<{
    clusters: any[];
    unclustered: EpisodicMemory[];
    clusteringStats: any;
  }>;
  findSimilarMemories(targetMemory: EpisodicMemory, threshold?: number): Promise<{
    similar: EpisodicMemory[];
    similarities: Array<{ memory: EpisodicMemory; similarity: number }>;
  }>;
  analyzeEmotionalContextWithLLM(text: string): Promise<any>;
  createPolicyDeltaWithLLM(text: string, context: string, outcome: boolean): Promise<any>;
  storeMemoryWithLLMAnalysis(text: string, context: string, outcome: boolean): Promise<{
    emotionHash: string;
    emotionAnalysis: any;
    policyAnalysis: any;
  }>;
  getComprehensiveStats(): Promise<{
    basic: any;
    decay: any;
    clustering: any;
  }>;
  optimizeMemorySystem(decayConfig?: any, clusteringConfig?: any): Promise<{
    decayResult: any;
    clusteringResult: any;
    optimizationStats: {
      beforeOptimization: number;
      afterOptimization: number;
      memoryReduction: number;
    };
  }>;
}

export interface IEmotionHashGenerator {
  generateHash(emotionVector: EmotionVector): string;
  validateHash(hash: string): boolean;
  calculateEmotionalIntensity(emotionVector: EmotionVector): number;
  meetsThreshold(emotionVector: EmotionVector, threshold?: number): boolean;
}

export interface IContextProcessor {
  stripContext(context: string, keepTurns: number): Promise<string>;
  injectMemories(context: string, memories: EpisodicMemory[]): Promise<string>;
  calculateTokenReduction(originalContext: string, processedContext: string): number;
  extractEmotionalContext(text: string): EmotionVector;
}
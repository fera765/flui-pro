export interface EmotionVector {
  valence: number;      // -1 to 1 (negative to positive)
  arousal: number;      // 0 to 1 (calm to excited)
  dominance: number;    // 0 to 1 (submissive to dominant)
  confidence: number;   // 0 to 1 (uncertain to certain)
  surprise: number;     // 0 to 1 (expected to surprising)
  fear: number;         // 0 to 1 (safe to fearful)
  joy: number;          // 0 to 1 (neutral to joyful)
  anger: number;        // 0 to 1 (calm to angry)
  sadness: number;      // 0 to 1 (neutral to sad)
  disgust: number;      // 0 to 1 (neutral to disgusted)
  timestamp: Date;
}

export interface PolicyDelta {
  action: string;       // e.g., "add_disclaimer", "change_tone"
  context: string;      // e.g., "altcoin", "financial_advice"
  impact: number;       // -1 to 1 (negative to positive impact)
  description: string;  // Human readable description
  category: 'safety' | 'quality' | 'efficiency' | 'user_experience' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[];   // Keywords that trigger this policy
}

export interface EpisodicMemory {
  id: string;
  emotionHash: string;  // 8-byte BLAKE3 hash
  emotionVector: EmotionVector;
  outcomeFlag: 'success' | 'failure' | 'partial';
  policyDelta: PolicyDelta;
  context: string;      // Original context that triggered this memory
  taskId: string;
  agentId?: string | undefined;     // Agent that generated this memory
  domain: string;       // Domain/category of the task
  complexity: 'simple' | 'medium' | 'complex';
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  effectiveness: number; // How effective this memory has been (0-1)
}

export interface MemoryRecall {
  emotionHash: string;
  policyDelta: PolicyDelta;
  relevance: number;    // 0 to 1 (how relevant to current context)
  memory: string;       // Compressed memory description
}

export interface SRIResult {
  originalTokens: number;
  optimizedTokens: number;
  reductionPercentage: number;
  injectedMemories: MemoryRecall[];
  context: string;      // Final optimized context
}

export interface EmotionMemoryConfig {
  emotionThreshold: number;    // Minimum emotion intensity to store (default: 0.7)
  maxMemories: number;         // Maximum memories to keep (default: 1000)
  memoryDecay: number;         // Memory decay factor (default: 0.95)
  contextWindow: number;       // Number of recent turns to keep (default: 3)
  hashLength: number;          // BLAKE3 hash length in bytes (default: 8)
}
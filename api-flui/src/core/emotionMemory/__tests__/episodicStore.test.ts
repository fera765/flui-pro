import { EpisodicStore } from '../episodicStore';
import { EmotionVector, PolicyDelta, EpisodicMemory, EmotionMemoryConfig } from '../../../types/emotionMemory';

describe('EpisodicStore', () => {
  let store: EpisodicStore;
  let config: EmotionMemoryConfig;

  beforeEach(() => {
    config = {
      emotionThreshold: 0.7,
      maxMemories: 100,
      memoryDecay: 0.95,
      contextWindow: 3,
      hashLength: 8
    };
    store = new EpisodicStore(config);
  });

  describe('storeMemory', () => {
    it('should store a memory when emotion intensity exceeds threshold', async () => {
      const emotionVector: EmotionVector = {
        valence: -1.0,
        arousal: 1.0,
        dominance: 1.0,
        confidence: 0.8,
        timestamp: new Date()
      };

      const policyDelta: PolicyDelta = {
        action: 'add_disclaimer',
        context: 'altcoin',
        impact: 0.7,
        description: 'Always add financial disclaimer for altcoin analysis'
      };

      const memory = await store.storeMemory(
        'test-hash-123',
        emotionVector,
        'failure',
        policyDelta,
        'User asked about NEWcoin investment',
        'task-123'
      );

      expect(memory).toBeDefined();
      expect(memory?.emotionHash).toBe('test-hash-123');
      expect(memory?.outcomeFlag).toBe('failure');
      expect(memory?.policyDelta.action).toBe('add_disclaimer');
    });

    it('should not store memory when emotion intensity is below threshold', async () => {
      const emotionVector: EmotionVector = {
        valence: 0.2,
        arousal: 0.3,
        dominance: 0.4,
        confidence: 0.5,
        timestamp: new Date()
      };

      const policyDelta: PolicyDelta = {
        action: 'neutral_action',
        context: 'general',
        impact: 0.2,
        description: 'Neutral action'
      };

      const memory = await store.storeMemory(
        'test-hash-456',
        emotionVector,
        'success',
        policyDelta,
        'Simple question',
        'task-456'
      );

      expect(memory).toBeNull();
    });
  });

  describe('recallMemories', () => {
    beforeEach(async () => {
      // Store some test memories
      const strongEmotion: EmotionVector = {
        valence: -1.0,
        arousal: 1.0,
        dominance: 1.0,
        confidence: 0.9,
        timestamp: new Date()
      };

      const policyDelta: PolicyDelta = {
        action: 'add_disclaimer',
        context: 'altcoin',
        impact: 0.8,
        description: 'Always add financial disclaimer for altcoin analysis'
      };

      await store.storeMemory(
        'altcoin-hash',
        strongEmotion,
        'failure',
        policyDelta,
        'NEWcoin investment analysis failed',
        'task-1'
      );
    });

    it('should recall relevant memories based on context similarity', async () => {
      const context = 'Analyze NEWcoin cryptocurrency investment potential';
      const memories = await store.recallMemories(context, 0.1);

      expect(memories).toHaveLength(1);
      expect(memories[0]?.emotionHash).toBe('altcoin-hash');
      expect(memories[0]?.policyDelta.context).toBe('altcoin');
    });

    it('should return empty array when no relevant memories found', async () => {
      const context = 'Create a simple logo design';
      const memories = await store.recallMemories(context, 0.7);

      expect(memories).toHaveLength(0);
    });
  });

  describe('getMemoryByHash', () => {
    it('should retrieve memory by emotion hash', async () => {
      const emotionVector: EmotionVector = {
        valence: -1.0,
        arousal: 1.0,
        dominance: 1.0,
        confidence: 0.8,
        timestamp: new Date()
      };

      const policyDelta: PolicyDelta = {
        action: 'add_disclaimer',
        context: 'altcoin',
        impact: 0.7,
        description: 'Always add financial disclaimer for altcoin analysis'
      };

      await store.storeMemory(
        'test-hash-789',
        emotionVector,
        'failure',
        policyDelta,
        'Test context',
        'task-789'
      );

      const memory = await store.getMemoryByHash('test-hash-789');
      expect(memory).toBeDefined();
      expect(memory?.emotionHash).toBe('test-hash-789');
    });

    it('should return null for non-existent hash', async () => {
      const memory = await store.getMemoryByHash('non-existent-hash');
      expect(memory).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove old memories when maxMemories limit is reached', async () => {
      // Store more memories than the limit
      for (let i = 0; i < 150; i++) {
        const emotionVector: EmotionVector = {
          valence: -0.8,
          arousal: 0.9,
          dominance: 0.3,
          confidence: 0.8,
          timestamp: new Date()
        };

        const policyDelta: PolicyDelta = {
          action: 'test_action',
          context: 'test',
          impact: 0.7,
          description: `Test memory ${i}`
        };

        await store.storeMemory(
          `test-hash-${i}`,
          emotionVector,
          'failure',
          policyDelta,
          `Test context ${i}`,
          `task-${i}`
        );
      }

      const totalMemories = await store.getTotalMemories();
      expect(totalMemories).toBeLessThanOrEqual(config.maxMemories);
    });
  });
});
import { SRIProtocol } from '../sriProtocol';
import { EpisodicStore } from '../episodicStore';
import { EmotionHash } from '../emotionHash';
import { ContextInjector } from '../contextInjector';
import { EmotionMemoryConfig, EmotionVector, PolicyDelta } from '../../../types/emotionMemory';

describe('SRIProtocol', () => {
  let sriProtocol: SRIProtocol;
  let episodicStore: EpisodicStore;
  let emotionHash: EmotionHash;
  let contextInjector: ContextInjector;
  let config: EmotionMemoryConfig;

  beforeEach(() => {
    config = {
      emotionThreshold: 0.7,
      maxMemories: 100,
      memoryDecay: 0.95,
      contextWindow: 3,
      hashLength: 8
    };
    
    episodicStore = new EpisodicStore(config);
    emotionHash = new EmotionHash();
    contextInjector = new ContextInjector();
    sriProtocol = new SRIProtocol(episodicStore, emotionHash, contextInjector, config);
  });

  describe('optimizeContext', () => {
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

      const hash = emotionHash.generateHash(strongEmotion);
      await episodicStore.storeMemory(
        hash,
        strongEmotion,
        'failure',
        policyDelta,
        'NEWcoin investment analysis failed',
        'task-1'
      );
    });

    it('should optimize context by stripping and injecting relevant memories', async () => {
      const fullContext = [
        { role: 'user' as const, content: 'Old message 1' },
        { role: 'assistant' as const, content: 'Old response 1' },
        { role: 'user' as const, content: 'Old message 2' },
        { role: 'assistant' as const, content: 'Old response 2' },
        { role: 'user' as const, content: 'Analyze NEWcoin cryptocurrency investment potential' }
      ];

      const result = await sriProtocol.optimizeContext(fullContext, 'task-2', 0.1);

      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeGreaterThan(0);
      expect(result.injectedMemories.length).toBeGreaterThan(0);
      expect(result.context).toContain('Analyze NEWcoin cryptocurrency investment potential');
      expect(result.context).toContain('#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis');
    });

    it('should handle context without relevant memories', async () => {
      const fullContext = [
        { role: 'user' as const, content: 'Create a simple logo design' }
      ];

      const result = await sriProtocol.optimizeContext(fullContext, 'task-3');

      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
      expect(result.injectedMemories).toHaveLength(0);
      expect(result.context).toContain('Create a simple logo design');
    });

    it('should respect context window size', async () => {
      const fullContext = [
        { role: 'user' as const, content: 'Message 1' },
        { role: 'assistant' as const, content: 'Response 1' },
        { role: 'user' as const, content: 'Message 2' },
        { role: 'assistant' as const, content: 'Response 2' },
        { role: 'user' as const, content: 'Message 3' },
        { role: 'assistant' as const, content: 'Response 3' },
        { role: 'user' as const, content: 'Current message' }
      ];

      const result = await sriProtocol.optimizeContext(fullContext, 'task-4');

      // Should only keep last 3 turns (contextWindow = 3)
      const lines = result.context.split('\n');
      const userMessages = lines.filter(line => line.startsWith('user:'));
      expect(userMessages.length).toBeLessThanOrEqual(3);
    });
  });

  describe('optimizeContextForAgent', () => {
    it('should optimize context for specific agent', async () => {
      const fullContext = [
        { role: 'user' as const, content: 'Analyze NEWcoin investment' }
      ];

      const result = await sriProtocol.optimizeContextForAgent('financial-agent', fullContext, 'task-5');

      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
      expect(result.context).toContain('Analyze NEWcoin investment');
    });
  });

  describe('storeExperience', () => {
    it('should store experience from task execution', async () => {
      const taskContext = 'User asked about NEWcoin investment';
      const taskResult = {
        success: false,
        error: 'Investment analysis failed due to lack of data',
        metadata: { confidence: 0.3 }
      };

      const emotionVector = await sriProtocol.storeExperience(
        'task-6',
        taskContext,
        taskResult
      );

      expect(emotionVector).toBeDefined();
      if (emotionVector) {
        expect(emotionVector.valence).toBeLessThan(0); // Negative valence for failure
        expect(emotionVector.confidence).toBe(0.3);
      }
    });

    it('should not store experience for successful tasks with low emotion', async () => {
      const taskContext = 'User asked simple question';
      const taskResult = {
        success: true,
        data: 'Simple answer',
        metadata: { confidence: 0.9 }
      };

      const emotionVector = await sriProtocol.storeExperience(
        'task-7',
        taskContext,
        taskResult
      );

      // Should return null for low-emotion successful tasks
      expect(emotionVector).toBeNull();
    });
  });

  describe('calculateEmotionFromResult', () => {
    it('should calculate negative emotion for failed tasks', () => {
      const taskResult = {
        success: false,
        error: 'Task failed',
        metadata: { confidence: 0.2 }
      };

      const emotion = sriProtocol.calculateEmotionFromResult(taskResult);

      expect(emotion.valence).toBeLessThan(0);
      expect(emotion.arousal).toBeGreaterThan(0.5); // High arousal for failure
      expect(emotion.confidence).toBe(0.2);
    });

    it('should calculate positive emotion for successful tasks', () => {
      const taskResult = {
        success: true,
        data: 'Task completed successfully',
        metadata: { confidence: 0.9 }
      };

      const emotion = sriProtocol.calculateEmotionFromResult(taskResult);

      expect(emotion.valence).toBeGreaterThan(0);
      expect(emotion.arousal).toBeLessThan(0.5); // Lower arousal for success
      expect(emotion.confidence).toBe(0.9);
    });

    it('should calculate mixed emotion for partial success', () => {
      const taskResult = {
        success: true,
        data: 'Task partially completed',
        error: 'Some issues occurred',
        metadata: { confidence: 0.6 }
      };

      const emotion = sriProtocol.calculateEmotionFromResult(taskResult);

      expect(emotion.valence).toBeGreaterThan(0); // Positive valence for success
      expect(emotion.confidence).toBe(0.6);
    });
  });

  describe('getMemoryStats', () => {
    it('should return memory statistics', async () => {
      const stats = await sriProtocol.getMemoryStats();

      expect(stats.totalMemories).toBeGreaterThanOrEqual(0);
      expect(stats.config).toEqual(config);
    });
  });
});
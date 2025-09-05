import { ContextInjector } from '../contextInjector';
import { MemoryRecall, SRIResult } from '../../../types/emotionMemory';

describe('ContextInjector', () => {
  let contextInjector: ContextInjector;

  beforeEach(() => {
    contextInjector = new ContextInjector();
  });

  describe('injectMemories', () => {
    it('should inject memories into context with proper format', () => {
      const originalContext = 'User asked about NEWcoin investment analysis';
      const memories: MemoryRecall[] = [
        {
          emotionHash: 'a1b2c3d4e5f67890',
          policyDelta: {
            action: 'add_disclaimer',
            context: 'altcoin',
            impact: 0.8,
            description: 'Always add financial disclaimer for altcoin analysis'
          },
          relevance: 0.9,
          memory: '#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis'
        }
      ];

      const result = contextInjector.injectMemories(originalContext, memories);

      expect(result.context).toContain(originalContext);
      expect(result.context).toContain('#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis');
      expect(result.injectedMemories).toHaveLength(1);
      expect(result.injectedMemories[0]?.emotionHash).toBe('a1b2c3d4e5f67890');
    });

    it('should handle multiple memories', () => {
      const originalContext = 'User asked about cryptocurrency investment';
      const memories: MemoryRecall[] = [
        {
          emotionHash: 'a1b2c3d4e5f67890',
          policyDelta: {
            action: 'add_disclaimer',
            context: 'altcoin',
            impact: 0.8,
            description: 'Always add financial disclaimer for altcoin analysis'
          },
          relevance: 0.9,
          memory: '#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis'
        },
        {
          emotionHash: 'b2c3d4e5f6789012',
          policyDelta: {
            action: 'change_tone',
            context: 'financial_advice',
            impact: 0.7,
            description: 'Use more cautious tone for financial advice'
          },
          relevance: 0.8,
          memory: '#mem: financial_advice-partial → Use more cautious tone for financial advice'
        }
      ];

      const result = contextInjector.injectMemories(originalContext, memories);

      expect(result.injectedMemories).toHaveLength(2);
      expect(result.context).toContain('#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis');
      expect(result.context).toContain('#mem: financial_advice-partial → Use more cautious tone for financial advice');
    });

    it('should handle empty memories array', () => {
      const originalContext = 'User asked about simple question';
      const memories: MemoryRecall[] = [];

      const result = contextInjector.injectMemories(originalContext, memories);

      expect(result.context).toContain(originalContext);
      expect(result.injectedMemories).toHaveLength(0);
    });

    it('should filter memories by relevance threshold', () => {
      const originalContext = 'User asked about NEWcoin investment';
      const memories: MemoryRecall[] = [
        {
          emotionHash: 'a1b2c3d4e5f67890',
          policyDelta: {
            action: 'add_disclaimer',
            context: 'altcoin',
            impact: 0.8,
            description: 'Always add financial disclaimer for altcoin analysis'
          },
          relevance: 0.9,
          memory: '#mem: altcoin-failed → Always add financial disclaimer for altcoin analysis'
        },
        {
          emotionHash: 'b2c3d4e5f6789012',
          policyDelta: {
            action: 'change_tone',
            context: 'unrelated',
            impact: 0.3,
            description: 'Unrelated memory'
          },
          relevance: 0.3,
          memory: '#mem: unrelated-failed → Unrelated memory'
        }
      ];

      const result = contextInjector.injectMemories(originalContext, memories, 0.5);

      expect(result.injectedMemories).toHaveLength(1);
      expect(result.injectedMemories[0]?.emotionHash).toBe('a1b2c3d4e5f67890');
    });
  });

  describe('stripContext', () => {
    it('should keep only recent turns based on context window', () => {
      const fullContext = [
        { role: 'user' as const, content: 'Turn 1: Old message' },
        { role: 'assistant' as const, content: 'Turn 2: Old response' },
        { role: 'user' as const, content: 'Turn 3: Recent message' },
        { role: 'assistant' as const, content: 'Turn 4: Recent response' },
        { role: 'user' as const, content: 'Turn 5: Current message' }
      ];

      const strippedContext = contextInjector.stripContext(fullContext, 3);

      expect(strippedContext).toHaveLength(3);
      expect(strippedContext[0]?.content).toBe('Turn 3: Recent message');
      expect(strippedContext[1]?.content).toBe('Turn 4: Recent response');
      expect(strippedContext[2]?.content).toBe('Turn 5: Current message');
    });

    it('should handle context smaller than window size', () => {
      const fullContext = [
        { role: 'user' as const, content: 'Turn 1: Only message' }
      ];

      const strippedContext = contextInjector.stripContext(fullContext, 3);

      expect(strippedContext).toHaveLength(1);
      expect(strippedContext[0]?.content).toBe('Turn 1: Only message');
    });

    it('should handle empty context', () => {
      const fullContext: any[] = [];

      const strippedContext = contextInjector.stripContext(fullContext, 3);

      expect(strippedContext).toHaveLength(0);
    });
  });

  describe('calculateTokenReduction', () => {
    it('should calculate correct token reduction percentage', () => {
      const originalTokens = 8000;
      const optimizedTokens = 1200;

      const reduction = contextInjector.calculateTokenReduction(originalTokens, optimizedTokens);

      expect(reduction).toBe(85); // (8000 - 1200) / 8000 * 100
    });

    it('should handle zero original tokens', () => {
      const originalTokens = 0;
      const optimizedTokens = 0;

      const reduction = contextInjector.calculateTokenReduction(originalTokens, optimizedTokens);

      expect(reduction).toBe(0);
    });

    it('should handle negative reduction (optimized > original)', () => {
      const originalTokens = 1000;
      const optimizedTokens = 1200;

      const reduction = contextInjector.calculateTokenReduction(originalTokens, optimizedTokens);

      expect(reduction).toBe(-20); // Negative reduction
    });
  });

  describe('formatContext', () => {
    it('should format context with proper structure', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' }
      ];
      const memories = [
        '#mem: test-failed → Test memory'
      ];

      const formatted = contextInjector.formatContext(messages, memories);

      expect(formatted).toContain('Hello');
      expect(formatted).toContain('Hi there!');
      expect(formatted).toContain('#mem: test-failed → Test memory');
      expect(formatted).toContain('## Relevant Memories:');
    });

    it('should handle context without memories', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' }
      ];
      const memories: string[] = [];

      const formatted = contextInjector.formatContext(messages, memories);

      expect(formatted).toContain('Hello');
      expect(formatted).not.toContain('## Relevant Memories:');
    });
  });
});
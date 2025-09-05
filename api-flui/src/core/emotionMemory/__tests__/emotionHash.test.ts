import { EmotionHash } from '../emotionHash';
import { EmotionVector } from '../../../types/emotionMemory';

describe('EmotionHash', () => {
  let emotionHash: EmotionHash;

  beforeEach(() => {
    emotionHash = new EmotionHash();
  });

  describe('generateHash', () => {
    it('should generate consistent hash for same emotion vector', () => {
      const emotionVector: EmotionVector = {
        valence: -0.8,
        arousal: 0.9,
        dominance: 0.3,
        confidence: 0.8,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const hash1 = emotionHash.generateHash(emotionVector);
      const hash2 = emotionHash.generateHash(emotionVector);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16); // 8 bytes = 16 hex chars
    });

    it('should generate different hashes for different emotion vectors', () => {
      const emotionVector1: EmotionVector = {
        valence: -0.8,
        arousal: 0.9,
        dominance: 0.3,
        confidence: 0.8,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const emotionVector2: EmotionVector = {
        valence: 0.8,
        arousal: 0.9,
        dominance: 0.3,
        confidence: 0.8,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const hash1 = emotionHash.generateHash(emotionVector1);
      const hash2 = emotionHash.generateHash(emotionVector2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different timestamps', () => {
      const emotionVector: EmotionVector = {
        valence: -0.8,
        arousal: 0.9,
        dominance: 0.3,
        confidence: 0.8,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const emotionVector2: EmotionVector = {
        ...emotionVector,
        timestamp: new Date('2024-01-01T10:01:00Z')
      };

      const hash1 = emotionHash.generateHash(emotionVector);
      const hash2 = emotionHash.generateHash(emotionVector2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash with correct format (hex string)', () => {
      const emotionVector: EmotionVector = {
        valence: -0.8,
        arousal: 0.9,
        dominance: 0.3,
        confidence: 0.8,
        timestamp: new Date()
      };

      const hash = emotionHash.generateHash(emotionVector);

      expect(hash).toMatch(/^[0-9a-f]{16}$/); // 16 hex characters
    });
  });

  describe('generateHashFromContext', () => {
    it('should generate hash from context string', () => {
      const context = 'User asked about NEWcoin investment analysis';
      const hash = emotionHash.generateHashFromContext(context);

      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should generate consistent hash for same context', () => {
      const context = 'User asked about NEWcoin investment analysis';
      
      const hash1 = emotionHash.generateHashFromContext(context);
      const hash2 = emotionHash.generateHashFromContext(context);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different contexts', () => {
      const context1 = 'User asked about NEWcoin investment analysis';
      const context2 = 'User asked about Bitcoin investment analysis';

      const hash1 = emotionHash.generateHashFromContext(context1);
      const hash2 = emotionHash.generateHashFromContext(context2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateHash', () => {
    it('should validate correct hash format', () => {
      const validHash = 'a1b2c3d4e5f67890';
      expect(emotionHash.validateHash(validHash)).toBe(true);
    });

    it('should reject invalid hash format', () => {
      const invalidHashes = [
        'a1b2c3d4e5f6789',  // Too short
        'a1b2c3d4e5f678901', // Too long
        'a1b2c3d4e5f6789g',  // Invalid character
        'A1B2C3D4E5F67890',  // Uppercase
        '',                  // Empty
        'not-a-hash'        // Not hex
      ];

      for (const invalidHash of invalidHashes) {
        expect(emotionHash.validateHash(invalidHash)).toBe(false);
      }
    });
  });

  describe('hashCollision', () => {
    it('should have very low collision probability', () => {
      const hashes = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const emotionVector: EmotionVector = {
          valence: Math.random() * 2 - 1,
          arousal: Math.random(),
          dominance: Math.random(),
          confidence: Math.random(),
          timestamp: new Date(Date.now() + i)
        };

        const hash = emotionHash.generateHash(emotionVector);
        hashes.add(hash);
      }

      // Should have very few collisions (all unique hashes)
      expect(hashes.size).toBe(iterations);
    });
  });
});
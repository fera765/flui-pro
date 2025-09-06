import { injectable } from 'inversify';
import * as crypto from 'crypto';
import { IEmotionHashGenerator, EmotionVector } from '../interfaces/IEmotionMemory';

@injectable()
export class EmotionHashGenerator implements IEmotionHashGenerator {
  
  generateHash(emotionVector: EmotionVector): string {
    // Create a normalized string representation of the emotion vector
    const vectorString = this.normalizeEmotionVector(emotionVector);
    
    // Generate SHA-256 hash and take first 8 bytes (16 hex characters)
    const hash = crypto.createHash('sha256').update(vectorString).digest('hex');
    
    // Return first 16 characters (8 bytes) as emotion hash
    return hash.substring(0, 16);
  }

  validateHash(hash: string): boolean {
    // Validate that hash is exactly 16 characters (8 bytes) and contains only hex
    return /^[a-f0-9]{16}$/i.test(hash);
  }

  private normalizeEmotionVector(emotionVector: EmotionVector): string {
    // Normalize each component to 3 decimal places for consistency
    const normalized = {
      valence: this.roundToDecimals(emotionVector.valence, 3),
      arousal: this.roundToDecimals(emotionVector.arousal, 3),
      dominance: this.roundToDecimals(emotionVector.dominance, 3),
      confidence: this.roundToDecimals(emotionVector.confidence, 3),
      regret: this.roundToDecimals(emotionVector.regret, 3),
      satisfaction: this.roundToDecimals(emotionVector.satisfaction, 3)
    };

    // Create a deterministic string representation
    return `v:${normalized.valence},a:${normalized.arousal},d:${normalized.dominance},c:${normalized.confidence},r:${normalized.regret},s:${normalized.satisfaction}`;
  }

  private roundToDecimals(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Calculate emotional intensity (magnitude of the emotion vector)
   */
  calculateEmotionalIntensity(emotionVector: EmotionVector): number {
    const components = [
      emotionVector.valence,
      emotionVector.arousal,
      emotionVector.dominance,
      emotionVector.confidence,
      emotionVector.regret,
      emotionVector.satisfaction
    ];

    // Calculate Euclidean norm (magnitude)
    const sumOfSquares = components.reduce((sum, component) => sum + Math.pow(component, 2), 0);
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Check if emotion vector meets threshold for memory storage
   */
  meetsThreshold(emotionVector: EmotionVector, threshold: number = 0.7): boolean {
    return this.calculateEmotionalIntensity(emotionVector) >= threshold;
  }
}
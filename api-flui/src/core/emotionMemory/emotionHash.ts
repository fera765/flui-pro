import { EmotionVector } from '../../types/emotionMemory';
import { createHash } from 'crypto';

export class EmotionHash {
  private readonly hashLength: number = 8; // 8 bytes = 16 hex characters

  /**
   * Generate BLAKE3 hash from emotion vector
   */
  generateHash(emotionVector: EmotionVector): string {
    // Create a deterministic string representation of the emotion vector
    const emotionString = this.serializeEmotionVector(emotionVector);
    
    // Use BLAKE3 (or SHA-256 as fallback) to generate hash
    const hash = createHash('sha256').update(emotionString).digest();
    
    // Take first 8 bytes and convert to hex
    return hash.slice(0, this.hashLength).toString('hex');
  }

  /**
   * Generate hash from context string
   */
  generateHashFromContext(context: string): string {
    // Normalize context: lowercase, trim, remove extra spaces
    const normalizedContext = context.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Generate hash
    const hash = createHash('sha256').update(normalizedContext).digest();
    
    // Take first 8 bytes and convert to hex
    return hash.slice(0, this.hashLength).toString('hex');
  }

  /**
   * Validate hash format
   */
  validateHash(hash: string): boolean {
    // Check if hash is exactly 16 hex characters (8 bytes)
    return /^[0-9a-f]{16}$/.test(hash);
  }

  /**
   * Serialize emotion vector to deterministic string
   */
  private serializeEmotionVector(emotionVector: EmotionVector): string {
    // Round to 3 decimal places to ensure consistency
    const valence = Math.round(emotionVector.valence * 1000) / 1000;
    const arousal = Math.round(emotionVector.arousal * 1000) / 1000;
    const dominance = Math.round(emotionVector.dominance * 1000) / 1000;
    const confidence = Math.round(emotionVector.confidence * 1000) / 1000;
    
    // Use ISO timestamp for consistency
    const timestamp = emotionVector.timestamp.toISOString();
    
    return `v:${valence},a:${arousal},d:${dominance},c:${confidence},t:${timestamp}`;
  }

  /**
   * Generate hash from multiple emotion vectors (for composite emotions)
   */
  generateCompositeHash(emotionVectors: EmotionVector[]): string {
    const serializedVectors = emotionVectors
      .map(v => this.serializeEmotionVector(v))
      .sort() // Sort to ensure deterministic order
      .join('|');
    
    const hash = createHash('sha256').update(serializedVectors).digest();
    return hash.slice(0, this.hashLength).toString('hex');
  }

  /**
   * Generate hash from emotion vector and context
   */
  generateContextualHash(emotionVector: EmotionVector, context: string): string {
    const emotionString = this.serializeEmotionVector(emotionVector);
    const normalizedContext = context.toLowerCase().trim().replace(/\s+/g, ' ');
    
    const combined = `${emotionString}|${normalizedContext}`;
    const hash = createHash('sha256').update(combined).digest();
    
    return hash.slice(0, this.hashLength).toString('hex');
  }
}
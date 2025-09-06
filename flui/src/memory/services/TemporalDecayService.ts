import { injectable } from 'inversify';
import { EpisodicMemory, EmotionVector } from '../interfaces/IEmotionMemory';

export interface DecayConfiguration {
  halfLife: number;           // Tempo para memória perder 50% da intensidade (ms)
  minIntensity: number;       // Intensidade mínima antes de remover (0.0-1.0)
  decayFunction: 'exponential' | 'linear' | 'logarithmic';
  accessBoost: number;        // Boost por acesso (0.0-1.0)
  timeDecayFactor: number;    // Fator de decaimento temporal (0.0-1.0)
}

@injectable()
export class TemporalDecayService {
  private readonly defaultConfig: DecayConfiguration = {
    halfLife: 7 * 24 * 60 * 60 * 1000, // 7 dias
    minIntensity: 0.1,
    decayFunction: 'exponential',
    accessBoost: 0.1,
    timeDecayFactor: 0.5
  };

  /**
   * Aplica decay temporal a uma memória
   */
  applyTemporalDecay(
    memory: EpisodicMemory,
    config: DecayConfiguration = this.defaultConfig
  ): {
    shouldRemove: boolean;
    decayedIntensity: number;
    accessBoost: number;
  } {
    const currentTime = Date.now();
    const age = currentTime - memory.timestamp;
    const lastAccessAge = currentTime - memory.lastAccessed;

    // Calcular decay baseado na idade
    const timeDecay = this.calculateTimeDecay(age, config);
    
    // Calcular boost baseado em acessos
    const accessBoost = this.calculateAccessBoost(memory.accessCount, config);
    
    // Calcular intensidade original
    const originalIntensity = this.calculateEmotionalIntensity(memory.emotionVector);
    
    // Aplicar decay e boost
    const decayedIntensity = Math.max(0, originalIntensity * timeDecay + accessBoost);
    
    // Decidir se deve remover
    const shouldRemove = decayedIntensity < config.minIntensity;
    
    return {
      shouldRemove,
      decayedIntensity,
      accessBoost
    };
  }

  /**
   * Aplica decay a múltiplas memórias
   */
  applyBulkDecay(
    memories: EpisodicMemory[],
    config: DecayConfiguration = this.defaultConfig
  ): {
    activeMemories: EpisodicMemory[];
    removedMemories: EpisodicMemory[];
    decayStats: {
      totalProcessed: number;
      totalRemoved: number;
      averageDecay: number;
      averageAccessBoost: number;
    };
  } {
    const activeMemories: EpisodicMemory[] = [];
    const removedMemories: EpisodicMemory[] = [];
    let totalDecay = 0;
    let totalAccessBoost = 0;

    for (const memory of memories) {
      const decayResult = this.applyTemporalDecay(memory, config);
      
      totalDecay += decayResult.decayedIntensity;
      totalAccessBoost += decayResult.accessBoost;
      
      if (decayResult.shouldRemove) {
        removedMemories.push(memory);
      } else {
        // Atualizar intensidade emocional baseada no decay
        const updatedMemory = this.updateMemoryIntensity(memory, decayResult.decayedIntensity);
        activeMemories.push(updatedMemory);
      }
    }

    return {
      activeMemories,
      removedMemories,
      decayStats: {
        totalProcessed: memories.length,
        totalRemoved: removedMemories.length,
        averageDecay: memories.length > 0 ? totalDecay / memories.length : 0,
        averageAccessBoost: memories.length > 0 ? totalAccessBoost / memories.length : 0
      }
    };
  }

  /**
   * Calcula decay baseado no tempo
   */
  private calculateTimeDecay(age: number, config: DecayConfiguration): number {
    const halfLife = config.halfLife;
    
    switch (config.decayFunction) {
      case 'exponential':
        return Math.pow(2, -age / halfLife);
      
      case 'linear':
        return Math.max(0, 1 - (age / (halfLife * 2)));
      
      case 'logarithmic':
        return Math.max(0, 1 - Math.log(1 + age / halfLife) / Math.log(2));
      
      default:
        return Math.pow(2, -age / halfLife);
    }
  }

  /**
   * Calcula boost baseado em acessos
   */
  private calculateAccessBoost(accessCount: number, config: DecayConfiguration): number {
    if (accessCount === 0) return 0;
    
    // Boost logarítmico para evitar crescimento excessivo
    return Math.min(config.accessBoost, Math.log(1 + accessCount) * config.accessBoost);
  }

  /**
   * Atualiza intensidade emocional da memória
   */
  private updateMemoryIntensity(memory: EpisodicMemory, newIntensity: number): EpisodicMemory {
    const originalIntensity = this.calculateEmotionalIntensity(memory.emotionVector);
    const scaleFactor = originalIntensity > 0 ? newIntensity / originalIntensity : 1;
    
    // Escalar todos os componentes do vetor emocional
    const scaledVector: EmotionVector = {
      valence: memory.emotionVector.valence * scaleFactor,
      arousal: memory.emotionVector.arousal * scaleFactor,
      dominance: memory.emotionVector.dominance * scaleFactor,
      confidence: memory.emotionVector.confidence * scaleFactor,
      regret: memory.emotionVector.regret * scaleFactor,
      satisfaction: memory.emotionVector.satisfaction * scaleFactor
    };
    
    return {
      ...memory,
      emotionVector: scaledVector
    };
  }

  /**
   * Calcula intensidade emocional
   */
  private calculateEmotionalIntensity(emotionVector: EmotionVector): number {
    const components = [
      emotionVector.valence,
      emotionVector.arousal,
      emotionVector.dominance,
      emotionVector.confidence,
      emotionVector.regret,
      emotionVector.satisfaction
    ];

    const sumOfSquares = components.reduce((sum, component) => sum + Math.pow(component, 2), 0);
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Cria configuração personalizada de decay
   */
  createCustomConfig(overrides: Partial<DecayConfiguration>): DecayConfiguration {
    return {
      ...this.defaultConfig,
      ...overrides
    };
  }

  /**
   * Calcula estatísticas de decay para um conjunto de memórias
   */
  calculateDecayStatistics(memories: EpisodicMemory[]): {
    averageAge: number;
    oldestMemory: number;
    newestMemory: number;
    totalAccesses: number;
    averageIntensity: number;
    decayDistribution: {
      high: number;    // > 0.7
      medium: number;  // 0.3-0.7
      low: number;     // < 0.3
    };
  } {
    if (memories.length === 0) {
      return {
        averageAge: 0,
        oldestMemory: 0,
        newestMemory: 0,
        totalAccesses: 0,
        averageIntensity: 0,
        decayDistribution: { high: 0, medium: 0, low: 0 }
      };
    }

    const currentTime = Date.now();
    const ages = memories.map(m => currentTime - m.timestamp);
    const intensities = memories.map(m => this.calculateEmotionalIntensity(m.emotionVector));
    const accesses = memories.map(m => m.accessCount);

    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const oldestMemory = Math.max(...ages);
    const newestMemory = Math.min(...ages);
    const totalAccesses = accesses.reduce((sum, access) => sum + access, 0);
    const averageIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;

    const decayDistribution = {
      high: intensities.filter(i => i > 0.7).length,
      medium: intensities.filter(i => i >= 0.3 && i <= 0.7).length,
      low: intensities.filter(i => i < 0.3).length
    };

    return {
      averageAge,
      oldestMemory,
      newestMemory,
      totalAccesses,
      averageIntensity,
      decayDistribution
    };
  }
}
import { injectable } from 'inversify';
import { EpisodicMemory, EmotionVector } from '../interfaces/IEmotionMemory';

export interface MemoryCluster {
  id: string;
  centroid: EmotionVector;
  memories: EpisodicMemory[];
  size: number;
  averageIntensity: number;
  dominantContext: string;
  lastUpdated: number;
  accessCount: number;
}

export interface ClusteringConfiguration {
  maxClusters: number;
  minClusterSize: number;
  similarityThreshold: number;
  maxIterations: number;
  convergenceThreshold: number;
}

@injectable()
export class MemoryClusteringService {
  private readonly defaultConfig: ClusteringConfiguration = {
    maxClusters: 10,
    minClusterSize: 2,
    similarityThreshold: 0.7,
    maxIterations: 100,
    convergenceThreshold: 0.01
  };

  /**
   * Agrupa memórias em clusters baseado em similaridade emocional
   */
  clusterMemories(
    memories: EpisodicMemory[],
    config: ClusteringConfiguration = this.defaultConfig
  ): {
    clusters: MemoryCluster[];
    unclustered: EpisodicMemory[];
    clusteringStats: {
      totalMemories: number;
      clusteredMemories: number;
      unclusteredMemories: number;
      averageClusterSize: number;
      clusteringQuality: number;
    };
  } {
    if (memories.length < config.minClusterSize) {
      return {
        clusters: [],
        unclustered: memories,
        clusteringStats: {
          totalMemories: memories.length,
          clusteredMemories: 0,
          unclusteredMemories: memories.length,
          averageClusterSize: 0,
          clusteringQuality: 0
        }
      };
    }

    // Executar clustering hierárquico
    const clusters = this.performHierarchicalClustering(memories, config);
    
    // Filtrar clusters por tamanho mínimo
    const validClusters = clusters.filter(cluster => cluster.size >= config.minClusterSize);
    const unclustered = this.findUnclusteredMemories(memories, validClusters);
    
    // Calcular estatísticas
    const clusteringStats = this.calculateClusteringStats(memories, validClusters, unclustered);
    
    return {
      clusters: validClusters,
      unclustered,
      clusteringStats
    };
  }

  /**
   * Encontra memórias similares a uma memória específica
   */
  findSimilarMemories(
    targetMemory: EpisodicMemory,
    memories: EpisodicMemory[],
    threshold: number = 0.7
  ): {
    similar: EpisodicMemory[];
    similarities: Array<{ memory: EpisodicMemory; similarity: number }>;
  } {
    const similarities: Array<{ memory: EpisodicMemory; similarity: number }> = [];
    
    for (const memory of memories) {
      if (memory.id === targetMemory.id) continue;
      
      const similarity = this.calculateEmotionalSimilarity(
        targetMemory.emotionVector,
        memory.emotionVector
      );
      
      if (similarity >= threshold) {
        similarities.push({ memory, similarity });
      }
    }
    
    // Ordenar por similaridade (maior primeiro)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return {
      similar: similarities.map(s => s.memory),
      similarities
    };
  }

  /**
   * Atualiza clusters existentes com novas memórias
   */
  updateClusters(
    existingClusters: MemoryCluster[],
    newMemories: EpisodicMemory[],
    config: ClusteringConfiguration = this.defaultConfig
  ): {
    updatedClusters: MemoryCluster[];
    newClusters: MemoryCluster[];
    unclustered: EpisodicMemory[];
  } {
    const updatedClusters: MemoryCluster[] = [];
    const unclustered: EpisodicMemory[] = [];
    
    for (const memory of newMemories) {
      let assigned = false;
      
      // Tentar atribuir a cluster existente
      for (const cluster of existingClusters) {
        const similarity = this.calculateEmotionalSimilarity(
          memory.emotionVector,
          cluster.centroid
        );
        
        if (similarity >= config.similarityThreshold) {
          // Atualizar cluster existente
          const updatedCluster = this.addMemoryToCluster(cluster, memory);
          updatedClusters.push(updatedCluster);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        unclustered.push(memory);
      }
    }
    
    // Criar novos clusters para memórias não atribuídas
    const newClusters = this.createClustersFromUnclustered(unclustered, config);
    
    return {
      updatedClusters,
      newClusters,
      unclustered: unclustered.filter(m => 
        !newClusters.some(c => c.memories.some(cm => cm.id === m.id))
      )
    };
  }

  /**
   * Executa clustering hierárquico
   */
  private performHierarchicalClustering(
    memories: EpisodicMemory[],
    config: ClusteringConfiguration
  ): MemoryCluster[] {
    // Inicializar cada memória como um cluster
    let clusters: MemoryCluster[] = memories.map(memory => ({
      id: `cluster_${memory.id}`,
      centroid: { ...memory.emotionVector },
      memories: [memory],
      size: 1,
      averageIntensity: this.calculateEmotionalIntensity(memory.emotionVector),
      dominantContext: this.extractDominantContext(memory),
      lastUpdated: Date.now(),
      accessCount: memory.accessCount
    }));
    
    // Iterar até convergência ou limite de iterações
    for (let iteration = 0; iteration < config.maxIterations; iteration++) {
      const bestMerge = this.findBestMerge(clusters, config);
      
      if (!bestMerge || bestMerge.similarity < config.similarityThreshold) {
        break;
      }
      
      // Mesclar clusters
      const mergedCluster = this.mergeClusters(bestMerge.cluster1, bestMerge.cluster2);
      clusters = clusters.filter(c => 
        c.id !== bestMerge.cluster1.id && c.id !== bestMerge.cluster2.id
      );
      clusters.push(mergedCluster);
    }
    
    return clusters;
  }

  /**
   * Encontra a melhor mesclagem entre clusters
   */
  private findBestMerge(
    clusters: MemoryCluster[],
    config: ClusteringConfiguration
  ): { cluster1: MemoryCluster; cluster2: MemoryCluster; similarity: number } | null {
    let bestMerge: { cluster1: MemoryCluster; cluster2: MemoryCluster; similarity: number } | null = null;
    let bestSimilarity = 0;
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const similarity = this.calculateEmotionalSimilarity(
          clusters[i].centroid,
          clusters[j].centroid
        );
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMerge = {
            cluster1: clusters[i],
            cluster2: clusters[j],
            similarity
          };
        }
      }
    }
    
    return bestMerge;
  }

  /**
   * Mescla dois clusters
   */
  private mergeClusters(cluster1: MemoryCluster, cluster2: MemoryCluster): MemoryCluster {
    const allMemories = [...cluster1.memories, ...cluster2.memories];
    const newCentroid = this.calculateCentroid(allMemories.map(m => m.emotionVector));
    
    return {
      id: `merged_${Date.now()}`,
      centroid: newCentroid,
      memories: allMemories,
      size: allMemories.length,
      averageIntensity: allMemories.reduce((sum, m) => 
        sum + this.calculateEmotionalIntensity(m.emotionVector), 0
      ) / allMemories.length,
      dominantContext: this.extractDominantContextFromMemories(allMemories),
      lastUpdated: Date.now(),
      accessCount: cluster1.accessCount + cluster2.accessCount
    };
  }

  /**
   * Calcula similaridade emocional entre dois vetores
   */
  private calculateEmotionalSimilarity(vector1: EmotionVector, vector2: EmotionVector): number {
    const components1 = [
      vector1.valence, vector1.arousal, vector1.dominance,
      vector1.confidence, vector1.regret, vector1.satisfaction
    ];
    
    const components2 = [
      vector2.valence, vector2.arousal, vector2.dominance,
      vector2.confidence, vector2.regret, vector2.satisfaction
    ];
    
    // Calcular similaridade do cosseno
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < components1.length; i++) {
      dotProduct += components1[i] * components2[i];
      norm1 += components1[i] * components1[i];
      norm2 += components2[i] * components2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Calcula centroide de um conjunto de vetores emocionais
   */
  private calculateCentroid(vectors: EmotionVector[]): EmotionVector {
    if (vectors.length === 0) {
      return {
        valence: 0, arousal: 0, dominance: 0,
        confidence: 0, regret: 0, satisfaction: 0
      };
    }
    
    const sum = vectors.reduce((acc, vector) => ({
      valence: acc.valence + vector.valence,
      arousal: acc.arousal + vector.arousal,
      dominance: acc.dominance + vector.dominance,
      confidence: acc.confidence + vector.confidence,
      regret: acc.regret + vector.regret,
      satisfaction: acc.satisfaction + vector.satisfaction
    }), { valence: 0, arousal: 0, dominance: 0, confidence: 0, regret: 0, satisfaction: 0 });
    
    return {
      valence: sum.valence / vectors.length,
      arousal: sum.arousal / vectors.length,
      dominance: sum.dominance / vectors.length,
      confidence: sum.confidence / vectors.length,
      regret: sum.regret / vectors.length,
      satisfaction: sum.satisfaction / vectors.length
    };
  }

  /**
   * Calcula intensidade emocional
   */
  private calculateEmotionalIntensity(emotionVector: EmotionVector): number {
    const components = [
      emotionVector.valence, emotionVector.arousal, emotionVector.dominance,
      emotionVector.confidence, emotionVector.regret, emotionVector.satisfaction
    ];

    const sumOfSquares = components.reduce((sum, component) => sum + Math.pow(component, 2), 0);
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Extrai contexto dominante de uma memória
   */
  private extractDominantContext(memory: EpisodicMemory): string {
    return memory.policyDelta.context || 'unknown';
  }

  /**
   * Extrai contexto dominante de múltiplas memórias
   */
  private extractDominantContextFromMemories(memories: EpisodicMemory[]): string {
    const contextCounts: Record<string, number> = {};
    
    for (const memory of memories) {
      const context = memory.policyDelta.context || 'unknown';
      contextCounts[context] = (contextCounts[context] || 0) + 1;
    }
    
    return Object.entries(contextCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }

  /**
   * Encontra memórias não agrupadas
   */
  private findUnclusteredMemories(
    allMemories: EpisodicMemory[],
    clusters: MemoryCluster[]
  ): EpisodicMemory[] {
    const clusteredMemoryIds = new Set(
      clusters.flatMap(cluster => cluster.memories.map(m => m.id))
    );
    
    return allMemories.filter(memory => !clusteredMemoryIds.has(memory.id));
  }

  /**
   * Cria clusters a partir de memórias não agrupadas
   */
  private createClustersFromUnclustered(
    unclustered: EpisodicMemory[],
    config: ClusteringConfiguration
  ): MemoryCluster[] {
    if (unclustered.length < config.minClusterSize) {
      return [];
    }
    
    return this.performHierarchicalClustering(unclustered, config);
  }

  /**
   * Adiciona memória a um cluster existente
   */
  private addMemoryToCluster(cluster: MemoryCluster, memory: EpisodicMemory): MemoryCluster {
    const updatedMemories = [...cluster.memories, memory];
    const newCentroid = this.calculateCentroid(updatedMemories.map(m => m.emotionVector));
    
    return {
      ...cluster,
      centroid: newCentroid,
      memories: updatedMemories,
      size: updatedMemories.length,
      averageIntensity: updatedMemories.reduce((sum, m) => 
        sum + this.calculateEmotionalIntensity(m.emotionVector), 0
      ) / updatedMemories.length,
      lastUpdated: Date.now(),
      accessCount: cluster.accessCount + memory.accessCount
    };
  }

  /**
   * Calcula estatísticas de clustering
   */
  private calculateClusteringStats(
    totalMemories: EpisodicMemory[],
    clusters: MemoryCluster[],
    unclustered: EpisodicMemory[]
  ): {
    totalMemories: number;
    clusteredMemories: number;
    unclusteredMemories: number;
    averageClusterSize: number;
    clusteringQuality: number;
  } {
    const clusteredMemories = clusters.reduce((sum, cluster) => sum + cluster.size, 0);
    const averageClusterSize = clusters.length > 0 ? clusteredMemories / clusters.length : 0;
    
    // Calcular qualidade do clustering (coesão interna)
    const clusteringQuality = this.calculateClusteringQuality(clusters);
    
    return {
      totalMemories: totalMemories.length,
      clusteredMemories,
      unclusteredMemories: unclustered.length,
      averageClusterSize,
      clusteringQuality
    };
  }

  /**
   * Calcula qualidade do clustering
   */
  private calculateClusteringQuality(clusters: MemoryCluster[]): number {
    if (clusters.length === 0) return 0;
    
    let totalCohesion = 0;
    
    for (const cluster of clusters) {
      if (cluster.memories.length <= 1) continue;
      
      let clusterCohesion = 0;
      for (const memory of cluster.memories) {
        const similarity = this.calculateEmotionalSimilarity(
          memory.emotionVector,
          cluster.centroid
        );
        clusterCohesion += similarity;
      }
      
      totalCohesion += clusterCohesion / cluster.memories.length;
    }
    
    return totalCohesion / clusters.length;
  }
}
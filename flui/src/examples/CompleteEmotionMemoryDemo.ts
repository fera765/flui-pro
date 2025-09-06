import { container } from '../config/container';
import { IEmotionMemory } from '../memory/interfaces/IEmotionMemory';
import { ILlmService } from '../interfaces/ILlmService';
import { TemporalDecayService } from '../memory/services/TemporalDecayService';
import { MemoryClusteringService } from '../memory/services/MemoryClusteringService';
import { LLMEmotionAnalysisService } from '../memory/services/LLMEmotionAnalysisService';

/**
 * Demonstração completa do sistema de memória emocional Flui
 * Inclui todas as funcionalidades: SRI, Decay Temporal, Clustering e Análise LLM
 */
export class CompleteEmotionMemoryDemo {
  private emotionMemory: IEmotionMemory;
  private llmService: ILlmService;
  private temporalDecayService: TemporalDecayService;
  private clusteringService: MemoryClusteringService;
  private llmAnalysisService: LLMEmotionAnalysisService;

  constructor() {
    this.emotionMemory = container.get<IEmotionMemory>('IEmotionMemory');
    this.llmService = container.get<ILlmService>('ILlmService');
    this.temporalDecayService = container.get<TemporalDecayService>('TemporalDecayService');
    this.clusteringService = container.get<MemoryClusteringService>('MemoryClusteringService');
    this.llmAnalysisService = container.get<LLMEmotionAnalysisService>('LLMEmotionAnalysisService');
  }

  /**
   * Demonstração completa do sistema
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 INICIANDO DEMONSTRAÇÃO COMPLETA DO SISTEMA DE MEMÓRIA EMOCIONAL FLUI');
    console.log('=' .repeat(80));
    
    try {
      // 1. Teste de conexão LLM
      await this.testLLMConnection();
      
      // 2. Demonstração do protocolo SRI
      await this.demonstrateSRIProtocol();
      
      // 3. Demonstração de análise emocional
      await this.demonstrateEmotionalAnalysis();
      
      // 4. Demonstração de armazenamento de memória
      await this.demonstrateMemoryStorage();
      
      // 5. Demonstração de decay temporal
      await this.demonstrateTemporalDecay();
      
      // 6. Demonstração de clustering
      await this.demonstrateMemoryClustering();
      
      // 7. Demonstração de otimização completa
      await this.demonstrateCompleteOptimization();
      
      // 8. Estatísticas finais
      await this.showFinalStatistics();
      
    } catch (error) {
      console.error('❌ Erro na demonstração:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n✅ DEMONSTRAÇÃO COMPLETA FINALIZADA!');
    console.log('=' .repeat(80));
  }

  /**
   * Testa conexão com LLM
   */
  private async testLLMConnection(): Promise<void> {
    console.log('\n🔌 TESTANDO CONEXÃO COM LLM');
    console.log('-'.repeat(40));
    
    const isConnected = await this.llmService.isConnected();
    
    if (isConnected) {
      console.log('✅ LLM conectada com sucesso!');
      
      try {
        const response = await this.llmService.generateResponse('Hello, how are you?');
        console.log('🤖 Resposta da LLM:', response.substring(0, 100) + '...');
      } catch (error) {
        console.log('⚠️ Erro na resposta da LLM:', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      console.log('⚠️ LLM não conectada - usando fallbacks');
    }
  }

  /**
   * Demonstra protocolo SRI
   */
  private async demonstrateSRIProtocol(): Promise<void> {
    console.log('\n🔄 DEMONSTRANDO PROTOCOLO SRI (Strip-Recall-Inject)');
    console.log('-'.repeat(50));
    
    const originalContext = `
User: Faça uma análise de investimento sobre NEWcoin
Assistant: Vou analisar NEWcoin para você. Esta é uma nova criptomoeda com potencial de crescimento.

User: Quais são os principais riscos?
Assistant: Os principais riscos incluem alta volatilidade, regulamentação incerta e competição no mercado.

User: E as oportunidades?
Assistant: As oportunidades incluem adoção crescente, tecnologia inovadora e mercado em expansão.

User: Qual sua recomendação final?
Assistant: Baseado na análise, recomendo cautela e diversificação. Sempre adicione disclaimers sobre volatilidade.
    `.trim();

    console.log(`📊 Contexto original: ${this.estimateTokens(originalContext)} tokens`);
    
    const sriResult = await this.emotionMemory.executeSRIProtocol(originalContext, 0.7, 2);
    
    console.log(`📉 Contexto processado: ${this.estimateTokens(sriResult.processedContext)} tokens`);
    console.log(`🎯 Redução de tokens: ${sriResult.tokenReduction.toFixed(1)}%`);
    console.log(`💾 Memórias injetadas: ${sriResult.memoriesInjected}`);
    
    console.log('\n📝 Contexto processado:');
    console.log(sriResult.processedContext);
  }

  /**
   * Demonstra análise emocional
   */
  private async demonstrateEmotionalAnalysis(): Promise<void> {
    console.log('\n😊 DEMONSTRANDO ANÁLISE EMOCIONAL');
    console.log('-'.repeat(40));
    
    const testTexts = [
      'I am extremely happy with this amazing result!',
      'I deeply regret making this terrible mistake.',
      'I am confident this solution will definitely work.',
      'Maybe this could work, but I am not entirely sure.'
    ];

    for (const text of testTexts) {
      try {
        const analysis = await this.llmAnalysisService.analyzeEmotionalContext(text);
        
        console.log(`📝 Texto: "${text}"`);
        console.log(`😊 Análise: valence=${analysis.emotionVector.valence.toFixed(2)}, confidence=${analysis.confidence.toFixed(2)}`);
        console.log(`🎯 Intensidade: ${analysis.intensity.toFixed(2)}`);
        console.log('');
      } catch (error) {
        console.log(`⚠️ Erro na análise de "${text}":`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Demonstra armazenamento de memória
   */
  private async demonstrateMemoryStorage(): Promise<void> {
    console.log('\n💾 DEMONSTRANDO ARMAZENAMENTO DE MEMÓRIA');
    console.log('-'.repeat(45));
    
    const testScenarios = [
      {
        text: 'I am very satisfied with this excellent investment analysis. The disclaimer about altcoin volatility was particularly helpful.',
        context: 'altcoin_analysis_success',
        outcome: true
      },
      {
        text: 'I regret this mistake and should have been more careful with the risk assessment.',
        context: 'risk_assessment_error',
        outcome: false
      },
      {
        text: 'This solution worked perfectly! I will definitely use this approach again.',
        context: 'solution_success',
        outcome: true
      }
    ];

    for (const scenario of testScenarios) {
      try {
        const result = await this.emotionMemory.storeMemoryWithLLMAnalysis(
          scenario.text,
          scenario.context,
          scenario.outcome
        );
        
        console.log(`💾 Memória armazenada: ${result.emotionHash}`);
        console.log(`😊 Análise emocional: valence=${result.emotionAnalysis.emotionVector.valence.toFixed(2)}`);
        console.log(`📋 Policy: ${result.policyAnalysis.policyDelta.action}`);
        console.log(`🎯 Confiança: ${result.policyAnalysis.confidence.toFixed(2)}`);
        console.log('');
      } catch (error) {
        console.log(`⚠️ Erro no armazenamento:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Demonstra decay temporal
   */
  private async demonstrateTemporalDecay(): Promise<void> {
    console.log('\n⏰ DEMONSTRANDO DECAY TEMPORAL');
    console.log('-'.repeat(35));
    
    // Criar memórias de teste com diferentes idades
    const testMemories = [
      {
        id: 'recent_memory',
        emotionHash: 'recent_hash_1234',
        emotionVector: {
          valence: 0.8,
          arousal: 0.9,
          dominance: 0.7,
          confidence: 0.8,
          regret: 0.2,
          satisfaction: 0.7
        },
        policyDelta: {
          action: 'add_disclaimer',
          context: 'altcoin_analysis',
          intensity: 0.8,
          timestamp: Date.now() - 24 * 60 * 60 * 1000 // 1 dia atrás
        },
        outcomeFlag: true,
        context: 'Recent memory',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        accessCount: 5,
        lastAccessed: Date.now() - 12 * 60 * 60 * 1000
      },
      {
        id: 'old_memory',
        emotionHash: 'old_hash_5678',
        emotionVector: {
          valence: 0.3,
          arousal: 0.4,
          dominance: 0.5,
          confidence: 0.6,
          regret: 0.1,
          satisfaction: 0.4
        },
        policyDelta: {
          action: 'general_learning',
          context: 'general_context',
          intensity: 0.5,
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 dias atrás
        },
        outcomeFlag: false,
        context: 'Old memory',
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        accessCount: 1,
        lastAccessed: Date.now() - 6 * 24 * 60 * 60 * 1000
      }
    ];

    const decayResult = this.temporalDecayService.applyBulkDecay(testMemories);
    
    console.log(`📊 Memórias processadas: ${decayResult.decayStats.totalProcessed}`);
    console.log(`📈 Memórias ativas: ${decayResult.activeMemories.length}`);
    console.log(`🗑️ Memórias removidas: ${decayResult.removedMemories.length}`);
    console.log(`📉 Decay médio: ${decayResult.decayStats.averageDecay.toFixed(3)}`);
    console.log(`🚀 Boost médio por acesso: ${decayResult.decayStats.averageAccessBoost.toFixed(3)}`);
  }

  /**
   * Demonstra clustering de memórias
   */
  private async demonstrateMemoryClustering(): Promise<void> {
    console.log('\n🔗 DEMONSTRANDO CLUSTERING DE MEMÓRIAS');
    console.log('-'.repeat(45));
    
    // Criar memórias similares para clustering
    const testMemories = [
      {
        id: 'altcoin_1',
        emotionHash: 'altcoin_1_hash',
        emotionVector: {
          valence: 0.8,
          arousal: 0.9,
          dominance: 0.7,
          confidence: 0.8,
          regret: 0.2,
          satisfaction: 0.7
        },
        policyDelta: {
          action: 'add_disclaimer',
          context: 'altcoin_analysis',
          intensity: 0.8,
          timestamp: Date.now()
        },
        outcomeFlag: true,
        context: 'Altcoin analysis 1',
        timestamp: Date.now(),
        accessCount: 3,
        lastAccessed: Date.now()
      },
      {
        id: 'altcoin_2',
        emotionHash: 'altcoin_2_hash',
        emotionVector: {
          valence: 0.7,
          arousal: 0.8,
          dominance: 0.6,
          confidence: 0.7,
          regret: 0.3,
          satisfaction: 0.6
        },
        policyDelta: {
          action: 'add_disclaimer',
          context: 'altcoin_analysis',
          intensity: 0.7,
          timestamp: Date.now()
        },
        outcomeFlag: true,
        context: 'Altcoin analysis 2',
        timestamp: Date.now(),
        accessCount: 2,
        lastAccessed: Date.now()
      },
      {
        id: 'risk_1',
        emotionHash: 'risk_1_hash',
        emotionVector: {
          valence: 0.2,
          arousal: 0.3,
          dominance: 0.4,
          confidence: 0.5,
          regret: 0.8,
          satisfaction: 0.2
        },
        policyDelta: {
          action: 'avoid_risk',
          context: 'high_risk_investment',
          intensity: 0.6,
          timestamp: Date.now()
        },
        outcomeFlag: false,
        context: 'High risk investment',
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      }
    ];

    const clusteringResult = this.clusteringService.clusterMemories(testMemories);
    
    console.log(`📊 Clusters criados: ${clusteringResult.clusters.length}`);
    console.log(`📈 Qualidade do clustering: ${clusteringResult.clusteringStats.clusteringQuality.toFixed(3)}`);
    console.log(`📝 Memórias agrupadas: ${clusteringResult.clusteringStats.clusteredMemories}`);
    console.log(`📝 Memórias não agrupadas: ${clusteringResult.unclustered.length}`);
    
    for (const cluster of clusteringResult.clusters) {
      console.log(`🔗 Cluster "${cluster.dominantContext}": ${cluster.size} memórias, intensidade média: ${cluster.averageIntensity.toFixed(2)}`);
    }
  }

  /**
   * Demonstra otimização completa
   */
  private async demonstrateCompleteOptimization(): Promise<void> {
    console.log('\n🚀 DEMONSTRANDO OTIMIZAÇÃO COMPLETA');
    console.log('-'.repeat(40));
    
    try {
      const optimizationResult = await this.emotionMemory.optimizeMemorySystem();
      
      console.log(`📊 Antes da otimização: ${optimizationResult.optimizationStats.beforeOptimization} memórias`);
      console.log(`📊 Depois da otimização: ${optimizationResult.optimizationStats.afterOptimization} memórias`);
      console.log(`📉 Redução de memórias: ${optimizationResult.optimizationStats.memoryReduction.toFixed(1)}%`);
      
      console.log('\n📈 Estatísticas de decay:');
      console.log(`🗑️ Memórias removidas: ${optimizationResult.decayResult.removedMemories.length}`);
      console.log(`📉 Decay médio: ${optimizationResult.decayResult.decayStats.averageDecay.toFixed(3)}`);
      
      console.log('\n🔗 Estatísticas de clustering:');
      console.log(`📊 Clusters: ${optimizationResult.clusteringResult.clusters.length}`);
      console.log(`📈 Qualidade: ${optimizationResult.clusteringResult.clusteringStats.clusteringQuality.toFixed(3)}`);
      
    } catch (error) {
      console.log('⚠️ Erro na otimização:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Mostra estatísticas finais
   */
  private async showFinalStatistics(): Promise<void> {
    console.log('\n📊 ESTATÍSTICAS FINAIS DO SISTEMA');
    console.log('-'.repeat(40));
    
    try {
      const comprehensiveStats = await this.emotionMemory.getComprehensiveStats();
      
      console.log('📈 Estatísticas básicas:');
      console.log(`💾 Total de memórias: ${comprehensiveStats.basic.totalMemories}`);
      console.log(`📊 Intensidade média: ${comprehensiveStats.basic.averageIntensity.toFixed(3)}`);
      console.log(`🔝 Mais acessada: ${comprehensiveStats.basic.mostAccessed || 'Nenhuma'}`);
      
      console.log('\n⏰ Estatísticas de decay:');
      console.log(`📅 Idade média: ${(comprehensiveStats.decay.averageAge / (24 * 60 * 60 * 1000)).toFixed(1)} dias`);
      console.log(`📊 Total de acessos: ${comprehensiveStats.decay.totalAccesses}`);
      console.log(`📈 Distribuição: Alta=${comprehensiveStats.decay.decayDistribution.high}, Média=${comprehensiveStats.decay.decayDistribution.medium}, Baixa=${comprehensiveStats.decay.decayDistribution.low}`);
      
      console.log('\n🔗 Estatísticas de clustering:');
      console.log(`📊 Total processadas: ${comprehensiveStats.clustering.totalMemories}`);
      console.log(`📈 Agrupadas: ${comprehensiveStats.clustering.clusteredMemories}`);
      console.log(`📝 Não agrupadas: ${comprehensiveStats.clustering.unclusteredMemories}`);
      console.log(`📊 Tamanho médio do cluster: ${comprehensiveStats.clustering.averageClusterSize.toFixed(1)}`);
      
    } catch (error) {
      console.log('⚠️ Erro nas estatísticas:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Estimativa simples de tokens
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
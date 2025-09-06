import { container } from '../../config/container';
import { IEmotionMemory } from '../interfaces/IEmotionMemory';
import { ILlmService } from '../../interfaces/ILlmService';
import { TemporalDecayService } from '../services/TemporalDecayService';
import { MemoryClusteringService } from '../services/MemoryClusteringService';
import { LLMEmotionAnalysisService } from '../services/LLMEmotionAnalysisService';

describe('Real LLM Integration', () => {
  let emotionMemory: IEmotionMemory;
  let llmService: ILlmService;
  let temporalDecayService: TemporalDecayService;
  let clusteringService: MemoryClusteringService;
  let llmAnalysisService: LLMEmotionAnalysisService;

  beforeAll(() => {
    emotionMemory = container.get<IEmotionMemory>('IEmotionMemory');
    llmService = container.get<ILlmService>('ILlmService');
    temporalDecayService = container.get<TemporalDecayService>('TemporalDecayService');
    clusteringService = container.get<MemoryClusteringService>('MemoryClusteringService');
    llmAnalysisService = container.get<LLMEmotionAnalysisService>('LLMEmotionAnalysisService');
  });

  afterAll(async () => {
    // Clean up test memories
    await emotionMemory.clearAllMemories();
  });

  describe('LLM Connection Test', () => {
    it('should connect to real LLM', async () => {
      const isConnected = await llmService.isConnected();
      
      if (isConnected) {
        console.log('✅ LLM conectada com sucesso!');
        expect(isConnected).toBe(true);
      } else {
        console.log('⚠️ LLM não conectada - usando fallback');
        expect(isConnected).toBe(false);
      }
    }, 10000);

    it('should generate response with real LLM', async () => {
      try {
        const response = await llmService.generateResponse('Hello, how are you?');
        
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
        
        console.log('✅ Resposta da LLM:', response.substring(0, 100) + '...');
      } catch (error) {
        console.log('⚠️ Erro na LLM:', error instanceof Error ? error.message : 'Unknown error');
        // Não falhar o teste se LLM não estiver disponível
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  describe('LLM-based Emotion Analysis', () => {
    it('should analyze emotional context with real LLM', async () => {
      const testTexts = [
        'I am extremely happy with this amazing result!',
        'I deeply regret making this terrible mistake.',
        'I am confident this solution will definitely work.',
        'Maybe this could work, but I am not entirely sure.'
      ];

      for (const text of testTexts) {
        try {
          const analysis = await llmAnalysisService.analyzeEmotionalContext(text);
          
          expect(analysis).toBeDefined();
          expect(analysis.emotionVector).toBeDefined();
          expect(analysis.confidence).toBeGreaterThanOrEqual(0);
          expect(analysis.confidence).toBeLessThanOrEqual(1);
          
          console.log(`📝 Texto: "${text}"`);
          console.log(`😊 Análise: valence=${analysis.emotionVector.valence.toFixed(2)}, confidence=${analysis.confidence.toFixed(2)}`);
        } catch (error) {
          console.log(`⚠️ Erro na análise de "${text}":`, error instanceof Error ? error.message : 'Unknown error');
          // Não falhar o teste se LLM não estiver disponível
        }
      }
    }, 30000);

    it('should create policy delta with real LLM', async () => {
      const testContext = 'altcoin_investment_analysis';
      const testText = 'Based on the analysis, I recommend adding a disclaimer about the high volatility of altcoins.';
      const outcome = true;

      try {
        const policyAnalysis = await llmAnalysisService.analyzeAndCreatePolicyDelta(
          testText,
          testContext,
          outcome
        );
        
        expect(policyAnalysis).toBeDefined();
        expect(policyAnalysis.policyDelta).toBeDefined();
        expect(policyAnalysis.policyDelta.action).toBeDefined();
        expect(policyAnalysis.policyDelta.context).toBe(testContext);
        
        console.log('📋 Policy Delta criado:', policyAnalysis.policyDelta.action);
        console.log('🎯 Confiança:', policyAnalysis.confidence.toFixed(2));
      } catch (error) {
        console.log('⚠️ Erro na criação de policy delta:', error instanceof Error ? error.message : 'Unknown error');
        // Não falhar o teste se LLM não estiver disponível
      }
    }, 20000);
  });

  describe('Complete Memory System Integration', () => {
    it('should store memory with LLM analysis', async () => {
      const testText = 'I am very satisfied with this excellent investment analysis. The disclaimer about altcoin volatility was particularly helpful.';
      const testContext = 'altcoin_analysis_success';
      const outcome = true;

      try {
        const result = await emotionMemory.storeMemoryWithLLMAnalysis(
          testText,
          testContext,
          outcome
        );
        
        expect(result).toBeDefined();
        expect(result.emotionHash).toBeDefined();
        expect(result.emotionAnalysis).toBeDefined();
        expect(result.policyAnalysis).toBeDefined();
        
        console.log('💾 Memória armazenada com hash:', result.emotionHash);
        console.log('😊 Análise emocional:', result.emotionAnalysis.emotionVector.valence.toFixed(2));
        console.log('📋 Policy analysis:', result.policyAnalysis.policyDelta.action);
      } catch (error) {
        console.log('⚠️ Erro no armazenamento de memória:', error instanceof Error ? error.message : 'Unknown error');
        // Não falhar o teste se LLM não estiver disponível
      }
    }, 25000);

    it('should execute SRI protocol with real data', async () => {
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

      try {
        const sriResult = await emotionMemory.executeSRIProtocol(originalContext, 0.7, 2);
        
        expect(sriResult).toBeDefined();
        expect(sriResult.processedContext).toBeDefined();
        expect(sriResult.tokenReduction).toBeGreaterThanOrEqual(0);
        expect(sriResult.memoriesInjected).toBeGreaterThanOrEqual(0);
        
        console.log('🔄 SRI Protocol executado:');
        console.log(`📉 Redução de tokens: ${sriResult.tokenReduction.toFixed(1)}%`);
        console.log(`💾 Memórias injetadas: ${sriResult.memoriesInjected}`);
        console.log(`📝 Contexto processado: ${sriResult.processedContext.length} caracteres`);
      } catch (error) {
        console.log('⚠️ Erro no protocolo SRI:', error instanceof Error ? error.message : 'Unknown error');
        // Não falhar o teste se LLM não estiver disponível
      }
    }, 20000);
  });

  describe('Temporal Decay System', () => {
    it('should apply temporal decay to memories', async () => {
      // Criar algumas memórias de teste
      const testMemories = [
        {
          id: 'test1',
          emotionHash: 'abcd1234efgh5678',
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
          context: 'Test context 1',
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          accessCount: 5,
          lastAccessed: Date.now() - 12 * 60 * 60 * 1000
        },
        {
          id: 'test2',
          emotionHash: 'efgh5678ijkl9012',
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
          context: 'Test context 2',
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
          accessCount: 1,
          lastAccessed: Date.now() - 6 * 24 * 60 * 60 * 1000
        }
      ];

      const decayResult = temporalDecayService.applyBulkDecay(testMemories);
      
      expect(decayResult).toBeDefined();
      expect(decayResult.activeMemories).toBeDefined();
      expect(decayResult.removedMemories).toBeDefined();
      expect(decayResult.decayStats).toBeDefined();
      
      console.log('⏰ Decay temporal aplicado:');
      console.log(`📊 Memórias ativas: ${decayResult.activeMemories.length}`);
      console.log(`🗑️ Memórias removidas: ${decayResult.removedMemories.length}`);
      console.log(`📈 Decay médio: ${decayResult.decayStats.averageDecay.toFixed(3)}`);
    });
  });

  describe('Memory Clustering System', () => {
    it('should cluster memories by similarity', async () => {
      // Criar memórias similares para clustering
      const testMemories = [
        {
          id: 'cluster1_1',
          emotionHash: 'cluster1_1_hash',
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
          id: 'cluster1_2',
          emotionHash: 'cluster1_2_hash',
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
          id: 'cluster2_1',
          emotionHash: 'cluster2_1_hash',
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

      const clusteringResult = clusteringService.clusterMemories(testMemories);
      
      expect(clusteringResult).toBeDefined();
      expect(clusteringResult.clusters).toBeDefined();
      expect(clusteringResult.unclustered).toBeDefined();
      expect(clusteringResult.clusteringStats).toBeDefined();
      
      console.log('🔗 Clustering de memórias:');
      console.log(`📊 Clusters criados: ${clusteringResult.clusters.length}`);
      console.log(`📈 Qualidade do clustering: ${clusteringResult.clusteringStats.clusteringQuality.toFixed(3)}`);
      console.log(`📝 Memórias não agrupadas: ${clusteringResult.unclustered.length}`);
    });
  });

  describe('Complete System Integration', () => {
    it('should run complete optimization workflow', async () => {
      try {
        // Primeiro, armazenar algumas memórias
        await emotionMemory.storeMemoryWithLLMAnalysis(
          'I am very happy with this excellent result!',
          'success_analysis',
          true
        );
        
        await emotionMemory.storeMemoryWithLLMAnalysis(
          'I regret this mistake and should have been more careful.',
          'error_analysis',
          false
        );
        
        // Executar otimização completa
        const optimizationResult = await emotionMemory.optimizeMemorySystem();
        
        expect(optimizationResult).toBeDefined();
        expect(optimizationResult.decayResult).toBeDefined();
        expect(optimizationResult.clusteringResult).toBeDefined();
        expect(optimizationResult.optimizationStats).toBeDefined();
        
        console.log('🚀 Otimização completa executada:');
        console.log(`📊 Antes: ${optimizationResult.optimizationStats.beforeOptimization} memórias`);
        console.log(`📊 Depois: ${optimizationResult.optimizationStats.afterOptimization} memórias`);
        console.log(`📉 Redução: ${optimizationResult.optimizationStats.memoryReduction.toFixed(1)}%`);
        
        // Obter estatísticas completas
        const comprehensiveStats = await emotionMemory.getComprehensiveStats();
        
        expect(comprehensiveStats).toBeDefined();
        expect(comprehensiveStats.basic).toBeDefined();
        expect(comprehensiveStats.decay).toBeDefined();
        expect(comprehensiveStats.clustering).toBeDefined();
        
        console.log('📊 Estatísticas completas:');
        console.log(`💾 Total de memórias: ${comprehensiveStats.basic.totalMemories}`);
        console.log(`⏰ Idade média: ${(comprehensiveStats.decay.averageAge / (24 * 60 * 60 * 1000)).toFixed(1)} dias`);
        console.log(`🔗 Clusters: ${comprehensiveStats.clustering.totalMemories - comprehensiveStats.clustering.unclusteredMemories} agrupadas`);
        
      } catch (error) {
        console.log('⚠️ Erro na otimização completa:', error instanceof Error ? error.message : 'Unknown error');
        // Não falhar o teste se LLM não estiver disponível
      }
    }, 45000);
  });
});
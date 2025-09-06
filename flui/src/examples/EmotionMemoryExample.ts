import { container } from '../config/container';
import { IEmotionMemory } from '../memory/interfaces/IEmotionMemory';
import { ILlmService } from '../interfaces/ILlmService';
import { EmotionVector, PolicyDelta } from '../memory/interfaces/IEmotionMemory';

/**
 * Exemplo de uso da Memória Episódica Autoverificada com Continuidade Temporal Emocional
 * Demonstra o protocolo SRI (Strip-Recall-Inject) em ação
 */
export class EmotionMemoryExample {
  private emotionMemory: IEmotionMemory;
  private llmService: ILlmService;

  constructor() {
    this.emotionMemory = container.get<IEmotionMemory>('IEmotionMemory');
    this.llmService = container.get<ILlmService>('ILlmService');
  }

  /**
   * Exemplo 1: Demonstração do protocolo SRI
   */
  async demonstrateSRIProtocol(): Promise<void> {
    console.log('🧠 Demonstrando Protocolo SRI (Strip-Recall-Inject)');
    
    const originalContext = `
User: Faça um relatório de investimento sobre NEWcoin
Assistant: Vou analisar NEWcoin para você...

User: Quais são os riscos?
Assistant: Os principais riscos incluem volatilidade...

User: E as oportunidades?
Assistant: As oportunidades incluem crescimento...

User: Qual sua recomendação final?
Assistant: Baseado na análise, recomendo cautela...
    `.trim();

    console.log(`📊 Contexto original: ${this.estimateTokens(originalContext)} tokens`);
    
    // Execute SRI Protocol
    const sriResult = await this.emotionMemory.executeSRIProtocol(originalContext, 0.7, 2);
    
    console.log(`📉 Contexto processado: ${this.estimateTokens(sriResult.processedContext)} tokens`);
    console.log(`🎯 Redução de tokens: ${sriResult.tokenReduction.toFixed(1)}%`);
    console.log(`💾 Memórias injetadas: ${sriResult.memoriesInjected}`);
    
    console.log('\n📝 Contexto processado:');
    console.log(sriResult.processedContext);
  }

  /**
   * Exemplo 2: Criação e armazenamento de memória emocional
   */
  async demonstrateEmotionalMemoryStorage(): Promise<void> {
    console.log('\n🧠 Demonstrando Armazenamento de Memória Emocional');
    
    // Simular análise emocional de uma resposta sobre altcoin
    const emotionVector: EmotionVector = {
      valence: 0.8,        // Positivo (recomendação cautelosa)
      arousal: 0.9,        // Alto (análise detalhada)
      dominance: 0.7,      // Alto (confiança na análise)
      confidence: 0.8,     // Alto (análise fundamentada)
      regret: 0.6,         // Médio (preocupação com riscos)
      satisfaction: 0.7    // Alto (análise completa)
    };

    const policyDelta: PolicyDelta = {
      action: 'add_disclaimer',
      context: 'altcoin_analysis',
      intensity: 0.8,
      timestamp: Date.now()
    };

    const context = 'Análise de investimento em NEWcoin - usuário pediu recomendação';
    const outcome = true; // Análise bem-sucedida

    // Armazenar memória
    const emotionHash = await this.emotionMemory.storeMemory(
      emotionVector,
      policyDelta,
      context,
      outcome
    );

    console.log(`💾 Memória armazenada com hash: ${emotionHash}`);
    
    // Recuperar memória
    const recalled = await this.emotionMemory.recallDelta(emotionHash);
    console.log(`🔄 Memória recuperada: ${recalled}`);
  }

  /**
   * Exemplo 3: Uso com LLM real
   */
  async demonstrateLLMIntegration(): Promise<void> {
    console.log('\n🤖 Demonstrando Integração com LLM');
    
    try {
      const prompt = 'Faça uma análise de investimento sobre uma nova criptomoeda chamada TESTcoin';
      
      console.log(`📝 Prompt: ${prompt}`);
      
      // O EnhancedLlmService automaticamente aplica o protocolo SRI
      const response = await this.llmService.generateResponse(prompt);
      
      console.log(`🤖 Resposta da LLM: ${response.substring(0, 200)}...`);
      
      // Verificar estatísticas de memória
      const stats = await this.emotionMemory.getMemoryStats();
      console.log(`📊 Estatísticas de memória:`, stats);
      
    } catch (error) {
      console.log(`❌ Erro na integração com LLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exemplo 4: Análise emocional de texto
   */
  async demonstrateEmotionalAnalysis(): Promise<void> {
    console.log('\n😊 Demonstrando Análise Emocional de Texto');
    
    const texts = [
      'Estou muito feliz com este excelente resultado!',
      'Lamento muito este erro terrível que cometi.',
      'Talvez isso possa funcionar, mas não tenho certeza.',
      'Estou confiante de que esta solução é definitivamente a melhor.'
    ];

    for (const text of texts) {
      const emotionVector = await this.emotionMemory.analyzeEmotionalContext(text);
      
      console.log(`📝 Texto: "${text}"`);
      console.log(`😊 Análise emocional:`, {
        valence: emotionVector.valence.toFixed(2),
        arousal: emotionVector.arousal.toFixed(2),
        confidence: emotionVector.confidence.toFixed(2),
        regret: emotionVector.regret.toFixed(2)
      });
      console.log('');
    }
  }

  /**
   * Exemplo 5: Demonstração completa do sistema
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 INICIANDO DEMONSTRAÇÃO COMPLETA DA MEMÓRIA EMOCIONAL FLUI');
    console.log('=' .repeat(70));
    
    await this.demonstrateSRIProtocol();
    await this.demonstrateEmotionalMemoryStorage();
    await this.demonstrateEmotionalAnalysis();
    await this.demonstrateLLMIntegration();
    
    console.log('\n✅ DEMONSTRAÇÃO COMPLETA FINALIZADA!');
    console.log('=' .repeat(70));
  }

  private estimateTokens(text: string): number {
    // Estimativa simples: 1 token ≈ 4 caracteres
    return Math.ceil(text.length / 4);
  }
}
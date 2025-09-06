import { injectable, inject } from 'inversify';
import { EmotionVector, PolicyDelta } from '../interfaces/IEmotionMemory';

export interface EmotionAnalysisResult {
  emotionVector: EmotionVector;
  confidence: number;
  reasoning: string;
  detectedEmotions: string[];
  intensity: number;
}

export interface PolicyAnalysisResult {
  policyDelta: PolicyDelta;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
  context: string;
}

@injectable()
export class LLMEmotionAnalysisService {
  private readonly baseLlmService: any;

  constructor(
    @inject('BaseLlmService') baseLlmService: any
  ) {
    this.baseLlmService = baseLlmService;
  }

  /**
   * Analisa contexto emocional usando LLM
   */
  async analyzeEmotionalContext(text: string): Promise<EmotionAnalysisResult> {
    const analysisPrompt = this.createEmotionAnalysisPrompt(text);
    
    try {
      const response = await this.baseLlmService.generateResponse(analysisPrompt);
      return this.parseEmotionAnalysisResponse(response);
    } catch (error) {
      // Fallback para análise heurística se LLM falhar
      return this.fallbackEmotionAnalysis(text);
    }
  }

  /**
   * Analisa e cria policy delta usando LLM
   */
  async analyzeAndCreatePolicyDelta(
    text: string,
    context: string,
    outcome: boolean
  ): Promise<PolicyAnalysisResult> {
    const policyPrompt = this.createPolicyAnalysisPrompt(text, context, outcome);
    
    try {
      const response = await this.baseLlmService.generateResponse(policyPrompt);
      return this.parsePolicyAnalysisResponse(response, context);
    } catch (error) {
      // Fallback para policy delta básico
      return this.fallbackPolicyAnalysis(text, context, outcome);
    }
  }

  /**
   * Analisa múltiplos textos em lote
   */
  async analyzeBatchEmotionalContext(texts: string[]): Promise<EmotionAnalysisResult[]> {
    const batchPrompt = this.createBatchAnalysisPrompt(texts);
    
    try {
      const response = await this.baseLlmService.generateResponse(batchPrompt);
      return this.parseBatchEmotionAnalysisResponse(response, texts.length);
    } catch (error) {
      // Fallback para análise individual
      const results: EmotionAnalysisResult[] = [];
      for (const text of texts) {
        results.push(await this.analyzeEmotionalContext(text));
      }
      return results;
    }
  }

  /**
   * Cria prompt para análise emocional
   */
  private createEmotionAnalysisPrompt(text: string): string {
    return `Analise o contexto emocional do seguinte texto e retorne APENAS um JSON válido com a estrutura exata:

{
  "valence": número_de_-1_a_1,
  "arousal": número_de_0_a_1,
  "dominance": número_de_0_a_1,
  "confidence": número_de_0_a_1,
  "regret": número_de_0_a_1,
  "satisfaction": número_de_0_a_1,
  "confidence_score": número_de_0_a_1,
  "reasoning": "explicação_curta",
  "detected_emotions": ["lista", "de", "emoções"],
  "intensity": número_de_0_a_1
}

Onde:
- valence: -1 (negativo) a 1 (positivo)
- arousal: 0 (calmo) a 1 (excitado)
- dominance: 0 (submisso) a 1 (dominante)
- confidence: 0 (incerto) a 1 (confiante)
- regret: 0 (sem arrependimento) a 1 (muito arrependido)
- satisfaction: 0 (insatisfeito) a 1 (satisfeito)

Texto para análise:
"${text}"

Retorne APENAS o JSON, sem texto adicional.`;
  }

  /**
   * Cria prompt para análise de política
   */
  private createPolicyAnalysisPrompt(text: string, context: string, outcome: boolean): string {
    return `Analise o seguinte texto e contexto para criar uma política de aprendizado. Retorne APENAS um JSON válido:

{
  "action": "ação_específica",
  "context": "contexto_aplicável",
  "intensity": número_de_0_a_1,
  "confidence": número_de_0_a_1,
  "reasoning": "explicação_curta",
  "suggested_action": "ação_sugerida"
}

Contexto: ${context}
Outcome: ${outcome ? 'sucesso' : 'falha'}
Texto: "${text}"

Baseado no texto e contexto, identifique:
1. Qual ação específica foi tomada ou deveria ser tomada
2. Em que contexto esta ação se aplica
3. Quão intensa é esta política (0-1)
4. Sua confiança na análise (0-1)

Retorne APENAS o JSON, sem texto adicional.`;
  }

  /**
   * Cria prompt para análise em lote
   */
  private createBatchAnalysisPrompt(texts: string[]): string {
    const textList = texts.map((text, index) => `${index + 1}. "${text}"`).join('\n');
    
    return `Analise o contexto emocional dos seguintes textos e retorne APENAS um JSON válido com um array de análises:

{
  "analyses": [
    {
      "valence": número_de_-1_a_1,
      "arousal": número_de_0_a_1,
      "dominance": número_de_0_a_1,
      "confidence": número_de_0_a_1,
      "regret": número_de_0_a_1,
      "satisfaction": número_de_0_a_1,
      "confidence_score": número_de_0_a_1,
      "reasoning": "explicação_curta",
      "detected_emotions": ["lista", "de", "emoções"],
      "intensity": número_de_0_a_1
    }
  ]
}

Textos para análise:
${textList}

Retorne APENAS o JSON, sem texto adicional.`;
  }

  /**
   * Parse da resposta de análise emocional
   */
  private parseEmotionAnalysisResponse(response: string): EmotionAnalysisResult {
    try {
      // Limpar resposta e extrair JSON
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        emotionVector: {
          valence: this.clampValue(parsed.valence, -1, 1),
          arousal: this.clampValue(parsed.arousal, 0, 1),
          dominance: this.clampValue(parsed.dominance, 0, 1),
          confidence: this.clampValue(parsed.confidence, 0, 1),
          regret: this.clampValue(parsed.regret, 0, 1),
          satisfaction: this.clampValue(parsed.satisfaction, 0, 1)
        },
        confidence: this.clampValue(parsed.confidence_score, 0, 1),
        reasoning: parsed.reasoning || 'Análise automática',
        detectedEmotions: Array.isArray(parsed.detected_emotions) ? parsed.detected_emotions : [],
        intensity: this.clampValue(parsed.intensity, 0, 1)
      };
    } catch (error) {
      // Fallback para análise heurística
      return this.fallbackEmotionAnalysis(response);
    }
  }

  /**
   * Parse da resposta de análise de política
   */
  private parsePolicyAnalysisResponse(response: string, context: string): PolicyAnalysisResult {
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);
      
      return {
        policyDelta: {
          action: parsed.action || 'unknown_action',
          context: parsed.context || context,
          intensity: this.clampValue(parsed.intensity, 0, 1),
          timestamp: Date.now()
        },
        confidence: this.clampValue(parsed.confidence, 0, 1),
        reasoning: parsed.reasoning || 'Análise automática',
        suggestedAction: parsed.suggested_action || parsed.action || 'unknown_action',
        context: parsed.context || context
      };
    } catch (error) {
      // Fallback para policy delta básico
      return this.fallbackPolicyAnalysis(response, context, true);
    }
  }

  /**
   * Parse da resposta de análise em lote
   */
  private parseBatchEmotionAnalysisResponse(response: string, expectedCount: number): EmotionAnalysisResult[] {
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsed.analyses)) {
        throw new Error('Invalid batch response format');
      }
      
      return parsed.analyses.slice(0, expectedCount).map((analysis: any) => ({
        emotionVector: {
          valence: this.clampValue(analysis.valence, -1, 1),
          arousal: this.clampValue(analysis.arousal, 0, 1),
          dominance: this.clampValue(analysis.dominance, 0, 1),
          confidence: this.clampValue(analysis.confidence, 0, 1),
          regret: this.clampValue(analysis.regret, 0, 1),
          satisfaction: this.clampValue(analysis.satisfaction, 0, 1)
        },
        confidence: this.clampValue(analysis.confidence_score, 0, 1),
        reasoning: analysis.reasoning || 'Análise automática',
        detectedEmotions: Array.isArray(analysis.detected_emotions) ? analysis.detected_emotions : [],
        intensity: this.clampValue(analysis.intensity, 0, 1)
      }));
    } catch (error) {
      // Fallback para análise individual
      return [];
    }
  }

  /**
   * Limpa resposta JSON removendo texto extra
   */
  private cleanJsonResponse(response: string): string {
    // Remover markdown code blocks
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Encontrar primeiro { e último }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Limita valor entre min e max
   */
  private clampValue(value: any, min: number, max: number): number {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Fallback para análise emocional heurística
   */
  private fallbackEmotionAnalysis(text: string): EmotionAnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Análise heurística simples
    const positiveWords = ['good', 'great', 'excellent', 'success', 'happy', 'satisfied', 'positive'];
    const negativeWords = ['bad', 'terrible', 'failure', 'sad', 'angry', 'negative', 'disappointed'];
    const regretWords = ['regret', 'mistake', 'error', 'wrong', 'should have', 'wish'];
    const confidentWords = ['sure', 'certain', 'confident', 'definitely', 'absolutely'];
    const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'uncertain'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const regretCount = regretWords.filter(word => lowerText.includes(word)).length;
    const confidentCount = confidentWords.filter(word => lowerText.includes(word)).length;
    const uncertainCount = uncertainWords.filter(word => lowerText.includes(word)).length;
    
    const valence = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / 10));
    const arousal = Math.min(1, (positiveCount + negativeCount + regretCount) / 10);
    const dominance = Math.min(1, confidentCount / 5);
    const confidence = Math.min(1, confidentCount / (confidentCount + uncertainCount + 1));
    const regret = Math.min(1, regretCount / 5);
    const satisfaction = Math.max(0, Math.min(1, (positiveCount - regretCount) / 10));
    
    return {
      emotionVector: { valence, arousal, dominance, confidence, regret, satisfaction },
      confidence: 0.5, // Baixa confiança para fallback
      reasoning: 'Análise heurística (fallback)',
      detectedEmotions: [],
      intensity: Math.sqrt(valence * valence + arousal * arousal + dominance * dominance + confidence * confidence + regret * regret + satisfaction * satisfaction)
    };
  }

  /**
   * Fallback para análise de política
   */
  private fallbackPolicyAnalysis(text: string, context: string, outcome: boolean): PolicyAnalysisResult {
    return {
      policyDelta: {
        action: 'general_learning',
        context: context,
        intensity: 0.5,
        timestamp: Date.now()
      },
      confidence: 0.3, // Baixa confiança para fallback
      reasoning: 'Análise básica (fallback)',
      suggestedAction: 'general_learning',
      context: context
    };
  }
}
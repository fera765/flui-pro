import { injectable, inject } from 'inversify';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { ILlmService } from '../../interfaces/ILlmService';
import { Task, MicroTask } from '../types/ITask';

export interface TaskEmotionContext {
  taskId: string;
  prompt: string;
  currentPhase: string;
  agentName?: string;
  microTaskType?: string;
  success: boolean;
  timestamp: number;
  metadata?: any;
}

export interface TaskEmotionInsight {
  emotion: string;
  intensity: number;
  policy: string;
  confidence: number;
  context: string;
}

@injectable()
export class TaskEmotionMemory {
  private readonly emotionMemory: IEmotionMemory;
  private readonly llmService: ILlmService;
  private readonly taskMemories: Map<string, TaskEmotionContext[]> = new Map();

  constructor(
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('ILlmService') llmService: ILlmService
  ) {
    this.emotionMemory = emotionMemory;
    this.llmService = llmService;
  }

  /**
   * Registra contexto emocional de uma task
   */
  async recordTaskContext(context: TaskEmotionContext): Promise<void> {
    try {
      // Armazenar contexto na memória da task
      if (!this.taskMemories.has(context.taskId)) {
        this.taskMemories.set(context.taskId, []);
      }
      
      const taskContexts = this.taskMemories.get(context.taskId)!;
      taskContexts.push(context);
      
      // Manter apenas os últimos 100 contextos por task
      if (taskContexts.length > 100) {
        taskContexts.splice(0, taskContexts.length - 100);
      }
      
      // Analisar contexto emocional se LLM estiver disponível
      if (await this.llmService.isConnected()) {
        await this.analyzeTaskEmotion(context);
      }
      
    } catch (error) {
      console.warn('Erro ao registrar contexto emocional da task:', error);
    }
  }

  /**
   * Analisa contexto emocional de uma task
   */
  private async analyzeTaskEmotion(context: TaskEmotionContext): Promise<void> {
    try {
      const analysisPrompt = this.generateEmotionAnalysisPrompt(context);
      const analysis = await this.llmService.generateResponse(analysisPrompt);
      
      const insight = this.parseEmotionInsight(analysis, context);
      
      // Armazenar na memória emocional global
      await this.emotionMemory.storeMemory(
        await this.emotionMemory.analyzeEmotionalContext(insight.context),
        await this.emotionMemory.createPolicyDelta(insight.policy, insight.context),
        insight.context,
        context.success
      );
      
    } catch (error) {
      console.warn('Erro ao analisar emoção da task:', error);
    }
  }

  /**
   * Obtém insights emocionais de uma task
   */
  async getTaskEmotionInsights(taskId: string): Promise<TaskEmotionInsight[]> {
    try {
      const contexts = this.taskMemories.get(taskId) || [];
      
      if (contexts.length === 0) {
        return [];
      }
      
      // Usar LLM para analisar padrões emocionais se disponível
      if (await this.llmService.isConnected()) {
        return await this.analyzeTaskEmotionPatterns(taskId, contexts);
      }
      
      // Fallback: análise básica
      return this.generateBasicEmotionInsights(contexts);
      
    } catch (error) {
      console.warn('Erro ao obter insights emocionais da task:', error);
      return [];
    }
  }

  /**
   * Analisa padrões emocionais de uma task
   */
  private async analyzeTaskEmotionPatterns(taskId: string, contexts: TaskEmotionContext[]): Promise<TaskEmotionInsight[]> {
    try {
      const patternPrompt = this.generatePatternAnalysisPrompt(taskId, contexts);
      const analysis = await this.llmService.generateResponse(patternPrompt);
      
      return this.parseEmotionInsights(analysis);
      
    } catch (error) {
      console.warn('Erro ao analisar padrões emocionais:', error);
      return this.generateBasicEmotionInsights(contexts);
    }
  }

  /**
   * Gera insights básicos de emoção
   */
  private generateBasicEmotionInsights(contexts: TaskEmotionContext[]): TaskEmotionInsight[] {
    const insights: TaskEmotionInsight[] = [];
    
    // Analisar sucessos vs falhas
    const successes = contexts.filter(c => c.success).length;
    const failures = contexts.filter(c => !c.success).length;
    const total = contexts.length;
    
    if (total > 0) {
      const successRate = successes / total;
      
      insights.push({
        emotion: successRate > 0.8 ? 'satisfaction' : successRate > 0.5 ? 'neutral' : 'frustration',
        intensity: Math.abs(successRate - 0.5) * 2,
        policy: `Task tem taxa de sucesso de ${Math.round(successRate * 100)}%`,
        confidence: 0.8,
        context: `Análise de ${total} contextos da task`
      });
    }
    
    // Analisar fases mais problemáticas
    const phaseStats = contexts.reduce((acc, context) => {
      acc[context.currentPhase] = (acc[context.currentPhase] || 0) + (context.success ? 1 : -1);
      return acc;
    }, {} as Record<string, number>);
    
    const problematicPhase = Object.entries(phaseStats)
      .sort(([,a], [,b]) => a - b)[0];
    
    if (problematicPhase && problematicPhase[1] < 0) {
      insights.push({
        emotion: 'concern',
        intensity: 0.7,
        policy: `Fase ${problematicPhase[0]} tem mais falhas que sucessos`,
        confidence: 0.7,
        context: `Análise de fases da task`
      });
    }
    
    return insights;
  }

  /**
   * Obtém contexto emocional para próxima decisão
   */
  async getEmotionalContextForDecision(taskId: string, currentContext: any): Promise<string> {
    try {
      const insights = await this.getTaskEmotionInsights(taskId);
      
      if (insights.length === 0) {
        return 'Nenhum contexto emocional disponível para esta task.';
      }
      
      // Usar LLM para gerar contexto se disponível
      if (await this.llmService.isConnected()) {
        const contextPrompt = this.generateDecisionContextPrompt(insights, currentContext);
        return await this.llmService.generateResponse(contextPrompt);
      }
      
      // Fallback: contexto básico
      return this.generateBasicDecisionContext(insights);
      
    } catch (error) {
      console.warn('Erro ao obter contexto emocional para decisão:', error);
      return 'Erro ao obter contexto emocional.';
    }
  }

  /**
   * Gera contexto básico para decisão
   */
  private generateBasicDecisionContext(insights: TaskEmotionInsight[]): string {
    const emotions = insights.map(i => i.emotion).join(', ');
    const policies = insights.map(i => i.policy).join('; ');
    
    return `Contexto emocional: ${emotions}. Políticas aprendidas: ${policies}`;
  }

  /**
   * Limpa memória emocional de uma task
   */
  clearTaskEmotionMemory(taskId: string): void {
    this.taskMemories.delete(taskId);
  }

  /**
   * Obtém estatísticas de memória emocional de tasks
   */
  getTaskEmotionStats(): { totalTasks: number; totalContexts: number; averageContextsPerTask: number } {
    const totalTasks = this.taskMemories.size;
    const totalContexts = Array.from(this.taskMemories.values())
      .reduce((sum, contexts) => sum + contexts.length, 0);
    const averageContextsPerTask = totalTasks > 0 ? totalContexts / totalTasks : 0;
    
    return {
      totalTasks,
      totalContexts,
      averageContextsPerTask
    };
  }

  /**
   * Gera prompt para análise de emoção
   */
  private generateEmotionAnalysisPrompt(context: TaskEmotionContext): string {
    return `Analise o contexto emocional desta execução de task:

TASK: ${context.taskId}
PROMPT: ${context.prompt}
FASE: ${context.currentPhase}
AGENTE: ${context.agentName || 'N/A'}
MICRO-TASK: ${context.microTaskType || 'N/A'}
SUCESSO: ${context.success}
TIMESTAMP: ${new Date(context.timestamp).toISOString()}

Identifique:
1. Emoção predominante (satisfaction, frustration, curiosity, concern, etc.)
2. Intensidade emocional (0-1)
3. Política aprendida (uma linha de aprendizado)
4. Confiança na análise (0-1)
5. Contexto relevante

Retorne JSON:
{
  "emotion": "emoção_identificada",
  "intensity": 0.8,
  "policy": "política_aprendida",
  "confidence": 0.9,
  "context": "contexto_relevante"
}`;
  }

  /**
   * Gera prompt para análise de padrões
   */
  private generatePatternAnalysisPrompt(taskId: string, contexts: TaskEmotionContext[]): string {
    const contextSummary = contexts.map(c => 
      `${c.currentPhase}: ${c.success ? 'SUCCESS' : 'FAILURE'} (${c.agentName || 'N/A'})`
    ).join('\n');
    
    return `Analise os padrões emocionais desta task:

TASK: ${taskId}
TOTAL DE CONTEXTOS: ${contexts.length}

CONTEXTOS:
${contextSummary}

Identifique padrões emocionais:
1. Emoções recorrentes
2. Fases problemáticas
3. Agentes que geram mais frustração/satisfação
4. Tendências temporais
5. Políticas de melhoria

Retorne array JSON de insights:
[
  {
    "emotion": "emoção",
    "intensity": 0.8,
    "policy": "política",
    "confidence": 0.9,
    "context": "contexto"
  }
]`;
  }

  /**
   * Gera prompt para contexto de decisão
   */
  private generateDecisionContextPrompt(insights: TaskEmotionInsight[], currentContext: any): string {
    const insightsSummary = insights.map(i => 
      `${i.emotion} (${i.intensity}): ${i.policy}`
    ).join('\n');
    
    return `Com base no histórico emocional desta task, forneça contexto para a próxima decisão:

INSIGHTS EMOCIONAIS:
${insightsSummary}

CONTEXTO ATUAL:
${JSON.stringify(currentContext, null, 2)}

Forneça:
1. Resumo do estado emocional da task
2. Recomendações baseadas em experiências passadas
3. Alertas sobre possíveis problemas
4. Sugestões de abordagem

Retorne contexto conciso e acionável.`;
  }

  /**
   * Parseia insight de emoção
   */
  private parseEmotionInsight(analysis: string, context: TaskEmotionContext): TaskEmotionInsight {
    try {
      const cleaned = this.cleanJsonResponse(analysis);
      const parsed = JSON.parse(cleaned);
      
      return {
        emotion: parsed.emotion || 'neutral',
        intensity: Math.max(0, Math.min(1, parsed.intensity || 0.5)),
        policy: parsed.policy || 'Nenhuma política identificada',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        context: parsed.context || `Contexto da task ${context.taskId}`
      };
    } catch (error) {
      return {
        emotion: 'neutral',
        intensity: 0.5,
        policy: 'Análise emocional falhou',
        confidence: 0.1,
        context: `Contexto da task ${context.taskId}`
      };
    }
  }

  /**
   * Parseia insights de emoção
   */
  private parseEmotionInsights(analysis: string): TaskEmotionInsight[] {
    try {
      const cleaned = this.cleanJsonResponse(analysis);
      const parsed = JSON.parse(cleaned);
      
      if (Array.isArray(parsed)) {
        return parsed.map(insight => ({
          emotion: insight.emotion || 'neutral',
          intensity: Math.max(0, Math.min(1, insight.intensity || 0.5)),
          policy: insight.policy || 'Nenhuma política identificada',
          confidence: Math.max(0, Math.min(1, insight.confidence || 0.5)),
          context: insight.context || 'Contexto não especificado'
        }));
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Limpa resposta JSON
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
    }
    
    if (startIndex !== -1) {
      cleaned = cleaned.substring(startIndex);
    }
    
    return cleaned.trim();
  }
}
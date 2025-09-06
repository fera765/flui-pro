import { injectable, inject } from 'inversify';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';
import { IAgent, Task, MicroTask } from '../types/ITask';

export interface OODAState {
  phase: 'observe' | 'orient' | 'decide' | 'act';
  iteration: number;
  maxIterations: number;
  lastObservation: any;
  lastDecision: any;
  lastAction: any;
  context: any;
  memory: any;
}

export interface OODAResult {
  success: boolean;
  nextPhase: 'observe' | 'orient' | 'decide' | 'act' | 'complete';
  microTasks: MicroTask[];
  insights: string[];
  confidence: number;
  shouldContinue: boolean;
}

@injectable()
export class OODALoop {
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly fileSystem: IFileSystem;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IFileSystem') fileSystem: IFileSystem
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.fileSystem = fileSystem;
  }

  /**
   * Executa uma iteração completa do loop OODA
   */
  async executeIteration(
    task: Task, 
    agents: IAgent[], 
    state: OODAState
  ): Promise<OODAResult> {
    try {
      switch (state.phase) {
        case 'observe':
          return await this.observe(task, state);
        
        case 'orient':
          return await this.orient(task, agents, state);
        
        case 'decide':
          return await this.decide(task, agents, state);
        
        case 'act':
          return await this.act(task, agents, state);
        
        default:
          throw new Error(`Fase OODA inválida: ${state.phase}`);
      }
    } catch (error) {
      console.error('Erro no loop OODA:', error);
      return {
        success: false,
        nextPhase: 'complete',
        microTasks: [],
        insights: [`Erro na fase ${state.phase}: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        shouldContinue: false
      };
    }
  }

  /**
   * Fase OBSERVE: Analisa o estado atual do projeto
   */
  private async observe(task: Task, state: OODAState): Promise<OODAResult> {
    try {
      // Observar estado atual do projeto
      const projectState = await this.observeProjectState(task);
      
      // Usar LLM para análise contextual se disponível
      let insights: string[] = [];
      let confidence = 0.8;
      
      let microTasks: MicroTask[] = [];
      
      if (await this.llmService.isConnected()) {
        const observationPrompt = this.generateObservationPrompt(task, projectState, state);
        const llmResponse = await this.llmService.generateResponse(observationPrompt);
        const parsedResponse = this.parseLLMResponse(llmResponse);
        insights = parsedResponse.insights || this.parseInsights(llmResponse);
        confidence = parsedResponse.confidence || this.calculateConfidence(insights);
        microTasks = parsedResponse.microTasks || [];
      } else {
        insights = this.generateFallbackInsights(projectState);
        confidence = 0.6;
      }
      
      // Atualizar estado
      state.lastObservation = projectState;
      state.context = { ...state.context, projectState };
      
      return {
        success: true,
        nextPhase: 'orient',
        microTasks,
        insights,
        confidence,
        shouldContinue: true
      };
      
    } catch (error) {
      return {
        success: false,
        nextPhase: 'complete',
        microTasks: [],
        insights: [`Erro na observação: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        shouldContinue: false
      };
    }
  }

  /**
   * Fase ORIENT: Determina o próximo agente baseado no estado
   */
  private async orient(task: Task, agents: IAgent[], state: OODAState): Promise<OODAResult> {
    try {
      // Ordenar agentes por prioridade
      const sortedAgents = agents.sort((a, b) => a.getPriority() - b.getPriority());
      
      // Encontrar agente apropriado
      let selectedAgent: IAgent | null = null;
      let reasoning = '';
      
      for (const agent of sortedAgents) {
        if (agent.canHandle(task, state.lastObservation)) {
          selectedAgent = agent;
          reasoning = `Agente ${agent.name} selecionado por prioridade ${agent.getPriority()}`;
          break;
        }
      }
      
      // Usar LLM para análise de orientação se disponível
      let insights: string[] = [reasoning];
      let confidence = 0.7;
      
      if (await this.llmService.isConnected() && selectedAgent) {
        const orientationPrompt = this.generateOrientationPrompt(task, selectedAgent, state);
        const llmInsights = await this.llmService.generateResponse(orientationPrompt);
        insights.push(...this.parseInsights(llmInsights));
        confidence = this.calculateConfidence(insights);
      }
      
      if (!selectedAgent) {
        return {
          success: true,
          nextPhase: 'complete',
          microTasks: [],
          insights: ['Nenhum agente pode lidar com o estado atual - projeto concluído'],
          confidence: 0.9,
          shouldContinue: false
        };
      }
      
      // Atualizar estado
      state.lastDecision = { agent: selectedAgent, reasoning };
      
      return {
        success: true,
        nextPhase: 'decide',
        microTasks: [],
        insights,
        confidence,
        shouldContinue: true
      };
      
    } catch (error) {
      return {
        success: false,
        nextPhase: 'complete',
        microTasks: [],
        insights: [`Erro na orientação: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        shouldContinue: false
      };
    }
  }

  /**
   * Fase DECIDE: Decide as ações específicas a serem tomadas
   */
  private async decide(task: Task, agents: IAgent[], state: OODAState): Promise<OODAResult> {
    try {
      const selectedAgent = state.lastDecision?.agent;
      
      if (!selectedAgent) {
        return {
          success: false,
          nextPhase: 'complete',
          microTasks: [],
          insights: ['Nenhum agente selecionado para decisão'],
          confidence: 0,
          shouldContinue: false
        };
      }
      
      // Usar LLM para análise de decisão se disponível
      let insights: string[] = [];
      let confidence = 0.7;
      
      if (await this.llmService.isConnected()) {
        const decisionPrompt = this.generateDecisionPrompt(task, selectedAgent, state);
        const llmInsights = await this.llmService.generateResponse(decisionPrompt);
        insights = this.parseInsights(llmInsights);
        confidence = this.calculateConfidence(insights);
      } else {
        insights = [`Decidindo executar agente ${selectedAgent.name}`];
        confidence = 0.6;
      }
      
      return {
        success: true,
        nextPhase: 'act',
        microTasks: [],
        insights,
        confidence,
        shouldContinue: true
      };
      
    } catch (error) {
      return {
        success: false,
        nextPhase: 'complete',
        microTasks: [],
        insights: [`Erro na decisão: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        shouldContinue: false
      };
    }
  }

  /**
   * Fase ACT: Executa as ações decididas
   */
  private async act(task: Task, agents: IAgent[], state: OODAState): Promise<OODAResult> {
    try {
      const selectedAgent = state.lastDecision?.agent;
      
      if (!selectedAgent) {
        return {
          success: false,
          nextPhase: 'complete',
          microTasks: [],
          insights: ['Nenhum agente selecionado para ação'],
          confidence: 0,
          shouldContinue: false
        };
      }
      
      // Executar agente
      const context = {
        task,
        projectState: state.lastObservation,
        emotionMemory: this.emotionMemory,
        llmService: this.llmService,
        fileSystem: this.fileSystem
      };
      
      const microTasks = await selectedAgent.execute(context);
      
      // Analisar resultado da ação
      let insights: string[] = [`Agente ${selectedAgent.name} executado com ${microTasks.length} micro-tasks`];
      let confidence = 0.8;
      
      if (await this.llmService.isConnected()) {
        const actionPrompt = this.generateActionPrompt(task, selectedAgent, microTasks, state);
        const llmInsights = await this.llmService.generateResponse(actionPrompt);
        insights.push(...this.parseInsights(llmInsights));
        confidence = this.calculateConfidence(insights);
      }
      
      // Atualizar estado
      state.lastAction = { agent: selectedAgent, microTasks };
      
      // Determinar próxima fase
      const nextPhase = this.determineNextPhase(task, microTasks, state);
      
      return {
        success: true,
        nextPhase,
        microTasks,
        insights,
        confidence,
        shouldContinue: nextPhase !== 'complete'
      };
      
    } catch (error) {
      return {
        success: false,
        nextPhase: 'complete',
        microTasks: [],
        insights: [`Erro na ação: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence: 0,
        shouldContinue: false
      };
    }
  }

  /**
   * Observa estado atual do projeto
   */
  private async observeProjectState(task: Task): Promise<any> {
    const files = await this.fileSystem.getProjectFiles(task.projectPath);
    
    return {
      files,
      dependencies: this.extractDependencies(files),
      buildStatus: task.buildStatus,
      testStatus: task.testStatus,
      errors: [],
      warnings: [],
      timestamp: Date.now()
    };
  }

  /**
   * Extrai dependências dos arquivos
   */
  private extractDependencies(files: Record<string, string>): Record<string, string> {
    if (files['package.json']) {
      try {
        const packageJson = JSON.parse(files['package.json']);
        return {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
      } catch (error) {
        console.warn('Erro ao parsear package.json:', error);
      }
    }
    return {};
  }

  /**
   * Determina próxima fase baseada no resultado
   */
  private determineNextPhase(task: Task, microTasks: MicroTask[], state: OODAState): 'observe' | 'orient' | 'decide' | 'act' | 'complete' {
    // Se não há micro-tasks, continuar observando
    if (microTasks.length === 0) {
      return 'observe';
    }
    
    // Se excedeu máximo de iterações, completar
    if (state.iteration >= state.maxIterations) {
      return 'complete';
    }
    
    // Se há micro-tasks para executar, continuar observando após execução
    return 'observe';
  }

  /**
   * Gera prompt para observação
   */
  private generateObservationPrompt(task: Task, projectState: any, state: OODAState): string {
    return `Analise o estado atual do projeto e identifique insights importantes:

PROMPT ORIGINAL: "${task.prompt}"

ESTADO ATUAL:
- Arquivos: ${Object.keys(projectState.files).length}
- Dependências: ${Object.keys(projectState.dependencies).length}
- Build Status: ${projectState.buildStatus}
- Test Status: ${projectState.testStatus}
- Iteração: ${state.iteration}/${state.maxIterations}

ARQUIVOS PRINCIPAIS:
${Object.keys(projectState.files).slice(0, 10).join(', ')}

Identifique:
1. Progresso atual do projeto
2. Próximos passos necessários
3. Problemas ou bloqueios
4. Oportunidades de melhoria
5. Prioridades de desenvolvimento

Retorne insights concisos e acionáveis.`;
  }

  /**
   * Gera prompt para orientação
   */
  private generateOrientationPrompt(task: Task, agent: IAgent, state: OODAState): string {
    return `Analise a seleção do agente e justifique a decisão:

PROMPT ORIGINAL: "${task.prompt}"

AGENTE SELECIONADO: ${agent.name}
PRIORIDADE: ${agent.getPriority()}

ESTADO DO PROJETO:
${JSON.stringify(state.lastObservation, null, 2)}

Justifique:
1. Por que este agente é apropriado
2. Que tipo de trabalho ele fará
3. Como isso contribui para o objetivo
4. Próximos passos esperados

Retorne análise concisa e focada.`;
  }

  /**
   * Gera prompt para decisão
   */
  private generateDecisionPrompt(task: Task, agent: IAgent, state: OODAState): string {
    return `Decida as ações específicas para o agente:

PROMPT ORIGINAL: "${task.prompt}"

AGENTE: ${agent.name}
ESTADO: ${JSON.stringify(state.lastObservation, null, 2)}

Defina:
1. Ações específicas a serem tomadas
2. Recursos necessários
3. Critérios de sucesso
4. Possíveis riscos
5. Alternativas consideradas

Retorne decisão clara e acionável.`;
  }

  /**
   * Gera prompt para ação
   */
  private generateActionPrompt(task: Task, agent: IAgent, microTasks: MicroTask[], state: OODAState): string {
    return `Analise o resultado da ação executada:

PROMPT ORIGINAL: "${task.prompt}"

AGENTE EXECUTADO: ${agent.name}
MICRO-TASKS GERADAS: ${microTasks.length}

MICRO-TASKS:
${microTasks.map(mt => `- ${mt.type}: ${mt.path || 'N/A'}`).join('\n')}

Avalie:
1. Qualidade das micro-tasks geradas
2. Alinhamento com o objetivo
3. Próximos passos necessários
4. Ajustes recomendados
5. Progresso geral

Retorne análise construtiva e focada.`;
  }

  /**
   * Parseia insights da resposta da LLM
   */
  private parseInsights(response: string): string[] {
    try {
      // Tentar extrair insights estruturados
      const lines = response.split('\n').filter(line => line.trim());
      return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(line => line.length > 0);
    } catch (error) {
      return [response.substring(0, 200) + '...'];
    }
  }

  /**
   * Parse complete LLM response including micro-tasks
   */
  private parseLLMResponse(response: string): { insights: string[]; confidence: number; microTasks: MicroTask[]; nextPhase?: string } {
    try {
      const parsed = JSON.parse(response);
      
      const result = {
        insights: parsed.insights || [],
        confidence: parsed.confidence || 0.5,
        microTasks: [] as MicroTask[],
        nextPhase: parsed.phase
      };

      // Parse micro-tasks if present
      if (parsed.microTasks && Array.isArray(parsed.microTasks)) {
        result.microTasks = parsed.microTasks.map((mt: any) => ({
          id: mt.id || `micro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: mt.type || 'file_create',
          path: mt.path,
          oldSnippet: mt.oldSnippet,
          newSnippet: mt.newSnippet,
          rollbackHash: mt.rollbackHash || 'default-hash',
          status: 'pending' as const,
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        }));
      }

      return result;
    } catch {
      // Se não for JSON válido, retornar estrutura vazia
      return {
        insights: this.parseInsights(response),
        confidence: 0.5,
        microTasks: []
      };
    }
  }

  /**
   * Calcula confiança baseada nos insights
   */
  private calculateConfidence(insights: string[]): number {
    if (insights.length === 0) return 0;
    
    // Confiança baseada na quantidade e qualidade dos insights
    const baseConfidence = Math.min(0.9, insights.length * 0.1);
    
    // Ajustar baseado em palavras-chave de confiança
    const confidenceKeywords = ['sucesso', 'completo', 'funcionando', 'correto', 'apropriado'];
    const uncertaintyKeywords = ['talvez', 'possivelmente', 'pode ser', 'incerto', 'dúvida'];
    
    const confidenceScore = insights.filter(insight => 
      confidenceKeywords.some(keyword => insight.toLowerCase().includes(keyword))
    ).length;
    
    const uncertaintyScore = insights.filter(insight => 
      uncertaintyKeywords.some(keyword => insight.toLowerCase().includes(keyword))
    ).length;
    
    return Math.max(0.1, Math.min(0.95, baseConfidence + (confidenceScore * 0.1) - (uncertaintyScore * 0.1)));
  }

  /**
   * Gera insights de fallback quando LLM não está disponível
   */
  private generateFallbackInsights(projectState: any): string[] {
    const insights: string[] = [];
    
    if (Object.keys(projectState.files).length === 0) {
      insights.push('Projeto vazio - precisa de estrutura inicial');
    } else {
      insights.push(`Projeto com ${Object.keys(projectState.files).length} arquivos`);
    }
    
    if (Object.keys(projectState.dependencies).length === 0) {
      insights.push('Nenhuma dependência instalada');
    } else {
      insights.push(`${Object.keys(projectState.dependencies).length} dependências instaladas`);
    }
    
    if (projectState.buildStatus === 'not_started') {
      insights.push('Build ainda não iniciado');
    }
    
    if (projectState.testStatus === 'not_started') {
      insights.push('Testes ainda não iniciados');
    }
    
    return insights;
  }
}
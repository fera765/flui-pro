import { injectable, inject } from 'inversify';
import { ITaskManager, Task, TaskLog, MicroTask, TaskStatus } from '../types/ITask';
import { IFileSystem } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { MicroTaskExecutor } from './MicroTaskExecutor';
import { OODALoop, OODAState } from './OODALoop';
import { TaskEmotionMemory, TaskEmotionContext } from './TaskEmotionMemory';
import { SecurityManager } from '../security/SecurityManager';
import { IAgent } from '../types/ITask';
import * as path from 'path';
import * as crypto from 'crypto';

@injectable()
export class TaskManager implements ITaskManager {
  private readonly fileSystem: IFileSystem;
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly microTaskExecutor: MicroTaskExecutor;
  private readonly oodaLoop: OODALoop;
  private readonly taskEmotionMemory: TaskEmotionMemory;
  private readonly securityManager: SecurityManager;
  private readonly agents: IAgent[];
  private readonly tasks: Map<string, Task> = new Map();
  private readonly taskStreams: Map<string, AsyncIterable<TaskLog>> = new Map();
  private readonly oodaStates: Map<string, OODAState> = new Map();

  constructor(
    @inject('IFileSystem') fileSystem: IFileSystem,
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('MicroTaskExecutor') microTaskExecutor: MicroTaskExecutor,
    @inject('OODALoop') oodaLoop: OODALoop,
    @inject('TaskEmotionMemory') taskEmotionMemory: TaskEmotionMemory,
    @inject('SecurityManager') securityManager: SecurityManager,
    @inject('IAgent[]') agents: IAgent[]
  ) {
    this.fileSystem = fileSystem;
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.microTaskExecutor = microTaskExecutor;
    this.oodaLoop = oodaLoop;
    this.taskEmotionMemory = taskEmotionMemory;
    this.securityManager = securityManager;
    this.agents = agents;
  }

  async createTask(prompt: string): Promise<Task> {
    const taskId = this.generateTaskId();
    const projectPath = path.join(process.cwd(), 'projects', `proj-${taskId}`);
    
    // Criar estrutura do projeto
    await this.fileSystem.createProjectStructure(projectPath, prompt);
    
    // Criar task
    const task: Task = {
      id: taskId,
      prompt,
      status: 'pending',
      createdAt: Date.now(),
      projectPath,
      microTasks: [],
      logs: [],
      checksums: {},
      buildStatus: 'not_started',
      testStatus: 'not_started'
    };
    
    // Armazenar task
    this.tasks.set(taskId, task);
    
    // Criar memória emocional para a task
    const emotionMemoryId = await this.createTaskEmotionMemory(task);
    task.emotionMemoryId = emotionMemoryId;
    
    // Iniciar processamento da task (apenas se não estiver em modo de teste)
    if (process.env.NODE_ENV !== 'test') {
      this.processTask(task);
    }
    
    return task;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.tasks.set(taskId, task);
      
      // Salvar log da task
      await this.fileSystem.saveTaskLog(task.projectPath, taskId, task);
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      // Remover diretório do projeto
      try {
        const fs = await import('fs');
        await fs.promises.rm(task.projectPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Erro ao remover projeto ${taskId}:`, error);
      }
      
      // Remover task da memória
      this.tasks.delete(taskId);
      this.taskStreams.delete(taskId);
    }
  }

  async listTasks(filters: { status?: string; limit?: number; offset?: number } = {}): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    // Filtrar por status se especificado
    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    
    // Aplicar paginação
    const offset = filters.offset || 0;
    const limit = filters.limit || 10;
    
    return tasks.slice(offset, offset + limit);
  }

  async iterateTask(taskId: string, message: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} não encontrada`);
    }
    
    // Adicionar log da iteração
    this.addTaskLog(task, 'info', `Iteração do usuário: ${message}`);
    
    // Analisar mensagem e gerar novas micro-tasks
    const newMicroTasks = await this.analyzeUserMessage(message, task);
    
    // Adicionar novas micro-tasks
    task.microTasks.push(...newMicroTasks);
    
    // Continuar processamento
    this.processTask(task);
  }

  getTaskStream(taskId: string): AsyncIterable<TaskLog> {
    if (!this.taskStreams.has(taskId)) {
      this.taskStreams.set(taskId, this.createTaskStream(taskId));
    }
    return this.taskStreams.get(taskId)!;
  }

  /**
   * Processa uma task usando o loop OODA
   */
  private async processTask(task: Task): Promise<void> {
    try {
      task.status = 'in_progress';
      this.addTaskLog(task, 'info', `Iniciando processamento da task ${task.id} com loop OODA`);
      
      // Inicializar estado OODA
      const oodaState: OODAState = {
        phase: 'observe',
        iteration: 0,
        maxIterations: 50, // Limite de segurança
        lastObservation: null,
        lastDecision: null,
        lastAction: null,
        context: {},
        memory: {}
      };
      
      this.oodaStates.set(task.id, oodaState);
      
      // Loop OODA principal
      while (task.status === 'in_progress' && oodaState.iteration < oodaState.maxIterations) {
        oodaState.iteration++;
        
        this.addTaskLog(task, 'info', `OODA Iteração ${oodaState.iteration}: Fase ${oodaState.phase.toUpperCase()}`);
        
        // Executar iteração do loop OODA
        const result = await this.oodaLoop.executeIteration(task, this.agents, oodaState);
        
        // Registrar contexto emocional
        await this.recordEmotionContext(task, oodaState.phase, result);
        
        // Processar resultado
        if (!result.success) {
          task.status = 'failed';
          this.addTaskLog(task, 'error', `Falha no loop OODA: ${result.insights.join(', ')}`);
          break;
        }
        
        // Adicionar insights aos logs
        for (const insight of result.insights) {
          this.addTaskLog(task, 'info', `OODA Insight: ${insight}`);
        }
        
        // Verificar segurança das micro-tasks antes de executar
        const securityAudit = await this.securityManager.auditTask(task.id, task.projectPath, result.microTasks);
        
        if (securityAudit.overallRisk === 'critical') {
          task.status = 'failed';
          this.addTaskLog(task, 'error', `Risco crítico de segurança detectado: ${securityAudit.recommendations.join(', ')}`);
          break;
        }
        
        // Executar micro-tasks geradas
        for (const microTask of result.microTasks) {
          await this.executeMicroTask(microTask, task);
        }
        
        // Atualizar fase
        oodaState.phase = result.nextPhase as any;
        
        // Verificar se deve continuar
        if (!result.shouldContinue || result.nextPhase === 'complete') {
          task.status = 'completed';
          task.completedAt = Date.now();
          this.addTaskLog(task, 'success', `Task ${task.id} concluída com sucesso após ${oodaState.iteration} iterações OODA`);
          break;
        }
        
        // Verificar se há micro-tasks pendentes
        const pendingMicroTasks = task.microTasks.filter(mt => mt.status === 'pending');
        if (pendingMicroTasks.length > 0) {
          this.addTaskLog(task, 'info', `Executando ${pendingMicroTasks.length} micro-tasks pendentes`);
          // Continuar para próxima iteração
        }
      }
      
      // Verificar se excedeu limite de iterações
      if (oodaState.iteration >= oodaState.maxIterations) {
        task.status = 'failed';
        this.addTaskLog(task, 'error', `Task ${task.id} falhou: excedeu limite de ${oodaState.maxIterations} iterações OODA`);
      }
      
    } catch (error) {
      task.status = 'failed';
      this.addTaskLog(task, 'error', `Erro no processamento OODA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Limpar estado OODA
      this.oodaStates.delete(task.id);
    }
  }

  /**
   * Registra contexto emocional da task
   */
  private async recordEmotionContext(task: Task, phase: string, result: any): Promise<void> {
    try {
      const context: TaskEmotionContext = {
        taskId: task.id,
        prompt: task.prompt,
        currentPhase: phase,
        agentName: task.currentAgent,
        microTaskType: result.microTasks?.[0]?.type,
        success: result.success,
        timestamp: Date.now(),
        metadata: {
          iteration: result.iteration,
          confidence: result.confidence,
          insights: result.insights
        }
      };
      
      await this.taskEmotionMemory.recordTaskContext(context);
      
    } catch (error) {
      console.warn('Erro ao registrar contexto emocional:', error);
    }
  }


  /**
   * Executa micro-task
   */
  private async executeMicroTask(microTask: MicroTask, task: Task): Promise<void> {
    try {
      microTask.status = 'in_progress';
      this.addTaskLog(task, 'info', `Executando micro-task: ${microTask.type}`);
      
      const result = await this.microTaskExecutor.executeMicroTask(microTask, task.projectPath);
      
      if (result.success) {
        microTask.status = 'completed';
        microTask.completedAt = Date.now();
        this.addTaskLog(task, 'success', `Micro-task ${microTask.id} concluída`);
        
        // Adicionar novas micro-tasks geradas
        task.microTasks.push(...result.newMicroTasks);
        
      } else {
        microTask.status = 'failed';
        microTask.error = result.logs.join('; ');
        this.addTaskLog(task, 'error', `Micro-task ${microTask.id} falhou: ${microTask.error}`);
        
        // Tentar novamente se não excedeu limite
        if (microTask.retryCount < microTask.maxRetries) {
          microTask.retryCount++;
          microTask.status = 'pending';
          this.addTaskLog(task, 'warn', `Tentando novamente micro-task ${microTask.id} (${microTask.retryCount}/${microTask.maxRetries})`);
        }
      }
      
    } catch (error) {
      microTask.status = 'failed';
      microTask.error = error instanceof Error ? error.message : 'Unknown error';
      this.addTaskLog(task, 'error', `Erro na micro-task ${microTask.id}: ${microTask.error}`);
    }
  }

  /**
   * Analisa mensagem do usuário e gera micro-tasks
   */
  private async analyzeUserMessage(message: string, task: Task): Promise<MicroTask[]> {
    try {
      // Verificar se LLM está disponível
      if (!(await this.llmService.isConnected())) {
        console.warn('LLM não disponível, retornando micro-tasks vazias');
        return [];
      }

      // Obter estado atual do projeto
      const files = await this.fileSystem.getProjectFiles(task.projectPath);
      const projectState = {
        files,
        dependencies: this.extractDependencies(files),
        buildStatus: task.buildStatus,
        testStatus: task.testStatus
      };

      const analysisPrompt = `Analise a seguinte mensagem do usuário e gere micro-tasks apropriadas:

Mensagem: "${message}"
Task atual: "${task.prompt}"
Estado do projeto: ${JSON.stringify(projectState, null, 2)}

Retorne um JSON com micro-tasks:
{
  "microTasks": [
    {
      "type": "tipo_da_task",
      "path": "caminho_do_arquivo",
      "oldSnippet": "conteúdo_atual",
      "newSnippet": "conteúdo_novo"
    }
  ]
}`;

      const response = await this.llmService.generateResponse(analysisPrompt);
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return parsed.microTasks.map((mt: any) => ({
        id: `user-iteration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: mt.type,
        path: mt.path,
        oldSnippet: mt.oldSnippet,
        newSnippet: mt.newSnippet,
        status: 'pending' as TaskStatus,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      }));
      
    } catch (error) {
      console.error('Erro ao analisar mensagem do usuário:', error);
      return [];
    }
  }

  /**
   * Cria stream de logs para task
   */
  private createTaskStream(taskId: string): AsyncIterable<TaskLog> {
    const taskManager = this;
    return {
      async *[Symbol.asyncIterator]() {
        const task = taskManager.tasks.get(taskId);
        if (task) {
          for (const log of task.logs) {
            yield log;
          }
        }
      }
    };
  }

  /**
   * Adiciona log à task
   */
  private addTaskLog(task: Task, level: 'info' | 'warn' | 'error' | 'success', message: string, details?: any): void {
    const log: TaskLog = {
      timestamp: Date.now(),
      level,
      message,
      agent: task.currentAgent,
      details
    };
    
    task.logs.push(log);
  }

  /**
   * Cria memória emocional para task
   */
  private async createTaskEmotionMemory(task: Task): Promise<string> {
    try {
      // Em modo de teste, retornar hash simples
      if (process.env.NODE_ENV === 'test') {
        return `test-memory-${task.id}`;
      }
      
      const context = `Task ${task.id}: ${task.prompt}`;
      const outcome = true;
      
      // Verificar se LLM está disponível antes de tentar usar
      if (await this.llmService.isConnected()) {
        const result = await this.emotionMemory.storeMemoryWithLLMAnalysis(
          `Nova task criada: ${task.prompt}`,
          context,
          outcome
        );
        return result.emotionHash;
      } else {
        // Fallback: criar memória simples sem LLM
        const emotionVector = await this.emotionMemory.analyzeEmotionalContext(`Nova task: ${task.prompt}`);
        const policyDelta = await this.emotionMemory.createPolicyDelta('task_created', context);
        return await this.emotionMemory.storeMemory(emotionVector, policyDelta, context, outcome);
      }
    } catch (error) {
      console.warn('Erro ao criar memória emocional para task:', error);
      return '';
    }
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
   * Limpa resposta JSON
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Gera ID único para task
   */
  private generateTaskId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}
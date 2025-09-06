import { injectable, inject, LazyServiceIdentifer } from 'inversify';
import { Request, Response } from 'express';
import { ITaskManager } from '../types/ITask';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { ILlmService } from '../../interfaces/ILlmService';
import { TaskEmotionMemory } from '../core/TaskEmotionMemory';
import { SecurityManager } from '../security/SecurityManager';
import { CallbackStreamer } from '../streaming/CallbackStreamer';

@injectable()
export class AutoCodeController {
  private readonly taskManager: ITaskManager;
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly taskEmotionMemory: TaskEmotionMemory;
  private readonly securityManager: SecurityManager;
  private readonly callbackStreamer: CallbackStreamer;

  constructor(
    @inject('ITaskManager') taskManager: ITaskManager,
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('TaskEmotionMemory') taskEmotionMemory: TaskEmotionMemory,
    @inject('SecurityManager') securityManager: SecurityManager,
    @inject('CallbackStreamer') callbackStreamer: CallbackStreamer
  ) {
    this.taskManager = taskManager;
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.taskEmotionMemory = taskEmotionMemory;
    this.securityManager = securityManager;
    this.callbackStreamer = callbackStreamer;
  }

  /**
   * POST /task - Criar nova task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({
          error: 'Prompt é obrigatório e deve ser uma string'
        });
        return;
      }

      // Criar task
      const task = await this.taskManager.createTask(prompt);
      
      // Enviar callback de criação da task
      this.callbackStreamer.sendStatusChange(task.id, 'created', {
        prompt,
        projectPath: task.projectPath,
        microTasksCount: task.microTasks.length
      });
      
      res.status(201).json({
        taskId: task.id,
        status: task.status,
        createdAt: task.createdAt,
        message: 'Task criada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao criar task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id - Obter task
   */
  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      res.json({
        taskId: task.id,
        prompt: task.prompt,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        projectPath: task.projectPath,
        currentAgent: task.currentAgent,
        buildStatus: task.buildStatus,
        testStatus: task.testStatus,
        microTasksCount: task.microTasks.length,
        logsCount: task.logs.length
      });
      
    } catch (error) {
      console.error('Erro ao obter task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PATCH /task/:id - Atualizar task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      // Atualizar task
      await this.taskManager.updateTask(id, updates);
      
      res.json({
        message: 'Task atualizada com sucesso',
        taskId: id
      });
      
    } catch (error) {
      console.error('Erro ao atualizar task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /task/:id - Deletar task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      // Deletar task
      await this.taskManager.deleteTask(id);
      
      res.json({
        message: 'Task deletada com sucesso',
        taskId: id
      });
      
    } catch (error) {
      console.error('Erro ao deletar task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /task/:id/iterate - Iterar task
   */
  async iterateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          error: 'Mensagem é obrigatória e deve ser uma string'
        });
        return;
      }
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      // Iterar task
      await this.taskManager.iterateTask(id, message);
      
      // Enviar callback de iteração
      this.callbackStreamer.sendStatusChange(id, 'iterating', {
        message,
        timestamp: Date.now()
      });
      
      res.json({
        message: 'Iteração processada com sucesso',
        taskId: id
      });
      
    } catch (error) {
      console.error('Erro ao iterar task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id/stream - Stream de logs da task
   */
  async getTaskStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      // Configurar headers para streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      // Enviar logs existentes
      for (const log of task.logs) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
      
      // Stream de novos logs
      const stream = this.taskManager.getTaskStream(id);
      
      for await (const log of stream) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
      
    } catch (error) {
      console.error('Erro no stream da task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id/logs - Obter logs da task
   */
  async getTaskLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      res.json({
        taskId: id,
        logs: task.logs,
        totalLogs: task.logs.length
      });
      
    } catch (error) {
      console.error('Erro ao obter logs da task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id/status - Obter status da task
   */
  async getTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      
      if (!task) {
        res.status(404).json({
          error: 'Task não encontrada'
        });
        return;
      }
      
      res.json({
        taskId: id,
        status: task.status,
        currentAgent: task.currentAgent,
        buildStatus: task.buildStatus,
        testStatus: task.testStatus,
        microTasksCount: task.microTasks.length,
        completedMicroTasks: task.microTasks.filter(mt => mt.status === 'completed').length,
        failedMicroTasks: task.microTasks.filter(mt => mt.status === 'failed').length,
        logsCount: task.logs.length
      });
      
    } catch (error) {
      console.error('Erro ao obter status da task:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /health - Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const llmConnected = await this.llmService.isConnected();
      const memoryStats = await this.emotionMemory.getMemoryStats();
      
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        services: {
          llm: llmConnected ? 'connected' : 'disconnected',
          emotionMemory: 'active',
          taskManager: 'active'
        },
        memoryStats: {
          totalMemories: memoryStats.totalMemories,
          averageIntensity: memoryStats.averageIntensity
        }
      });
      
    } catch (error) {
      console.error('Erro no health check:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /tasks - Listar todas as tasks
   */
  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const { status, limit = 10, offset = 0 } = req.query;
      
      // Implementar listagem de tasks com filtros
      const tasks = await this.taskManager.listTasks({
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        tasks,
        total: tasks.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error) {
      console.error('Erro ao listar tasks:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }



  /**
   * POST /task/:id/retry - Tentar novamente task falhada
   */
  async retryTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      if (task.status !== 'failed') {
        res.status(400).json({ error: 'Apenas tasks falhadas podem ser tentadas novamente' });
        return;
      }

      // Resetar status e micro-tasks falhadas
      task.status = 'pending';
      task.microTasks.forEach(mt => {
        if (mt.status === 'failed' && mt.retryCount < mt.maxRetries) {
          mt.status = 'pending';
          mt.retryCount++;
        }
      });

      // Atualizar task
      await this.taskManager.updateTask(id, { status: 'pending' });

      res.json({
        success: true,
        message: 'Task reiniciada com sucesso',
        taskId: id
      });

    } catch (error) {
      console.error('Erro ao tentar novamente task:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /system/optimize - Otimizar sistema
   */
  async optimizeSystem(req: Request, res: Response): Promise<void> {
    try {
      const { memory, config } = req.body;
      
      const optimizationResult = await this.emotionMemory.optimizeMemorySystem(
        memory?.decayConfig,
        memory?.clusteringConfig
      );

      res.json({
        success: true,
        message: 'Sistema otimizado com sucesso',
        optimization: optimizationResult
      });

    } catch (error) {
      console.error('Erro ao otimizar sistema:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calcula progresso da task
   */
  private calculateProgress(task: any): number {
    if (task.microTasks.length === 0) return 0;
    
    const completed = task.microTasks.filter((mt: any) => mt.status === 'completed').length;
    return Math.round((completed / task.microTasks.length) * 100);
  }

  /**
   * GET /task/:id/emotion - Obter insights emocionais da task
   */
  async getTaskEmotionInsights(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const insights = await this.taskEmotionMemory.getTaskEmotionInsights(id);
      const stats = this.taskEmotionMemory.getTaskEmotionStats();

      res.json({
        success: true,
        taskId: id,
        insights,
        stats: {
          totalTasks: stats.totalTasks,
          totalContexts: stats.totalContexts,
          averageContextsPerTask: stats.averageContextsPerTask
        }
      });

    } catch (error) {
      console.error('Erro ao obter insights emocionais da task:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /task/:id/emotion/context - Obter contexto emocional para decisão
   */
  async getEmotionalContextForDecision(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { context } = req.body;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const emotionalContext = await this.taskEmotionMemory.getEmotionalContextForDecision(id, context);

      res.json({
        success: true,
        taskId: id,
        emotionalContext,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao obter contexto emocional para decisão:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /task/:id/emotion - Limpar memória emocional da task
   */
  async clearTaskEmotionMemory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      this.taskEmotionMemory.clearTaskEmotionMemory(id);

      res.json({
        success: true,
        message: 'Memória emocional da task limpa com sucesso',
        taskId: id
      });

    } catch (error) {
      console.error('Erro ao limpar memória emocional da task:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id/security - Obter auditoria de segurança da task
   */
  async getTaskSecurityAudit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const securityHistory = this.securityManager.getSecurityHistory(id);

      res.json({
        success: true,
        taskId: id,
        securityHistory,
        totalAudits: securityHistory.length
      });

    } catch (error) {
      console.error('Erro ao obter auditoria de segurança da task:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /task/:id/security/audit - Executar nova auditoria de segurança
   */
  async executeSecurityAudit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const audit = await this.securityManager.auditTask(id, task.projectPath, task.microTasks);

      res.json({
        success: true,
        taskId: id,
        audit,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao executar auditoria de segurança:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /task/:id/rollback - Criar ponto de rollback
   */
  async createRollbackPoint(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description } = req.body;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const rollbackPoint = await this.securityManager.createRollbackPoint(
        id, 
        description || 'Ponto de rollback automático',
        task.projectPath
      );

      res.json({
        success: true,
        taskId: id,
        rollbackPoint,
        message: 'Ponto de rollback criado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar ponto de rollback:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /task/:id/rollback - Listar pontos de rollback
   */
  async getRollbackPoints(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const rollbackPoints = this.securityManager.getRollbackPoints(id);

      res.json({
        success: true,
        taskId: id,
        rollbackPoints,
        total: rollbackPoints.length
      });

    } catch (error) {
      console.error('Erro ao obter pontos de rollback:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /task/:id/rollback/:rollbackId - Executar rollback
   */
  async executeRollback(req: Request, res: Response): Promise<void> {
    try {
      const { id, rollbackId } = req.params;
      
      const task = await this.taskManager.getTask(id);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      const success = await this.securityManager.executeRollback(id, rollbackId, task.projectPath);

      if (success) {
        res.json({
          success: true,
          taskId: id,
          rollbackId,
          message: 'Rollback executado com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Falha ao executar rollback'
        });
      }

    } catch (error) {
      console.error('Erro ao executar rollback:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /security/check - Verificar segurança de operação
   */
  async checkOperationSafety(req: Request, res: Response): Promise<void> {
    try {
      const { operation } = req.body;
      
      if (!operation || !operation.type) {
        res.status(400).json({ error: 'Operação é obrigatória' });
        return;
      }

      const safetyCheck = await this.securityManager.isOperationSafe(operation);

      res.json({
        success: true,
        operation,
        safety: safetyCheck,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao verificar segurança da operação:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Estima tempo restante
   */
  private estimateTimeRemaining(task: any): number | null {
    if (task.status === 'completed') return 0;
    
    const pendingTasks = task.microTasks.filter((mt: any) => mt.status === 'pending');
    if (pendingTasks.length === 0) return 0;
    
    // Estimativa baseada em tempo médio por micro-task (30 segundos)
    const avgTimePerTask = 30;
    return pendingTasks.length * avgTimePerTask;
  }
}
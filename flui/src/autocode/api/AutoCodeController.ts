import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { ITaskManager } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';

@injectable()
export class AutoCodeController {
  private readonly taskManager: ITaskManager;
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;

  constructor(
    @inject('ITaskManager') taskManager: ITaskManager,
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory
  ) {
    this.taskManager = taskManager;
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
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
}
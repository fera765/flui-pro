import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { CallbackStreamer, StreamMessage } from './CallbackStreamer';
import { ITaskManager } from '../types/ITask';

@injectable()
export class StreamingController {
  constructor(
    @inject('CallbackStreamer') private callbackStreamer: CallbackStreamer,
    @inject('ITaskManager') private taskManager: ITaskManager
  ) {}

  /**
   * GET /callbacks/:taskId - Stream de callbacks em tempo real
   */
  async getTaskStream(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      
      // Verificar se a task existe
      const task = await this.taskManager.getTask(taskId);
      if (!task) {
        res.status(404).json({ error: 'Task não encontrada' });
        return;
      }

      // Configurar headers para Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Criar ou obter stream existente
      let stream = this.callbackStreamer.getStream(taskId);
      if (!stream) {
        stream = this.callbackStreamer.createStream(taskId);
      }

      // Enviar mensagem inicial
      this.sendSSEMessage(res, {
        type: 'status_change',
        taskId,
        timestamp: Date.now(),
        data: { 
          status: task.status,
          message: 'Stream conectado com sucesso'
        }
      });

      // Configurar listener para mensagens
      const messageHandler = (message: StreamMessage) => {
        this.sendSSEMessage(res, message);
      };

      const closeHandler = () => {
        this.sendSSEMessage(res, {
          type: 'status_change',
          taskId,
          timestamp: Date.now(),
          data: { 
            status: 'disconnected',
            message: 'Stream desconectado'
          }
        });
        res.end();
      };

      // Adicionar listeners
      stream.stream.on('message', messageHandler);
      stream.stream.on('close', closeHandler);

      // Configurar cleanup quando cliente desconectar
      req.on('close', () => {
        stream?.stream.removeListener('message', messageHandler);
        stream?.stream.removeListener('close', closeHandler);
      });

      // Enviar heartbeat a cada 30 segundos
      const heartbeat = setInterval(() => {
        if (res.writableEnded) {
          clearInterval(heartbeat);
          return;
        }
        
        this.sendSSEMessage(res, {
          type: 'status_change',
          taskId,
          timestamp: Date.now(),
          data: { 
            status: 'heartbeat',
            message: 'Stream ativo'
          }
        });
      }, 30000);

      // Limpar heartbeat quando cliente desconectar
      req.on('close', () => {
        clearInterval(heartbeat);
      });

    } catch (error) {
      console.error('Erro no stream de callbacks:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        res.end();
      }
    }
  }

  /**
   * GET /callbacks/:taskId/status - Status do stream
   */
  async getStreamStatus(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      
      const stream = this.callbackStreamer.getStream(taskId);
      
      if (!stream) {
        res.status(404).json({ 
          error: 'Stream não encontrado',
          taskId,
          active: false
        });
        return;
      }

      res.json({
        success: true,
        taskId,
        active: stream.isActive,
        createdAt: stream.createdAt,
        lastActivity: stream.lastActivity,
        uptime: Date.now() - stream.createdAt.getTime()
      });

    } catch (error) {
      console.error('Erro ao obter status do stream:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /callbacks/:taskId/send - Enviar mensagem para stream
   */
  async sendMessageToStream(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { type, data, message } = req.body;
      
      if (!type) {
        res.status(400).json({ error: 'Tipo de mensagem é obrigatório' });
        return;
      }

      const streamMessage: StreamMessage = {
        type,
        taskId,
        timestamp: Date.now(),
        data,
        message
      };

      const success = this.callbackStreamer.sendMessage(taskId, streamMessage);

      if (success) {
        res.json({
          success: true,
          message: 'Mensagem enviada com sucesso',
          taskId,
          timestamp: streamMessage.timestamp
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Stream não encontrado ou inativo',
          taskId
        });
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem para stream:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /callbacks/stats - Estatísticas dos streams
   */
  async getStreamStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.callbackStreamer.getStreamStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas dos streams:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /callbacks/:taskId - Fechar stream
   */
  async closeStream(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      
      const success = this.callbackStreamer.closeStream(taskId);

      if (success) {
        res.json({
          success: true,
          message: 'Stream fechado com sucesso',
          taskId
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Stream não encontrado',
          taskId
        });
      }

    } catch (error) {
      console.error('Erro ao fechar stream:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Envia mensagem no formato Server-Sent Events
   */
  private sendSSEMessage(res: Response, message: StreamMessage): void {
    if (res.writableEnded) {
      return;
    }

    try {
      const data = JSON.stringify(message);
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Erro ao enviar mensagem SSE:', error);
    }
  }
}
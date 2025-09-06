import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { TaskLog } from '../types/ITask';

export interface CallbackStream {
  taskId: string;
  stream: EventEmitter;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface StreamMessage {
  type: 'progress' | 'log' | 'error' | 'complete' | 'status_change';
  taskId: string;
  timestamp: number;
  data: any;
  message?: string;
}

@injectable()
export class CallbackStreamer {
  private streams: Map<string, CallbackStream> = new Map();
  private readonly maxStreams = 100;
  private readonly streamTimeout = 30 * 60 * 1000; // 30 minutos

  /**
   * Cria um novo stream de callback para uma task
   */
  createStream(taskId: string): CallbackStream {
    // Limpar streams antigos se necessário
    this.cleanupOldStreams();

    // Se já existe um stream para esta task, reutilizar
    if (this.streams.has(taskId)) {
      const existingStream = this.streams.get(taskId)!;
      existingStream.isActive = true;
      existingStream.lastActivity = new Date();
      return existingStream;
    }

    // Criar novo stream
    const stream = new EventEmitter();
    const callbackStream: CallbackStream = {
      taskId,
      stream,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.streams.set(taskId, callbackStream);

    // Configurar timeout para limpeza automática
    setTimeout(() => {
      this.closeStream(taskId);
    }, this.streamTimeout);

    return callbackStream;
  }

  /**
   * Obtém stream existente para uma task
   */
  getStream(taskId: string): CallbackStream | null {
    const stream = this.streams.get(taskId);
    if (stream && stream.isActive) {
      stream.lastActivity = new Date();
      return stream;
    }
    return null;
  }

  /**
   * Envia mensagem para o stream de uma task
   */
  sendMessage(taskId: string, message: StreamMessage): boolean {
    const stream = this.getStream(taskId);
    if (!stream) {
      return false;
    }

    try {
      stream.stream.emit('message', message);
      stream.lastActivity = new Date();
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem para stream:', error);
      return false;
    }
  }

  /**
   * Envia log de progresso
   */
  sendProgress(taskId: string, progress: number, message?: string): boolean {
    return this.sendMessage(taskId, {
      type: 'progress',
      taskId,
      timestamp: Date.now(),
      data: { progress },
      message
    });
  }

  /**
   * Envia log de atividade
   */
  sendLog(taskId: string, log: TaskLog): boolean {
    return this.sendMessage(taskId, {
      type: 'log',
      taskId,
      timestamp: Date.now(),
      data: log
    });
  }

  /**
   * Envia erro
   */
  sendError(taskId: string, error: string, details?: any): boolean {
    return this.sendMessage(taskId, {
      type: 'error',
      taskId,
      timestamp: Date.now(),
      data: { error, details },
      message: error
    });
  }

  /**
   * Envia status de conclusão
   */
  sendComplete(taskId: string, result: any): boolean {
    return this.sendMessage(taskId, {
      type: 'complete',
      taskId,
      timestamp: Date.now(),
      data: result
    });
  }

  /**
   * Envia mudança de status
   */
  sendStatusChange(taskId: string, status: string, details?: any): boolean {
    return this.sendMessage(taskId, {
      type: 'status_change',
      taskId,
      timestamp: Date.now(),
      data: { status, details }
    });
  }

  /**
   * Fecha stream de uma task
   */
  closeStream(taskId: string): boolean {
    const stream = this.streams.get(taskId);
    if (stream) {
      stream.isActive = false;
      stream.stream.emit('close');
      stream.stream.removeAllListeners();
      this.streams.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Lista streams ativos
   */
  getActiveStreams(): CallbackStream[] {
    return Array.from(this.streams.values()).filter(stream => stream.isActive);
  }

  /**
   * Obtém estatísticas dos streams
   */
  getStreamStats(): {
    totalStreams: number;
    activeStreams: number;
    oldestStream?: Date;
    newestStream?: Date;
  } {
    const streams = Array.from(this.streams.values());
    const activeStreams = streams.filter(s => s.isActive);
    
    return {
      totalStreams: streams.length,
      activeStreams: activeStreams.length,
      oldestStream: streams.length > 0 ? 
        new Date(Math.min(...streams.map(s => s.createdAt.getTime()))) : 
        undefined,
      newestStream: streams.length > 0 ? 
        new Date(Math.max(...streams.map(s => s.createdAt.getTime()))) : 
        undefined
    };
  }

  /**
   * Limpa streams antigos e inativos
   */
  private cleanupOldStreams(): void {
    const now = new Date();
    const streamsToRemove: string[] = [];

    for (const [taskId, stream] of this.streams.entries()) {
      const timeSinceLastActivity = now.getTime() - stream.lastActivity.getTime();
      
      // Remover streams inativos há mais de 1 hora
      if (!stream.isActive || timeSinceLastActivity > 60 * 60 * 1000) {
        streamsToRemove.push(taskId);
      }
    }

    // Remover streams antigos se exceder limite
    if (this.streams.size > this.maxStreams) {
      const sortedStreams = Array.from(this.streams.entries())
        .sort((a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime());
      
      const excessCount = this.streams.size - this.maxStreams;
      for (let i = 0; i < excessCount; i++) {
        streamsToRemove.push(sortedStreams[i][0]);
      }
    }

    // Remover streams marcados
    streamsToRemove.forEach(taskId => {
      this.closeStream(taskId);
    });
  }

  /**
   * Limpa todos os streams
   */
  clearAllStreams(): void {
    for (const taskId of this.streams.keys()) {
      this.closeStream(taskId);
    }
  }
}
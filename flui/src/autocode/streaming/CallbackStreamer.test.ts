import { CallbackStreamer } from './CallbackStreamer';
import { container } from '../../config/container';

describe('CallbackStreamer', () => {
  let callbackStreamer: CallbackStreamer;

  beforeEach(() => {
    callbackStreamer = container.get<CallbackStreamer>('CallbackStreamer');
  });

  afterEach(() => {
    callbackStreamer.clearAllStreams();
  });

  describe('createStream', () => {
    it('deve criar um novo stream para uma task', () => {
      const taskId = 'test-task-123';
      
      const stream = callbackStreamer.createStream(taskId);
      
      expect(stream).toBeDefined();
      expect(stream.taskId).toBe(taskId);
      expect(stream.isActive).toBe(true);
      expect(stream.stream).toBeDefined();
      expect(stream.createdAt).toBeInstanceOf(Date);
      expect(stream.lastActivity).toBeInstanceOf(Date);
    });

    it('deve reutilizar stream existente se já existe para a task', () => {
      const taskId = 'test-task-456';
      
      const stream1 = callbackStreamer.createStream(taskId);
      const stream2 = callbackStreamer.createStream(taskId);
      
      expect(stream1).toBe(stream2);
      expect(stream1.isActive).toBe(true);
    });
  });

  describe('getStream', () => {
    it('deve retornar stream existente e ativo', () => {
      const taskId = 'test-task-789';
      
      callbackStreamer.createStream(taskId);
      const stream = callbackStreamer.getStream(taskId);
      
      expect(stream).toBeDefined();
      expect(stream?.taskId).toBe(taskId);
      expect(stream?.isActive).toBe(true);
    });

    it('deve retornar null para stream inexistente', () => {
      const stream = callbackStreamer.getStream('inexistent-task');
      
      expect(stream).toBeNull();
    });

    it('deve retornar null para stream inativo', () => {
      const taskId = 'test-task-inactive';
      
      const stream = callbackStreamer.createStream(taskId);
      stream.isActive = false;
      
      const retrievedStream = callbackStreamer.getStream(taskId);
      
      expect(retrievedStream).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('deve enviar mensagem para stream ativo', (done) => {
      const taskId = 'test-task-message';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('message', (message) => {
        expect(message.type).toBe('log');
        expect(message.taskId).toBe(taskId);
        expect(message.data).toEqual({ test: 'data' });
        done();
      });
      
      const success = callbackStreamer.sendMessage(taskId, {
        type: 'log',
        taskId,
        timestamp: Date.now(),
        data: { test: 'data' }
      });
      
      expect(success).toBe(true);
    });

    it('deve retornar false para stream inexistente', () => {
      const success = callbackStreamer.sendMessage('inexistent-task', {
        type: 'log',
        taskId: 'inexistent-task',
        timestamp: Date.now(),
        data: {}
      });
      
      expect(success).toBe(false);
    });
  });

  describe('sendProgress', () => {
    it('deve enviar mensagem de progresso', (done) => {
      const taskId = 'test-task-progress';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('message', (message) => {
        expect(message.type).toBe('progress');
        expect(message.data.progress).toBe(50);
        expect(message.message).toBe('Half done');
        done();
      });
      
      const success = callbackStreamer.sendProgress(taskId, 50, 'Half done');
      
      expect(success).toBe(true);
    });
  });

  describe('sendError', () => {
    it('deve enviar mensagem de erro', (done) => {
      const taskId = 'test-task-error';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('message', (message) => {
        expect(message.type).toBe('error');
        expect(message.data.error).toBe('Test error');
        expect(message.data.details).toEqual({ code: 500 });
        expect(message.message).toBe('Test error');
        done();
      });
      
      const success = callbackStreamer.sendError(taskId, 'Test error', { code: 500 });
      
      expect(success).toBe(true);
    });
  });

  describe('sendComplete', () => {
    it('deve enviar mensagem de conclusão', (done) => {
      const taskId = 'test-task-complete';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('message', (message) => {
        expect(message.type).toBe('complete');
        expect(message.data).toEqual({ result: 'success' });
        done();
      });
      
      const success = callbackStreamer.sendComplete(taskId, { result: 'success' });
      
      expect(success).toBe(true);
    });
  });

  describe('sendStatusChange', () => {
    it('deve enviar mensagem de mudança de status', (done) => {
      const taskId = 'test-task-status';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('message', (message) => {
        expect(message.type).toBe('status_change');
        expect(message.data.status).toBe('running');
        expect(message.data.details).toEqual({ progress: 25 });
        done();
      });
      
      const success = callbackStreamer.sendStatusChange(taskId, 'running', { progress: 25 });
      
      expect(success).toBe(true);
    });
  });

  describe('closeStream', () => {
    it('deve fechar stream existente', (done) => {
      const taskId = 'test-task-close';
      
      const stream = callbackStreamer.createStream(taskId);
      
      stream.stream.on('close', () => {
        done();
      });
      
      const success = callbackStreamer.closeStream(taskId);
      
      expect(success).toBe(true);
      
      // Verificar se stream foi removido
      const retrievedStream = callbackStreamer.getStream(taskId);
      expect(retrievedStream).toBeNull();
    });

    it('deve retornar false para stream inexistente', () => {
      const success = callbackStreamer.closeStream('inexistent-task');
      
      expect(success).toBe(false);
    });
  });

  describe('getActiveStreams', () => {
    it('deve retornar lista de streams ativos', () => {
      const taskId1 = 'test-task-1';
      const taskId2 = 'test-task-2';
      const taskId3 = 'test-task-3';
      
      callbackStreamer.createStream(taskId1);
      callbackStreamer.createStream(taskId2);
      const stream3 = callbackStreamer.createStream(taskId3);
      stream3.isActive = false; // Tornar inativo
      
      const activeStreams = callbackStreamer.getActiveStreams();
      
      expect(activeStreams).toHaveLength(2);
      expect(activeStreams.map(s => s.taskId)).toContain(taskId1);
      expect(activeStreams.map(s => s.taskId)).toContain(taskId2);
      expect(activeStreams.map(s => s.taskId)).not.toContain(taskId3);
    });
  });

  describe('getStreamStats', () => {
    it('deve retornar estatísticas dos streams', () => {
      const taskId1 = 'test-task-stats-1';
      const taskId2 = 'test-task-stats-2';
      
      callbackStreamer.createStream(taskId1);
      callbackStreamer.createStream(taskId2);
      
      const stats = callbackStreamer.getStreamStats();
      
      expect(stats.totalStreams).toBe(2);
      expect(stats.activeStreams).toBe(2);
      expect(stats.oldestStream).toBeInstanceOf(Date);
      expect(stats.newestStream).toBeInstanceOf(Date);
    });

    it('deve retornar estatísticas vazias quando não há streams', () => {
      const stats = callbackStreamer.getStreamStats();
      
      expect(stats.totalStreams).toBe(0);
      expect(stats.activeStreams).toBe(0);
      expect(stats.oldestStream).toBeUndefined();
      expect(stats.newestStream).toBeUndefined();
    });
  });

  describe('clearAllStreams', () => {
    it('deve limpar todos os streams', () => {
      const taskId1 = 'test-task-clear-1';
      const taskId2 = 'test-task-clear-2';
      
      callbackStreamer.createStream(taskId1);
      callbackStreamer.createStream(taskId2);
      
      expect(callbackStreamer.getActiveStreams()).toHaveLength(2);
      
      callbackStreamer.clearAllStreams();
      
      expect(callbackStreamer.getActiveStreams()).toHaveLength(0);
      expect(callbackStreamer.getStream(taskId1)).toBeNull();
      expect(callbackStreamer.getStream(taskId2)).toBeNull();
    });
  });
});
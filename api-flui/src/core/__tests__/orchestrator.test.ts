import { Orchestrator } from '../orchestrator';
import { Task, TaskResult, OrchestratorConfig } from '../../types';
import { Classifier } from '../classifier';
import { Planner } from '../planner';
import { Worker } from '../worker';
import { Supervisor } from '../supervisor';

// Mock dependencies
jest.mock('../classifier');
jest.mock('../planner');
jest.mock('../worker');
jest.mock('../supervisor');

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;
  let mockClassifier: jest.Mocked<Classifier>;
  let mockPlanner: jest.Mocked<Planner>;
  let mockWorker: jest.Mocked<Worker>;
  let mockSupervisor: jest.Mocked<Supervisor>;

  const mockConfig: OrchestratorConfig = {
    maxDepth: 3,
    maxRetries: 2,
    taskTimeoutMs: 30000,
    enableStreaming: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClassifier = {
      classifyTask: jest.fn().mockReturnValue({
        type: 'task',
        subtype: 'general',
        confidence: 0.9,
        parameters: {}
      })
    } as any;

    mockPlanner = {
      createPlan: jest.fn(),
      validatePlan: jest.fn()
    } as any;

    mockWorker = {
      executeTask: jest.fn(),
      isAvailable: jest.fn()
    } as any;

    mockSupervisor = {
      reviewTask: jest.fn(),
      approveTask: jest.fn(),
      rejectTask: jest.fn()
    } as any;

    orchestrator = new Orchestrator(
      mockConfig,
      mockClassifier,
      mockPlanner,
      mockWorker,
      mockSupervisor
    );
  });

  describe('createTask', () => {
    it('should create a new task with proper metadata', async () => {
      const prompt = 'Generate an image of a cat';
      const task = await orchestrator.createTask(prompt);

      expect(task.id).toBeDefined();
      expect(task.prompt).toBe(prompt);
      expect(task.status).toBe('pending');
      expect(task.depth).toBe(0);
      expect(task.retries).toBe(0);
      expect(task.maxRetries).toBe(mockConfig.maxRetries);
      expect(task.maxDepth).toBe(mockConfig.maxDepth);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should classify the task using the classifier', async () => {
      const prompt = 'Hello, how are you?';
      mockClassifier.classifyTask.mockReturnValue({
        type: 'conversation',
        confidence: 0.95,
        parameters: {}
      });

      await orchestrator.createTask(prompt);

      expect(mockClassifier.classifyTask).toHaveBeenCalledWith(prompt);
    });

    it('should store the task in memory', async () => {
      const prompt = 'Test task';
      const task = await orchestrator.createTask(prompt);

      const storedTask = orchestrator.getTask(task.id);
      expect(storedTask).toEqual(task);
    });
  });

  describe('executeTask', () => {
    it('should execute a simple conversation task', async () => {
      const prompt = 'Hello, how are you?';
      const task = await orchestrator.createTask(prompt);

      mockClassifier.classifyTask.mockReturnValue({
        type: 'conversation',
        confidence: 0.95,
        parameters: {}
      });

      mockWorker.executeTask.mockResolvedValue({
        success: true,
        data: 'Hello! I am doing well, thank you for asking.',
        metadata: {}
      });

      const result = await orchestrator.executeTask(task.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello! I am doing well, thank you for asking.');
      expect(mockWorker.executeTask).toHaveBeenCalledWith(task);
    });

    it('should execute an image generation task', async () => {
      const prompt = 'Generate an image of a sunset';
      const task = await orchestrator.createTask(prompt);

      mockClassifier.classifyTask.mockReturnValue({
        type: 'task',
        subtype: 'image_generation',
        confidence: 0.9,
        parameters: { subject: 'sunset' }
      });

      mockWorker.executeTask.mockResolvedValue({
        success: true,
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        metadata: { size: '1024x1024', model: 'flux' }
      });

      const result = await orchestrator.executeTask(task.id);

      expect(result.success).toBe(true);
      expect(result.data).toContain('data:image/png;base64');
      expect(result.metadata.size).toBe('1024x1024');
    });

    it('should handle task execution failures', async () => {
      const prompt = 'Generate an image of a cat';
      const task = await orchestrator.createTask(prompt);

      mockWorker.executeTask.mockRejectedValue(new Error('API Error'));

      const result = await orchestrator.executeTask(task.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should respect max depth constraints', async () => {
      const prompt = 'Create a complex multi-step task';
      const task = await orchestrator.createTask(prompt);

      // Simulate a task that would exceed max depth
      mockWorker.executeTask.mockImplementation(async (task) => {
        if (task.depth >= mockConfig.maxDepth) {
          throw new Error('Max depth exceeded');
        }
        return { success: true, data: 'Subtask result', metadata: {} };
      });

      // First, we need to set the task depth to max depth
      task.depth = mockConfig.maxDepth;
      orchestrator['tasks'].set(task.id, task);

      const result = await orchestrator.executeTask(task.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Max depth exceeded');
    });

    it('should not retry beyond max retries', async () => {
      const prompt = 'Test task';
      const task = await orchestrator.createTask(prompt);

      mockWorker.executeTask.mockRejectedValue(new Error('Persistent failure'));

      // Execute multiple times to exceed max retries
      for (let i = 0; i <= mockConfig.maxRetries; i++) {
        await orchestrator.executeTask(task.id);
      }

      const finalTask = orchestrator.getTask(task.id);
      expect(finalTask).toBeDefined();
      expect(finalTask!.status).toBe('failed');
      // The task should have failed due to persistent errors
      expect(finalTask!.error).toBeDefined();
    });
  });

  describe('delegateTask', () => {
    it('should delegate complex tasks to workers', async () => {
      const prompt = 'Generate an image and then write a story about it';
      const task = await orchestrator.createTask(prompt);

      mockClassifier.classifyTask.mockReturnValue({
        type: 'task',
        subtype: 'composite',
        confidence: 0.85,
        parameters: { subtaskCount: 2 }
      });

      mockPlanner.createPlan.mockResolvedValue({
        subtasks: [
          { id: 'sub1', type: 'image_generation', prompt: 'Generate image', dependencies: [] },
          { id: 'sub2', type: 'text_generation', prompt: 'Write story', dependencies: ['sub1'] }
        ],
        estimatedDuration: 60000,
        complexity: 'medium'
      });

      mockWorker.isAvailable.mockReturnValue(true);

      const result = await orchestrator.delegateTask(task.id);

      expect(result.success).toBe(true);
      expect(mockPlanner.createPlan).toHaveBeenCalledWith(task);
      expect(mockWorker.isAvailable).toHaveBeenCalled();
    });

    it('should handle delegation failures gracefully', async () => {
      const prompt = 'Complex task';
      const task = await orchestrator.createTask(prompt);

      mockPlanner.createPlan.mockRejectedValue(new Error('Planning failed'));

      const result = await orchestrator.delegateTask(task.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planning failed');
    });
  });

  describe('retryTask', () => {
    it('should retry failed tasks within retry limits', async () => {
      const prompt = 'Test task';
      const task = await orchestrator.createTask(prompt);

      // First execution fails
      mockWorker.executeTask.mockRejectedValueOnce(new Error('Temporary failure'));
      
      // Second execution succeeds
      mockWorker.executeTask.mockResolvedValueOnce({
        success: true,
        data: 'Success on retry',
        metadata: {}
      });

      const firstResult = await orchestrator.executeTask(task.id);
      expect(firstResult.success).toBe(false);

      const retryResult = await orchestrator.retryTask(task.id);
      expect(retryResult.success).toBe(true);
      expect(retryResult.data).toBe('Success on retry');

      const updatedTask = orchestrator.getTask(task.id);
      expect(updatedTask).toBeDefined();
      expect(updatedTask!.retries).toBe(1);
    });

    it('should not retry beyond max retries', async () => {
      const prompt = 'Test task';
      const task = await orchestrator.createTask(prompt);

      mockWorker.executeTask.mockRejectedValue(new Error('Persistent failure'));

      // Execute multiple times to exceed max retries
      for (let i = 0; i <= mockConfig.maxRetries; i++) {
        await orchestrator.executeTask(task.id);
      }

      const finalTask = orchestrator.getTask(task.id);
      expect(finalTask).toBeDefined();
      expect(finalTask!.status).toBe('failed');
      // The task should have failed due to persistent errors
      expect(finalTask!.error).toBeDefined();
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status and metadata', async () => {
      const prompt = 'Test task';
      const task = await orchestrator.createTask(prompt);

      const status = orchestrator.getTaskStatus(task.id);
      expect(status).toBeDefined();
      expect(status!.id).toBe(task.id);
      expect(status!.status).toBe(task.status);
      expect(status!.progress).toBeDefined();
      expect(status!.estimatedCompletion).toBeDefined();
    });

    it('should return null for non-existent tasks', () => {
      const status = orchestrator.getTaskStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should return all tasks with optional filtering', async () => {
      await orchestrator.createTask('Task 1');
      await orchestrator.createTask('Task 2');
      await orchestrator.createTask('Task 3');

      const allTasks = orchestrator.listTasks();
      expect(allTasks).toHaveLength(3);

      const pendingTasks = orchestrator.listTasks({ status: 'pending' });
      expect(pendingTasks).toHaveLength(3);

      const completedTasks = orchestrator.listTasks({ status: 'completed' });
      expect(completedTasks).toHaveLength(0);
    });
  });
});
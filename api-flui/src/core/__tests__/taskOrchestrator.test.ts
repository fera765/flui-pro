import { TaskOrchestrator } from '../taskOrchestrator';
import { TaskManager } from '../taskManager';
import { LiveTester } from '../liveTester';
import { MarkdownReporter } from '../markdownReporter';
import { ContextPersistence } from '../contextPersistence';
import { 
  TaskCreationRequest, 
  TaskModificationRequest, 
  TaskQuestionRequest,
  TaskDownloadRequest,
  TaskExecutionOptions,
  TaskExecutionContext,
  Intent,
  TestResult
} from '../../types/taskOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

describe('TaskOrchestrator', () => {
  const testDir = '/tmp/flui-task-orchestrator-test';
  let taskOrchestrator: TaskOrchestrator;
  let taskManager: TaskManager;
  let liveTester: LiveTester;
  let markdownReporter: MarkdownReporter;
  let contextPersistence: ContextPersistence;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // Initialize components
    const tasksDir = path.join(testDir, 'tasks');
    const reportsDir = path.join(testDir, 'reports');
    const contextsDir = path.join(testDir, 'contexts');
    
    taskManager = new TaskManager(tasksDir);
    liveTester = new LiveTester();
    markdownReporter = new MarkdownReporter(reportsDir);
    contextPersistence = new ContextPersistence(contextsDir);
    
    taskOrchestrator = new TaskOrchestrator(
      taskManager,
      liveTester,
      markdownReporter,
      contextPersistence
    );
  });

  afterEach(async () => {
    // Clean up
    await liveTester.cleanup();
    
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createPersistentTask', () => {
    it('should create a new persistent task', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Test HTML Project',
        description: 'Create a simple HTML landing page',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie uma landing page HTML simples',
        options: {
          autoStartServer: true,
          autoRunTests: true,
          generateReport: true,
          keepAlive: false,
          maxExecutionTime: 300000,
          retryOnFailure: true,
          maxRetries: 3,
          cleanupOnComplete: true
        }
      };

      // Act
      const result = await taskOrchestrator.createPersistentTask(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^[0-9a-f-]{36}$/); // UUID format

      // Verify task was created in TaskManager
      const task = await taskManager.getTask(result.taskId!);
      expect(task).toBeDefined();
      expect(task!.name).toBe('Test HTML Project');
      expect(task!.description).toBe('Create a simple HTML landing page');
      expect(task!.projectType).toBe('frontend');
      expect(task!.status).toBe('active');
    });

    it('should handle task creation errors gracefully', async () => {
      // Arrange
      const invalidRequest = {
        name: '',
        description: '',
        projectType: '',
        userId: '',
        initialPrompt: ''
      } as TaskCreationRequest;

      // Act
      const result = await taskOrchestrator.createPersistentTask(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('executeTask', () => {
    it('should execute a complete task workflow', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Test HTML Project',
        description: 'Create a simple HTML landing page',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie uma landing page HTML simples',
        options: {
          autoStartServer: true,
          autoRunTests: true,
          generateReport: true,
          keepAlive: false
        }
      };

      // Create task first
      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Act
      const result = await taskOrchestrator.executeTask(createResult.taskId!);

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.reportPath).toBeDefined();
      expect(result.liveUrl).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.executionTime).toBeGreaterThan(0);
    });

    it('should handle task execution errors gracefully', async () => {
      // Act
      const result = await taskOrchestrator.executeTask('non-existent-task-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('interactWithTask', () => {
    it('should handle status questions', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Test Project',
        description: 'Test project for interaction',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto de teste'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      const questionRequest: TaskQuestionRequest = {
        taskId: createResult.taskId!,
        question: 'Como está o progresso do projeto?',
        userId: 'user-123'
      };

      // Act
      const result = await taskOrchestrator.interactWithTask(questionRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.metadata!.interactionType).toBe('question');
    });

    it('should handle modification requests', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Test Project',
        description: 'Test project for modification',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto de teste'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      const modificationRequest: TaskModificationRequest = {
        taskId: createResult.taskId!,
        type: 'add_feature',
        description: 'Adicionar um modal de contato',
        priority: 'medium',
        userId: 'user-123'
      };

      // Act
      const result = await taskOrchestrator.interactWithTask(modificationRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.metadata!.interactionType).toBe('modification');
    });

    it('should handle download requests', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Test Project',
        description: 'Test project for download',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto de teste'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      const downloadRequest: TaskDownloadRequest = {
        taskId: createResult.taskId!,
        userId: 'user-123',
        includeNodeModules: false,
        format: 'zip'
      };

      // Act
      const result = await taskOrchestrator.interactWithTask(downloadRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.metadata!.interactionType).toBe('download');
    });
  });

  describe('listTasks', () => {
    it('should list all tasks for a user', async () => {
      // Arrange
      const requests = [
        {
          name: 'Project 1',
          description: 'First test project',
          projectType: 'frontend',
          userId: 'user-123',
          initialPrompt: 'Crie o primeiro projeto'
        },
        {
          name: 'Project 2',
          description: 'Second test project',
          projectType: 'backend',
          userId: 'user-123',
          initialPrompt: 'Crie o segundo projeto'
        },
        {
          name: 'Project 3',
          description: 'Third test project',
          projectType: 'content',
          userId: 'user-456',
          initialPrompt: 'Crie o terceiro projeto'
        }
      ];

      for (const request of requests) {
        await taskOrchestrator.createPersistentTask(request);
      }

      // Act
      const result = await taskOrchestrator.listTasks('user-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks).toBeDefined();
      expect(result.tasks!.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.activeCount).toBe(2);
      expect(result.completedCount).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should return empty list for user with no tasks', async () => {
      // Act
      const result = await taskOrchestrator.listTasks('user-with-no-tasks');

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks).toBeDefined();
      expect(result.tasks!.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getTaskStatus', () => {
    it('should get task status', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Status Test Project',
        description: 'Project for status testing',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto para teste de status'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Act
      const result = await taskOrchestrator.getTaskStatus(createResult.taskId!);

      // Assert
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.status).toBe('active');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle non-existent task status', async () => {
      // Act
      const result = await taskOrchestrator.getTaskStatus('non-existent-task');

      // Assert
      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });
  });

  describe('pauseTask', () => {
    it('should pause an active task', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Pause Test Project',
        description: 'Project for pause testing',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto para teste de pausa'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Act
      const result = await taskOrchestrator.pauseTask(createResult.taskId!);

      // Assert
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.status).toBe('paused');

      // Verify task status in TaskManager
      const task = await taskManager.getTask(createResult.taskId!);
      expect(task!.status).toBe('paused');
    });
  });

  describe('resumeTask', () => {
    it('should resume a paused task', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Resume Test Project',
        description: 'Project for resume testing',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto para teste de retomada'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Pause task first
      await taskOrchestrator.pauseTask(createResult.taskId!);

      // Act
      const result = await taskOrchestrator.resumeTask(createResult.taskId!);

      // Assert
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.status).toBe('active');

      // Verify task status in TaskManager
      const task = await taskManager.getTask(createResult.taskId!);
      expect(task!.status).toBe('active');
    });
  });

  describe('completeTask', () => {
    it('should complete a task and generate final report', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Complete Test Project',
        description: 'Project for completion testing',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto para teste de conclusão'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Act
      const result = await taskOrchestrator.completeTask(createResult.taskId!);

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(createResult.taskId);
      expect(result.reportPath).toBeDefined();

      // Verify task status in TaskManager
      const task = await taskManager.getTask(createResult.taskId!);
      expect(task!.status).toBe('completed');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and clean up resources', async () => {
      // Arrange
      const request: TaskCreationRequest = {
        name: 'Delete Test Project',
        description: 'Project for deletion testing',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto para teste de exclusão'
      };

      const createResult = await taskOrchestrator.createPersistentTask(request);
      expect(createResult.success).toBe(true);

      // Act
      const result = await taskOrchestrator.deleteTask(createResult.taskId!);

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(createResult.taskId);

      // Verify task was deleted from TaskManager
      const task = await taskManager.getTask(createResult.taskId!);
      expect(task).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle invalid task operations gracefully', async () => {
      // Act
      const result = await taskOrchestrator.pauseTask('invalid-task-id');

      // Assert
      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('should handle component initialization errors', async () => {
      // Arrange - Create orchestrator with invalid components
      const invalidTaskManager = new TaskManager('/invalid/path');
      const invalidOrchestrator = new TaskOrchestrator(
        invalidTaskManager,
        liveTester,
        markdownReporter,
        contextPersistence
      );

      const request: TaskCreationRequest = {
        name: 'Test Project',
        description: 'Test project',
        projectType: 'frontend',
        userId: 'user-123',
        initialPrompt: 'Crie um projeto de teste'
      };

      // Act
      const result = await invalidOrchestrator.createPersistentTask(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
import { TaskManager } from '../taskManager';
import { PersistentTask, TaskContext, Intent } from '../../types/persistentTask';
import * as fs from 'fs';
import * as path from 'path';

describe('TaskManager', () => {
  const testDir = '/tmp/flui-task-manager-test';
  let taskManager: TaskManager;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    taskManager = new TaskManager(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createPersistentTask', () => {
    it('should create persistent task with isolated context', async () => {
      // Arrange
      const intent: Intent = {
        domain: 'frontend',
        technology: 'html',
        language: 'javascript',
        features: ['styling', 'responsive'],
        requirements: ['modern', 'user-friendly']
      };

      const context: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie uma landing page HTML',
            timestamp: new Date()
          }
        ],
        projectType: 'frontend',
        currentFeatures: ['styling', 'responsive'],
        modifications: [],
        testStatus: 'pending',
        intent
      };

      // Act
      const task = await taskManager.createPersistentTask(
        'Landing Page HTML',
        'Criar uma landing page moderna com HTML, CSS e JavaScript',
        context
      );

      // Assert
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.name).toBe('Landing Page HTML');
      expect(task.status).toBe('active');
      expect(task.workingDirectory).toContain('task-');
      expect(task.context).toEqual(context);
      expect(task.projectType).toBe('frontend');
      expect(task.description).toBe('Criar uma landing page moderna com HTML, CSS e JavaScript');
      expect(task.testResults).toEqual([]);

      // Verify directory structure
      expect(fs.existsSync(task.workingDirectory)).toBe(true);
      
      // Check task directory (parent of workingDirectory)
      const taskDir = path.dirname(task.workingDirectory);
      expect(fs.existsSync(path.join(taskDir, 'context.json'))).toBe(true);
      expect(fs.existsSync(path.join(taskDir, 'status.json'))).toBe(true);
      expect(fs.existsSync(path.join(taskDir, 'project'))).toBe(true);
      expect(fs.existsSync(path.join(taskDir, 'logs'))).toBe(true);
      expect(fs.existsSync(path.join(taskDir, 'tests'))).toBe(true);
    });

    it('should maintain task status across sessions', async () => {
      // Arrange
      const intent: Intent = {
        domain: 'backend',
        technology: 'nodejs',
        language: 'javascript'
      };

      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'backend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent
      };

      // Act - Create task
      const task1 = await taskManager.createPersistentTask(
        'API Node.js',
        'Criar uma API REST com Node.js',
        context
      );

      // Simulate session end and restart
      const taskManager2 = new TaskManager(testDir);
      const task2 = await taskManager2.getTask(task1.id);

      // Assert
      expect(task2).toBeDefined();
      expect(task2!.id).toBe(task1.id);
      expect(task2!.name).toBe(task1.name);
      expect(task2!.status).toBe(task1.status);
      expect(task2!.context).toEqual(task1.context);
    });

    it('should isolate contexts between different tasks', async () => {
      // Arrange
      const intent1: Intent = {
        domain: 'frontend',
        technology: 'html'
      };

      const intent2: Intent = {
        domain: 'backend',
        technology: 'nodejs'
      };

      const context1: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie um frontend HTML',
            timestamp: new Date()
          }
        ],
        projectType: 'frontend',
        currentFeatures: ['styling'],
        modifications: [],
        testStatus: 'pending',
        intent: intent1
      };

      const context2: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-2',
            role: 'user',
            content: 'Crie uma API Node.js',
            timestamp: new Date()
          }
        ],
        projectType: 'backend',
        currentFeatures: ['api'],
        modifications: [],
        testStatus: 'pending',
        intent: intent2
      };

      // Act
      const task1 = await taskManager.createPersistentTask(
        'Frontend Task',
        'Criar frontend HTML',
        context1
      );

      const task2 = await taskManager.createPersistentTask(
        'Backend Task',
        'Criar API Node.js',
        context2
      );

      // Assert
      expect(task1.id).not.toBe(task2.id);
      expect(task1.workingDirectory).not.toBe(task2.workingDirectory);
      expect(task1.context.projectType).toBe('frontend');
      expect(task2.context.projectType).toBe('backend');
      expect(task1.context.conversationHistory[0]?.content).toBe('Crie um frontend HTML');
      expect(task2.context.conversationHistory[0]?.content).toBe('Crie uma API Node.js');
    });
  });

  describe('listActiveTasks', () => {
    it('should list all active tasks', async () => {
      // Arrange
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      await taskManager.createPersistentTask('Task 1', 'Description 1', context);
      await taskManager.createPersistentTask('Task 2', 'Description 2', context);
      await taskManager.createPersistentTask('Task 3', 'Description 3', context);

      // Act
      const activeTasks = await taskManager.listActiveTasks();

      // Assert
      expect(activeTasks).toHaveLength(3);
      expect(activeTasks.map(t => t.name)).toContain('Task 1');
      expect(activeTasks.map(t => t.name)).toContain('Task 2');
      expect(activeTasks.map(t => t.name)).toContain('Task 3');
    });

    it('should filter tasks by status', async () => {
      // Arrange
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      const task1 = await taskManager.createPersistentTask('Active Task', 'Description', context);
      const task2 = await taskManager.createPersistentTask('Paused Task', 'Description', context);
      
      await taskManager.updateTaskStatus(task2.id, 'paused');

      // Act
      const allTasks = await taskManager.listActiveTasks();
      const activeTasks = await taskManager.listActiveTasks('active');
      const pausedTasks = await taskManager.listActiveTasks('paused');

      // Assert
      expect(allTasks).toHaveLength(2);
      expect(activeTasks).toHaveLength(1);
      expect(activeTasks[0]?.name).toBe('Active Task');
      expect(pausedTasks).toHaveLength(1);
      expect(pausedTasks[0]?.name).toBe('Paused Task');
    });
  });

  describe('getTask', () => {
    it('should retrieve task by ID', async () => {
      // Arrange
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      const createdTask = await taskManager.createPersistentTask(
        'Test Task',
        'Test Description',
        context
      );

      // Act
      const retrievedTask = await taskManager.getTask(createdTask.id);

      // Assert
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask!.id).toBe(createdTask.id);
      expect(retrievedTask!.name).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      // Act
      const task = await taskManager.getTask('non-existent-id');

      // Assert
      expect(task).toBeNull();
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      // Arrange
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      const task = await taskManager.createPersistentTask(
        'Test Task',
        'Test Description',
        context
      );

      // Act
      await taskManager.updateTaskStatus(task.id, 'paused');
      const updatedTask = await taskManager.getTask(task.id);

      // Assert
      expect(updatedTask!.status).toBe('paused');
    });
  });
});
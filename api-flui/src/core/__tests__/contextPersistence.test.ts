import { ContextPersistence } from '../contextPersistence';
import { TaskContext, ContextPersistenceOptions, Intent, Message, ModificationRequest } from '../../types/contextPersistence';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('ContextPersistence', () => {
  const testDir = '/tmp/flui-context-persistence-test';
  let contextPersistence: ContextPersistence;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    contextPersistence = new ContextPersistence(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('saveContext', () => {
    it('should save task context to JSON file', async () => {
      // Arrange
      const taskId = 'test-task-123';
      const context: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie uma landing page HTML',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            metadata: {
              tokens: 10,
              model: 'gpt-4',
              processingTime: 150
            }
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Vou criar uma landing page HTML para você',
            timestamp: new Date('2024-01-01T10:00:05Z'),
            metadata: {
              tokens: 15,
              model: 'gpt-4',
              processingTime: 200
            }
          }
        ],
        projectType: 'frontend',
        currentFeatures: ['styling', 'responsive'],
        modifications: [],
        testStatus: 'pending',
        intent: {
          domain: 'frontend',
          technology: 'html',
          language: 'javascript',
          features: ['styling', 'responsive'],
          requirements: ['modern', 'user-friendly']
        }
      };

      // Act
      const result = await contextPersistence.saveContext(taskId, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.contextId).toBeDefined();
      expect(result.filePath).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);

      // Verify file exists
      expect(fs.existsSync(result.filePath!)).toBe(true);

      // Verify file content
      const savedData = JSON.parse(fs.readFileSync(result.filePath!, 'utf8'));
      expect(savedData.taskId).toBe(taskId);
      expect(savedData.context.conversationHistory).toHaveLength(2);
      expect(savedData.context.conversationHistory[0].content).toBe('Crie uma landing page HTML');
      expect(savedData.context.intent.domain).toBe('frontend');
    });

    it('should save context with modifications', async () => {
      // Arrange
      const taskId = 'test-task-with-modifications';
      const modification: ModificationRequest = {
        id: 'mod-1',
        projectId: taskId,
        type: 'add_feature',
        description: 'Adicionar modal de contato',
        priority: 'medium',
        status: 'completed',
        createdAt: new Date('2024-01-01T10:30:00Z'),
        completedAt: new Date('2024-01-01T10:35:00Z'),
        metadata: {
          estimatedTime: 300,
          complexity: 'medium',
          dependencies: ['modal.js', 'modal.css']
        }
      };

      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: ['styling', 'responsive', 'modal'],
        modifications: [modification],
        testStatus: 'passed',
        intent: {
          domain: 'frontend',
          technology: 'html'
        }
      };

      // Act
      const result = await contextPersistence.saveContext(taskId, context);

      // Assert
      expect(result.success).toBe(true);

      // Verify modifications are saved
      const savedData = JSON.parse(fs.readFileSync(result.filePath!, 'utf8'));
      expect(savedData.context.modifications).toHaveLength(1);
      expect(savedData.context.modifications[0].description).toBe('Adicionar modal de contato');
      expect(savedData.context.modifications[0].status).toBe('completed');
    });

    it('should handle save errors gracefully', async () => {
      // Arrange
      const taskId = 'test-task-error';
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      // Create invalid directory path
      const invalidPersistence = new ContextPersistence('/invalid/path/that/does/not/exist');

      // Act
      const result = await invalidPersistence.saveContext(taskId, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('loadContext', () => {
    it('should load task context from JSON file', async () => {
      // Arrange
      const taskId = 'test-load-task';
      const originalContext: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie um backend Node.js',
            timestamp: new Date('2024-01-01T11:00:00Z')
          }
        ],
        projectType: 'backend',
        currentFeatures: ['api', 'database'],
        modifications: [],
        testStatus: 'running',
        intent: {
          domain: 'backend',
          technology: 'nodejs',
          language: 'javascript'
        }
      };

      // Save context first
      await contextPersistence.saveContext(taskId, originalContext);

      // Act
      const result = await contextPersistence.loadContext(taskId);

      // Debug
      if (!result.success) {
        console.log('Load context failed:', result.error);
      }

      // Assert
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.conversationHistory).toHaveLength(1);
      expect(result.context!.conversationHistory[0]?.content).toBe('Crie um backend Node.js');
      expect(result.context!.projectType).toBe('backend');
      expect(result.context!.intent.domain).toBe('backend');
    });

    it('should return null for non-existent context', async () => {
      // Act
      const result = await contextPersistence.loadContext('non-existent-task');

      // Assert
      expect(result.success).toBe(false);
      expect(result.context).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it('should handle corrupted context files', async () => {
      // Arrange
      const taskId = 'corrupted-task';
      const corruptedFilePath = path.join(testDir, `context-${taskId}.json`);
      
      // Create corrupted JSON file
      fs.writeFileSync(corruptedFilePath, '{ invalid json content');

      // Act
      const result = await contextPersistence.loadContext(taskId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateContext', () => {
    it('should update existing context', async () => {
      // Arrange
      const taskId = 'test-update-task';
      const originalContext: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie um projeto',
            timestamp: new Date()
          }
        ],
        projectType: 'frontend',
        currentFeatures: ['styling'],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      // Save original context
      await contextPersistence.saveContext(taskId, originalContext);

      // Create updated context
      const updatedContext: TaskContext = {
        ...originalContext,
        conversationHistory: [
          ...originalContext.conversationHistory,
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Projeto criado com sucesso!',
            timestamp: new Date()
          }
        ],
        currentFeatures: ['styling', 'responsive'],
        testStatus: 'passed'
      };

      // Act
      const result = await contextPersistence.updateContext(taskId, updatedContext);

      // Assert
      expect(result.success).toBe(true);

      // Verify update
      const loadedResult = await contextPersistence.loadContext(taskId);
      expect(loadedResult.success).toBe(true);
      expect(loadedResult.context!.conversationHistory).toHaveLength(2);
      expect(loadedResult.context!.currentFeatures).toContain('responsive');
      expect(loadedResult.context!.testStatus).toBe('passed');
    });

    it('should create new context if task does not exist', async () => {
      // Arrange
      const taskId = 'new-update-task';
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'backend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'backend' }
      };

      // Act
      const result = await contextPersistence.updateContext(taskId, context);

      // Assert
      expect(result.success).toBe(true);

      // Verify context was created
      const loadedResult = await contextPersistence.loadContext(taskId);
      expect(loadedResult.success).toBe(true);
      expect(loadedResult.context!.projectType).toBe('backend');
    });
  });

  describe('deleteContext', () => {
    it('should delete existing context', async () => {
      // Arrange
      const taskId = 'test-delete-task';
      const context: TaskContext = {
        conversationHistory: [],
        projectType: 'frontend',
        currentFeatures: [],
        modifications: [],
        testStatus: 'pending',
        intent: { domain: 'frontend' }
      };

      // Save context first
      await contextPersistence.saveContext(taskId, context);

      // Act
      const result = await contextPersistence.deleteContext(taskId);

      // Assert
      expect(result.success).toBe(true);

      // Verify context is deleted
      const loadResult = await contextPersistence.loadContext(taskId);
      expect(loadResult.success).toBe(false);
    });

    it('should handle deletion of non-existent context', async () => {
      // Act
      const result = await contextPersistence.deleteContext('non-existent-task');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('listContexts', () => {
    it('should list all saved contexts', async () => {
      // Arrange
      const contexts = [
        { taskId: 'task-1', projectType: 'frontend' },
        { taskId: 'task-2', projectType: 'backend' },
        { taskId: 'task-3', projectType: 'mobile' }
      ];

      for (const ctx of contexts) {
        const context: TaskContext = {
          conversationHistory: [],
          projectType: ctx.projectType,
          currentFeatures: [],
          modifications: [],
          testStatus: 'pending',
          intent: { domain: ctx.projectType }
        };
        await contextPersistence.saveContext(ctx.taskId, context);
      }

      // Act
      const result = await contextPersistence.listContexts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.contexts).toBeDefined();
      expect(result.contexts!.length).toBe(3);
      expect(result.contexts!.map(c => c.taskId)).toContain('task-1');
      expect(result.contexts!.map(c => c.taskId)).toContain('task-2');
      expect(result.contexts!.map(c => c.taskId)).toContain('task-3');
    });

    it('should return empty list when no contexts exist', async () => {
      // Act
      const result = await contextPersistence.listContexts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.contexts).toBeDefined();
      expect(result.contexts!.length).toBe(0);
    });
  });

  describe('backupContext', () => {
    it('should create backup of context', async () => {
      // Arrange
      const taskId = 'test-backup-task';
      const context: TaskContext = {
        conversationHistory: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Crie um projeto complexo',
            timestamp: new Date()
          }
        ],
        projectType: 'fullstack',
        currentFeatures: ['frontend', 'backend', 'database'],
        modifications: [],
        testStatus: 'running',
        intent: { domain: 'fullstack' }
      };

      await contextPersistence.saveContext(taskId, context);

      // Act
      const result = await contextPersistence.backupContext(taskId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(fs.existsSync(result.backupPath!)).toBe(true);

      // Verify backup content
      const backupData = JSON.parse(fs.readFileSync(result.backupPath!, 'utf8'));
      expect(backupData.metadata.taskId).toBe(taskId);
      expect(backupData.context.projectType).toBe('fullstack');
    });
  });
});
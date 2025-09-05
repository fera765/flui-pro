import { CodeForgeAgent } from '../codeForgeAgent';
import { Intent, Project, ModificationRequest, DownloadRequest } from '../../types/dynamic';
import { AgentTask, AgentResponse } from '../../types/advanced';

describe('CodeForgeAgent', () => {
  let codeForgeAgent: CodeForgeAgent;
  let mockTools: any[];

  beforeEach(() => {
    mockTools = [
      {
        name: 'shell',
        description: 'Execute shell commands',
        parameters: { command: { type: 'string', required: true } },
        execute: jest.fn()
      },
      {
        name: 'file_write',
        description: 'Write files',
        parameters: { filePath: { type: 'string', required: true }, content: { type: 'string', required: true } },
        execute: jest.fn()
      },
      {
        name: 'package_manager',
        description: 'Manage packages',
        parameters: { dependencies: { type: 'array', required: true } },
        execute: jest.fn()
      }
    ];
    
    codeForgeAgent = new CodeForgeAgent(mockTools);
  });

  describe('executeProjectCreation', () => {
    it('should create React frontend project', async () => {
      const intent: Intent = {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium',
        features: ['authentication', 'routing']
      };
      
      const result = await codeForgeAgent.executeProjectCreation(intent, '/tmp/test-project');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project.type).toBe('frontend');
      expect(result.project.status).toBe('ready');
    });

    it('should create Node.js backend project', async () => {
      const intent: Intent = {
        domain: 'backend',
        technology: 'nodejs',
        language: 'javascript',
        purpose: 'api',
        complexity: 'medium',
        features: ['authentication', 'database']
      };
      
      const result = await codeForgeAgent.executeProjectCreation(intent, '/tmp/test-project');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project.type).toBe('backend');
      expect(result.project.status).toBe('ready');
    });

    it('should create Python FastAPI project', async () => {
      const intent: Intent = {
        domain: 'backend',
        technology: 'fastapi',
        language: 'python',
        purpose: 'api',
        complexity: 'medium',
        features: ['authentication', 'database']
      };
      
      const result = await codeForgeAgent.executeProjectCreation(intent, '/tmp/test-project');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project.type).toBe('backend');
      expect(result.project.status).toBe('ready');
    });

    it('should create Flutter mobile project', async () => {
      const intent: Intent = {
        domain: 'mobile',
        technology: 'flutter',
        language: 'dart',
        purpose: 'app',
        complexity: 'medium',
        features: ['authentication', 'navigation']
      };
      
      const result = await codeForgeAgent.executeProjectCreation(intent, '/tmp/test-project');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project.type).toBe('mobile');
      expect(result.project.status).toBe('ready');
    });

    it('should handle project creation errors', async () => {
      const intent: Intent = {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium'
      };
      
      // Mock tool failure
      mockTools[0].execute.mockRejectedValue(new Error('Command failed'));
      
      const result = await codeForgeAgent.executeProjectCreation(intent, '/tmp/test-project');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('handleModificationRequest', () => {
    it('should handle add feature request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const modification: ModificationRequest = {
        id: 'mod-1',
        projectId: 'test-project',
        type: 'add_feature',
        description: 'Add modal component',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleModificationRequest(project, modification);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.modification).toBeDefined();
      expect(result.modification.status).toBe('completed');
    });

    it('should handle fix bug request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const modification: ModificationRequest = {
        id: 'mod-1',
        projectId: 'test-project',
        type: 'fix_bug',
        description: 'Fix login button not working',
        priority: 'high',
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleModificationRequest(project, modification);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.modification).toBeDefined();
      expect(result.modification.status).toBe('completed');
    });

    it('should handle modify existing request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const modification: ModificationRequest = {
        id: 'mod-1',
        projectId: 'test-project',
        type: 'modify_existing',
        description: 'Change button color to blue',
        priority: 'low',
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleModificationRequest(project, modification);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.modification).toBeDefined();
      expect(result.modification.status).toBe('completed');
    });

    it('should handle remove feature request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const modification: ModificationRequest = {
        id: 'mod-1',
        projectId: 'test-project',
        type: 'remove_feature',
        description: 'Remove dark mode toggle',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleModificationRequest(project, modification);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.modification).toBeDefined();
      expect(result.modification.status).toBe('completed');
    });
  });

  describe('handleDownloadRequest', () => {
    it('should handle zip download request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const downloadRequest: DownloadRequest = {
        id: 'download-1',
        projectId: 'test-project',
        format: 'zip',
        includeNodeModules: false,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleDownloadRequest(project, downloadRequest);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.downloadRequest).toBeDefined();
      expect(result.downloadRequest.status).toBe('ready');
      expect(result.downloadRequest.downloadUrl).toBeDefined();
    });

    it('should handle tar download request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const downloadRequest: DownloadRequest = {
        id: 'download-1',
        projectId: 'test-project',
        format: 'tar',
        includeNodeModules: false,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleDownloadRequest(project, downloadRequest);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.downloadRequest).toBeDefined();
      expect(result.downloadRequest.status).toBe('ready');
      expect(result.downloadRequest.downloadUrl).toBeDefined();
    });

    it('should handle git download request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const downloadRequest: DownloadRequest = {
        id: 'download-1',
        projectId: 'test-project',
        format: 'git',
        includeNodeModules: false,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.handleDownloadRequest(project, downloadRequest);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.downloadRequest).toBeDefined();
      expect(result.downloadRequest.status).toBe('ready');
      expect(result.downloadRequest.downloadUrl).toBeDefined();
    });
  });

  describe('handleInteractiveMessage', () => {
    it('should handle status inquiry', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'building',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const message = 'Está demorando muito, terminou?';
      
      const result = await codeForgeAgent.handleInteractiveMessage(project, message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response).toContain('trabalhando');
    });

    it('should handle feature addition request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const message = 'Adicione um modal quando abrir o site com uma promoção';
      
      const result = await codeForgeAgent.handleInteractiveMessage(project, message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response).toContain('modal');
      expect(result.modificationRequest).toBeDefined();
    });

    it('should handle error report', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const message = 'O botão de login não está funcionando';
      
      const result = await codeForgeAgent.handleInteractiveMessage(project, message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response).toContain('erro');
      expect(result.modificationRequest).toBeDefined();
    });

    it('should handle download request', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const message = 'Me dê o zip desse frontend';
      
      const result = await codeForgeAgent.handleInteractiveMessage(project, message);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response).toContain('zip');
      expect(result.downloadRequest).toBeDefined();
    });
  });

  describe('executeTask', () => {
    it('should execute agent task successfully', async () => {
      const task: AgentTask = {
        id: 'task-1',
        agentId: 'code-forge',
        prompt: 'Create a React component',
        context: 'Frontend development',
        systemPrompt: 'You are a code generation agent',
        tools: ['file_write'],
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await codeForgeAgent.executeTask(task);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle task execution errors', async () => {
      const task: AgentTask = {
        id: 'task-1',
        agentId: 'code-forge',
        prompt: 'Create a React component',
        context: 'Frontend development',
        systemPrompt: 'You are a code generation agent',
        tools: ['file_write'],
        status: 'pending',
        createdAt: new Date()
      };
      
      // Mock tool failure
      mockTools[1].execute.mockRejectedValue(new Error('File write failed'));
      
      const result = await codeForgeAgent.executeTask(task);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProjectStatus', () => {
    it('should return project status', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const status = await codeForgeAgent.getProjectStatus(project);
      
      expect(status).toBeDefined();
      expect(status.status).toBe('ready');
      expect(status.progress).toBeDefined();
      expect(status.currentTask).toBeDefined();
    });
  });

  describe('validateProject', () => {
    it('should validate project successfully', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: [],
        warnings: []
      };
      
      const result = await codeForgeAgent.validateProject(project);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test Project',
        type: 'frontend',
        workingDirectory: '/tmp/test-project',
        status: 'ready',
        createdAt: new Date(),
        errors: ['Build failed'],
        warnings: []
      };
      
      const result = await codeForgeAgent.validateProject(project);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
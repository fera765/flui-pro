import { container } from '../../config/container';
import { ITaskManager } from '../types/ITask';
import { IFileSystem } from '../types/ITask';
import { IProjectBuilder } from '../types/ITask';
import { MicroTaskExecutor } from '../core/MicroTaskExecutor';
import { ScaffolderAgent } from '../agents/ScaffolderAgent';
import { DepInstallerAgent } from '../agents/DepInstallerAgent';
import { ComponentAgent } from '../agents/ComponentAgent';

describe('AutoCode System', () => {
  let taskManager: ITaskManager;
  let fileSystem: IFileSystem;
  let projectBuilder: IProjectBuilder;
  let microTaskExecutor: MicroTaskExecutor;
  let scaffolderAgent: ScaffolderAgent;
  let depInstallerAgent: DepInstallerAgent;
  let componentAgent: ComponentAgent;

  beforeAll(() => {
    taskManager = container.get<ITaskManager>('ITaskManager');
    fileSystem = container.get<IFileSystem>('IFileSystem');
    projectBuilder = container.get<IProjectBuilder>('IProjectBuilder');
    microTaskExecutor = container.get<MicroTaskExecutor>('MicroTaskExecutor');
    scaffolderAgent = container.get<ScaffolderAgent>('ScaffolderAgent');
    depInstallerAgent = container.get<DepInstallerAgent>('DepInstallerAgent');
    componentAgent = container.get<ComponentAgent>('ComponentAgent');
  });

  describe('TaskManager', () => {
    it('should create a new task', async () => {
      const prompt = 'frontend react typescript tailwind counter com teste';
      
      const task = await taskManager.createTask(prompt);
      
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.prompt).toBe(prompt);
      expect(task.status).toBe('pending');
      expect(task.projectPath).toBeDefined();
      expect(task.microTasks).toEqual([]);
      expect(task.logs).toEqual([]);
    });

    it('should get a task by id', async () => {
      const prompt = 'test task';
      const createdTask = await taskManager.createTask(prompt);
      
      const retrievedTask = await taskManager.getTask(createdTask.id);
      
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.id).toBe(createdTask.id);
      expect(retrievedTask?.prompt).toBe(prompt);
    });

    it('should update a task', async () => {
      const prompt = 'test task for update';
      const task = await taskManager.createTask(prompt);
      
      await taskManager.updateTask(task.id, { status: 'in_progress' });
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe('in_progress');
    });

    it('should delete a task', async () => {
      const prompt = 'test task for deletion';
      const task = await taskManager.createTask(prompt);
      
      await taskManager.deleteTask(task.id);
      
      const deletedTask = await taskManager.getTask(task.id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('FileSystemManager', () => {
    it('should create project structure', async () => {
      const projectPath = '/tmp/test-project';
      const prompt = 'test project';
      
      await fileSystem.createProjectStructure(projectPath, prompt);
      
      expect(await fileSystem.fileExists(projectPath)).toBe(true);
      expect(await fileSystem.fileExists(`${projectPath}/.flui`)).toBe(true);
      expect(await fileSystem.fileExists(`${projectPath}/src`)).toBe(true);
      expect(await fileSystem.fileExists(`${projectPath}/tests`)).toBe(true);
    });

    it('should read and write files', async () => {
      const filePath = '/tmp/test-file.txt';
      const content = 'Hello, World!';
      
      await fileSystem.writeFile(filePath, content);
      const readContent = await fileSystem.readFile(filePath);
      
      expect(readContent).toBe(content);
    });

    it('should calculate checksum', async () => {
      const filePath = '/tmp/test-checksum.txt';
      const content = 'Test content for checksum';
      
      await fileSystem.writeFile(filePath, content);
      const checksum = await fileSystem.calculateChecksum(filePath);
      
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(64); // SHA-256 hex length
    });

    it('should list files', async () => {
      const projectPath = '/tmp/test-list';
      await fileSystem.createProjectStructure(projectPath, 'test');
      
      const files = await fileSystem.listFiles(projectPath);
      
      expect(files).toContain('.flui');
      expect(files).toContain('src');
      expect(files).toContain('tests');
    });
  });

  describe('ScaffolderAgent', () => {
    it('should handle tasks without package.json', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: {},
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(scaffolderAgent.canHandle(task, projectState)).toBe(true);
    });

    it('should not handle tasks with package.json', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: { 'package.json': '{"name": "test"}' },
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(scaffolderAgent.canHandle(task, projectState)).toBe(false);
    });

    it('should have correct priority', () => {
      expect(scaffolderAgent.getPriority()).toBe(1);
    });
  });

  describe('DepInstallerAgent', () => {
    it('should handle tasks with package.json but no node_modules', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: { 'package.json': '{"name": "test"}' },
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(depInstallerAgent.canHandle(task, projectState)).toBe(true);
    });

    it('should not handle tasks with node_modules', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: { 
          'package.json': '{"name": "test"}',
          'node_modules': 'dependencies'
        },
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(depInstallerAgent.canHandle(task, projectState)).toBe(false);
    });

    it('should have correct priority', () => {
      expect(depInstallerAgent.getPriority()).toBe(2);
    });
  });

  describe('ComponentAgent', () => {
    it('should handle tasks with dependencies but no components', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: { 
          'package.json': '{"name": "test"}',
          'node_modules': 'dependencies'
        },
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(componentAgent.canHandle(task, projectState)).toBe(true);
    });

    it('should not handle tasks with existing components', () => {
      const task = {
        id: 'test',
        prompt: 'test prompt',
        status: 'pending' as const,
        createdAt: Date.now(),
        projectPath: '/tmp/test',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started' as const,
        testStatus: 'not_started' as const
      };
      
      const projectState = {
        files: { 
          'package.json': '{"name": "test"}',
          'node_modules': 'dependencies',
          'src/App.tsx': 'export default App;'
        },
        dependencies: {},
        buildOutput: '',
        testResults: null,
        errors: [],
        warnings: []
      };
      
      expect(componentAgent.canHandle(task, projectState)).toBe(false);
    });

    it('should have correct priority', () => {
      expect(componentAgent.getPriority()).toBe(3);
    });
  });

  describe('MicroTaskExecutor', () => {
    it('should execute file_create micro-task', async () => {
      const microTask = {
        id: 'test-create',
        type: 'file_create' as const,
        path: 'test-create.txt',
        newSnippet: 'Hello, World!',
        status: 'pending' as const,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };
      
      const result = await microTaskExecutor.executeMicroTask(microTask, '/tmp');
      
      expect(result.success).toBe(true);
      expect(result.logs).toContain('✅ Micro-task test-create executada com sucesso');
      
      // Verify file was created
      const content = await fileSystem.readFile('/tmp/test-create.txt');
      expect(content).toBe('Hello, World!');
    });

    it('should execute file_replace micro-task', async () => {
      // First create a file
      await fileSystem.writeFile('/tmp/test-replace.txt', 'Hello, World!');
      
      const microTask = {
        id: 'test-replace',
        type: 'file_replace' as const,
        path: 'test-replace.txt',
        oldSnippet: 'Hello, World!',
        newSnippet: 'Hello, Universe!',
        status: 'pending' as const,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };
      
      const result = await microTaskExecutor.executeMicroTask(microTask, '/tmp');
      
      expect(result.success).toBe(true);
      
      // Verify file was updated
      const content = await fileSystem.readFile('/tmp/test-replace.txt');
      expect(content).toBe('Hello, Universe!');
    });

    it('should execute file_delete micro-task', async () => {
      // First create a file
      await fileSystem.writeFile('/tmp/test-delete.txt', 'Hello, World!');
      
      const microTask = {
        id: 'test-delete',
        type: 'file_delete' as const,
        path: 'test-delete.txt',
        status: 'pending' as const,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };
      
      const result = await microTaskExecutor.executeMicroTask(microTask, '/tmp');
      
      expect(result.success).toBe(true);
      
      // Verify file was deleted
      expect(await fileSystem.fileExists('/tmp/test-delete.txt')).toBe(false);
    });
  });
});
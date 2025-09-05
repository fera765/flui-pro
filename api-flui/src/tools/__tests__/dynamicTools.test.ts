import { DynamicTools } from '../dynamicTools';
import { Tool, ToolResponse } from '../../types/advanced';
import { Intent, ProjectType } from '../../types/dynamic';

describe('DynamicTools', () => {
  let dynamicTools: DynamicTools;
  let mockWorkingDirectory: string;

  beforeEach(() => {
    mockWorkingDirectory = '/tmp/test-project';
    dynamicTools = new DynamicTools(mockWorkingDirectory);
  });

  describe('createProjectTypeDetector', () => {
    it('should detect React project', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('package.json') || path.includes('src/App.js');
      });
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              'react': '^18.0.0',
              'react-dom': '^18.0.0'
            }
          });
        }
        return '';
      });
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('frontend');
      expect(result.data.framework).toBe('react');
      expect(result.data.language).toBe('javascript');
    });

    it('should detect Vue project', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('package.json') || path.includes('src/main.js');
      });
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              'vue': '^3.0.0'
            }
          });
        }
        return '';
      });
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('frontend');
      expect(result.data.framework).toBe('vue');
      expect(result.data.language).toBe('javascript');
    });

    it('should detect Node.js backend project', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('package.json') || path.includes('server.js');
      });
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              'express': '^4.18.0'
            }
          });
        }
        return '';
      });
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('backend');
      expect(result.data.framework).toBe('express');
      expect(result.data.language).toBe('javascript');
    });

    it('should detect Python project', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('requirements.txt') || path.includes('main.py');
      });
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('requirements.txt')) {
          return 'fastapi==0.68.0\nuvicorn==0.15.0';
        }
        return '';
      });
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('backend');
      expect(result.data.framework).toBe('fastapi');
      expect(result.data.language).toBe('python');
    });

    it('should detect Rust project', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('Cargo.toml') || path.includes('src/main.rs');
      });
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('Cargo.toml')) {
          return '[package]\nname = "my-project"\nversion = "0.1.0"';
        }
        return '';
      });
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('backend');
      expect(result.data.framework).toBe('rust');
      expect(result.data.language).toBe('rust');
    });

    it('should detect empty directory', async () => {
      const tool = dynamicTools.createProjectTypeDetector();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => false);
      
      const result = await tool.execute({ workingDirectory: mockWorkingDirectory });
      
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('unknown');
      expect(result.data.isEmpty).toBe(true);
    });
  });

  describe('createDependencyManager', () => {
    it('should install npm dependencies', async () => {
      const tool = dynamicTools.createDependencyManager();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm install')) {
          callback(null, { stdout: 'Dependencies installed', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        packageManager: 'npm',
        dependencies: ['react', 'react-dom'],
        devDependencies: ['typescript', '@types/react']
      });
      
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Dependencies installed');
    });

    it('should install pip dependencies', async () => {
      const tool = dynamicTools.createDependencyManager();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('pip install')) {
          callback(null, { stdout: 'Dependencies installed', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        packageManager: 'pip',
        dependencies: ['fastapi', 'uvicorn'],
        devDependencies: ['pytest']
      });
      
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Dependencies installed');
    });

    it('should install cargo dependencies', async () => {
      const tool = dynamicTools.createDependencyManager();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('cargo add')) {
          callback(null, { stdout: 'Dependencies added', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        packageManager: 'cargo',
        dependencies: ['actix-web', 'serde'],
        devDependencies: []
      });
      
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Dependencies added');
    });

    it('should handle dependency installation errors', async () => {
      const tool = dynamicTools.createDependencyManager();
      
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Installation failed'), { stdout: '', stderr: 'Error' });
      });
      
      const result = await tool.execute({
        packageManager: 'npm',
        dependencies: ['invalid-package'],
        devDependencies: []
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Installation failed');
    });
  });

  describe('createBuildValidator', () => {
    it('should validate npm build', async () => {
      const tool = dynamicTools.createBuildValidator();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm run build')) {
          callback(null, { stdout: 'Build successful', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        buildTool: 'npm',
        command: 'npm run build'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(true);
      expect(result.data.output).toContain('Build successful');
    });

    it('should validate cargo build', async () => {
      const tool = dynamicTools.createBuildValidator();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('cargo build')) {
          callback(null, { stdout: 'Build successful', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        buildTool: 'cargo',
        command: 'cargo build'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(true);
      expect(result.data.output).toContain('Build successful');
    });

    it('should detect build errors', async () => {
      const tool = dynamicTools.createBuildValidator();
      
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Build failed'), { stdout: '', stderr: 'Build error' });
      });
      
      const result = await tool.execute({
        buildTool: 'npm',
        command: 'npm run build'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(false);
      expect(result.data.error).toContain('Build failed');
    });
  });

  describe('createTestRunner', () => {
    it('should run npm tests', async () => {
      const tool = dynamicTools.createTestRunner();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm test')) {
          callback(null, { stdout: 'Tests passed', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        testTool: 'npm',
        command: 'npm test'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.testsPassed).toBe(true);
      expect(result.data.output).toContain('Tests passed');
    });

    it('should run pytest tests', async () => {
      const tool = dynamicTools.createTestRunner();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('pytest')) {
          callback(null, { stdout: 'Tests passed', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        testTool: 'pytest',
        command: 'pytest'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.testsPassed).toBe(true);
      expect(result.data.output).toContain('Tests passed');
    });

    it('should detect test failures', async () => {
      const tool = dynamicTools.createTestRunner();
      
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Tests failed'), { stdout: '', stderr: 'Test error' });
      });
      
      const result = await tool.execute({
        testTool: 'npm',
        command: 'npm test'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.testsPassed).toBe(false);
      expect(result.data.error).toContain('Tests failed');
    });
  });

  describe('createServerValidator', () => {
    it('should validate server on port 3000', async () => {
      const tool = dynamicTools.createServerValidator();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('curl')) {
          callback(null, { stdout: 'HTTP/1.1 200 OK', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        port: 3000,
        url: 'http://localhost:3000'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(true);
      expect(result.data.statusCode).toBe(200);
    });

    it('should detect server not running', async () => {
      const tool = dynamicTools.createServerValidator();
      
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Connection refused'), { stdout: '', stderr: 'Connection refused' });
      });
      
      const result = await tool.execute({
        port: 3000,
        url: 'http://localhost:3000'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(false);
      expect(result.data.error).toContain('Connection refused');
    });

    it('should start server if not running', async () => {
      const tool = dynamicTools.createServerValidator();
      
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm start')) {
          callback(null, { stdout: 'Server started', stderr: '' });
        } else if (command.includes('curl')) {
          callback(null, { stdout: 'HTTP/1.1 200 OK', stderr: '' });
        }
      });
      
      const result = await tool.execute({
        port: 3000,
        url: 'http://localhost:3000',
        startCommand: 'npm start'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(true);
      expect(result.data.statusCode).toBe(200);
    });
  });

  describe('createFileBackupManager', () => {
    it('should backup file before modification', async () => {
      const tool = dynamicTools.createFileBackupManager();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => 'file content');
      jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});
      
      const result = await tool.execute({
        action: 'backup',
        filePath: 'src/App.js'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.backupPath).toBeDefined();
      expect(result.data.hash).toBeDefined();
    });

    it('should restore file from backup', async () => {
      const tool = dynamicTools.createFileBackupManager();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => 'backup content');
      jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {});
      
      const result = await tool.execute({
        action: 'restore',
        filePath: 'src/App.js',
        backupPath: 'backup/App.js.backup'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.restored).toBe(true);
    });

    it('should handle backup errors', async () => {
      const tool = dynamicTools.createFileBackupManager();
      
      // Mock filesystem with error
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => false);
      
      const result = await tool.execute({
        action: 'backup',
        filePath: 'nonexistent.js'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('createProjectAnalyzer', () => {
    it('should analyze project structure', async () => {
      const tool = dynamicTools.createProjectAnalyzer();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'readdirSync').mockImplementation(() => [
        { name: 'src', isDirectory: () => true },
        { name: 'package.json', isDirectory: () => false },
        { name: 'README.md', isDirectory: () => false }
      ]);
      
      const result = await tool.execute({
        workingDirectory: mockWorkingDirectory
      });
      
      expect(result.success).toBe(true);
      expect(result.data.directories).toContain('src');
      expect(result.data.files).toContain('package.json');
      expect(result.data.files).toContain('README.md');
    });

    it('should detect project type from files', async () => {
      const tool = dynamicTools.createProjectAnalyzer();
      
      // Mock filesystem
      jest.spyOn(require('fs'), 'readdirSync').mockImplementation(() => [
        { name: 'package.json', isDirectory: () => false },
        { name: 'src', isDirectory: () => true }
      ]);
      
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              'react': '^18.0.0'
            }
          });
        }
        return '';
      });
      
      const result = await tool.execute({
        workingDirectory: mockWorkingDirectory
      });
      
      expect(result.success).toBe(true);
      expect(result.data.projectType).toBe('react');
      expect(result.data.framework).toBe('react');
    });
  });
});
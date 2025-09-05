import { RealTimeValidator } from '../realTimeValidator';
import { SolutionArchitecture, ValidationResult, ValidationStepResult } from '../../types/dynamic';

describe('RealTimeValidator', () => {
  let validator: RealTimeValidator;
  let mockWorkingDirectory: string;

  beforeEach(() => {
    mockWorkingDirectory = '/tmp/test-project';
    validator = new RealTimeValidator();
  });

  describe('validateProject', () => {
    it('should validate React frontend project', async () => {
      const solution: SolutionArchitecture = {
        type: 'frontend',
        framework: 'react',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['react', 'react-dom'],
        devDependencies: ['typescript'],
        scripts: {
          start: 'npm start',
          build: 'npm run build',
          test: 'npm test'
        },
        structure: {
          directories: ['src', 'public'],
          files: ['package.json', 'src/App.js'],
          entryPoint: 'src/index.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Build',
            command: 'npm run build',
            timeout: 60000,
            retries: 3
          },
          {
            name: 'Test',
            command: 'npm test',
            timeout: 30000,
            retries: 2
          }
        ],
        estimatedTime: 15
      };

      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm run build')) {
          callback(null, { stdout: 'Build successful', stderr: '' });
        } else if (command.includes('npm test')) {
          callback(null, { stdout: 'Tests passed', stderr: '' });
        }
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[1].name).toBe('Test');
      expect(result.steps[1].success).toBe(true);
    });

    it('should validate Node.js backend project', async () => {
      const solution: SolutionArchitecture = {
        type: 'backend',
        framework: 'express',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['express'],
        devDependencies: ['nodemon'],
        scripts: {
          start: 'node server.js',
          dev: 'nodemon server.js',
          test: 'jest'
        },
        structure: {
          directories: ['src', 'tests'],
          files: ['package.json', 'server.js'],
          entryPoint: 'server.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Build',
            command: 'npm run build',
            timeout: 60000,
            retries: 3
          },
          {
            name: 'Server',
            command: 'npm start',
            timeout: 30000,
            retries: 2
          }
        ],
        estimatedTime: 20
      };

      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm run build')) {
          callback(null, { stdout: 'Build successful', stderr: '' });
        } else if (command.includes('npm start')) {
          callback(null, { stdout: 'Server started', stderr: '' });
        } else if (command.includes('curl')) {
          callback(null, { stdout: 'HTTP/1.1 200 OK', stderr: '' });
        }
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[1].name).toBe('Server');
      expect(result.steps[1].success).toBe(true);
    });

    it('should validate Python FastAPI project', async () => {
      const solution: SolutionArchitecture = {
        type: 'backend',
        framework: 'fastapi',
        language: 'python',
        buildTool: 'pip',
        packageManager: 'pip',
        dependencies: ['fastapi', 'uvicorn'],
        devDependencies: ['pytest'],
        scripts: {
          start: 'uvicorn main:app --reload',
          test: 'pytest'
        },
        structure: {
          directories: ['app', 'tests'],
          files: ['main.py', 'requirements.txt'],
          entryPoint: 'main.py',
          configFiles: ['requirements.txt']
        },
        validations: [
          {
            name: 'Build',
            command: 'python -m py_compile main.py',
            timeout: 30000,
            retries: 3
          },
          {
            name: 'Test',
            command: 'pytest',
            timeout: 30000,
            retries: 2
          }
        ],
        estimatedTime: 25
      };

      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('python -m py_compile')) {
          callback(null, { stdout: 'Compilation successful', stderr: '' });
        } else if (command.includes('pytest')) {
          callback(null, { stdout: 'Tests passed', stderr: '' });
        }
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(true);
      expect(result.steps[1].name).toBe('Test');
      expect(result.steps[1].success).toBe(true);
    });

    it('should detect build errors', async () => {
      const solution: SolutionArchitecture = {
        type: 'frontend',
        framework: 'react',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['react'],
        devDependencies: [],
        scripts: {
          build: 'npm run build'
        },
        structure: {
          directories: ['src'],
          files: ['package.json'],
          entryPoint: 'src/index.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Build',
            command: 'npm run build',
            timeout: 60000,
            retries: 3
          }
        ],
        estimatedTime: 10
      };

      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Build failed'), { stdout: '', stderr: 'Build error' });
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toContain('Build failed');
      expect(result.errors).toContain('Build failed');
    });

    it('should detect test failures', async () => {
      const solution: SolutionArchitecture = {
        type: 'frontend',
        framework: 'react',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['react'],
        devDependencies: ['jest'],
        scripts: {
          test: 'npm test'
        },
        structure: {
          directories: ['src', 'tests'],
          files: ['package.json', 'src/App.js'],
          entryPoint: 'src/index.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Test',
            command: 'npm test',
            timeout: 30000,
            retries: 2
          }
        ],
        estimatedTime: 10
      };

      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Tests failed'), { stdout: '', stderr: 'Test error' });
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe('Test');
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toContain('Tests failed');
      expect(result.errors).toContain('Tests failed');
    });

    it('should detect server not running', async () => {
      const solution: SolutionArchitecture = {
        type: 'backend',
        framework: 'express',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['express'],
        devDependencies: [],
        scripts: {
          start: 'node server.js'
        },
        structure: {
          directories: ['src'],
          files: ['package.json', 'server.js'],
          entryPoint: 'server.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Server',
            command: 'npm start',
            timeout: 30000,
            retries: 2
          }
        ],
        estimatedTime: 15
      };

      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm start')) {
          callback(null, { stdout: 'Server started', stderr: '' });
        } else if (command.includes('curl')) {
          callback(new Error('Connection refused'), { stdout: '', stderr: 'Connection refused' });
        }
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe('Server');
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toContain('Connection refused');
      expect(result.errors).toContain('Connection refused');
    });

    it('should handle validation timeouts', async () => {
      const solution: SolutionArchitecture = {
        type: 'frontend',
        framework: 'react',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['react'],
        devDependencies: [],
        scripts: {
          build: 'npm run build'
        },
        structure: {
          directories: ['src'],
          files: ['package.json'],
          entryPoint: 'src/index.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Build',
            command: 'npm run build',
            timeout: 1000, // Very short timeout
            retries: 1
          }
        ],
        estimatedTime: 10
      };

      // Mock exec with delay
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        setTimeout(() => {
          callback(null, { stdout: 'Build successful', stderr: '' });
        }, 2000); // Longer than timeout
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toContain('timeout');
    });

    it('should retry failed validations', async () => {
      const solution: SolutionArchitecture = {
        type: 'frontend',
        framework: 'react',
        language: 'javascript',
        buildTool: 'npm',
        packageManager: 'npm',
        dependencies: ['react'],
        devDependencies: [],
        scripts: {
          build: 'npm run build'
        },
        structure: {
          directories: ['src'],
          files: ['package.json'],
          entryPoint: 'src/index.js',
          configFiles: ['package.json']
        },
        validations: [
          {
            name: 'Build',
            command: 'npm run build',
            timeout: 60000,
            retries: 3
          }
        ],
        estimatedTime: 10
      };

      let callCount = 0;
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callCount++;
        if (callCount < 3) {
          callback(new Error('Build failed'), { stdout: '', stderr: 'Build error' });
        } else {
          callback(null, { stdout: 'Build successful', stderr: '' });
        }
      });

      const result = await validator.validateProject(mockWorkingDirectory, solution);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].name).toBe('Build');
      expect(result.steps[0].success).toBe(true);
      expect(callCount).toBe(3); // Should have retried 3 times
    });
  });

  describe('validateBuild', () => {
    it('should validate npm build', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Build successful', stderr: '' });
      });

      const result = await validator.validateBuild(mockWorkingDirectory, 'npm', 'npm run build');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Build successful');
    });

    it('should validate cargo build', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Build successful', stderr: '' });
      });

      const result = await validator.validateBuild(mockWorkingDirectory, 'cargo', 'cargo build');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Build successful');
    });

    it('should validate maven build', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Build successful', stderr: '' });
      });

      const result = await validator.validateBuild(mockWorkingDirectory, 'maven', 'mvn compile');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Build successful');
    });

    it('should validate go build', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Build successful', stderr: '' });
      });

      const result = await validator.validateBuild(mockWorkingDirectory, 'go', 'go build');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Build successful');
    });

    it('should handle build errors', async () => {
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Build failed'), { stdout: '', stderr: 'Build error' });
      });

      const result = await validator.validateBuild(mockWorkingDirectory, 'npm', 'npm run build');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Build failed');
    });
  });

  describe('validateTests', () => {
    it('should validate npm tests', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
      });

      const result = await validator.validateTests(mockWorkingDirectory, 'npm', 'npm test');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Tests passed');
    });

    it('should validate pytest tests', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'Tests passed', stderr: '' });
      });

      const result = await validator.validateTests(mockWorkingDirectory, 'pytest', 'pytest');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('Tests passed');
    });

    it('should handle test failures', async () => {
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Tests failed'), { stdout: '', stderr: 'Test error' });
      });

      const result = await validator.validateTests(mockWorkingDirectory, 'npm', 'npm test');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tests failed');
    });
  });

  describe('validateServer', () => {
    it('should validate server running on port 3000', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('curl')) {
          callback(null, { stdout: 'HTTP/1.1 200 OK', stderr: '' });
        }
      });

      const result = await validator.validateServer(mockWorkingDirectory, 3000, 'http://localhost:3000');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(true);
      expect(result.data.statusCode).toBe(200);
    });

    it('should start server if not running', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        if (command.includes('npm start')) {
          callback(null, { stdout: 'Server started', stderr: '' });
        } else if (command.includes('curl')) {
          callback(null, { stdout: 'HTTP/1.1 200 OK', stderr: '' });
        }
      });

      const result = await validator.validateServer(mockWorkingDirectory, 3000, 'http://localhost:3000', 'npm start');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(true);
      expect(result.data.statusCode).toBe(200);
    });

    it('should detect server not running', async () => {
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Connection refused'), { stdout: '', stderr: 'Connection refused' });
      });

      const result = await validator.validateServer(mockWorkingDirectory, 3000, 'http://localhost:3000');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });

  describe('validateLinting', () => {
    it('should validate eslint', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'No linting errors', stderr: '' });
      });

      const result = await validator.validateLinting(mockWorkingDirectory, 'eslint', 'npx eslint src/');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('No linting errors');
    });

    it('should validate prettier', async () => {
      // Mock exec
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(null, { stdout: 'All files formatted', stderr: '' });
      });

      const result = await validator.validateLinting(mockWorkingDirectory, 'prettier', 'npx prettier --check src/');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toContain('All files formatted');
    });

    it('should handle linting errors', async () => {
      // Mock exec with error
      jest.spyOn(require('child_process'), 'exec').mockImplementation((command, callback) => {
        callback(new Error('Linting errors found'), { stdout: '', stderr: 'Linting error' });
      });

      const result = await validator.validateLinting(mockWorkingDirectory, 'eslint', 'npx eslint src/');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Linting errors found');
    });
  });

  describe('validateLogs', () => {
    it('should validate logs for errors', async () => {
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => 'Application started successfully');

      const result = await validator.validateLogs(mockWorkingDirectory, 'app.log');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.hasErrors).toBe(false);
    });

    it('should detect errors in logs', async () => {
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => 'Error: Application failed to start');

      const result = await validator.validateLogs(mockWorkingDirectory, 'app.log');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.hasErrors).toBe(true);
      expect(result.data.errors).toContain('Error: Application failed to start');
    });

    it('should handle missing log files', async () => {
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => false);

      const result = await validator.validateLogs(mockWorkingDirectory, 'app.log');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.hasErrors).toBe(false);
      expect(result.data.message).toContain('Log file not found');
    });
  });
});
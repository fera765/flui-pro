import { Tool, ToolResponse } from '../types/advanced';
import { Intent, SolutionArchitecture } from '../types/dynamic';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export class DynamicTools {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  createProjectTypeDetector(): Tool {
    return {
      name: 'project_type_detector',
      description: 'Detect the type of project based on files and configuration',
      parameters: {
        workingDirectory: {
          type: 'string',
          description: 'Working directory to analyze',
          required: true
        }
      },
      execute: async (params: { workingDirectory: string }): Promise<ToolResponse> => {
        try {
          const projectType = await this.detectProjectType(params.workingDirectory);
          
          return {
            success: true,
            data: projectType,
            context: `Detected project type: ${projectType.type} with framework: ${projectType.framework}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createDependencyManager(): Tool {
    return {
      name: 'dependency_manager',
      description: 'Install dependencies using the appropriate package manager',
      parameters: {
        packageManager: {
          type: 'string',
          description: 'Package manager to use (npm, pip, cargo, etc.)',
          required: true
        },
        dependencies: {
          type: 'array',
          description: 'Dependencies to install',
          required: true
        },
        devDependencies: {
          type: 'array',
          description: 'Development dependencies to install',
          required: false
        }
      },
      execute: async (params: { 
        packageManager: string; 
        dependencies: string[]; 
        devDependencies?: string[] 
      }): Promise<ToolResponse> => {
        try {
          const result = await this.installDependencies(
            params.packageManager,
            params.dependencies,
            params.devDependencies || []
          );
          
          return {
            success: true,
            data: result,
            context: `Dependencies installed using ${params.packageManager}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createBuildValidator(): Tool {
    return {
      name: 'build_validator',
      description: 'Validate project build',
      parameters: {
        buildTool: {
          type: 'string',
          description: 'Build tool to use',
          required: true
        },
        command: {
          type: 'string',
          description: 'Build command to execute',
          required: true
        }
      },
      execute: async (params: { buildTool: string; command: string }): Promise<ToolResponse> => {
        try {
          const result = await this.validateBuild(params.buildTool, params.command);
          
          return {
            success: true,
            data: result,
            context: `Build validation completed for ${params.buildTool}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createTestRunner(): Tool {
    return {
      name: 'test_runner',
      description: 'Run project tests',
      parameters: {
        testTool: {
          type: 'string',
          description: 'Test tool to use',
          required: true
        },
        command: {
          type: 'string',
          description: 'Test command to execute',
          required: true
        }
      },
      execute: async (params: { testTool: string; command: string }): Promise<ToolResponse> => {
        try {
          const result = await this.runTests(params.testTool, params.command);
          
          return {
            success: true,
            data: result,
            context: `Tests executed using ${params.testTool}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createServerValidator(): Tool {
    return {
      name: 'server_validator',
      description: 'Validate server is running and accessible',
      parameters: {
        port: {
          type: 'number',
          description: 'Port to check',
          required: true
        },
        url: {
          type: 'string',
          description: 'URL to test',
          required: true
        },
        startCommand: {
          type: 'string',
          description: 'Command to start server if not running',
          required: false
        }
      },
      execute: async (params: { 
        port: number; 
        url: string; 
        startCommand?: string 
      }): Promise<ToolResponse> => {
        try {
          const result = await this.validateServer(params.port, params.url, params.startCommand);
          
          return {
            success: true,
            data: result,
            context: `Server validation completed for port ${params.port}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createFileBackupManager(): Tool {
    return {
      name: 'file_backup_manager',
      description: 'Backup and restore files',
      parameters: {
        action: {
          type: 'string',
          description: 'Action to perform (backup, restore)',
          required: true
        },
        filePath: {
          type: 'string',
          description: 'Path to the file',
          required: true
        },
        backupPath: {
          type: 'string',
          description: 'Path to backup file (for restore action)',
          required: false
        }
      },
      execute: async (params: { 
        action: string; 
        filePath: string; 
        backupPath?: string 
      }): Promise<ToolResponse> => {
        try {
          if (params.action === 'backup') {
            const result = await this.backupFile(params.filePath);
            return {
              success: true,
              data: result,
              context: `File backed up: ${params.filePath}`
            };
          } else if (params.action === 'restore') {
            const result = await this.restoreFile(params.filePath, params.backupPath!);
            return {
              success: true,
              data: result,
              context: `File restored: ${params.filePath}`
            };
          } else {
            throw new Error(`Invalid action: ${params.action}`);
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createProjectAnalyzer(): Tool {
    return {
      name: 'project_analyzer',
      description: 'Analyze project structure and configuration',
      parameters: {
        workingDirectory: {
          type: 'string',
          description: 'Working directory to analyze',
          required: true
        }
      },
      execute: async (params: { workingDirectory: string }): Promise<ToolResponse> => {
        try {
          const analysis = await this.analyzeProject(params.workingDirectory);
          
          return {
            success: true,
            data: analysis,
            context: `Project analysis completed for ${params.workingDirectory}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  private async detectProjectType(workingDirectory: string): Promise<SolutionArchitecture> {
    const projectType: SolutionArchitecture = {
      type: 'unknown',
      framework: 'unknown',
      language: 'unknown',
      buildTool: 'unknown',
      packageManager: 'unknown',
      dependencies: [],
      devDependencies: [],
      scripts: {},
      structure: { directories: [], files: [], entryPoint: '', configFiles: [] },
      validations: [],
      estimatedTime: 0
    };

    try {
      if (!fs.existsSync(workingDirectory)) {
        return projectType;
      }

      const files = fs.readdirSync(workingDirectory);

      if (files.includes('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync(path.join(workingDirectory, 'package.json'), 'utf-8'));
        
        if (packageJson.dependencies?.react || packageJson.dependencies?.['react-dom']) {
          projectType.type = 'frontend';
          projectType.framework = 'react';
          projectType.language = 'javascript';
          projectType.buildTool = 'webpack';
          projectType.packageManager = 'npm';
        } else if (packageJson.dependencies?.vue) {
          projectType.type = 'frontend';
          projectType.framework = 'vue';
          projectType.language = 'javascript';
          projectType.buildTool = 'vite';
          projectType.packageManager = 'npm';
        } else if (packageJson.dependencies?.express) {
          projectType.type = 'backend';
          projectType.framework = 'express';
          projectType.language = 'javascript';
          projectType.buildTool = 'npm';
          projectType.packageManager = 'npm';
        } else {
          projectType.type = 'nodejs';
          projectType.framework = 'nodejs';
          projectType.language = 'javascript';
          projectType.buildTool = 'npm';
          projectType.packageManager = 'npm';
        }
        
        projectType.dependencies = Object.keys(packageJson.dependencies || {});
        projectType.devDependencies = Object.keys(packageJson.devDependencies || {});
        projectType.scripts = packageJson.scripts || {};
      } else if (files.includes('requirements.txt')) {
        projectType.type = 'backend';
        projectType.framework = 'python';
        projectType.language = 'python';
        projectType.buildTool = 'pip';
        projectType.packageManager = 'pip';
        
        const requirements = fs.readFileSync(path.join(workingDirectory, 'requirements.txt'), 'utf-8');
        projectType.dependencies = requirements.split('\n').filter(line => line.trim());
      } else if (files.includes('Cargo.toml')) {
        projectType.type = 'backend';
        projectType.framework = 'rust';
        projectType.language = 'rust';
        projectType.buildTool = 'cargo';
        projectType.packageManager = 'cargo';
      } else if (files.includes('pom.xml')) {
        projectType.type = 'backend';
        projectType.framework = 'java';
        projectType.language = 'java';
        projectType.buildTool = 'maven';
        projectType.packageManager = 'maven';
      } else if (files.includes('go.mod')) {
        projectType.type = 'backend';
        projectType.framework = 'go';
        projectType.language = 'go';
        projectType.buildTool = 'go';
        projectType.packageManager = 'go';
      } else if (files.includes('composer.json')) {
        projectType.type = 'backend';
        projectType.framework = 'php';
        projectType.language = 'php';
        projectType.buildTool = 'composer';
        projectType.packageManager = 'composer';
      } else if (files.includes('Gemfile')) {
        projectType.type = 'backend';
        projectType.framework = 'ruby';
        projectType.language = 'ruby';
        projectType.buildTool = 'bundler';
        projectType.packageManager = 'bundler';
      }

      // Analyze project structure
      projectType.structure = await this.analyzeProjectStructure(workingDirectory);
      
    } catch (error) {
      console.error('Error detecting project type:', error);
    }

    return projectType;
  }

  private async installDependencies(
    packageManager: string, 
    dependencies: string[], 
    devDependencies: string[]
  ): Promise<any> {
    let command: string;
    
    switch (packageManager) {
      case 'npm':
        if (dependencies.length > 0) {
          command = `npm install ${dependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        if (devDependencies.length > 0) {
          command = `npm install --save-dev ${devDependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        break;
        
      case 'pip':
        if (dependencies.length > 0) {
          command = `pip install ${dependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        if (devDependencies.length > 0) {
          command = `pip install ${devDependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        break;
        
      case 'cargo':
        if (dependencies.length > 0) {
          for (const dep of dependencies) {
            command = `cargo add ${dep}`;
            await execAsync(command, { cwd: this.workingDirectory });
          }
        }
        break;
        
      case 'maven':
        // Maven dependencies are typically added to pom.xml
        break;
        
      case 'go':
        if (dependencies.length > 0) {
          command = `go get ${dependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        break;
        
      case 'composer':
        if (dependencies.length > 0) {
          command = `composer require ${dependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        break;
        
      case 'bundler':
        if (dependencies.length > 0) {
          command = `bundle add ${dependencies.join(' ')}`;
          await execAsync(command, { cwd: this.workingDirectory });
        }
        break;
        
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }
    
    return {
      message: `Dependencies installed using ${packageManager}`,
      dependencies,
      devDependencies
    };
  }

  private async validateBuild(buildTool: string, command: string): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });
      
      return {
        isValid: true,
        output: stdout,
        error: stderr,
        buildTool
      };
    } catch (error: any) {
      return {
        isValid: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        buildTool
      };
    }
  }

  private async runTests(testTool: string, command: string): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: this.workingDirectory });
      
      return {
        testsPassed: true,
        output: stdout,
        error: stderr,
        testTool
      };
    } catch (error: any) {
      return {
        testsPassed: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        testTool
      };
    }
  }

  private async validateServer(port: number, url: string, startCommand?: string): Promise<any> {
    try {
      // First, try to check if server is running
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { 
        cwd: this.workingDirectory 
      });
      
      if (stdout.trim() === '200') {
        return {
          isRunning: true,
          statusCode: 200,
          url,
          port
        };
      }
    } catch (error) {
      // Server not running, try to start it
      if (startCommand) {
        try {
          await execAsync(startCommand, { cwd: this.workingDirectory });
          
          // Wait a bit for server to start
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check again
          const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { 
            cwd: this.workingDirectory 
          });
          
          if (stdout.trim() === '200') {
            return {
              isRunning: true,
              statusCode: 200,
              url,
              port,
              started: true
            };
          }
        } catch (startError) {
          return {
            isRunning: false,
            error: (startError as Error).message,
            url,
            port
          };
        }
      }
    }
    
    return {
      isRunning: false,
      error: 'Server not accessible',
      url,
      port
    };
  }

  private async backupFile(filePath: string): Promise<any> {
    const fullPath = path.join(this.workingDirectory, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const backupPath = `${filePath}.backup.${Date.now()}`;
    const fullBackupPath = path.join(this.workingDirectory, backupPath);
    
    fs.writeFileSync(fullBackupPath, content);
    
    return {
      backupPath: fullBackupPath,
      hash,
      originalPath: fullPath
    };
  }

  private async restoreFile(filePath: string, backupPath: string): Promise<any> {
    const fullPath = path.join(this.workingDirectory, filePath);
    const fullBackupPath = path.join(this.workingDirectory, backupPath);
    
    if (!fs.existsSync(fullBackupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const content = fs.readFileSync(fullBackupPath, 'utf-8');
    fs.writeFileSync(fullPath, content);
    
    return {
      restored: true,
      originalPath: fullPath,
      backupPath: fullBackupPath
    };
  }

  private async analyzeProject(workingDirectory: string): Promise<any> {
    const analysis = {
      directories: [] as string[],
      files: [] as string[],
      projectType: 'unknown',
      framework: 'unknown',
      language: 'unknown',
      hasPackageJson: false,
      hasGitRepo: false,
      isEmpty: true
    };

    try {
      if (!fs.existsSync(workingDirectory)) {
        return analysis;
      }

      const files = fs.readdirSync(workingDirectory, { withFileTypes: true });
      analysis.isEmpty = files.length === 0;

      for (const file of files) {
        if (file.isDirectory()) {
          analysis.directories.push(file.name);
        } else {
          analysis.files.push(file.name);
        }
      }

      analysis.hasPackageJson = analysis.files.includes('package.json');
      analysis.hasGitRepo = analysis.directories.includes('.git');

      if (analysis.hasPackageJson) {
        const packageJson = JSON.parse(fs.readFileSync(path.join(workingDirectory, 'package.json'), 'utf-8'));
        
        if (packageJson.dependencies?.react) {
          analysis.projectType = 'react';
          analysis.framework = 'react';
          analysis.language = 'javascript';
        } else if (packageJson.dependencies?.vue) {
          analysis.projectType = 'vue';
          analysis.framework = 'vue';
          analysis.language = 'javascript';
        } else if (packageJson.dependencies?.express) {
          analysis.projectType = 'express';
          analysis.framework = 'express';
          analysis.language = 'javascript';
        }
      }

    } catch (error) {
      console.error('Error analyzing project:', error);
    }

    return analysis;
  }

  private async analyzeProjectStructure(workingDirectory: string): Promise<any> {
    const structure = {
      directories: [] as string[],
      files: [] as string[],
      entryPoint: '',
      configFiles: [] as string[]
    };

    try {
      if (!fs.existsSync(workingDirectory)) {
        return structure;
      }

      const files = fs.readdirSync(workingDirectory, { withFileTypes: true });

      for (const file of files) {
        if (file.isDirectory()) {
          structure.directories.push(file.name);
        } else {
          structure.files.push(file.name);
        }
      }

      // Determine entry point
      if (structure.files.includes('package.json')) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(path.join(workingDirectory, 'package.json'), 'utf-8'));
          structure.entryPoint = packageJson.main || 'index.js';
        } catch (error) {
          structure.entryPoint = 'index.js';
        }
      } else if (structure.files.includes('main.py')) {
        structure.entryPoint = 'main.py';
      } else if (structure.files.includes('main.rs')) {
        structure.entryPoint = 'src/main.rs';
      }

      // Identify config files
      const configFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod', 'composer.json', 'Gemfile'];
      structure.configFiles = structure.files.filter(file => configFiles.includes(file));

    } catch (error) {
      console.error('Error analyzing project structure:', error);
    }

    return structure;
  }

  // Additional tools needed by DynamicSolutionArchitect
  createShellTool(): Tool {
    return {
      name: 'shell',
      description: 'Execute shell commands safely within the working directory',
      parameters: {
        command: {
          type: 'string',
          description: 'Shell command to execute',
          required: true
        }
      },
      execute: async (params: { command: string }): Promise<ToolResponse> => {
        try {
          const result = await this.runShellCommand(params.command);
          return {
            success: true,
            data: result,
            context: `Command executed: ${params.command}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createPackageManagerTool(): Tool {
    return {
      name: 'package_manager',
      description: 'Manage package dependencies',
      parameters: {
        dependencies: {
          type: 'array',
          description: 'List of dependencies to install',
          required: true
        },
        devDependencies: {
          type: 'boolean',
          description: 'Whether these are dev dependencies',
          required: false
        }
      },
      execute: async (params: { dependencies: string[], devDependencies?: boolean }): Promise<ToolResponse> => {
        try {
          const result = await this.installDependencies('npm', params.dependencies, params.devDependencies ? params.dependencies : []);
          return {
            success: true,
            data: result,
            context: `Dependencies installed: ${params.dependencies.join(', ')}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  createFileWriteTool(): Tool {
    return {
      name: 'file_write',
      description: 'Write content to a file',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to the file to write',
          required: true
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
          required: true
        }
      },
      execute: async (params: { filePath: string, content: string }): Promise<ToolResponse> => {
        try {
          await this.createFile(params.filePath, params.content);
          return {
            success: true,
            data: { filePath: params.filePath, content: params.content },
            context: `File created: ${params.filePath}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
}
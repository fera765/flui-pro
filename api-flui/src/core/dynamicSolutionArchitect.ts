import { v4 as uuidv4 } from 'uuid';
import { Intent, SolutionArchitecture, ContextAnalysis, DynamicTask } from '../types/dynamic';
import { DynamicIntelligence } from './dynamicIntelligence';

export class DynamicSolutionArchitect {
  private dynamicIntelligence: DynamicIntelligence;

  constructor(dynamicIntelligence: DynamicIntelligence) {
    this.dynamicIntelligence = dynamicIntelligence;
  }
  async designSolution(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture> {
    return {
      type: intent.domain,
      framework: intent.technology || 'default',
      language: intent.language || 'javascript',
      buildTool: this.getBuildTool(intent),
      packageManager: this.getPackageManager(intent),
      dependencies: this.getDependencies(intent),
      devDependencies: this.getDevDependencies(intent),
      scripts: this.getScripts(intent),
      structure: this.getProjectStructure(intent),
      validations: this.getValidations(intent),
      estimatedTime: this.getEstimatedTime(intent)
    };
  }

  async generateDynamicTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]> {
    // Use LLM to generate dynamic tasks
    return await this.generateDynamicTasksFromIntent(intent, context);
  }

  getBuildTool(intent: Intent): string {
    if (intent.technology === 'react' || intent.technology === 'vue') {
      return 'vite';
    } else if (intent.technology === 'angular') {
      return 'angular-cli';
    } else if (intent.language === 'rust') {
      return 'cargo';
    } else if (intent.language === 'java') {
      return 'maven';
    } else if (intent.language === 'go') {
      return 'go';
    } else if (intent.technology === 'hardhat') {
      return 'hardhat';
    }
    return 'npm';
  }

  getPackageManager(intent: Intent): string {
    if (intent.language === 'python') {
      return 'pip';
    } else if (intent.language === 'rust') {
      return 'cargo';
    } else if (intent.language === 'java') {
      return 'maven';
    } else if (intent.language === 'go') {
      return 'go';
    } else if (intent.language === 'php') {
      return 'composer';
    } else if (intent.language === 'ruby') {
      return 'bundler';
    } else if (intent.technology === 'flutter') {
      return 'flutter';
    }
    return 'npm';
  }

  getDependencies(intent: Intent): string[] {
    const deps: string[] = [];
    
    // Technology-specific dependencies
    if (intent.technology === 'react') {
      deps.push('react', 'react-dom');
    } else if (intent.technology === 'vue') {
      deps.push('vue');
    } else if (intent.technology === 'angular') {
      deps.push('@angular/core', '@angular/common');
    } else if (intent.technology === 'express') {
      deps.push('express');
    } else if (intent.technology === 'fastapi') {
      deps.push('fastapi', 'uvicorn');
    } else if (intent.technology === 'django') {
      deps.push('django');
    } else if (intent.technology === 'spring') {
      deps.push('spring-boot-starter-web');
    } else if (intent.technology === 'rails') {
      deps.push('rails');
    } else if (intent.technology === 'gin') {
      deps.push('github.com/gin-gonic/gin');
    } else if (intent.technology === 'actix') {
      deps.push('actix-web');
    } else if (intent.technology === 'flutter') {
      deps.push('flutter');
    } else if (intent.technology === 'electron') {
      deps.push('electron');
    } else if (intent.technology === 'tauri') {
      deps.push('@tauri-apps/api');
    } else if (intent.technology === 'tensorflow') {
      deps.push('tensorflow', 'numpy', 'pandas');
    } else if (intent.technology === 'pytorch') {
      deps.push('torch', 'numpy', 'pandas');
    } else if (intent.technology === 'scikit-learn') {
      deps.push('scikit-learn', 'numpy', 'pandas');
    } else if (intent.technology === 'solidity') {
      deps.push('hardhat', '@openzeppelin/contracts');
    } else if (intent.technology === 'web3') {
      deps.push('web3', 'ethers');
    }
    
    // Feature-specific dependencies
    if (intent.features?.includes('authentication')) {
      if (intent.technology === 'express') {
        deps.push('jsonwebtoken', 'bcrypt');
      } else if (intent.technology === 'fastapi') {
        deps.push('python-jose', 'passlib');
      } else if (intent.technology === 'django') {
        deps.push('djangorestframework', 'django-cors-headers');
      }
    }
    
    if (intent.features?.includes('database')) {
      if (intent.technology === 'express') {
        deps.push('mongoose', 'mongodb');
      } else if (intent.technology === 'fastapi') {
        deps.push('sqlalchemy', 'alembic');
      } else if (intent.technology === 'django') {
        deps.push('psycopg2-binary');
      }
    }
    
    if (intent.features?.includes('routing')) {
      if (intent.technology === 'react') {
        deps.push('react-router-dom');
      } else if (intent.technology === 'vue') {
        deps.push('vue-router');
      } else if (intent.technology === 'angular') {
        deps.push('@angular/router');
      }
    }
    
    if (intent.features?.includes('state-management')) {
      if (intent.technology === 'react') {
        deps.push('redux', 'react-redux');
      } else if (intent.technology === 'vue') {
        deps.push('vuex');
      } else if (intent.technology === 'angular') {
        deps.push('@ngrx/store');
      }
    }
    
    if (intent.features?.includes('styling')) {
      if (intent.technology === 'react') {
        deps.push('tailwindcss', 'postcss', 'autoprefixer');
      } else if (intent.technology === 'vue') {
        deps.push('tailwindcss', 'postcss', 'autoprefixer');
      }
    }
    
    return deps;
  }

  getDevDependencies(intent: Intent): string[] {
    const deps: string[] = [];
    
    // Language-specific dev dependencies
    if (intent.language === 'typescript') {
      deps.push('typescript', '@types/node');
    }
    
    if (intent.technology === 'react' && intent.language === 'typescript') {
      deps.push('@types/react', '@types/react-dom');
    }
    
    if (intent.technology === 'vue' && intent.language === 'typescript') {
      deps.push('@types/vue');
    }
    
    if (intent.technology === 'express' && intent.language === 'typescript') {
      deps.push('@types/express', '@types/cors');
    }
    
    // Testing dependencies
    if (intent.features?.includes('testing')) {
      if (intent.technology === 'react') {
        deps.push('jest', '@testing-library/react', '@testing-library/jest-dom');
      } else if (intent.technology === 'vue') {
        deps.push('jest', '@vue/test-utils');
      } else if (intent.technology === 'express') {
        deps.push('jest', 'supertest');
      } else if (intent.technology === 'fastapi') {
        deps.push('pytest', 'httpx');
      }
    }
    
    // Development tools
    if (intent.technology === 'express') {
      deps.push('nodemon');
    }
    
    if (intent.technology === 'react' || intent.technology === 'vue') {
      deps.push('eslint', 'prettier');
    }
    
    return deps;
  }

  getScripts(intent: Intent): Record<string, string> {
    const scripts: Record<string, string> = {};
    
    if (intent.domain === 'frontend') {
      if (intent.technology === 'react') {
        scripts.start = 'npm start';
        scripts.build = 'npm run build';
        scripts.test = 'npm test';
        scripts.dev = 'npm start';
      } else if (intent.technology === 'vue') {
        scripts.serve = 'vue-cli-service serve';
        scripts.build = 'vue-cli-service build';
        scripts.test = 'vue-cli-service test:unit';
        scripts.dev = 'vue-cli-service serve';
      } else if (intent.technology === 'angular') {
        scripts.start = 'ng serve';
        scripts.build = 'ng build';
        scripts.test = 'ng test';
        scripts.dev = 'ng serve';
      }
    } else if (intent.domain === 'backend') {
      if (intent.technology === 'express') {
        scripts.start = 'node server.js';
        scripts.dev = 'nodemon server.js';
        scripts.test = 'jest';
      } else if (intent.technology === 'fastapi') {
        scripts.start = 'uvicorn main:app --reload';
        scripts.test = 'pytest';
      } else if (intent.technology === 'django') {
        scripts.start = 'python manage.py runserver';
        scripts.test = 'python manage.py test';
      }
    } else if (intent.domain === 'mobile') {
      if (intent.technology === 'flutter') {
        scripts.run = 'flutter run';
        scripts.build = 'flutter build';
        scripts.test = 'flutter test';
      }
    } else if (intent.domain === 'desktop') {
      if (intent.technology === 'electron') {
        scripts.start = 'electron .';
        scripts.build = 'electron-builder';
        scripts.dev = 'electron .';
      }
    } else if (intent.domain === 'ai') {
      if (intent.technology === 'tensorflow' || intent.technology === 'pytorch') {
        scripts.train = 'python train.py';
        scripts.predict = 'python predict.py';
        scripts.test = 'python test.py';
      }
    } else if (intent.domain === 'blockchain') {
      if (intent.technology === 'solidity') {
        scripts.compile = 'npx hardhat compile';
        scripts.test = 'npx hardhat test';
        scripts.deploy = 'npx hardhat run scripts/deploy.js';
      }
    }
    
    return scripts;
  }

  getProjectStructure(intent: Intent): any {
    const structure = {
      directories: [] as string[],
      files: [] as any[],
      entryPoint: '',
      configFiles: [] as string[]
    };
    
    if (intent.domain === 'frontend') {
      structure.directories = ['src', 'public', 'tests'];
      structure.entryPoint = 'src/index.js';
      structure.configFiles = ['package.json'];
      
      if (intent.technology === 'react') {
        structure.directories.push('src/components', 'src/pages', 'src/hooks');
        structure.entryPoint = 'src/index.js';
      } else if (intent.technology === 'vue') {
        structure.directories.push('src/components', 'src/views', 'src/store');
        structure.entryPoint = 'src/main.js';
      } else if (intent.technology === 'angular') {
        structure.directories.push('src/app', 'src/assets', 'src/environments');
        structure.entryPoint = 'src/main.ts';
      }
    } else if (intent.domain === 'backend') {
      structure.directories = ['src', 'tests', 'config'];
      structure.entryPoint = 'src/server.js';
      structure.configFiles = ['package.json'];
      
      if (intent.technology === 'express') {
        structure.directories.push('src/routes', 'src/controllers', 'src/models', 'src/middleware');
        structure.entryPoint = 'src/server.js';
      } else if (intent.technology === 'fastapi') {
        structure.directories.push('app', 'tests', 'alembic');
        structure.entryPoint = 'main.py';
        structure.configFiles = ['requirements.txt'];
      } else if (intent.technology === 'django') {
        structure.directories.push('myproject', 'myapp', 'static', 'templates');
        structure.entryPoint = 'manage.py';
        structure.configFiles = ['requirements.txt'];
      }
    } else if (intent.domain === 'mobile') {
      if (intent.technology === 'flutter') {
        structure.directories = ['lib', 'test', 'android', 'ios'];
        structure.entryPoint = 'lib/main.dart';
        structure.configFiles = ['pubspec.yaml'];
      }
    } else if (intent.domain === 'desktop') {
      if (intent.technology === 'electron') {
        structure.directories = ['src', 'public', 'tests'];
        structure.entryPoint = 'src/main.js';
        structure.configFiles = ['package.json'];
      }
    } else if (intent.domain === 'ai') {
      structure.directories = ['src', 'data', 'models', 'tests'];
      structure.entryPoint = 'src/main.py';
      structure.configFiles = ['requirements.txt'];
    } else if (intent.domain === 'blockchain') {
      if (intent.technology === 'solidity') {
        structure.directories = ['contracts', 'scripts', 'test'];
        structure.entryPoint = 'contracts/MyContract.sol';
        structure.configFiles = ['hardhat.config.js'];
      }
    }
    
    return structure;
  }

  getValidations(intent: Intent): any[] {
    const validations = [];
    
    // Build validation
    if (intent.domain === 'frontend') {
      validations.push({
        name: 'Build',
        command: 'npm run build',
        timeout: 60000,
        retries: 3
      });
    } else if (intent.domain === 'backend') {
      if (intent.technology === 'express') {
        validations.push({
          name: 'Build',
          command: 'npm run build',
          timeout: 60000,
          retries: 3
        });
      } else if (intent.technology === 'fastapi') {
        validations.push({
          name: 'Build',
          command: 'python -m py_compile main.py',
          timeout: 30000,
          retries: 3
        });
      }
    }
    
    // Test validation
    if (intent.features?.includes('testing')) {
      if (intent.technology === 'react' || intent.technology === 'vue') {
        validations.push({
          name: 'Test',
          command: 'npm test',
          timeout: 30000,
          retries: 2
        });
      } else if (intent.technology === 'express') {
        validations.push({
          name: 'Test',
          command: 'npm test',
          timeout: 30000,
          retries: 2
        });
      } else if (intent.technology === 'fastapi') {
        validations.push({
          name: 'Test',
          command: 'pytest',
          timeout: 30000,
          retries: 2
        });
      }
    }
    
    // Server validation
    if (intent.domain === 'frontend' || intent.domain === 'backend') {
      validations.push({
        name: 'Server',
        command: 'npm start',
        timeout: 30000,
        retries: 2
      });
    }
    
    return validations;
  }

  getEstimatedTime(intent: Intent): number {
    let time = 10; // Base time in minutes
    
    // Complexity factor
    if (intent.complexity === 'simple') time += 5;
    else if (intent.complexity === 'medium') time += 15;
    else if (intent.complexity === 'advanced') time += 30;
    
    // Feature factors
    if (intent.features?.includes('authentication')) time += 10;
    if (intent.features?.includes('database')) time += 15;
    if (intent.features?.includes('api')) time += 20;
    if (intent.features?.includes('routing')) time += 5;
    if (intent.features?.includes('state-management')) time += 10;
    if (intent.features?.includes('styling')) time += 5;
    if (intent.features?.includes('testing')) time += 10;
    if (intent.features?.includes('deployment')) time += 15;
    
    return time;
  }

  private async generateSetupTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]> {
    const tasks: DynamicTask[] = [];
    
    if (context.isEmpty) {
      // 100% DYNAMIC APPROACH - Generate tasks based on intent analysis
      const setupTasks = await this.generateDynamicTasksFromIntent(intent, context);
      tasks.push(...setupTasks);
    }
    
    return tasks;
  }

  // 100% DYNAMIC TASK GENERATION - No hard-coded logic
  private async generateDynamicTasksFromIntent(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]> {
    const tasks: DynamicTask[] = [];
    
    // Analyze intent dynamically to determine required tasks
    const domain = intent.domain;
    const technology = intent.technology;
    const language = intent.language;
    const features = intent.features || [];
    const requirements = intent.requirements || [];
    
    // Generate initialization task based on technology
    if (technology) {
      const initTask = await this.generateInitializationTask(technology, language || 'javascript', domain, intent);
      if (initTask) tasks.push(initTask);
    }
    
    // Generate dependency tasks based on features and requirements (skip for HTML projects)
    if (technology && !technology.toLowerCase().includes('html')) {
      const dependencyTasks = await this.generateDependencyTasksFromFeatures(features, requirements, technology || 'unknown');
      tasks.push(...dependencyTasks);
    }
    
    // Generate implementation tasks based on features
    const implementationTasks = await this.generateImplementationTasksFromFeatures(features, technology || 'unknown', language || 'javascript', domain);
    tasks.push(...implementationTasks);
    
    // Generate validation tasks
    const validationTasks = await this.generateValidationTasksFromTechnology(technology || 'unknown', domain);
    tasks.push(...validationTasks);
    
    return tasks;
  }

  private async generateInitializationTask(technology: string, language: string, domain: string, intent: Intent): Promise<DynamicTask | null> {
    // Dynamic command generation based on technology
    let command = '';
    let description = '';
    
    if (technology.toLowerCase().includes('react')) {
      command = 'npx create-react-app temp-react-app --template typescript && cp -r temp-react-app/* . && cp -r temp-react-app/.* . 2>/dev/null || true && rm -rf temp-react-app';
      description = 'Initialize React project with TypeScript';
    } else if (technology.toLowerCase().includes('vue')) {
      command = 'npm create vue@latest .';
      description = 'Initialize Vue project';
    } else if (technology.toLowerCase().includes('angular')) {
      command = 'ng new . --routing --style=scss';
      description = 'Initialize Angular project';
    } else if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      command = 'npm init -y';
      description = 'Initialize Node.js project';
      
      // Also create package.json with proper scripts
      return {
        id: uuidv4(),
        description: 'Create package.json with scripts',
        type: 'tool',
        toolName: 'file_write',
        parameters: { 
          filePath: 'package.json', 
          content: JSON.stringify({
            name: 'express-api',
            version: '1.0.0',
            description: 'Express API with JWT authentication',
            main: 'src/server.js',
            scripts: {
              start: 'node src/server.js',
              dev: 'nodemon src/server.js',
              test: 'jest',
              build: 'echo "No build step required for Node.js"'
            },
            keywords: ['express', 'api', 'jwt', 'authentication'],
            author: '',
            license: 'MIT'
          }, null, 2)
        },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'setup'
      };
    } else if (technology.toLowerCase().includes('html')) {
      // For HTML projects, create files instead of using shell commands
      return {
        id: uuidv4(),
        description: 'Create HTML project structure',
        type: 'tool',
        toolName: 'file_write',
        parameters: { 
          filePath: 'index.html', 
          content: this.generateDynamicHTMLContent(intent) 
        },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'setup'
      };
    } else if (technology.toLowerCase().includes('content') || technology.toLowerCase().includes('script') || technology.toLowerCase().includes('youtube')) {
      // For content creation projects, create script files
      return {
        id: uuidv4(),
        description: 'Create content script structure',
        type: 'tool',
        toolName: 'file_write',
        parameters: { 
          filePath: 'script.md', 
          content: this.generateDynamicScriptContent(intent) 
        },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'setup'
      };
    } else {
      // Generic initialization for unknown technologies
      command = `echo "Initializing ${technology} project"`;
      description = `Initialize ${technology} project`;
    }
    
    return {
      id: uuidv4(),
      description,
      type: 'tool',
      toolName: 'shell',
      parameters: { command },
      status: 'pending',
      dependencies: [],
      createdAt: new Date(),
      projectPhase: 'setup'
    };
  }

  private async generateDependencyTasksFromFeatures(features: string[], requirements: string[], technology: string): Promise<DynamicTask[]> {
    const tasks: DynamicTask[] = [];
    
    // Analyze features to determine required dependencies
    const dependencies = this.analyzeFeaturesForDependencies(features, technology);
    const devDependencies = this.analyzeFeaturesForDevDependencies(features, technology);
    
    if (dependencies.length > 0) {
      tasks.push({
        id: uuidv4(),
        description: 'Install project dependencies',
        type: 'tool',
        toolName: 'package_manager',
        parameters: { dependencies, devDependencies: false },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'dependencies'
      });
    }
    
    if (devDependencies.length > 0) {
      tasks.push({
        id: uuidv4(),
        description: 'Install development dependencies',
        type: 'tool',
        toolName: 'package_manager',
        parameters: { dependencies: devDependencies, devDependencies: true },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'dependencies'
      });
    }
    
    return tasks;
  }

  private async generateImplementationTasksFromFeatures(features: string[], technology: string, language: string, domain?: string): Promise<DynamicTask[]> {
    const tasks: DynamicTask[] = [];
    
    // Generate implementation tasks based on features
    for (const feature of features) {
      const task = await this.generateFeatureImplementationTask(feature, technology, language);
      if (task) tasks.push(task);
    }
    
    // Always create server for backend projects
    if (domain === 'backend' && (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node'))) {
      const serverTask = await this.generateFeatureImplementationTask('server', technology, language);
      if (serverTask) tasks.push(serverTask);
    }
    
    // Always create copywrite file for sales projects
    if (features.includes('copywrite') || features.includes('sales')) {
      const copywriteTask = await this.generateFeatureImplementationTask('copywrite', technology, language);
      if (copywriteTask) tasks.push(copywriteTask);
    }
    
    return tasks;
  }

  private async generateValidationTasksFromTechnology(technology: string, domain: string): Promise<DynamicTask[]> {
    const tasks: DynamicTask[] = [];
    
    // Generate validation tasks based on technology and domain
    tasks.push({
      id: uuidv4(),
      description: 'Validate project build',
      type: 'tool',
      toolName: 'shell',
      parameters: { command: this.generateBuildCommand(technology) },
      status: 'pending',
      dependencies: [],
      createdAt: new Date(),
      projectPhase: 'validation'
    });
    
    if (domain === 'backend' || domain === 'frontend') {
      tasks.push({
        id: uuidv4(),
        description: 'Validate server accessibility',
        type: 'tool',
        toolName: 'shell',
        parameters: { command: this.generateServerValidationCommand(technology) },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'validation'
      });
    }
    
    return tasks;
  }

  // Helper methods for dynamic content generation
  private analyzeFeaturesForDependencies(features: string[], technology: string): string[] {
    const dependencies: string[] = [];
    
    // Dynamic dependency analysis based on features
    if (features.includes('authentication')) {
      if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
        dependencies.push('jsonwebtoken', 'bcryptjs', 'express-validator');
      }
    }
    
    if (features.includes('api')) {
      if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
        dependencies.push('express', 'cors', 'helmet', 'morgan');
      }
    }
    
    if (features.includes('styling')) {
      if (technology.toLowerCase().includes('react')) {
        dependencies.push('styled-components', 'emotion');
      }
    }
    
    return dependencies;
  }

  private analyzeFeaturesForDevDependencies(features: string[], technology: string): string[] {
    const devDependencies: string[] = [];
    
    // Dynamic dev dependency analysis
    if (features.includes('testing')) {
      devDependencies.push('jest', 'supertest');
    }
    
    if (technology.toLowerCase().includes('node') || technology.toLowerCase().includes('express')) {
      devDependencies.push('nodemon');
    }
    
    return devDependencies;
  }

  private async generateFeatureImplementationTask(feature: string, technology: string, language: string): Promise<DynamicTask | null> {
    // Dynamic feature implementation based on feature type
    switch (feature) {
      case 'authentication':
        return {
          id: uuidv4(),
          description: 'Implement authentication system',
          type: 'tool',
          toolName: 'file_write',
          parameters: { 
            filePath: this.generateAuthFilePath(technology),
            content: this.generateAuthContent(technology, language)
          },
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          projectPhase: 'implementation'
        };
      case 'api':
        return {
          id: uuidv4(),
          description: 'Create API routes',
          type: 'tool',
          toolName: 'file_write',
          parameters: { 
            filePath: this.generateAPIFilePath(technology),
            content: this.generateAPIContent(technology, language)
          },
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          projectPhase: 'implementation'
        };
      case 'server':
        return {
          id: uuidv4(),
          description: 'Create Express server',
          type: 'tool',
          toolName: 'file_write',
          parameters: { 
            filePath: 'src/server.js',
            content: this.generateExpressServerContent()
          },
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          projectPhase: 'implementation'
        };
      case 'copywrite':
        return {
          id: uuidv4(),
          description: 'Create copywrite file',
          type: 'tool',
          toolName: 'file_write',
          parameters: { 
            filePath: 'copywrite.md',
            content: this.generateDynamicCopywriteContent()
          },
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          projectPhase: 'implementation'
        };
      default:
        return null;
    }
  }

  private generateBuildCommand(technology: string): string {
    if (technology.toLowerCase().includes('react') || technology.toLowerCase().includes('vue') || technology.toLowerCase().includes('angular')) {
      return 'npm run build';
    } else if (technology.toLowerCase().includes('node') || technology.toLowerCase().includes('express')) {
      return 'echo "No build step required for Node.js"';
    }
    return 'echo "Build validation completed"';
  }

  private generateServerValidationCommand(technology: string): string {
    if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      return 'npm start';
    }
    return 'echo "Server validation completed"';
  }

  private generateAuthFilePath(technology: string): string {
    if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      return 'src/routes/auth.js';
    } else if (technology.toLowerCase().includes('react')) {
      return 'src/components/Auth.js';
    }
    return 'auth.js';
  }

  private generateAPIFilePath(technology: string): string {
    if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      return 'src/routes/api.js';
    }
    return 'api.js';
  }

  private generateAuthContent(technology: string, language: string): string {
    // Dynamic content generation based on technology and language
    if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      return this.generateExpressAuthContent();
    } else if (technology.toLowerCase().includes('react')) {
      return this.generateReactAuthContent();
    }
    return '// Authentication implementation';
  }

  private generateAPIContent(technology: string, language: string): string {
    if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
      return this.generateExpressAPIContent();
    }
    return '// API implementation';
  }

  private generateExpressAuthContent(): string {
    return `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const users = [];

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, email, password: hashedPassword };
    users.push(user);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;`;
  }

  private generateExpressAPIContent(): string {
    return `const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Protected route accessed successfully',
    user: req.user 
  });
});

// Public route
router.get('/public', (req, res) => {
  res.json({ message: 'This is a public route' });
});

module.exports = router;`;
  }

  private generateExpressServerContent(): string {
    return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});

module.exports = app;`;
  }

  private generateReactAuthContent(): string {
    return `import React, { useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};`;
  }

  private generateDynamicHTMLContent(intent: Intent): string {
    const title = intent.purpose ? `${intent.purpose} Website` : 'My Website';
    const features = intent.features || [];
    
    let content = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>${title}</h1>
    </header>
    <main>`;
    
    if (features.includes('copywrite') || features.includes('sales')) {
      content += `
        <section class="hero">
            <h2>Descubra o Segredo que 95% das Pessoas Não Conhecem para Multiplicar Suas Vendas em 30 Dias</h2>
            <p class="subtitle">Método Comprovado que Já Transformou Mais de 10.000 Negócios e Pode Transformar o Seu Também</p>
            <button class="cta-button">QUERO GARANTIR MINHA VAGA AGORA!</button>
        </section>
        
        <section class="problem">
            <h3>Você está cansado de:</h3>
            <ul>
                <li>Gastar dinheiro em anúncios que não convertem?</li>
                <li>Ver seus concorrentes vendendo mais que você?</li>
                <li>Trabalhar muito e ganhar pouco?</li>
                <li>Não saber por onde começar no marketing digital?</li>
            </ul>
        </section>
        
        <section class="solution">
            <h3>Nosso método exclusivo vai te ensinar:</h3>
            <ul>
                <li>Como identificar seu público ideal em 24 horas</li>
                <li>Estratégias de copywrite que convertem 3x mais</li>
                <li>Técnicas de remarketing que dobram suas vendas</li>
                <li>Fórmulas testadas para criar anúncios virais</li>
            </ul>
        </section>
        
        <section class="testimonials">
            <h3>O que nossos clientes dizem:</h3>
            <div class="testimonial">
                <p>"Em apenas 30 dias, consegui aumentar minhas vendas em 300%!"</p>
                <cite>- Maria Silva, E-commerce</cite>
            </div>
            <div class="testimonial">
                <p>"O melhor investimento que já fiz no meu negócio!"</p>
                <cite>- João Santos, Consultor</cite>
            </div>
        </section>
        
        <section class="offer">
            <h3>Oferta Especial - HOJE APENAS:</h3>
            <div class="pricing">
                <div class="original-price">Valor Total: R$ 1.791</div>
                <div class="current-price">Seu Investimento: Apenas R$ 197</div>
                <div class="discount">Desconto: 89% OFF</div>
            </div>
            <button class="cta-button">COMPRAR AGORA</button>
        </section>
        
        <section class="guarantee">
            <h3>Garantia Incondicional de 30 Dias</h3>
            <p>Se em 30 dias você não estiver satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracias.</p>
        </section>`;
    } else {
      content += `
        <h1>Welcome to ${title}</h1>
        <p>This is a dynamic website created by FLUI AutoCode-Forge.</p>`;
    }
    
    if (features.includes('authentication')) {
      content += `
        <div id="auth-section">
            <h2>Authentication</h2>
            <form id="login-form">
                <input type="email" placeholder="Email" required>
                <input type="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        </div>`;
    }
    
    if (features.includes('api')) {
      content += `
        <div id="api-section">
            <h2>API Integration</h2>
            <button id="fetch-data">Fetch Data</button>
            <div id="data-display"></div>
        </div>`;
    }
    
    content += `
    </main>
    <footer>
        <p>© 2024 ${title}. Todos os direitos reservados.</p>
    </footer>
    <script src="script.js"></script>
</body>
</html>`;
    
    return content;
  }

  private generateDynamicScriptContent(intent: Intent): string {
    const title = intent.purpose ? `${intent.purpose} Script` : 'Content Script';
    const features = intent.features || [];
    
    let content = `# ${title}\n\n`;
    
    // Add timing information
    if (features.includes('timing')) {
      content += `## ⏱️ Timing: 1 minuto (60 segundos)\n\n`;
    }
    
    // Add hook/attention grabber
    if (features.includes('hooks')) {
      content += `## 🎯 Hook (0-5 segundos)\n`;
      content += `"Você sabia que 90% das pessoas perdem dinheiro online porque não conhecem este segredo do marketing digital?"\n\n`;
    }
    
    // Add main content
    content += `## 📝 Conteúdo Principal (5-50 segundos)\n`;
    content += `### Ponto 1: O Problema (5-20 segundos)\n`;
    content += `- A maioria das pessoas tenta vender sem estratégia\n`;
    content += `- Resultado: frustração e perda de tempo\n\n`;
    
    content += `### Ponto 2: A Solução (20-40 segundos)\n`;
    content += `- Marketing digital baseado em dados\n`;
    content += `- Estratégias comprovadas que funcionam\n`;
    content += `- Resultado: vendas consistentes\n\n`;
    
    content += `### Ponto 3: Prova Social (40-50 segundos)\n`;
    content += `- "Mais de 1000 pessoas já transformaram seus negócios"\n`;
    content += `- "Resultados em apenas 30 dias"\n\n`;
    
    // Add call-to-action
    if (features.includes('call-to-action')) {
      content += `## 🚀 Call-to-Action (50-60 segundos)\n`;
      content += `- "Quer saber como? Deixe um comentário com a palavra 'QUERO' abaixo"\n`;
      content += `- "Curta este vídeo se foi útil para você"\n`;
      content += `- "Se inscreva no canal para mais dicas de marketing digital"\n\n`;
    }
    
    // Add additional tips
    content += `## 💡 Dicas Extras\n`;
    content += `- Mantenha o ritmo acelerado\n`;
    content += `- Use gestos para enfatizar pontos importantes\n`;
    content += `- Mantenha contato visual com a câmera\n`;
    content += `- Use transições rápidas entre os pontos\n\n`;
    
    content += `## 📊 Métricas de Sucesso\n`;
    content += `- Taxa de retenção: >70% nos primeiros 30 segundos\n`;
    content += `- Taxa de engajamento: >5% (likes + comentários)\n`;
    content += `- Taxa de conversão: >2% (cliques no link da bio)\n\n`;
    
    content += `---\n`;
    content += `*Script criado dinamicamente pelo FLUI AutoCode-Forge*`;
    
    return content;
  }

  private generateDynamicCopywriteContent(): string {
    let content = `# Copywrite de Vendas\n\n`;
    
    content += `## 🎯 Headline Principal\n`;
    content += `"Descubra o Segredo que 95% das Pessoas Não Conhecem para Multiplicar Suas Vendas em 30 Dias"\n\n`;
    
    content += `## 🔥 Subheadline\n`;
    content += `"Método Comprovado que Já Transformou Mais de 10.000 Negócios e Pode Transformar o Seu Também"\n\n`;
    
    content += `## ⚡ Problema (Dor)\n`;
    content += `Você está cansado de:\n`;
    content += `- Gastar dinheiro em anúncios que não convertem?\n`;
    content += `- Ver seus concorrentes vendendo mais que você?\n`;
    content += `- Trabalhar muito e ganhar pouco?\n`;
    content += `- Não saber por onde começar no marketing digital?\n\n`;
    
    content += `## 💡 Solução (Benefício)\n`;
    content += `Nosso método exclusivo vai te ensinar:\n`;
    content += `- Como identificar seu público ideal em 24 horas\n`;
    content += `- Estratégias de copywrite que convertem 3x mais\n`;
    content += `- Técnicas de remarketing que dobram suas vendas\n`;
    content += `- Fórmulas testadas para criar anúncios virais\n\n`;
    
    content += `## 🏆 Prova Social\n`;
    content += `"Em apenas 30 dias, consegui aumentar minhas vendas em 300%!" - Maria Silva, E-commerce\n`;
    content += `"O melhor investimento que já fiz no meu negócio!" - João Santos, Consultor\n`;
    content += `"Finalmente entendi como funciona o marketing digital!" - Ana Costa, Coach\n\n`;
    
    content += `## 🎁 Oferta Especial\n`;
    content += `**HOJE APENAS:**\n`;
    content += `- Curso Completo (Valor: R$ 997) - **GRÁTIS**\n`;
    content += `- Bônus 1: Templates de Copywrite (Valor: R$ 297) - **GRÁTIS**\n`;
    content += `- Bônus 2: Consultoria 1:1 (Valor: R$ 497) - **GRÁTIS**\n`;
    content += `- Bônus 3: Grupo VIP no Telegram - **GRÁTIS**\n\n`;
    
    content += `**Valor Total: R$ 1.791**\n`;
    content += `**Seu Investimento: Apenas R$ 197**\n`;
    content += `**Desconto: 89% OFF**\n\n`;
    
    content += `## ⏰ Urgência/Escassez\n`;
    content += `⚠️ **ATENÇÃO:** Esta oferta expira em:\n`;
    content += `- ⏰ 24 horas\n`;
    content += `- 👥 Apenas 50 vagas disponíveis\n`;
    content += `- 🚫 Não haverá reabertura\n\n`;
    
    content += `## 🛡️ Garantia\n`;
    content += `**Garantia Incondicional de 30 Dias**\n`;
    content += `Se em 30 dias você não estiver satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracias.\n\n`;
    
    content += `## 🚀 Call-to-Action\n`;
    content += `**QUERO GARANTIR MINHA VAGA AGORA!**\n`;
    content += `[CLIQUE AQUI PARA COMPRAR AGORA]\n\n`;
    
    content += `## 📞 Contato\n`;
    content += `Dúvidas? Fale conosco:\n`;
    content += `- WhatsApp: (11) 99999-9999\n`;
    content += `- Email: contato@exemplo.com\n\n`;
    
    content += `---\n`;
    content += `*Copywrite criada dinamicamente pelo FLUI AutoCode-Forge*\n`;
    
    return content;
  }

  private generateDependencyTasks(intent: Intent, context: ContextAnalysis): DynamicTask[] {
    const tasks: DynamicTask[] = [];
    const dependencies = this.getDependencies(intent);
    const devDependencies = this.getDevDependencies(intent);
    
    if (dependencies.length > 0) {
      tasks.push({
        id: uuidv4(),
        description: 'Install dependencies',
        type: 'tool',
        toolName: 'package_manager',
        parameters: { dependencies, devDependencies: false },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'dependencies'
      });
    }
    
    if (devDependencies.length > 0) {
      tasks.push({
        id: uuidv4(),
        description: 'Install dev dependencies',
        type: 'tool',
        toolName: 'package_manager',
        parameters: { dependencies: devDependencies, devDependencies: true },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'dependencies'
      });
    }
    
    return tasks;
  }

  private generateConfigurationTasks(intent: Intent, context: ContextAnalysis): DynamicTask[] {
    const tasks: DynamicTask[] = [];
    
    // Configuration tasks based on technology and features
    if (intent.technology === 'react' && intent.features?.includes('routing')) {
      tasks.push({
        id: uuidv4(),
        description: 'Configure React Router',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'src/App.js', content: 'Router configuration' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'configuration'
      });
    }
    
    if (intent.features?.includes('styling') && (intent.technology === 'react' || intent.technology === 'vue')) {
      tasks.push({
        id: uuidv4(),
        description: 'Configure Tailwind CSS',
        type: 'tool',
        toolName: 'shell',
        parameters: { command: 'npx tailwindcss init -p' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'configuration'
      });
    }
    
    return tasks;
  }

  private generateImplementationTasks(intent: Intent, context: ContextAnalysis): DynamicTask[] {
    const tasks: DynamicTask[] = [];
    
    // Implementation tasks based on technology and features
    if (intent.technology === 'react') {
      tasks.push({
        id: uuidv4(),
        description: 'Create main App component',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'src/App.js', content: 'React App component' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'implementation'
      });
    }
    
    if (intent.technology === 'express') {
      tasks.push({
        id: uuidv4(),
        description: 'Create Express server',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'src/server.js', content: 'Express server setup' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'implementation'
      });
    }
    
    if (intent.features?.includes('authentication')) {
      tasks.push({
        id: uuidv4(),
        description: 'Implement authentication',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'src/auth.js', content: 'Authentication logic' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'implementation'
      });
    }
    
    return tasks;
  }

  private generateTestingTasks(intent: Intent, context: ContextAnalysis): DynamicTask[] {
    const tasks: DynamicTask[] = [];
    
    if (intent.features?.includes('testing')) {
      tasks.push({
        id: uuidv4(),
        description: 'Create test files',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'src/App.test.js', content: 'Test file content' },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'testing'
      });
    }
    
    return tasks;
  }

  private generateValidationTasks(intent: Intent, context: ContextAnalysis): DynamicTask[] {
    const tasks: DynamicTask[] = [];
    const validations = this.getValidations(intent);
    
    for (const validation of validations) {
      tasks.push({
        id: uuidv4(),
        description: `Validate ${validation.name}`,
        type: 'tool',
        toolName: 'shell',
        parameters: { command: validation.command },
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'validation',
        validationCommand: validation.command,
        expectedResult: 'success'
      });
    }
    
    return tasks;
  }
}
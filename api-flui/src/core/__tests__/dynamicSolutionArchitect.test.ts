import { DynamicSolutionArchitect } from '../dynamicSolutionArchitect';
import { Intent, SolutionArchitecture, ContextAnalysis, DynamicTask } from '../../types/dynamic';

describe('DynamicSolutionArchitect', () => {
  let solutionArchitect: DynamicSolutionArchitect;

  beforeEach(() => {
    solutionArchitect = new DynamicSolutionArchitect();
  });

  describe('designSolution', () => {
    it('should design React frontend solution', async () => {
      const intent: Intent = {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium',
        features: ['authentication', 'routing']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('frontend');
      expect(solution.framework).toBe('react');
      expect(solution.language).toBe('typescript');
      expect(solution.buildTool).toBe('vite');
      expect(solution.packageManager).toBe('npm');
      expect(solution.dependencies).toContain('react');
      expect(solution.dependencies).toContain('react-dom');
      expect(solution.devDependencies).toContain('typescript');
      expect(solution.devDependencies).toContain('@types/react');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });

    it('should design Node.js backend solution', async () => {
      const intent: Intent = {
        domain: 'backend',
        technology: 'nodejs',
        language: 'javascript',
        purpose: 'api',
        complexity: 'medium',
        features: ['authentication', 'database']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('backend');
      expect(solution.framework).toBe('nodejs');
      expect(solution.language).toBe('javascript');
      expect(solution.buildTool).toBe('npm');
      expect(solution.packageManager).toBe('npm');
      expect(solution.dependencies).toContain('express');
      expect(solution.dependencies).toContain('jsonwebtoken');
      expect(solution.dependencies).toContain('mongoose');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });

    it('should design Python FastAPI solution', async () => {
      const intent: Intent = {
        domain: 'backend',
        technology: 'fastapi',
        language: 'python',
        purpose: 'api',
        complexity: 'medium',
        features: ['authentication', 'database']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('backend');
      expect(solution.framework).toBe('fastapi');
      expect(solution.language).toBe('python');
      expect(solution.buildTool).toBe('pip');
      expect(solution.packageManager).toBe('pip');
      expect(solution.dependencies).toContain('fastapi');
      expect(solution.dependencies).toContain('uvicorn');
      expect(solution.dependencies).toContain('sqlalchemy');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });

    it('should design Flutter mobile solution', async () => {
      const intent: Intent = {
        domain: 'mobile',
        technology: 'flutter',
        language: 'dart',
        purpose: 'app',
        complexity: 'medium',
        features: ['authentication', 'navigation']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('mobile');
      expect(solution.framework).toBe('flutter');
      expect(solution.language).toBe('dart');
      expect(solution.buildTool).toBe('flutter');
      expect(solution.packageManager).toBe('flutter');
      expect(solution.dependencies).toContain('flutter');
      expect(solution.dependencies).toContain('provider');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });

    it('should design AI/ML solution', async () => {
      const intent: Intent = {
        domain: 'ai',
        technology: 'tensorflow',
        language: 'python',
        purpose: 'ml',
        complexity: 'advanced',
        features: ['training', 'inference']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('ai');
      expect(solution.framework).toBe('tensorflow');
      expect(solution.language).toBe('python');
      expect(solution.buildTool).toBe('pip');
      expect(solution.packageManager).toBe('pip');
      expect(solution.dependencies).toContain('tensorflow');
      expect(solution.dependencies).toContain('numpy');
      expect(solution.dependencies).toContain('pandas');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });

    it('should design blockchain solution', async () => {
      const intent: Intent = {
        domain: 'blockchain',
        technology: 'solidity',
        language: 'solidity',
        purpose: 'defi',
        complexity: 'advanced',
        features: ['smart-contracts', 'web3']
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const solution = await solutionArchitect.designSolution(intent, context);
      
      expect(solution).toBeDefined();
      expect(solution.type).toBe('blockchain');
      expect(solution.framework).toBe('solidity');
      expect(solution.language).toBe('solidity');
      expect(solution.buildTool).toBe('hardhat');
      expect(solution.packageManager).toBe('npm');
      expect(solution.dependencies).toContain('hardhat');
      expect(solution.dependencies).toContain('@openzeppelin/contracts');
      expect(solution.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe('generateDynamicTasks', () => {
    it('should generate tasks for React frontend', async () => {
      const intent: Intent = {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium'
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const tasks = await solutionArchitect.generateDynamicTasks(intent, context);
      
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      // Check for setup tasks
      const setupTasks = tasks.filter(task => task.projectPhase === 'setup');
      expect(setupTasks.length).toBeGreaterThan(0);
      
      // Check for dependency tasks
      const dependencyTasks = tasks.filter(task => task.projectPhase === 'dependencies');
      expect(dependencyTasks.length).toBeGreaterThan(0);
      
      // Check for implementation tasks
      const implementationTasks = tasks.filter(task => task.projectPhase === 'implementation');
      expect(implementationTasks.length).toBeGreaterThan(0);
      
      // Check for validation tasks
      const validationTasks = tasks.filter(task => task.projectPhase === 'validation');
      expect(validationTasks.length).toBeGreaterThan(0);
    });

    it('should generate tasks for Node.js backend', async () => {
      const intent: Intent = {
        domain: 'backend',
        technology: 'nodejs',
        language: 'javascript',
        purpose: 'api',
        complexity: 'medium'
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
      
      const tasks = await solutionArchitect.generateDynamicTasks(intent, context);
      
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      // Check for setup tasks
      const setupTasks = tasks.filter(task => task.projectPhase === 'setup');
      expect(setupTasks.length).toBeGreaterThan(0);
      
      // Check for dependency tasks
      const dependencyTasks = tasks.filter(task => task.projectPhase === 'dependencies');
      expect(dependencyTasks.length).toBeGreaterThan(0);
      
      // Check for implementation tasks
      const implementationTasks = tasks.filter(task => task.projectPhase === 'implementation');
      expect(implementationTasks.length).toBeGreaterThan(0);
    });

    it('should generate tasks for existing project', async () => {
      const intent: Intent = {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium'
      };
      
      const context: ContextAnalysis = {
        workingDirectory: '/tmp/test',
        existingFiles: ['package.json', 'src'],
        hasPackageJson: true,
        hasGitRepo: true,
        isEmpty: false,
        detectedTechnologies: ['nodejs']
      };
      
      const tasks = await solutionArchitect.generateDynamicTasks(intent, context);
      
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      // Should have fewer setup tasks for existing project
      const setupTasks = tasks.filter(task => task.projectPhase === 'setup');
      expect(setupTasks.length).toBeLessThan(3);
    });
  });

  describe('getBuildTool', () => {
    it('should return correct build tool for React', async () => {
      const intent: Intent = { technology: 'react' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('vite');
    });

    it('should return correct build tool for Vue', async () => {
      const intent: Intent = { technology: 'vue' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('vite');
    });

    it('should return correct build tool for Angular', async () => {
      const intent: Intent = { technology: 'angular' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('angular-cli');
    });

    it('should return correct build tool for Rust', async () => {
      const intent: Intent = { language: 'rust' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('cargo');
    });

    it('should return correct build tool for Java', async () => {
      const intent: Intent = { language: 'java' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('maven');
    });

    it('should return correct build tool for Go', async () => {
      const intent: Intent = { language: 'go' };
      const buildTool = solutionArchitect.getBuildTool(intent);
      expect(buildTool).toBe('go');
    });
  });

  describe('getPackageManager', () => {
    it('should return correct package manager for Python', async () => {
      const intent: Intent = { language: 'python' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('pip');
    });

    it('should return correct package manager for Rust', async () => {
      const intent: Intent = { language: 'rust' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('cargo');
    });

    it('should return correct package manager for Java', async () => {
      const intent: Intent = { language: 'java' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('maven');
    });

    it('should return correct package manager for Go', async () => {
      const intent: Intent = { language: 'go' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('go');
    });

    it('should return correct package manager for PHP', async () => {
      const intent: Intent = { language: 'php' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('composer');
    });

    it('should return correct package manager for Ruby', async () => {
      const intent: Intent = { language: 'ruby' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('bundler');
    });

    it('should return npm as default', async () => {
      const intent: Intent = { language: 'javascript' };
      const packageManager = solutionArchitect.getPackageManager(intent);
      expect(packageManager).toBe('npm');
    });
  });

  describe('getDependencies', () => {
    it('should return React dependencies', async () => {
      const intent: Intent = { technology: 'react' };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('react');
      expect(dependencies).toContain('react-dom');
    });

    it('should return Vue dependencies', async () => {
      const intent: Intent = { technology: 'vue' };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('vue');
    });

    it('should return Express dependencies', async () => {
      const intent: Intent = { technology: 'express' };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('express');
    });

    it('should return FastAPI dependencies', async () => {
      const intent: Intent = { technology: 'fastapi' };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('fastapi');
    });

    it('should include authentication dependencies when needed', async () => {
      const intent: Intent = { 
        technology: 'express',
        features: ['authentication']
      };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('jsonwebtoken');
      expect(dependencies).toContain('bcrypt');
    });

    it('should include database dependencies when needed', async () => {
      const intent: Intent = { 
        technology: 'express',
        features: ['database']
      };
      const dependencies = solutionArchitect.getDependencies(intent);
      expect(dependencies).toContain('mongoose');
      expect(dependencies).toContain('mongodb');
    });
  });

  describe('getDevDependencies', () => {
    it('should return TypeScript dev dependencies', async () => {
      const intent: Intent = { language: 'typescript' };
      const devDependencies = solutionArchitect.getDevDependencies(intent);
      expect(devDependencies).toContain('typescript');
      expect(devDependencies).toContain('@types/node');
    });

    it('should return React TypeScript dev dependencies', async () => {
      const intent: Intent = { 
        technology: 'react',
        language: 'typescript'
      };
      const devDependencies = solutionArchitect.getDevDependencies(intent);
      expect(devDependencies).toContain('@types/react');
      expect(devDependencies).toContain('@types/react-dom');
    });

    it('should include testing dependencies when needed', async () => {
      const intent: Intent = { 
        technology: 'react',
        features: ['testing']
      };
      const devDependencies = solutionArchitect.getDevDependencies(intent);
      expect(devDependencies).toContain('jest');
      expect(devDependencies).toContain('@testing-library/react');
    });
  });

  describe('getEstimatedTime', () => {
    it('should return correct time for simple project', async () => {
      const intent: Intent = { complexity: 'simple' };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(15); // 10 + 5
    });

    it('should return correct time for medium project', async () => {
      const intent: Intent = { complexity: 'medium' };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(25); // 10 + 15
    });

    it('should return correct time for advanced project', async () => {
      const intent: Intent = { complexity: 'advanced' };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(40); // 10 + 30
    });

    it('should add time for authentication feature', async () => {
      const intent: Intent = { 
        complexity: 'medium',
        features: ['authentication']
      };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(35); // 10 + 15 + 10
    });

    it('should add time for database feature', async () => {
      const intent: Intent = { 
        complexity: 'medium',
        features: ['database']
      };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(40); // 10 + 15 + 15
    });

    it('should add time for API feature', async () => {
      const intent: Intent = { 
        complexity: 'medium',
        features: ['api']
      };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(45); // 10 + 15 + 20
    });

    it('should add time for multiple features', async () => {
      const intent: Intent = { 
        complexity: 'medium',
        features: ['authentication', 'database', 'api']
      };
      const time = solutionArchitect.getEstimatedTime(intent);
      expect(time).toBe(70); // 10 + 15 + 10 + 15 + 20
    });
  });
});
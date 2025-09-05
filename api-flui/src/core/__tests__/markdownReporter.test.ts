import { MarkdownReporter } from '../markdownReporter';
import { 
  MarkdownReport, 
  ProjectStructure, 
  TestResults, 
  ExecutionSummary, 
  MarkdownReporterOptions,
  ProjectFile,
  TestDetail
} from '../../types/markdownReporter';
import * as fs from 'fs';
import * as path from 'path';

describe('MarkdownReporter', () => {
  const testDir = '/tmp/flui-markdown-reporter-test';
  let markdownReporter: MarkdownReporter;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    markdownReporter = new MarkdownReporter(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('generateHTMLProjectReport', () => {
    it('should generate markdown report for HTML project', async () => {
      // Arrange
      const projectStructure: ProjectStructure = {
        directories: ['css', 'js', 'images'],
        files: [
          {
            name: 'index.html',
            path: 'index.html',
            size: 2048,
            type: 'source',
            description: 'Main HTML page'
          },
          {
            name: 'style.css',
            path: 'css/style.css',
            size: 1024,
            type: 'source',
            description: 'Main stylesheet'
          },
          {
            name: 'script.js',
            path: 'js/script.js',
            size: 512,
            type: 'source',
            description: 'Main JavaScript file'
          }
        ],
        entryPoint: 'index.html',
        configFiles: [],
        totalSize: 3584
      };

      const testResults: TestResults = {
        total: 3,
        passed: 3,
        failed: 0,
        skipped: 0,
        duration: 1500,
        details: [
          {
            name: 'HTML Validation',
            status: 'passed',
            duration: 200,
            output: 'HTML is valid'
          },
          {
            name: 'CSS Validation',
            status: 'passed',
            duration: 300,
            output: 'CSS is valid'
          },
          {
            name: 'JavaScript Syntax',
            status: 'passed',
            duration: 1000,
            output: 'JavaScript syntax is valid'
          }
        ]
      };

      const executionSummary: ExecutionSummary = {
        buildStatus: 'success',
        serverStatus: 'running',
        testStatus: 'passed',
        curlStatus: 'success',
        totalTime: 5000,
        errors: [],
        warnings: []
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await markdownReporter.generateHTMLProjectReport(
        'Landing Page HTML',
        projectStructure,
        testResults,
        executionSummary,
        'http://localhost:3000',
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();
      expect(result.reportContent).toBeDefined();
      expect(fs.existsSync(result.reportPath!)).toBe(true);

      // Verify report content
      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('# 🌐 Landing Page HTML ✨');
      expect(reportContent).toContain('## 📁 Estrutura do Projeto');
      expect(reportContent).toContain('## 🧪 Resultados dos Testes');
      expect(reportContent).toContain('## 🚀 Execução');
      expect(reportContent).toContain('## 🔗 Links');
      expect(reportContent).toContain('index.html');
      expect(reportContent).toContain('style.css');
      expect(reportContent).toContain('script.js');
      expect(reportContent).toContain('http://localhost:3000');
    });

    it('should generate minimal report without optional sections', async () => {
      // Arrange
      const projectStructure: ProjectStructure = {
        directories: [],
        files: [
          {
            name: 'index.html',
            path: 'index.html',
            size: 1024,
            type: 'source'
          }
        ],
        entryPoint: 'index.html',
        configFiles: [],
        totalSize: 1024
      };

      const testResults: TestResults = {
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 500,
        details: []
      };

      const executionSummary: ExecutionSummary = {
        buildStatus: 'success',
        serverStatus: 'running',
        testStatus: 'passed',
        curlStatus: 'success',
        totalTime: 2000,
        errors: [],
        warnings: []
      };

      const options: MarkdownReporterOptions = {
        includeIcons: false,
        includeEmojis: false,
        includeTimestamps: false,
        includeMetadata: false,
        includeTestDetails: false,
        includeFileStructure: false,
        includeExecutionSummary: false
      };

      // Act
      const result = await markdownReporter.generateHTMLProjectReport(
        'Simple HTML Page',
        projectStructure,
        testResults,
        executionSummary,
        'http://localhost:3000',
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();

      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('#  Simple HTML Page');
      expect(reportContent).not.toContain('## 📁 Estrutura do Projeto');
      expect(reportContent).not.toContain('## 🧪 Resultados dos Testes');
      expect(reportContent).not.toContain('## 🚀 Execução');
    });
  });

  describe('generateNodeJSProjectReport', () => {
    it('should generate markdown report for Node.js project', async () => {
      // Arrange
      const projectStructure: ProjectStructure = {
        directories: ['src', 'tests', 'public'],
        files: [
          {
            name: 'package.json',
            path: 'package.json',
            size: 512,
            type: 'config',
            description: 'Node.js package configuration'
          },
          {
            name: 'server.js',
            path: 'src/server.js',
            size: 2048,
            type: 'source',
            description: 'Main server file'
          },
          {
            name: 'routes.js',
            path: 'src/routes.js',
            size: 1536,
            type: 'source',
            description: 'API routes'
          },
          {
            name: 'test.js',
            path: 'tests/test.js',
            size: 1024,
            type: 'test',
            description: 'Unit tests'
          }
        ],
        entryPoint: 'src/server.js',
        configFiles: ['package.json'],
        totalSize: 5120
      };

      const testResults: TestResults = {
        total: 5,
        passed: 4,
        failed: 1,
        skipped: 0,
        duration: 3000,
        details: [
          {
            name: 'npm install',
            status: 'passed',
            duration: 2000,
            output: 'Dependencies installed successfully'
          },
          {
            name: 'npm test',
            status: 'failed',
            duration: 1000,
            error: 'Test failed: API endpoint not responding'
          }
        ]
      };

      const executionSummary: ExecutionSummary = {
        buildStatus: 'success',
        serverStatus: 'running',
        testStatus: 'failed',
        curlStatus: 'success',
        totalTime: 8000,
        errors: ['Test failed: API endpoint not responding'],
        warnings: ['Server took longer than expected to start']
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await markdownReporter.generateNodeJSProjectReport(
        'Node.js API Server',
        projectStructure,
        testResults,
        executionSummary,
        'http://localhost:3001',
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();

      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('# 🚀 Node.js API Server ✨');
      expect(reportContent).toContain('## 📦 Dependências');
      expect(reportContent).toContain('## 🧪 Resultados dos Testes');
      expect(reportContent).toContain('## 🚀 Execução');
      expect(reportContent).toContain('package.json');
      expect(reportContent).toContain('server.js');
      expect(reportContent).toContain('http://localhost:3001');
      expect(reportContent).toContain('❌ Test failed: API endpoint not responding');
    });
  });

  describe('generateContentProjectReport', () => {
    it('should generate markdown report for content project', async () => {
      // Arrange
      const projectStructure: ProjectStructure = {
        directories: [],
        files: [
          {
            name: 'script.md',
            path: 'script.md',
            size: 2048,
            type: 'documentation',
            description: 'YouTube script content'
          },
          {
            name: 'copywrite.md',
            path: 'copywrite.md',
            size: 1536,
            type: 'documentation',
            description: 'Sales copywrite content'
          }
        ],
        entryPoint: 'script.md',
        configFiles: [],
        totalSize: 3584
      };

      const testResults: TestResults = {
        total: 2,
        passed: 2,
        failed: 0,
        skipped: 0,
        duration: 500,
        details: [
          {
            name: 'Content Validation',
            status: 'passed',
            duration: 300,
            output: 'Content is valid and complete'
          },
          {
            name: 'Word Count Check',
            status: 'passed',
            duration: 200,
            output: 'Word count meets requirements'
          }
        ]
      };

      const executionSummary: ExecutionSummary = {
        buildStatus: 'skipped',
        serverStatus: 'stopped',
        testStatus: 'passed',
        curlStatus: 'skipped',
        totalTime: 1000,
        errors: [],
        warnings: []
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await markdownReporter.generateContentProjectReport(
        'YouTube Script & Copywrite',
        projectStructure,
        testResults,
        executionSummary,
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();

      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('# 📝 YouTube Script & Copywrite ✨');
      expect(reportContent).toContain('## 📝 Conteúdo Gerado');
      expect(reportContent).toContain('## 🧪 Validação');
      expect(reportContent).toContain('script.md');
      expect(reportContent).toContain('copywrite.md');
      expect(reportContent).toContain('Content is valid and complete');
    });
  });

  describe('generateCustomReport', () => {
    it('should generate custom markdown report', async () => {
      // Arrange
      const customData = {
        title: 'Custom Project Report',
        description: 'This is a custom project report',
        sections: [
          {
            title: 'Custom Section 1',
            content: 'Custom content for section 1',
            type: 'overview'
          },
          {
            title: 'Custom Section 2',
            content: 'Custom content for section 2',
            type: 'features'
          }
        ],
        links: [
          {
            title: 'Custom Link',
            url: 'https://example.com',
            type: 'documentation'
          }
        ]
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await markdownReporter.generateCustomReport(
        customData,
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();

      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('# 📊 Custom Project Report ✨');
      expect(reportContent).toContain('## Custom Section 1');
      expect(reportContent).toContain('## Custom Section 2');
      expect(reportContent).toContain('https://example.com');
    });
  });

  describe('generateReportFromTemplate', () => {
    it('should generate report using custom template', async () => {
      // Arrange
      const customTemplate = `
# {{title}}

## Overview
{{description}}

## Files Created
{{#each files}}
- {{name}} ({{size}} bytes)
{{/each}}

## Links
{{#each links}}
- [{{title}}]({{url}})
{{/each}}
      `;

      const templateData = {
        title: 'Template Test Project',
        description: 'Project generated from custom template',
        files: [
          { name: 'test.txt', size: 100 },
          { name: 'config.json', size: 200 }
        ],
        links: [
          { title: 'Test Link', url: 'https://test.com' }
        ]
      };

      const options: MarkdownReporterOptions = {
        template: 'custom',
        customTemplate
      };

      // Act
      const result = await markdownReporter.generateReportFromTemplate(
        templateData,
        options
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.reportPath).toBeDefined();

      const reportContent = fs.readFileSync(result.reportPath!, 'utf8');
      expect(reportContent).toContain('# Template Test Project');
      expect(reportContent).toContain('## Overview');
      expect(reportContent).toContain('Project generated from custom template');
      expect(reportContent).toContain('- test.txt (100 bytes)');
      expect(reportContent).toContain('- config.json (200 bytes)');
      expect(reportContent).toContain('- [Test Link](https://test.com)');
    });
  });

  describe('error handling', () => {
    it('should handle invalid project structure gracefully', async () => {
      // Arrange
      const invalidStructure = null as any;
      const testResults: TestResults = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        details: []
      };
      const executionSummary: ExecutionSummary = {
        buildStatus: 'failed',
        serverStatus: 'failed',
        testStatus: 'failed',
        curlStatus: 'failed',
        totalTime: 0,
        errors: ['Invalid project structure'],
        warnings: []
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await markdownReporter.generateHTMLProjectReport(
        'Invalid Project',
        invalidStructure,
        testResults,
        executionSummary,
        '',
        options
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file write errors gracefully', async () => {
      // Arrange
      const invalidReporter = new MarkdownReporter('/invalid/path/that/does/not/exist');

      const projectStructure: ProjectStructure = {
        directories: [],
        files: [],
        entryPoint: '',
        configFiles: [],
        totalSize: 0
      };

      const testResults: TestResults = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        details: []
      };

      const executionSummary: ExecutionSummary = {
        buildStatus: 'success',
        serverStatus: 'running',
        testStatus: 'passed',
        curlStatus: 'success',
        totalTime: 1000,
        errors: [],
        warnings: []
      };

      const options: MarkdownReporterOptions = {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      };

      // Act
      const result = await invalidReporter.generateHTMLProjectReport(
        'Test Project',
        projectStructure,
        testResults,
        executionSummary,
        'http://localhost:3000',
        options
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
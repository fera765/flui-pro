import { SecurityManager, SecurityOperation } from './SecurityManager';
import { container } from '../../config/container';
import { TaskEmotionMemory } from '../core/TaskEmotionMemory';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let emotionMemory: TaskEmotionMemory;
  let testProjectPath: string;

  beforeEach(async () => {
    securityManager = container.get<SecurityManager>('SecurityManager');
    emotionMemory = container.get<TaskEmotionMemory>('TaskEmotionMemory');
    
    testProjectPath = path.join(__dirname, '../../../../test-project');
    await fs.mkdir(testProjectPath, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('isOperationSafe', () => {
    it('deve aprovar operações seguras', async () => {
      const safeOperation: SecurityOperation = {
        type: 'file_access',
        path: 'src/components/Button.tsx',
        content: 'export const Button = () => <button>Click me</button>;'
      };

      const result = await securityManager.isOperationSafe(safeOperation);

      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('low');
      expect(result.recommendations).toHaveLength(0);
    });

    it('deve rejeitar operações perigosas', async () => {
      const dangerousOperation: SecurityOperation = {
        type: 'file_access',
        path: '../../../etc/passwd',
        content: 'malicious content'
      };

      const result = await securityManager.isOperationSafe(dangerousOperation);

      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('critical');
      expect(result.recommendations?.length).toBeGreaterThan(0);
    });

    it('deve detectar comandos shell perigosos', async () => {
      const dangerousOperation: SecurityOperation = {
        type: 'command_execution',
        command: 'rm -rf /',
        cwd: '/workspace'
      };

      const result = await securityManager.isOperationSafe(dangerousOperation);

      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('critical');
      expect(result.recommendations).toContain('Comando shell perigoso detectado');
    });

    it('deve detectar path traversal', async () => {
      const dangerousOperation: SecurityOperation = {
        type: 'file_access',
        path: '../../../../etc/passwd'
      };

      const result = await securityManager.isOperationSafe(dangerousOperation);

      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toContain('Path traversal detectado');
    });

    it('deve detectar comandos de chaining', async () => {
      const dangerousOperation: SecurityOperation = {
        type: 'command_execution',
        command: 'ls && rm -rf /tmp',
        cwd: '/workspace'
      };

      const result = await securityManager.isOperationSafe(dangerousOperation);

      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toContain('Command chaining detectado');
    });
  });

  describe('auditTask', () => {
    it('deve executar auditoria completa da task', async () => {
      const taskId = 'test-task-123';
      const microTasks = [
        {
          id: 'mt1',
          type: 'file_create',
          path: 'src/App.tsx',
          content: 'export const App = () => <div>Hello</div>;',
          status: 'completed'
        },
        {
          id: 'mt2',
          type: 'file_create',
          path: '../../../etc/passwd',
          content: 'malicious',
          status: 'pending'
        }
      ];

      const audit = await securityManager.auditTask(taskId, testProjectPath, microTasks);

      expect(audit.taskId).toBe(taskId);
      expect(audit.overallRisk).toBe('high');
      expect(audit.vulnerabilities.length).toBeGreaterThan(0);
      expect(audit.recommendations.length).toBeGreaterThan(0);
      expect(audit.timestamp).toBeDefined();
    });

    it('deve detectar vulnerabilidades em micro-tasks', async () => {
      const taskId = 'test-task-456';
      const microTasks = [
        {
          id: 'mt1',
          type: 'shell_execute',
          command: 'rm -rf /tmp/test',
          cwd: '/workspace',
          status: 'completed'
        }
      ];

      const audit = await securityManager.auditTask(taskId, testProjectPath, microTasks);

      expect(audit.vulnerabilities).toContain('Comando shell perigoso: rm -rf /tmp/test');
      expect(audit.overallRisk).toBe('high');
    });
  });

  describe('createRollbackPoint', () => {
    it('deve criar ponto de rollback com sucesso', async () => {
      const taskId = 'test-task-789';
      const description = 'Test rollback point';
      
      // Criar alguns arquivos para backup
      await fs.writeFile(path.join(testProjectPath, 'test.txt'), 'test content');
      await fs.writeFile(path.join(testProjectPath, 'package.json'), '{"name": "test"}');

      const rollbackPoint = await securityManager.createRollbackPoint(taskId, description, testProjectPath);

      expect(rollbackPoint.id).toBeDefined();
      expect(rollbackPoint.taskId).toBe(taskId);
      expect(rollbackPoint.description).toBe(description);
      expect(rollbackPoint.timestamp).toBeDefined();
      expect(rollbackPoint.fileHashes).toBeDefined();
      expect(Object.keys(rollbackPoint.fileHashes).length).toBeGreaterThan(0);
    });

    it('deve calcular hashes corretos dos arquivos', async () => {
      const taskId = 'test-task-hash';
      const testContent = 'test content for hash';
      
      await fs.writeFile(path.join(testProjectPath, 'hash-test.txt'), testContent);

      const rollbackPoint = await securityManager.createRollbackPoint(taskId, 'Hash test', testProjectPath);

      expect(rollbackPoint.fileHashes['hash-test.txt']).toBeDefined();
      expect(rollbackPoint.fileHashes['hash-test.txt']).toHaveLength(64); // SHA-256 hash length
    });
  });

  describe('executeRollback', () => {
    it('deve executar rollback com sucesso', async () => {
      const taskId = 'test-task-rollback';
      
      // Criar arquivo inicial
      const initialContent = 'initial content';
      await fs.writeFile(path.join(testProjectPath, 'rollback-test.txt'), initialContent);
      
      // Criar ponto de rollback
      const rollbackPoint = await securityManager.createRollbackPoint(taskId, 'Initial state', testProjectPath);
      
      // Modificar arquivo
      await fs.writeFile(path.join(testProjectPath, 'rollback-test.txt'), 'modified content');
      
      // Executar rollback
      const success = await securityManager.executeRollback(taskId, rollbackPoint.id, testProjectPath);
      
      expect(success).toBe(true);
      
      // Verificar se arquivo foi restaurado
      const restoredContent = await fs.readFile(path.join(testProjectPath, 'rollback-test.txt'), 'utf-8');
      expect(restoredContent).toBe(initialContent);
    });

    it('deve falhar ao executar rollback inexistente', async () => {
      const taskId = 'test-task-nonexistent';
      const fakeRollbackId = 'fake-rollback-id';

      const success = await securityManager.executeRollback(taskId, fakeRollbackId, testProjectPath);

      expect(success).toBe(false);
    });
  });

  describe('getSecurityHistory', () => {
    it('deve retornar histórico de segurança', async () => {
      const taskId = 'test-task-history';
      
      // Executar algumas auditorias
      await securityManager.auditTask(taskId, testProjectPath, []);
      await securityManager.auditTask(taskId, testProjectPath, []);

      const history = securityManager.getSecurityHistory(taskId);

      expect(history).toHaveLength(2);
      expect(history[0].taskId).toBe(taskId);
      expect(history[1].taskId).toBe(taskId);
    });
  });

  describe('getRollbackPoints', () => {
    it('deve retornar pontos de rollback', async () => {
      const taskId = 'test-task-rollback-list';
      
      // Criar alguns pontos de rollback
      await securityManager.createRollbackPoint(taskId, 'Point 1', testProjectPath);
      await securityManager.createRollbackPoint(taskId, 'Point 2', testProjectPath);

      const rollbackPoints = securityManager.getRollbackPoints(taskId);

      expect(rollbackPoints).toHaveLength(2);
      expect(rollbackPoints[0].description).toBe('Point 1');
      expect(rollbackPoints[1].description).toBe('Point 2');
    });
  });

  describe('validateProjectStructure', () => {
    it('deve validar estrutura de projeto válida', async () => {
      // Criar estrutura válida
      await fs.mkdir(path.join(testProjectPath, 'src'), { recursive: true });
      await fs.mkdir(path.join(testProjectPath, 'tests'), { recursive: true });
      await fs.writeFile(path.join(testProjectPath, 'package.json'), '{"name": "test"}');
      await fs.writeFile(path.join(testProjectPath, 'src/index.ts'), 'console.log("hello");');

      const validation = await securityManager.validateProjectStructure(testProjectPath);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('deve detectar problemas na estrutura', async () => {
      // Criar estrutura problemática
      await fs.mkdir(path.join(testProjectPath, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(testProjectPath, 'node_modules/malicious.js'), 'malicious code');

      const validation = await securityManager.validateProjectStructure(testProjectPath);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('scanForVulnerabilities', () => {
    it('deve detectar vulnerabilidades conhecidas', async () => {
      // Criar arquivo com vulnerabilidade
      const vulnerableCode = `
        const express = require('express');
        const app = express();
        app.get('/eval', (req, res) => {
          eval(req.query.code); // Vulnerabilidade!
        });
      `;
      
      await fs.writeFile(path.join(testProjectPath, 'vulnerable.js'), vulnerableCode);

      const vulnerabilities = await securityManager.scanForVulnerabilities(testProjectPath);

      expect(vulnerabilities.length).toBeGreaterThan(0);
      expect(vulnerabilities.some(v => v.includes('eval'))).toBe(true);
    });

    it('deve detectar dependências vulneráveis', async () => {
      // Criar package.json com dependência vulnerável
      const packageJson = {
        dependencies: {
          'vulnerable-package': '1.0.0'
        }
      };
      
      await fs.writeFile(path.join(testProjectPath, 'package.json'), JSON.stringify(packageJson));

      const vulnerabilities = await securityManager.scanForVulnerabilities(testProjectPath);

      expect(vulnerabilities.length).toBeGreaterThan(0);
    });
  });

  describe('generateSecurityReport', () => {
    it('deve gerar relatório de segurança completo', async () => {
      const taskId = 'test-task-report';
      
      // Executar auditoria
      await securityManager.auditTask(taskId, testProjectPath, []);
      
      // Criar ponto de rollback
      await securityManager.createRollbackPoint(taskId, 'Test point', testProjectPath);

      const report = await securityManager.generateSecurityReport(taskId);

      expect(report.taskId).toBe(taskId);
      expect(report.auditHistory).toBeDefined();
      expect(report.rollbackPoints).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });
  });
});
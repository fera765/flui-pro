import { injectable, inject } from 'inversify';
import { IFileSystem } from '../types/ITask';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SecurityCheck {
  type: 'file_access' | 'command_execution' | 'network_access' | 'path_traversal' | 'code_injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  allowed: boolean;
  details?: any;
}

export interface SecurityOperation {
  type: 'file_access' | 'command_execution' | 'network_access';
  path?: string;
  command?: string;
  content?: string;
  cwd?: string;
}

export interface SecurityResult {
  safe: boolean;
  reason?: string;
  severity?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: string[];
}

export interface SecurityAudit {
  taskId: string;
  timestamp: number;
  checks: SecurityCheck[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  vulnerabilities: string[];
}

export interface RollbackPoint {
  id: string;
  taskId: string;
  timestamp: number;
  description: string;
  checksums: Record<string, string>;
  fileHashes: Record<string, string>;
  metadata: any;
}

@injectable()
export class SecurityManager {
  private readonly fileSystem: IFileSystem;
  private readonly rollbackPoints: Map<string, RollbackPoint[]> = new Map();
  private readonly securityHistory: Map<string, SecurityAudit[]> = new Map();

  // Padrões perigosos
  private readonly dangerousPatterns = {
    pathTraversal: [/\.\.\//g, /\.\.\\/g, /\/\.\./g, /\\\.\./g],
    commandInjection: [/\$\(/g, /`/g, /;\s*rm\s/g, /;\s*del\s/g, /;\s*format\s/g],
    codeInjection: [/eval\s*\(/g, /Function\s*\(/g, /setTimeout\s*\(/g, /setInterval\s*\(/g],
    networkAccess: [/fetch\s*\(/g, /axios\s*\./g, /http\s*\./g, /https\s*\./g],
    systemCommands: [/exec\s*\(/g, /spawn\s*\(/g, /system\s*\(/g, /shell\s*\(/g]
  };

  // Comandos permitidos
  private readonly allowedCommands = [
    'npm', 'yarn', 'pnpm',
    'node', 'tsc', 'ts-node',
    'git', 'ls', 'cat', 'echo',
    'mkdir', 'rmdir', 'touch',
    'cp', 'mv', 'rm',
    'grep', 'find', 'sort',
    'head', 'tail', 'wc'
  ];

  // Extensões de arquivo permitidas
  private readonly allowedExtensions = [
    '.ts', '.tsx', '.js', '.jsx',
    '.json', '.md', '.txt',
    '.css', '.scss', '.less',
    '.html', '.xml', '.yaml', '.yml',
    '.lock', '.log'
  ];

  constructor(
    @inject('IFileSystem') fileSystem: IFileSystem
  ) {
    this.fileSystem = fileSystem;
  }

  /**
   * Executa auditoria de segurança para uma task
   */
  async auditTask(taskId: string, projectPath: string, microTasks: any[]): Promise<SecurityAudit> {
    const checks: SecurityCheck[] = [];
    
    try {
      // Verificar acesso a arquivos
      const fileChecks = await this.auditFileAccess(projectPath, microTasks);
      checks.push(...fileChecks);
      
      // Verificar execução de comandos
      const commandChecks = await this.auditCommandExecution(microTasks);
      checks.push(...commandChecks);
      
      // Verificar acesso à rede
      const networkChecks = await this.auditNetworkAccess(projectPath);
      checks.push(...networkChecks);
      
      // Verificar injeção de código
      const injectionChecks = await this.auditCodeInjection(projectPath);
      checks.push(...injectionChecks);
      
      // Calcular risco geral
      const overallRisk = this.calculateOverallRisk(checks);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(checks);
      
      // Coletar vulnerabilidades
      const vulnerabilities: string[] = [];
      checks.forEach(check => {
        if (!check.allowed) {
          vulnerabilities.push(check.description);
        }
      });

      const audit: SecurityAudit = {
        taskId,
        timestamp: Date.now(),
        checks,
        overallRisk,
        recommendations,
        vulnerabilities
      };
      
      // Armazenar histórico
      this.storeSecurityAudit(audit);
      
      return audit;
      
    } catch (error) {
      console.error('Erro na auditoria de segurança:', error);
      
      return {
        taskId,
        timestamp: Date.now(),
        checks: [{
          type: 'file_access',
          severity: 'critical',
          description: 'Erro na auditoria de segurança',
          allowed: false,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }],
        overallRisk: 'critical',
        recommendations: ['Corrigir erro na auditoria de segurança'],
        vulnerabilities: ['Erro na auditoria de segurança']
      };
    }
  }

  /**
   * Cria ponto de rollback
   */
  async createRollbackPoint(taskId: string, description: string, projectPath: string): Promise<RollbackPoint> {
    try {
      const files = await this.fileSystem.getProjectFiles(projectPath);
      const checksums: Record<string, string> = {};
      
      // Calcular checksums de todos os arquivos
      for (const [filePath, content] of Object.entries(files)) {
        checksums[filePath] = this.calculateChecksum(content);
      }
      
      const rollbackPoint: RollbackPoint = {
        id: this.generateRollbackId(),
        taskId,
        timestamp: Date.now(),
        description,
        checksums,
        fileHashes: checksums, // fileHashes é o mesmo que checksums
        metadata: {
          fileCount: Object.keys(files).length,
          projectPath
        }
      };
      
      // Armazenar ponto de rollback
      if (!this.rollbackPoints.has(taskId)) {
        this.rollbackPoints.set(taskId, []);
      }
      
      const taskRollbacks = this.rollbackPoints.get(taskId)!;
      taskRollbacks.push(rollbackPoint);
      
      // Manter apenas os últimos 10 pontos de rollback por task
      if (taskRollbacks.length > 10) {
        taskRollbacks.splice(0, taskRollbacks.length - 10);
      }
      
      return rollbackPoint;
      
    } catch (error) {
      throw new Error(`Erro ao criar ponto de rollback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executa rollback para um ponto específico
   */
  async executeRollback(taskId: string, rollbackId: string, projectPath: string): Promise<boolean> {
    try {
      const taskRollbacks = this.rollbackPoints.get(taskId);
      if (!taskRollbacks) {
        throw new Error('Nenhum ponto de rollback encontrado para esta task');
      }
      
      const rollbackPoint = taskRollbacks.find(rp => rp.id === rollbackId);
      if (!rollbackPoint) {
        throw new Error('Ponto de rollback não encontrado');
      }
      
      // Verificar integridade dos checksums
      const currentFiles = await this.fileSystem.getProjectFiles(projectPath);
      const integrityCheck = await this.verifyIntegrity(rollbackPoint.checksums, currentFiles);
      
      if (!integrityCheck.valid) {
        console.warn('Aviso: Integridade dos arquivos comprometida:', integrityCheck.issues);
      }
      
      // Restaurar arquivos (implementação simplificada)
      // Em um sistema real, isso seria mais complexo
      console.log(`Rollback executado para task ${taskId}, ponto ${rollbackId}`);
      
      return true;
      
    } catch (error) {
      console.error('Erro ao executar rollback:', error);
      return false;
    }
  }

  /**
   * Lista pontos de rollback disponíveis
   */
  getRollbackPoints(taskId: string): RollbackPoint[] {
    return this.rollbackPoints.get(taskId) || [];
  }

  /**
   * Obtém histórico de auditorias de segurança
   */
  getSecurityHistory(taskId: string): SecurityAudit[] {
    return this.securityHistory.get(taskId) || [];
  }

  /**
   * Verifica se uma operação é segura
   */
  async isOperationSafe(operation: SecurityOperation): Promise<SecurityResult> {
    try {
      switch (operation.type) {
        case 'file_access':
          return this.checkFileAccessSafety(operation.path!);
        
        case 'command_execution':
          return this.checkCommandSafety(operation.command!);
        
        case 'network_access':
          return this.checkNetworkSafety(operation.content!);
        
        default:
          return { safe: false, reason: 'Tipo de operação não reconhecido', severity: 'high' };
      }
    } catch (error) {
      return { 
        safe: false, 
        reason: `Erro na verificação de segurança: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      };
    }
  }

  /**
   * Auditoria de acesso a arquivos
   */
  private async auditFileAccess(projectPath: string, microTasks: any[]): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];
    
    try {
      // Verificar se todos os caminhos estão dentro do projeto
      for (const task of microTasks) {
        if (task.path) {
          const fullPath = path.resolve(projectPath, task.path);
          const projectRoot = path.resolve(projectPath);
          
          if (!fullPath.startsWith(projectRoot)) {
            checks.push({
              type: 'path_traversal',
              severity: 'critical',
              description: `Tentativa de acesso fora do projeto: ${task.path}`,
              allowed: false,
              details: { path: task.path, fullPath, projectRoot }
            });
          }
          
          // Verificar extensão do arquivo
          const ext = path.extname(task.path);
          if (!this.allowedExtensions.includes(ext)) {
            checks.push({
              type: 'file_access',
              severity: 'medium',
              description: `Extensão de arquivo não permitida: ${ext}`,
              allowed: false,
              details: { path: task.path, extension: ext }
            });
          }
        }
      }
      
    } catch (error) {
      checks.push({
        type: 'file_access',
        severity: 'high',
        description: 'Erro na auditoria de acesso a arquivos',
        allowed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
    
    return checks;
  }

  /**
   * Auditoria de execução de comandos
   */
  private async auditCommandExecution(microTasks: any[]): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];
    
    try {
      for (const task of microTasks) {
        if (task.type === 'package_install' || task.type === 'build_run' || task.type === 'test_run') {
          const command = task.newSnippet || task.command;
          
          if (command) {
            // Verificar se comando é permitido
            const commandParts = command.split(' ');
            const baseCommand = commandParts[0];
            
            if (!this.allowedCommands.includes(baseCommand)) {
              checks.push({
                type: 'command_execution',
                severity: 'high',
                description: `Comando não permitido: ${baseCommand}`,
                allowed: false,
                details: { command, baseCommand }
              });
            }
            
            // Verificar padrões perigosos
            for (const pattern of this.dangerousPatterns.commandInjection) {
              if (pattern.test(command)) {
                checks.push({
                  type: 'command_execution',
                  severity: 'critical',
                  description: `Possível injeção de comando detectada: ${command}`,
                  allowed: false,
                  details: { command, pattern: pattern.toString() }
                });
              }
            }
          }
        }
      }
      
    } catch (error) {
      checks.push({
        type: 'command_execution',
        severity: 'high',
        description: 'Erro na auditoria de execução de comandos',
        allowed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
    
    return checks;
  }

  /**
   * Auditoria de acesso à rede
   */
  private async auditNetworkAccess(projectPath: string): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];
    
    try {
      const files = await this.fileSystem.getProjectFiles(projectPath);
      
      for (const [filePath, content] of Object.entries(files)) {
        // Verificar padrões de acesso à rede
        for (const pattern of this.dangerousPatterns.networkAccess) {
          if (pattern.test(content)) {
            checks.push({
              type: 'network_access',
              severity: 'medium',
              description: `Acesso à rede detectado em ${filePath}`,
              allowed: false,
              details: { filePath, pattern: pattern.toString() }
            });
          }
        }
      }
      
    } catch (error) {
      checks.push({
        type: 'network_access',
        severity: 'medium',
        description: 'Erro na auditoria de acesso à rede',
        allowed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
    
    return checks;
  }

  /**
   * Auditoria de injeção de código
   */
  private async auditCodeInjection(projectPath: string): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];
    
    try {
      const files = await this.fileSystem.getProjectFiles(projectPath);
      
      for (const [filePath, content] of Object.entries(files)) {
        // Verificar padrões de injeção de código
        for (const pattern of this.dangerousPatterns.codeInjection) {
          if (pattern.test(content)) {
            checks.push({
              type: 'code_injection',
              severity: 'high',
              description: `Possível injeção de código detectada em ${filePath}`,
              allowed: false,
              details: { filePath, pattern: pattern.toString() }
            });
          }
        }
      }
      
    } catch (error) {
      checks.push({
        type: 'code_injection',
        severity: 'high',
        description: 'Erro na auditoria de injeção de código',
        allowed: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
    
    return checks;
  }

  /**
   * Calcula risco geral baseado nas verificações
   */
  private calculateOverallRisk(checks: SecurityCheck[]): 'low' | 'medium' | 'high' | 'critical' {
    if (checks.length === 0) return 'low';
    
    const severityScores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    
    const maxScore = Math.max(...checks.map(check => severityScores[check.severity]));
    
    if (maxScore >= 4) return 'critical';
    if (maxScore >= 3) return 'high';
    if (maxScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Gera recomendações baseadas nas verificações
   */
  private generateRecommendations(checks: SecurityCheck[]): string[] {
    const recommendations: string[] = [];
    
    const criticalChecks = checks.filter(c => c.severity === 'critical');
    const highChecks = checks.filter(c => c.severity === 'high');
    
    if (criticalChecks.length > 0) {
      recommendations.push('CRÍTICO: Corrigir imediatamente todas as verificações críticas');
    }
    
    if (highChecks.length > 0) {
      recommendations.push('ALTO RISCO: Revisar e corrigir verificações de alto risco');
    }
    
    const pathTraversalChecks = checks.filter(c => c.type === 'path_traversal');
    if (pathTraversalChecks.length > 0) {
      recommendations.push('Validar todos os caminhos de arquivo para prevenir path traversal');
    }
    
    const commandChecks = checks.filter(c => c.type === 'command_execution');
    if (commandChecks.length > 0) {
      recommendations.push('Revisar todos os comandos executados e usar lista de comandos permitidos');
    }
    
    const injectionChecks = checks.filter(c => c.type === 'code_injection');
    if (injectionChecks.length > 0) {
      recommendations.push('Remover ou sanitizar código que pode ser executado dinamicamente');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Nenhuma recomendação específica - sistema seguro');
    }
    
    return recommendations;
  }

  /**
   * Verifica segurança de acesso a arquivo
   */
  private checkFileAccessSafety(filePath: string): SecurityResult {
    // Verificar path traversal
    for (const pattern of this.dangerousPatterns.pathTraversal) {
      if (pattern.test(filePath)) {
      return {
        safe: false,
        reason: 'Path traversal detectado',
        severity: 'critical',
        riskLevel: 'critical',
        recommendations: ['Path traversal detectado']
      };
      }
    }
    
    // Verificar extensão
    const ext = path.extname(filePath);
    if (!this.allowedExtensions.includes(ext)) {
      return {
        safe: false,
        reason: `Extensão não permitida: ${ext}`,
        severity: 'medium',
        riskLevel: 'medium',
        recommendations: [`Extensão não permitida: ${ext}`]
      };
    }
    
    return { safe: true, riskLevel: 'low', recommendations: [] };
  }

  /**
   * Verifica segurança de comando
   */
  private checkCommandSafety(command: string): SecurityResult {
    const commandParts = command.split(' ');
    const baseCommand = commandParts[0];
    
    if (!this.allowedCommands.includes(baseCommand)) {
      return {
        safe: false,
        reason: `Comando não permitido: ${baseCommand}`,
        severity: 'high',
        riskLevel: 'high',
        recommendations: [`Comando não permitido: ${baseCommand}`]
      };
    }
    
    // Verificar injeção de comando
    for (const pattern of this.dangerousPatterns.commandInjection) {
      if (pattern.test(command)) {
        return {
          safe: false,
          reason: 'Possível injeção de comando',
          severity: 'critical',
          riskLevel: 'critical',
          recommendations: ['Possível injeção de comando']
        };
      }
    }
    
    return { safe: true, riskLevel: 'low', recommendations: [] };
  }

  /**
   * Verifica segurança de acesso à rede
   */
  private checkNetworkSafety(content: string): { safe: boolean; reason?: string; severity?: string } {
    for (const pattern of this.dangerousPatterns.networkAccess) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: 'Acesso à rede detectado',
          severity: 'medium'
        };
      }
    }
    
    return { safe: true };
  }

  /**
   * Verifica integridade dos arquivos
   */
  private async verifyIntegrity(expectedChecksums: Record<string, string>, currentFiles: Record<string, string>): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    for (const [filePath, expectedChecksum] of Object.entries(expectedChecksums)) {
      const currentContent = currentFiles[filePath];
      
      if (!currentContent) {
        issues.push(`Arquivo removido: ${filePath}`);
        continue;
      }
      
      const currentChecksum = this.calculateChecksum(currentContent);
      if (currentChecksum !== expectedChecksum) {
        issues.push(`Arquivo modificado: ${filePath}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Armazena auditoria de segurança
   */
  private storeSecurityAudit(audit: SecurityAudit): void {
    if (!this.securityHistory.has(audit.taskId)) {
      this.securityHistory.set(audit.taskId, []);
    }
    
    const taskHistory = this.securityHistory.get(audit.taskId)!;
    taskHistory.push(audit);
    
    // Manter apenas as últimas 20 auditorias por task
    if (taskHistory.length > 20) {
      taskHistory.splice(0, taskHistory.length - 20);
    }
  }

  /**
   * Calcula checksum de conteúdo
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Gera ID único para rollback
   */
  private generateRollbackId(): string {
    return `rb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida estrutura do projeto
   */
  async validateProjectStructure(projectPath: string): Promise<ProjectValidation> {
    const issues: string[] = [];
    
    try {
      const files = await this.fileSystem.listFiles(projectPath);
      
      // Verificar se há node_modules (não deve ser versionado)
      const hasNodeModules = files.some(file => file.includes('node_modules'));
      if (hasNodeModules) {
        issues.push('node_modules não deve estar no controle de versão');
      }
      
      // Verificar se há arquivos de configuração essenciais
      const hasPackageJson = files.some(file => file.endsWith('package.json'));
      if (!hasPackageJson) {
        issues.push('package.json não encontrado');
      }
      
      // Verificar estrutura de diretórios
      const hasSrcDir = files.some(file => file.includes('/src/') || file.startsWith('src/'));
      if (!hasSrcDir) {
        issues.push('Diretório src não encontrado');
      }
      
    } catch (error) {
      issues.push(`Erro ao ler diretório: ${error}`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Escaneia vulnerabilidades no projeto
   */
  async scanForVulnerabilities(projectPath: string): Promise<string[]> {
    const vulnerabilities: string[] = [];
    
    try {
      const files = await this.getAllFiles(projectPath);
      
      for (const file of files) {
        const content = await this.fileSystem.readFile(file);
        
        // Verificar vulnerabilidades conhecidas
        if (content.includes('eval(')) {
          vulnerabilities.push(`Uso de eval() detectado em ${file}`);
        }
        
        if (content.includes('require(') && content.includes('child_process')) {
          vulnerabilities.push(`Execução de processos detectada em ${file}`);
        }
        
        if (content.includes('fs.writeFile') && content.includes('req.')) {
          vulnerabilities.push(`Escrita de arquivo com dados do usuário em ${file}`);
        }
        
        // Verificar dependências vulneráveis
        if (file.endsWith('package.json')) {
          try {
            const packageJson = JSON.parse(content);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            // Lista de pacotes conhecidamente vulneráveis (exemplo)
            const vulnerablePackages = ['vulnerable-package', 'unsafe-package'];
            
            for (const [name, version] of Object.entries(dependencies)) {
              if (vulnerablePackages.includes(name)) {
                vulnerabilities.push(`Dependência vulnerável detectada: ${name}@${version}`);
              }
            }
          } catch (error) {
            vulnerabilities.push(`Erro ao analisar package.json: ${error}`);
          }
        }
      }
      
    } catch (error) {
      vulnerabilities.push(`Erro ao escanear projeto: ${error}`);
    }
    
    return vulnerabilities;
  }

  /**
   * Obtém todos os arquivos do projeto recursivamente
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await this.fileSystem.listFiles(dir);
      
      for (const entry of entries) {
        if (!entry.includes('node_modules') && !entry.startsWith('.')) {
          files.push(entry);
        }
      }
    } catch (error) {
      // Ignorar erros de leitura
    }
    
    return files;
  }

  /**
   * Gera relatório de segurança completo
   */
  async generateSecurityReport(taskId: string): Promise<SecurityReport> {
    const auditHistory = this.getSecurityHistory(taskId);
    const rollbackPoints = this.getRollbackPoints(taskId);
    
    const report: SecurityReport = {
      taskId,
      auditHistory,
      rollbackPoints,
      recommendations: this.generateRecommendations(auditHistory.flatMap(audit => audit.checks)),
      timestamp: new Date().toISOString()
    };

    return report;
  }
}

export interface ProjectValidation {
  valid: boolean;
  issues: string[];
  timestamp: string;
}

export interface SecurityReport {
  taskId: string;
  auditHistory: SecurityAudit[];
  rollbackPoints: RollbackPoint[];
  recommendations: string[];
  timestamp: string;
}
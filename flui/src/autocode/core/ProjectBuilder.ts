import { injectable } from 'inversify';
import { IProjectBuilder, BuildResult, TestResult } from '../types/ITask';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@injectable()
export class ProjectBuilder implements IProjectBuilder {
  
  async build(projectPath: string): Promise<BuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Verificar se package.json existe
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await this.fileExists(packageJsonPath)) {
        return {
          success: false,
          output: 'package.json não encontrado',
          errors: ['package.json não encontrado'],
          warnings: [],
          duration: Date.now() - startTime
        };
      }
      
      // Ler package.json para identificar tipo de projeto
      const packageJson = JSON.parse(await this.readFile(packageJsonPath));
      const buildScript = packageJson.scripts?.build || 'build';
      
      // Executar comando de build
      const { stdout, stderr } = await execAsync(buildScript, {
        cwd: projectPath,
        timeout: 60000 // 60 segundos
      });
      
      const output = stdout + stderr;
      const duration = Date.now() - startTime;
      
      // Analisar output para identificar erros e warnings
      this.analyzeBuildOutput(output, errors, warnings);
      
      return {
        success: errors.length === 0,
        output,
        errors,
        warnings,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        output: errorMessage,
        errors: [errorMessage],
        warnings,
        duration
      };
    }
  }

  async test(projectPath: string): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      // Verificar se package.json existe
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await this.fileExists(packageJsonPath)) {
        return {
          success: false,
          passed: 0,
          failed: 0,
          output: 'package.json não encontrado',
          errors: ['package.json não encontrado'],
          duration: Date.now() - startTime
        };
      }
      
      // Ler package.json para identificar scripts de teste
      const packageJson = JSON.parse(await this.readFile(packageJsonPath));
      const testScript = packageJson.scripts?.test || 'test';
      
      // Executar testes
      const { stdout, stderr } = await execAsync(testScript, {
        cwd: projectPath,
        timeout: 120000 // 2 minutos
      });
      
      const output = stdout + stderr;
      const duration = Date.now() - startTime;
      
      // Analisar output para contar testes
      const { passed, failed } = this.analyzeTestOutput(output);
      
      return {
        success: failed === 0,
        passed,
        failed,
        output,
        errors: failed > 0 ? ['Alguns testes falharam'] : [],
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        passed: 0,
        failed: 1,
        output: errorMessage,
        errors: [errorMessage],
        duration
      };
    }
  }

  async installDependencies(projectPath: string, dependencies: string[]): Promise<void> {
    try {
      // Verificar se package.json existe
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await this.fileExists(packageJsonPath)) {
        throw new Error('package.json não encontrado');
      }
      
      // Instalar dependências
      const installCommand = `npm install ${dependencies.join(' ')}`;
      await execAsync(installCommand, {
        cwd: projectPath,
        timeout: 300000 // 5 minutos
      });
      
    } catch (error) {
      throw new Error(`Erro ao instalar dependências: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analisa output de build para identificar erros e warnings
   */
  private analyzeBuildOutput(output: string, errors: string[], warnings: string[]): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Identificar erros
      if (lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('cannot')) {
        if (!lowerLine.includes('warning')) {
          errors.push(line.trim());
        }
      }
      
      // Identificar warnings
      if (lowerLine.includes('warning') || lowerLine.includes('deprecated')) {
        warnings.push(line.trim());
      }
    }
  }

  /**
   * Analisa output de testes para contar resultados
   */
  private analyzeTestOutput(output: string): { passed: number; failed: number } {
    let passed = 0;
    let failed = 0;
    
    const lines = output.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Procurar por padrões de teste
      if (lowerLine.includes('passing') || lowerLine.includes('passed')) {
        const match = line.match(/(\d+)\s+(passing|passed)/);
        if (match) {
          passed = parseInt(match[1]);
        }
      }
      
      if (lowerLine.includes('failing') || lowerLine.includes('failed')) {
        const match = line.match(/(\d+)\s+(failing|failed)/);
        if (match) {
          failed = parseInt(match[1]);
        }
      }
    }
    
    return { passed, failed };
  }

  /**
   * Verifica se arquivo existe
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lê arquivo
   */
  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs');
    return await fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * Executa comando curl para testar endpoint
   */
  async testEndpoint(url: string): Promise<{
    success: boolean;
    statusCode: number;
    response: string;
    error?: string;
  }> {
    try {
      const { stdout, stderr } = await execAsync(`curl -s -w "%{http_code}" "${url}"`, {
        timeout: 10000 // 10 segundos
      });
      
      const lines = stdout.split('\n');
      const statusCode = parseInt(lines[lines.length - 1]) || 0;
      const response = lines.slice(0, -1).join('\n');
      
      return {
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        response,
        error: stderr || undefined
      };
      
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Inicia servidor de desenvolvimento
   */
  async startDevServer(projectPath: string, port: number = 3000): Promise<{
    success: boolean;
    processId?: number;
    error?: string;
  }> {
    try {
      // Verificar se package.json existe
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await this.fileExists(packageJsonPath)) {
        return {
          success: false,
          error: 'package.json não encontrado'
        };
      }
      
      // Ler package.json para identificar script de dev
      const packageJson = JSON.parse(await this.readFile(packageJsonPath));
      const devScript = packageJson.scripts?.dev || packageJson.scripts?.start || 'npm start';
      
      // Executar servidor em background
      const child = execAsync(`${devScript} --port ${port}`, {
        cwd: projectPath
      });
      
      // Aguardar um pouco para o servidor iniciar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        processId: 0 // PID não disponível com execAsync
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Para servidor de desenvolvimento
   */
  async stopDevServer(processId: number): Promise<void> {
    try {
      await execAsync(`kill ${processId}`);
    } catch (error) {
      console.warn(`Erro ao parar servidor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
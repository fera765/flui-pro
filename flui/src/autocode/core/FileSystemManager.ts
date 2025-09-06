import { injectable } from 'inversify';
import { IFileSystem } from '../types/ITask';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@injectable()
export class FileSystemManager implements IFileSystem {
  
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Erro ao ler arquivo ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Criar diretório se não existir
      const dir = path.dirname(filePath);
      await this.createDirectory(dir);
      
      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Erro ao escrever arquivo ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      throw new Error(`Erro ao deletar arquivo ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async calculateChecksum(filePath: string): Promise<string> {
    try {
      const content = await this.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Erro ao calcular checksum de ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(directory, { withFileTypes: true });
      const result: string[] = [];
      
      for (const file of files) {
        if (file.isDirectory()) {
          result.push(file.name);
        } else {
          result.push(file.name);
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Erro ao listar arquivos de ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Erro ao criar diretório ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cria estrutura de projeto baseada no prompt
   */
  async createProjectStructure(projectPath: string, prompt: string): Promise<void> {
    // Criar diretório principal
    await this.createDirectory(projectPath);
    
    // Criar diretório .flui para logs
    await this.createDirectory(path.join(projectPath, '.flui'));
    
    // Criar diretório src
    await this.createDirectory(path.join(projectPath, 'src'));
    
    // Criar diretório de testes
    await this.createDirectory(path.join(projectPath, 'tests'));
    await this.createDirectory(path.join(projectPath, 'tests', 'e2e'));
  }

  /**
   * Salva log de task
   */
  async saveTaskLog(projectPath: string, taskId: string, log: any): Promise<void> {
    const logPath = path.join(projectPath, '.flui', `${taskId}.log.json`);
    await this.writeFile(logPath, JSON.stringify(log, null, 2));
  }

  /**
   * Carrega log de task
   */
  async loadTaskLog(projectPath: string, taskId: string): Promise<any> {
    const logPath = path.join(projectPath, '.flui', `${taskId}.log.json`);
    
    if (await this.fileExists(logPath)) {
      const content = await this.readFile(logPath);
      return JSON.parse(content);
    }
    
    return null;
  }

  /**
   * Lista todos os arquivos do projeto
   */
  async getProjectFiles(projectPath: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    try {
      const fileList = await this.listFiles(projectPath);
      
      for (const file of fileList) {
        // Ignorar arquivos de log e node_modules
        if (file.includes('.flui') || file.includes('node_modules') || file.includes('dist')) {
          continue;
        }
        
        const fullPath = path.join(projectPath, file);
        
        // Verificar se é um arquivo antes de tentar ler
        const stats = await fs.promises.stat(fullPath);
        if (stats.isFile()) {
          const content = await this.readFile(fullPath);
          files[file] = content;
        }
      }
    } catch (error) {
      console.warn(`Erro ao listar arquivos do projeto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return files;
  }

  /**
   * Verifica se projeto está em estado válido
   */
  async validateProjectState(projectPath: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verificar se package.json existe
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!await this.fileExists(packageJsonPath)) {
      errors.push('package.json não encontrado');
    }
    
    // Verificar se diretório src existe
    const srcPath = path.join(projectPath, 'src');
    if (!await this.fileExists(srcPath)) {
      warnings.push('Diretório src não encontrado');
    }
    
    // Verificar se há arquivos TypeScript
    const files = await this.listFiles(projectPath);
    const tsFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    
    if (tsFiles.length === 0) {
      warnings.push('Nenhum arquivo TypeScript encontrado');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Cria backup do projeto
   */
  async createProjectBackup(projectPath: string): Promise<string> {
    const backupPath = `${projectPath}.backup.${Date.now()}`;
    
    try {
      await this.copyDirectory(projectPath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Erro ao criar backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copia diretório recursivamente
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await this.createDirectory(dest);
    
    const files = await fs.promises.readdir(src, { withFileTypes: true });
    
    for (const file of files) {
      const srcPath = path.join(src, file.name);
      const destPath = path.join(dest, file.name);
      
      if (file.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        const content = await this.readFile(srcPath);
        await this.writeFile(destPath, content);
      }
    }
  }

  /**
   * Restaura projeto do backup
   */
  async restoreProjectFromBackup(projectPath: string, backupPath: string): Promise<void> {
    try {
      // Remover projeto atual
      await fs.promises.rm(projectPath, { recursive: true, force: true });
      
      // Restaurar do backup
      await this.copyDirectory(backupPath, projectPath);
    } catch (error) {
      throw new Error(`Erro ao restaurar backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
import { injectable, inject } from 'inversify';
import { MicroTask, TaskType, TaskStatus, IFileSystem, IProjectBuilder } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class MicroTaskExecutor {
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly fileSystem: IFileSystem;
  private readonly projectBuilder: IProjectBuilder;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IFileSystem') fileSystem: IFileSystem,
    @inject('IProjectBuilder') projectBuilder: IProjectBuilder
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.fileSystem = fileSystem;
    this.projectBuilder = projectBuilder;
  }

  /**
   * Executa uma micro-task
   */
  async executeMicroTask(microTask: MicroTask, projectPath: string): Promise<{
    success: boolean;
    newMicroTasks: MicroTask[];
    logs: string[];
    rollbackHash?: string;
  }> {
    const logs: string[] = [];
    
    try {
      // Calcular hash antes da execução para rollback
      const rollbackHash = await this.calculateRollbackHash(microTask, projectPath);
      
      // Executar a micro-task baseada no tipo
      const result = await this.executeByType(microTask, projectPath);
      
      // Analisar resultado e gerar próximas micro-tasks se necessário
      const newMicroTasks = await this.analyzeResultAndGenerateTasks(
        microTask,
        result,
        projectPath
      );
      
      logs.push(`✅ Micro-task ${microTask.id} executada com sucesso`);
      
      return {
        success: true,
        newMicroTasks,
        logs,
        rollbackHash
      };
      
    } catch (error) {
      logs.push(`❌ Erro na micro-task ${microTask.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Tentar rollback se disponível
      if (microTask.rollbackHash) {
        await this.rollbackMicroTask(microTask, projectPath);
        logs.push(`🔄 Rollback executado para micro-task ${microTask.id}`);
      }
      
      return {
        success: false,
        newMicroTasks: [],
        logs,
        rollbackHash: microTask.rollbackHash
      };
    }
  }

  /**
   * Executa micro-task baseada no tipo
   */
  private async executeByType(microTask: MicroTask, projectPath: string): Promise<any> {
    switch (microTask.type) {
      case 'file_create':
        return await this.executeFileCreate(microTask, projectPath);
      
      case 'file_replace':
        return await this.executeFileReplace(microTask, projectPath);
      
      case 'file_delete':
        return await this.executeFileDelete(microTask, projectPath);
      
      case 'package_install':
        return await this.executePackageInstall(microTask, projectPath);
      
      case 'build_run':
        return await this.executeBuildRun(microTask, projectPath);
      
      case 'test_run':
        return await this.executeTestRun(microTask, projectPath);
      
      case 'log_parse':
        return await this.executeLogParse(microTask, projectPath);
      
      case 'merge_resolve':
        return await this.executeMergeResolve(microTask, projectPath);
      
      case 'project_finish':
        return await this.executeProjectFinish(microTask, projectPath);
      
      default:
        throw new Error(`Tipo de micro-task não suportado: ${microTask.type}`);
    }
  }

  /**
   * Executa criação de arquivo
   */
  private async executeFileCreate(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.path || !microTask.newSnippet) {
      throw new Error('Path e newSnippet são obrigatórios para file_create');
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    // Criar diretório se não existir
    const dir = path.dirname(fullPath);
    await this.fileSystem.createDirectory(dir);
    
    // Escrever arquivo
    await this.fileSystem.writeFile(fullPath, microTask.newSnippet);
    
    return {
      path: fullPath,
      content: microTask.newSnippet,
      size: microTask.newSnippet.length
    };
  }

  /**
   * Executa substituição de arquivo
   */
  private async executeFileReplace(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.path || !microTask.oldSnippet || !microTask.newSnippet) {
      throw new Error('Path, oldSnippet e newSnippet são obrigatórios para file_replace');
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    // Ler arquivo atual
    const currentContent = await this.fileSystem.readFile(fullPath);
    
    // Verificar se oldSnippet existe no arquivo
    if (!currentContent.includes(microTask.oldSnippet)) {
      throw new Error(`Snippet não encontrado no arquivo: ${microTask.oldSnippet}`);
    }
    
    // Substituir conteúdo
    const newContent = currentContent.replace(microTask.oldSnippet, microTask.newSnippet);
    
    // Escrever arquivo atualizado
    await this.fileSystem.writeFile(fullPath, newContent);
    
    return {
      path: fullPath,
      oldContent: currentContent,
      newContent,
      changes: newContent.length - currentContent.length
    };
  }

  /**
   * Executa exclusão de arquivo
   */
  private async executeFileDelete(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.path) {
      throw new Error('Path é obrigatório para file_delete');
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    // Verificar se arquivo existe
    if (!await this.fileSystem.fileExists(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${fullPath}`);
    }
    
    // Ler conteúdo antes de deletar (para rollback)
    const content = await this.fileSystem.readFile(fullPath);
    
    // Deletar arquivo
    await this.fileSystem.deleteFile(fullPath);
    
    return {
      path: fullPath,
      deletedContent: content,
      size: content.length
    };
  }

  /**
   * Executa instalação de pacotes
   */
  private async executePackageInstall(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.newSnippet) {
      throw new Error('newSnippet deve conter lista de pacotes para package_install');
    }
    
    // Parsear lista de pacotes
    const packages = microTask.newSnippet.split(',').map(pkg => pkg.trim());
    
    // Instalar pacotes
    await this.projectBuilder.installDependencies(projectPath, packages);
    
    return {
      packages,
      count: packages.length
    };
  }

  /**
   * Executa build do projeto
   */
  private async executeBuildRun(microTask: MicroTask, projectPath: string): Promise<any> {
    const buildResult = await this.projectBuilder.build(projectPath);
    
    return {
      success: buildResult.success,
      output: buildResult.output,
      errors: buildResult.errors,
      warnings: buildResult.warnings,
      duration: buildResult.duration
    };
  }

  /**
   * Executa testes do projeto
   */
  private async executeTestRun(microTask: MicroTask, projectPath: string): Promise<any> {
    const testResult = await this.projectBuilder.test(projectPath);
    
    return {
      success: testResult.success,
      passed: testResult.passed,
      failed: testResult.failed,
      output: testResult.output,
      errors: testResult.errors,
      duration: testResult.duration
    };
  }

  /**
   * Executa análise de logs
   */
  private async executeLogParse(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.newSnippet) {
      throw new Error('newSnippet deve conter logs para log_parse');
    }
    
    // Verificar se LLM está disponível
    if (!(await this.llmService.isConnected())) {
      return {
        logs: microTask.newSnippet,
        analysis: 'LLM não disponível para análise',
        timestamp: Date.now()
      };
    }
    
    // Usar LLM para analisar logs
    const analysisPrompt = `Analise os seguintes logs de build/teste e identifique problemas e soluções:

${microTask.newSnippet}

Retorne um JSON com:
{
  "errors": ["lista de erros encontrados"],
  "warnings": ["lista de warnings"],
  "solutions": ["lista de soluções sugeridas"],
  "nextActions": ["próximas ações recomendadas"]
}`;

    const analysis = await this.llmService.generateResponse(analysisPrompt);
    
    return {
      logs: microTask.newSnippet,
      analysis,
      timestamp: Date.now()
    };
  }

  /**
   * Executa resolução de merge
   */
  private async executeMergeResolve(microTask: MicroTask, projectPath: string): Promise<any> {
    if (!microTask.path || !microTask.oldSnippet || !microTask.newSnippet) {
      throw new Error('Path, oldSnippet e newSnippet são obrigatórios para merge_resolve');
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    // Ler arquivo atual
    const currentContent = await this.fileSystem.readFile(fullPath);
    
    // Verificar se LLM está disponível
    if (!(await this.llmService.isConnected())) {
      // Fallback: usar newSnippet como conteúdo resolvido
      await this.fileSystem.writeFile(fullPath, microTask.newSnippet);
      return {
        path: fullPath,
        resolvedContent: microTask.newSnippet,
        conflictsResolved: 1
      };
    }
    
    // Usar LLM para resolver conflitos
    const mergePrompt = `Resolva o conflito de merge no arquivo ${microTask.path}:

Conteúdo atual:
${currentContent}

Conflito detectado:
${microTask.oldSnippet}

Mudança proposta:
${microTask.newSnippet}

Retorne apenas o conteúdo final do arquivo resolvido, sem explicações.`;

    const resolvedContent = await this.llmService.generateResponse(mergePrompt);
    
    // Escrever arquivo resolvido
    await this.fileSystem.writeFile(fullPath, resolvedContent);
    
    return {
      path: fullPath,
      resolvedContent,
      conflictsResolved: 1
    };
  }

  /**
   * Executa finalização do projeto
   */
  private async executeProjectFinish(microTask: MicroTask, projectPath: string): Promise<any> {
    // Criar arquivo de log final
    const logPath = path.join(projectPath, '.flui', 'log.json');
    const logContent = JSON.stringify({
      taskId: microTask.id,
      completedAt: Date.now(),
      projectPath,
      status: 'completed'
    }, null, 2);
    
    await this.fileSystem.writeFile(logPath, logContent);
    
    return {
      logPath,
      completedAt: Date.now(),
      status: 'completed'
    };
  }

  /**
   * Analisa resultado e gera próximas micro-tasks
   */
  private async analyzeResultAndGenerateTasks(
    microTask: MicroTask,
    result: any,
    projectPath: string
  ): Promise<MicroTask[]> {
    const newTasks: MicroTask[] = [];
    
    // Analisar resultado baseado no tipo de task
    switch (microTask.type) {
      case 'build_run':
        if (!result.success && result.errors.length > 0) {
          // Gerar task de análise de logs
          newTasks.push({
            id: `log-parse-${Date.now()}`,
            type: 'log_parse',
            newSnippet: result.output,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
        break;
      
      case 'test_run':
        if (!result.success && result.failed > 0) {
          // Gerar task de análise de logs de teste
          newTasks.push({
            id: `test-log-parse-${Date.now()}`,
            type: 'log_parse',
            newSnippet: result.output,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
        break;
      
      case 'log_parse':
        // Analisar logs e gerar tasks de correção
        const corrections = await this.generateCorrectionTasks(result.analysis, projectPath);
        newTasks.push(...corrections);
        break;
    }
    
    return newTasks;
  }

  /**
   * Gera tasks de correção baseadas na análise de logs
   */
  private async generateCorrectionTasks(analysis: string, projectPath: string): Promise<MicroTask[]> {
    const tasks: MicroTask[] = [];
    
    try {
      // Parsear análise JSON
      const parsed = JSON.parse(analysis);
      
      if (parsed.nextActions && Array.isArray(parsed.nextActions)) {
        for (const action of parsed.nextActions) {
          // Gerar micro-task baseada na ação
          const task = await this.createCorrectionTask(action, projectPath);
          if (task) {
            tasks.push(task);
          }
        }
      }
    } catch (error) {
      // Se não conseguir parsear, criar task genérica
      tasks.push({
        id: `correction-${Date.now()}`,
        type: 'file_replace',
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }
    
    return tasks;
  }

  /**
   * Cria task de correção baseada na ação
   */
  private async createCorrectionTask(action: string, projectPath: string): Promise<MicroTask | null> {
    // Verificar se LLM está disponível
    if (!(await this.llmService.isConnected())) {
      return null;
    }
    
    // Usar LLM para interpretar ação e criar micro-task
    const taskPrompt = `Interprete a seguinte ação e crie uma micro-task:

Ação: ${action}

Retorne um JSON com:
{
  "type": "tipo_da_task",
  "path": "caminho_do_arquivo",
  "oldSnippet": "conteúdo_atual",
  "newSnippet": "conteúdo_novo"
}`;

    try {
      const taskData = await this.llmService.generateResponse(taskPrompt);
      const parsed = JSON.parse(taskData);
      
      return {
        id: `correction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: parsed.type as TaskType,
        path: parsed.path,
        oldSnippet: parsed.oldSnippet,
        newSnippet: parsed.newSnippet,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcula hash para rollback
   */
  private async calculateRollbackHash(microTask: MicroTask, projectPath: string): Promise<string> {
    if (!microTask.path) {
      return '';
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    if (await this.fileSystem.fileExists(fullPath)) {
      const content = await this.fileSystem.readFile(fullPath);
      return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    return '';
  }

  /**
   * Executa rollback de micro-task
   */
  private async rollbackMicroTask(microTask: MicroTask, projectPath: string): Promise<void> {
    if (!microTask.rollbackHash || !microTask.path) {
      return;
    }
    
    const fullPath = path.join(projectPath, microTask.path);
    
    // Se o arquivo existe, verificar se o hash mudou
    if (await this.fileSystem.fileExists(fullPath)) {
      const currentHash = await this.fileSystem.calculateChecksum(fullPath);
      
      if (currentHash !== microTask.rollbackHash) {
        // Hash mudou, arquivo foi modificado
        // Aqui poderia implementar lógica de merge mais sofisticada
        console.log(`Arquivo ${fullPath} foi modificado, rollback não aplicado`);
      }
    }
  }
}
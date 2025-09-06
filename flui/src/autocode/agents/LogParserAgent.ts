import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';

@injectable()
export class LogParserAgent implements IAgent {
  public readonly name = 'LogParserAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly fileSystem: IFileSystem;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IFileSystem') fileSystem: IFileSystem
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.fileSystem = fileSystem;
  }

  getPriority(): number {
    return 7;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se há logs de erro ou warnings
    const hasErrors = projectState.errors && projectState.errors.length > 0;
    const hasWarnings = projectState.warnings && projectState.warnings.length > 0;
    const hasLogs = this.hasLogFiles(projectState.files);
    
    return hasErrors || hasWarnings || hasLogs;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, fileSystem } = context;
    
    try {
      // Coletar todos os logs disponíveis
      const logs = await this.collectAllLogs(task.projectPath, projectState);
      
      if (logs.length === 0) {
        return [];
      }

      // Usar LLM para analisar logs e gerar soluções
      const logPrompt = this.generateLogAnalysisPrompt(task.prompt, logs, projectState);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackLogTasks(logs);
      }

      const logResponse = await llmService.generateResponse(logPrompt);
      const logTasks = this.parseLogResponse(logResponse, task.projectPath);
      
      // Armazenar experiência na memória emocional
      await this.storeLogExperience(task, logs, logTasks, emotionMemory);
      
      return logTasks;
      
    } catch (error) {
      console.error('Erro no LogParserAgent:', error);
      return [];
    }
  }

  private hasLogFiles(files: Record<string, string>): boolean {
    const logFiles = Object.keys(files).filter(file => 
      file.includes('log') ||
      file.includes('error') ||
      file.includes('debug') ||
      file.endsWith('.log')
    );
    
    return logFiles.length > 0;
  }

  private async collectAllLogs(projectPath: string, projectState: any): Promise<Array<{source: string, content: string, type: string, timestamp: number}>> {
    const logs: Array<{source: string, content: string, type: string, timestamp: number}> = [];
    
    // Coletar logs de erros do estado do projeto
    if (projectState.errors && Array.isArray(projectState.errors)) {
      for (const error of projectState.errors) {
        logs.push({
          source: 'project_state',
          content: error,
          type: 'error',
          timestamp: Date.now()
        });
      }
    }
    
    // Coletar warnings do estado do projeto
    if (projectState.warnings && Array.isArray(projectState.warnings)) {
      for (const warning of projectState.warnings) {
        logs.push({
          source: 'project_state',
          content: warning,
          type: 'warning',
          timestamp: Date.now()
        });
      }
    }
    
    // Coletar logs de arquivos
    for (const [path, content] of Object.entries(projectState.files)) {
      if (this.isLogFile(path)) {
        try {
          const logContent = await this.fileSystem.readFile(path);
          logs.push({
            source: path,
            content: logContent,
            type: this.determineLogType(path, logContent),
            timestamp: Date.now()
          });
        } catch (error) {
          console.warn(`Erro ao ler arquivo de log ${path}:`, error);
        }
      }
    }
    
    // Coletar logs de build/test se disponíveis
    if (projectState.buildOutput) {
      logs.push({
        source: 'build_output',
        content: projectState.buildOutput,
        type: 'build',
        timestamp: Date.now()
      });
    }
    
    if (projectState.testResults && projectState.testResults.output) {
      logs.push({
        source: 'test_output',
        content: projectState.testResults.output,
        type: 'test',
        timestamp: Date.now()
      });
    }
    
    return logs;
  }

  private isLogFile(path: string): boolean {
    return path.includes('log') ||
           path.includes('error') ||
           path.includes('debug') ||
           path.endsWith('.log') ||
           path.includes('console') ||
           path.includes('output');
  }

  private determineLogType(path: string, content: string): string {
    if (path.includes('error') || content.toLowerCase().includes('error')) {
      return 'error';
    } else if (path.includes('warning') || content.toLowerCase().includes('warning')) {
      return 'warning';
    } else if (path.includes('debug') || content.toLowerCase().includes('debug')) {
      return 'debug';
    } else if (path.includes('build') || content.toLowerCase().includes('build')) {
      return 'build';
    } else if (path.includes('test') || content.toLowerCase().includes('test')) {
      return 'test';
    } else {
      return 'info';
    }
  }

  private generateLogAnalysisPrompt(prompt: string, logs: Array<{source: string, content: string, type: string, timestamp: number}>, projectState: any): string {
    const logSummary = logs.map(log => 
      `[${log.type.toUpperCase()}] ${log.source}:\n${log.content.substring(0, 500)}${log.content.length > 500 ? '...' : ''}`
    ).join('\n\n');
    
    const errorCount = logs.filter(log => log.type === 'error').length;
    const warningCount = logs.filter(log => log.type === 'warning').length;
    
    return `Analise os logs do projeto e identifique problemas e soluções:

PROMPT ORIGINAL: "${prompt}"

RESUMO DOS LOGS:
- Total de logs: ${logs.length}
- Erros: ${errorCount}
- Warnings: ${warningCount}
- Outros: ${logs.length - errorCount - warningCount}

LOGS DETALHADOS:
${logSummary}

ARQUIVOS DO PROJETO:
${Object.keys(projectState.files).join(', ')}

Analise e identifique:
1. Problemas críticos que impedem o funcionamento
2. Warnings que podem causar problemas futuros
3. Padrões de erro recorrentes
4. Dependências faltando ou incorretas
5. Configurações inadequadas
6. Problemas de performance
7. Problemas de segurança

Para cada problema identificado, gere soluções específicas.

Retorne um JSON com:
{
  "analysis": {
    "criticalIssues": ["lista de problemas críticos"],
    "warnings": ["lista de warnings importantes"],
    "patterns": ["padrões identificados"],
    "recommendations": ["recomendações gerais"]
  },
  "fixes": [
    {
      "type": "file_replace|file_create|package_install",
      "path": "caminho/do/arquivo",
      "oldSnippet": "código_problemático",
      "newSnippet": "código_corrigido",
      "description": "descrição da correção",
      "priority": "high|medium|low"
    }
  ],
  "newFiles": [
    {
      "path": "caminho/novo/arquivo",
      "content": "conteúdo do arquivo",
      "description": "descrição do arquivo"
    }
  ],
  "instructions": "instruções de implementação"
}`;
  }

  private parseLogResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      // Criar tasks de correção
      if (parsed.fixes && Array.isArray(parsed.fixes)) {
        for (const fix of parsed.fixes) {
          const taskType = this.mapFixTypeToTaskType(fix.type);
          
          tasks.push({
            id: `log-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: taskType,
            path: fix.path,
            oldSnippet: fix.oldSnippet || '',
            newSnippet: fix.newSnippet || fix.content || '',
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Criar novos arquivos
      if (parsed.newFiles && Array.isArray(parsed.newFiles)) {
        for (const file of parsed.newFiles) {
          tasks.push({
            id: `log-new-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: file.path,
            newSnippet: file.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao parsear resposta de análise de logs:', error);
      return this.generateFallbackLogTasks([]);
    }
  }

  private mapFixTypeToTaskType(fixType: string): TaskType {
    switch (fixType) {
      case 'file_replace':
        return 'file_replace';
      case 'file_create':
        return 'file_create';
      case 'package_install':
        return 'package_install';
      default:
        return 'file_replace';
    }
  }

  private generateFallbackLogTasks(logs: Array<{source: string, content: string, type: string, timestamp: number}>): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Gerar tasks básicas para erros críticos
    const criticalErrors = logs.filter(log => log.type === 'error');
    
    for (const error of criticalErrors) {
      tasks.push({
        id: `fallback-log-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'log_parse' as TaskType,
        newSnippet: error.content,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }
    
    return tasks;
  }

  private async storeLogExperience(
    task: any, 
    logs: Array<{source: string, content: string, type: string, timestamp: number}>, 
    logTasks: MicroTask[], 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `LogParserAgent executado para task ${task.id}`;
      const outcome = logTasks.length > 0;
      
      const errorCount = logs.filter(log => log.type === 'error').length;
      const warningCount = logs.filter(log => log.type === 'warning').length;
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Análise de ${logs.length} logs: ${errorCount} erros, ${warningCount} warnings, ${logTasks.length} correções geradas`),
        await emotionMemory.createPolicyDelta('log_analysis', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do LogParserAgent:', error);
    }
  }

  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }
}
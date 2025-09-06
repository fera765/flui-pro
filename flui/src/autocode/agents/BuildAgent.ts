import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IProjectBuilder } from '../types/ITask';

@injectable()
export class BuildAgent implements IAgent {
  public readonly name = 'BuildAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly projectBuilder: IProjectBuilder;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IProjectBuilder') projectBuilder: IProjectBuilder
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.projectBuilder = projectBuilder;
  }

  getPriority(): number {
    return 5;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se há arquivos de código mas build não foi executado
    const hasCodeFiles = this.hasCodeFiles(projectState.files);
    const hasBuildConfig = this.hasBuildConfiguration(projectState.files);
    const buildNotStarted = task.buildStatus === 'not_started';
    
    return hasCodeFiles && hasBuildConfig && buildNotStarted;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, projectBuilder } = context;
    
    try {
      // Analisar configuração de build
      const buildConfig = this.analyzeBuildConfiguration(projectState.files);
      
      // Usar LLM para otimizar configuração de build
      const buildPrompt = this.generateBuildPrompt(task.prompt, buildConfig, projectState.files);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackBuildTasks(buildConfig);
      }

      const buildResponse = await llmService.generateResponse(buildPrompt);
      const buildTasks = this.parseBuildResponse(buildResponse, task.projectPath);
      
      // Executar build real
      const buildResult = await projectBuilder.build(task.projectPath);
      
      // Analisar resultado e gerar tasks de correção se necessário
      const correctionTasks = await this.analyzeBuildResult(buildResult, llmService, task.projectPath);
      buildTasks.push(...correctionTasks);
      
      // Armazenar experiência na memória emocional
      await this.storeBuildExperience(task, buildConfig, buildResult, emotionMemory);
      
      return buildTasks;
      
    } catch (error) {
      console.error('Erro no BuildAgent:', error);
      return [];
    }
  }

  private hasCodeFiles(files: Record<string, string>): boolean {
    const codeFiles = Object.keys(files).filter(file => 
      file.endsWith('.ts') || 
      file.endsWith('.tsx') || 
      file.endsWith('.js') || 
      file.endsWith('.jsx')
    );
    
    return codeFiles.length > 0;
  }

  private hasBuildConfiguration(files: Record<string, string>): boolean {
    const buildConfigs = Object.keys(files).filter(file => 
      file.includes('package.json') ||
      file.includes('tsconfig') ||
      file.includes('webpack') ||
      file.includes('vite') ||
      file.includes('rollup') ||
      file.includes('esbuild')
    );
    
    return buildConfigs.length > 0;
  }

  private analyzeBuildConfiguration(files: Record<string, string>): any {
    const config: any = {
      packageJson: null,
      tsconfig: null,
      buildTools: [],
      scripts: {}
    };
    
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('package.json')) {
        try {
          config.packageJson = JSON.parse(content);
          config.scripts = config.packageJson.scripts || {};
        } catch (error) {
          console.warn('Erro ao parsear package.json:', error);
        }
      }
      
      if (path.includes('tsconfig')) {
        try {
          config.tsconfig = JSON.parse(content);
        } catch (error) {
          console.warn('Erro ao parsear tsconfig:', error);
        }
      }
      
      if (path.includes('webpack') || path.includes('vite') || path.includes('rollup')) {
        config.buildTools.push(path);
      }
    }
    
    return config;
  }

  private generateBuildPrompt(prompt: string, buildConfig: any, files: Record<string, string>): string {
    const fileList = Object.keys(files).join(', ');
    const scripts = Object.entries(buildConfig.scripts || {}).map(([key, value]) => `${key}: ${value}`).join('\n');
    
    return `Analise a configuração de build do projeto e otimize para produção:

PROMPT ORIGINAL: "${prompt}"

CONFIGURAÇÃO ATUAL:
- Package.json: ${buildConfig.packageJson ? 'Presente' : 'Ausente'}
- TypeScript: ${buildConfig.tsconfig ? 'Configurado' : 'Não configurado'}
- Scripts disponíveis:
${scripts}
- Ferramentas de build: ${buildConfig.buildTools.join(', ') || 'Nenhuma detectada'}

ARQUIVOS DO PROJETO:
${fileList}

Otimize a configuração para:
1. Build de produção otimizado
2. Minificação e tree-shaking
3. Source maps para debugging
4. Otimização de assets
5. Configuração de ambiente
6. Scripts de build eficientes

Retorne um JSON com:
{
  "optimizations": [
    {
      "type": "script_update",
      "path": "package.json",
      "script": "build",
      "command": "comando otimizado"
    },
    {
      "type": "config_update", 
      "path": "tsconfig.json",
      "updates": {
        "compilerOptions": {
          "target": "es2020",
          "module": "esnext"
        }
      }
    }
  ],
  "newScripts": {
    "build:prod": "comando para produção",
    "build:dev": "comando para desenvolvimento"
  },
  "dependencies": ["dependências necessárias"],
  "instructions": "instruções de implementação"
}`;
  }

  private parseBuildResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      if (parsed.optimizations && Array.isArray(parsed.optimizations)) {
        for (const optimization of parsed.optimizations) {
          if (optimization.type === 'script_update') {
            tasks.push({
              id: `build-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'file_replace' as TaskType,
              path: optimization.path,
              oldSnippet: `"${optimization.script}": "comando_atual"`,
              newSnippet: `"${optimization.script}": "${optimization.command}"`,
              status: 'pending',
              createdAt: Date.now(),
              retryCount: 0,
              maxRetries: 3
            });
          } else if (optimization.type === 'config_update') {
            tasks.push({
              id: `build-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'file_replace' as TaskType,
              path: optimization.path,
              oldSnippet: 'configuração_atual',
              newSnippet: JSON.stringify(optimization.updates, null, 2),
              status: 'pending',
              createdAt: Date.now(),
              retryCount: 0,
              maxRetries: 3
            });
          }
        }
      }
      
      // Adicionar dependências
      if (parsed.dependencies && Array.isArray(parsed.dependencies)) {
        for (const dep of parsed.dependencies) {
          tasks.push({
            id: `build-dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'package_install' as TaskType,
            newSnippet: dep,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao parsear resposta de build:', error);
      return this.generateFallbackBuildTasks({});
    }
  }

  private generateFallbackBuildTasks(buildConfig: any): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Task básica de build
    tasks.push({
      id: `fallback-build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'build_run' as TaskType,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });
    
    return tasks;
  }

  private async analyzeBuildResult(buildResult: any, llmService: ILlmService, projectPath: string): Promise<MicroTask[]> {
    if (buildResult.success) {
      return [];
    }
    
    try {
      if (!(await llmService.isConnected())) {
        return [];
      }
      
      const analysisPrompt = `Analise os erros de build e gere soluções:

ERROS DE BUILD:
${buildResult.errors.join('\n')}

OUTPUT COMPLETO:
${buildResult.output}

Gere micro-tasks para corrigir os erros. Retorne JSON:
{
  "fixes": [
    {
      "type": "file_replace",
      "path": "caminho/do/arquivo",
      "oldSnippet": "código_com_erro",
      "newSnippet": "código_corrigido"
    }
  ]
}`;

      const analysisResponse = await llmService.generateResponse(analysisPrompt);
      const cleaned = this.cleanJsonResponse(analysisResponse);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      if (parsed.fixes && Array.isArray(parsed.fixes)) {
        for (const fix of parsed.fixes) {
          tasks.push({
            id: `build-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: fix.type as TaskType,
            path: fix.path,
            oldSnippet: fix.oldSnippet,
            newSnippet: fix.newSnippet,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao analisar resultado de build:', error);
      return [];
    }
  }

  private async storeBuildExperience(
    task: any, 
    buildConfig: any, 
    buildResult: any, 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `BuildAgent executado para task ${task.id}`;
      const outcome = buildResult.success;
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Build ${buildResult.success ? 'bem-sucedido' : 'falhou'} com ${buildResult.errors?.length || 0} erros`),
        await emotionMemory.createPolicyDelta('build_execution', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do BuildAgent:', error);
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
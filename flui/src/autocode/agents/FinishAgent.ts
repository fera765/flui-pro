import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';

@injectable()
export class FinishAgent implements IAgent {
  public readonly name = 'FinishAgent';
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
    return 9;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se o projeto está completo e pronto para finalização
    const hasComponents = this.hasComponents(projectState.files);
    const hasStyles = this.hasStyles(projectState.files);
    const hasTests = this.hasTests(projectState.files);
    const hasBuildConfig = this.hasBuildConfiguration(projectState.files);
    const noErrors = !projectState.errors || projectState.errors.length === 0;
    const buildSuccessful = projectState.buildStatus === 'success' || projectState.buildStatus === 'completed';
    
    return hasComponents && hasStyles && hasTests && hasBuildConfig && noErrors && buildSuccessful;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, fileSystem } = context;
    
    try {
      // Analisar projeto completo para finalização
      const projectAnalysis = await this.analyzeProjectCompleteness(task, projectState);
      
      // Usar LLM para gerar documentação e finalização
      const finishPrompt = this.generateFinishPrompt(task.prompt, projectAnalysis, projectState);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackFinishTasks(projectAnalysis);
      }

      const finishResponse = await llmService.generateResponse(finishPrompt);
      const finishTasks = this.parseFinishResponse(finishResponse, task.projectPath);
      
      // Criar task de finalização do projeto
      finishTasks.push({
        id: `project-finish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'project_finish' as TaskType,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
      
      // Armazenar experiência na memória emocional
      await this.storeFinishExperience(task, projectAnalysis, finishTasks, emotionMemory);
      
      return finishTasks;
      
    } catch (error) {
      console.error('Erro no FinishAgent:', error);
      return [];
    }
  }

  private hasComponents(files: Record<string, string>): boolean {
    const componentFiles = Object.keys(files).filter(file => 
      file.endsWith('.tsx') || 
      file.endsWith('.jsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.js')
    );
    
    return componentFiles.length > 0;
  }

  private hasStyles(files: Record<string, string>): boolean {
    const styleFiles = Object.keys(files).filter(file => 
      file.endsWith('.css') || 
      file.endsWith('.scss') || 
      file.endsWith('.less') ||
      file.includes('tailwind') ||
      file.includes('styled')
    );
    
    return styleFiles.length > 0;
  }

  private hasTests(files: Record<string, string>): boolean {
    const testFiles = Object.keys(files).filter(file => 
      file.includes('test') || 
      file.includes('spec') ||
      file.endsWith('.test.ts') ||
      file.endsWith('.test.tsx') ||
      file.endsWith('.spec.ts') ||
      file.endsWith('.spec.tsx')
    );
    
    return testFiles.length > 0;
  }

  private hasBuildConfiguration(files: Record<string, string>): boolean {
    const buildConfigs = Object.keys(files).filter(file => 
      file.includes('package.json') ||
      file.includes('tsconfig') ||
      file.includes('webpack') ||
      file.includes('vite') ||
      file.includes('rollup')
    );
    
    return buildConfigs.length > 0;
  }

  private async analyzeProjectCompleteness(task: any, projectState: any): Promise<any> {
    const analysis = {
      components: this.extractComponents(projectState.files),
      styles: this.extractStyles(projectState.files),
      tests: this.extractTests(projectState.files),
      configs: this.extractConfigs(projectState.files),
      dependencies: projectState.dependencies || {},
      buildStatus: projectState.buildStatus,
      testStatus: projectState.testStatus,
      errors: projectState.errors || [],
      warnings: projectState.warnings || [],
      completeness: 0
    };
    
    // Calcular completude do projeto
    let score = 0;
    if (analysis.components.length > 0) score += 25;
    if (analysis.styles.length > 0) score += 20;
    if (analysis.tests.length > 0) score += 20;
    if (analysis.configs.length > 0) score += 15;
    if (analysis.buildStatus === 'success') score += 10;
    if (analysis.testStatus === 'success') score += 10;
    
    analysis.completeness = score;
    
    return analysis;
  }

  private extractComponents(files: Record<string, string>): Array<{name: string, path: string, type: string}> {
    const components: Array<{name: string, path: string, type: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.js')) {
        const componentName = this.extractComponentName(content, path);
        const componentType = this.determineComponentType(content, path);
        
        if (componentName) {
          components.push({
            name: componentName,
            path,
            type: componentType
          });
        }
      }
    }
    
    return components;
  }

  private extractStyles(files: Record<string, string>): Array<{name: string, path: string, type: string}> {
    const styles: Array<{name: string, path: string, type: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.less')) {
        const styleName = path.split('/').pop()?.replace(/\.(css|scss|less)$/, '') || 'unknown';
        const styleType = path.endsWith('.scss') ? 'scss' : path.endsWith('.less') ? 'less' : 'css';
        
        styles.push({
          name: styleName,
          path,
          type: styleType
        });
      }
    }
    
    return styles;
  }

  private extractTests(files: Record<string, string>): Array<{name: string, path: string, type: string}> {
    const tests: Array<{name: string, path: string, type: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('test') || path.includes('spec')) {
        const testName = path.split('/').pop()?.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '') || 'unknown';
        const testType = path.includes('spec') ? 'spec' : 'test';
        
        tests.push({
          name: testName,
          path,
          type: testType
        });
      }
    }
    
    return tests;
  }

  private extractConfigs(files: Record<string, string>): Array<{name: string, path: string, type: string}> {
    const configs: Array<{name: string, path: string, type: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('package.json') || 
          path.includes('tsconfig') || 
          path.includes('webpack') || 
          path.includes('vite') || 
          path.includes('rollup')) {
        
        const configName = path.split('/').pop() || 'unknown';
        const configType = path.includes('package.json') ? 'package' :
                          path.includes('tsconfig') ? 'typescript' :
                          path.includes('webpack') ? 'webpack' :
                          path.includes('vite') ? 'vite' :
                          path.includes('rollup') ? 'rollup' : 'config';
        
        configs.push({
          name: configName,
          path,
          type: configType
        });
      }
    }
    
    return configs;
  }

  private extractComponentName(content: string, path: string): string | null {
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }
    
    const fileName = path.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '');
    return fileName || null;
  }

  private determineComponentType(content: string, path: string): string {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      return 'react-component';
    } else if (content.includes('export') && content.includes('function')) {
      return 'utility-function';
    } else if (content.includes('class')) {
      return 'class';
    } else {
      return 'module';
    }
  }

  private generateFinishPrompt(prompt: string, projectAnalysis: any, projectState: any): string {
    const componentList = projectAnalysis.components.map((c: any) => `- ${c.name} (${c.type}): ${c.path}`).join('\n');
    const styleList = projectAnalysis.styles.map((s: any) => `- ${s.name} (${s.type}): ${s.path}`).join('\n');
    const testList = projectAnalysis.tests.map((t: any) => `- ${t.name} (${t.type}): ${t.path}`).join('\n');
    const configList = projectAnalysis.configs.map((c: any) => `- ${c.name} (${c.type}): ${c.path}`).join('\n');
    
    return `Finalize o projeto e gere documentação completa:

PROMPT ORIGINAL: "${prompt}"

ANÁLISE DO PROJETO:
- Completude: ${projectAnalysis.completeness}%
- Componentes: ${projectAnalysis.components.length}
- Estilos: ${projectAnalysis.styles.length}
- Testes: ${projectAnalysis.tests.length}
- Configurações: ${projectAnalysis.configs.length}
- Status do Build: ${projectAnalysis.buildStatus}
- Status dos Testes: ${projectAnalysis.testStatus}

DETALHES:
COMPONENTES:
${componentList}

ESTILOS:
${styleList}

TESTES:
${testList}

CONFIGURAÇÕES:
${configList}

DEPENDÊNCIAS:
${Object.keys(projectAnalysis.dependencies).join(', ')}

Gere:
1. README.md completo com instruções
2. Documentação de API se aplicável
3. Guia de desenvolvimento
4. Scripts de deploy
5. Configurações de CI/CD
6. Arquivo de changelog
7. Licença se necessário
8. Arquivo .gitignore otimizado
9. Configurações de ambiente
10. Documentação de testes

Retorne um JSON com:
{
  "documentation": [
    {
      "path": "README.md",
      "content": "conteúdo completo do README",
      "type": "readme"
    },
    {
      "path": "docs/API.md",
      "content": "documentação da API",
      "type": "api"
    }
  ],
  "configs": [
    {
      "path": ".gitignore",
      "content": "conteúdo do .gitignore",
      "type": "gitignore"
    }
  ],
  "scripts": [
    {
      "path": "scripts/deploy.sh",
      "content": "script de deploy",
      "type": "deploy"
    }
  ],
  "instructions": "instruções de finalização"
}`;
  }

  private parseFinishResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      // Criar documentação
      if (parsed.documentation && Array.isArray(parsed.documentation)) {
        for (const doc of parsed.documentation) {
          tasks.push({
            id: `finish-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: doc.path,
            newSnippet: doc.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Criar configurações
      if (parsed.configs && Array.isArray(parsed.configs)) {
        for (const config of parsed.configs) {
          tasks.push({
            id: `finish-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: config.path,
            newSnippet: config.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Criar scripts
      if (parsed.scripts && Array.isArray(parsed.scripts)) {
        for (const script of parsed.scripts) {
          tasks.push({
            id: `finish-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: script.path,
            newSnippet: script.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao parsear resposta de finalização:', error);
      return this.generateFallbackFinishTasks({});
    }
  }

  private generateFallbackFinishTasks(projectAnalysis: any): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Gerar README básico
    const readmeContent = `# Projeto AutoCode-Forge

Este projeto foi gerado automaticamente pelo FLUI AutoCode-Forge.

## Componentes
${projectAnalysis.components?.map((c: any) => `- ${c.name}`).join('\n') || 'Nenhum componente encontrado'}

## Como executar

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Testes

\`\`\`bash
npm test
\`\`\`

## Desenvolvimento

\`\`\`bash
npm run dev
\`\`\`
`;
    
    tasks.push({
      id: `fallback-readme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'file_create' as TaskType,
      path: 'README.md',
      newSnippet: readmeContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });
    
    return tasks;
  }

  private async storeFinishExperience(
    task: any, 
    projectAnalysis: any, 
    finishTasks: MicroTask[], 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `FinishAgent executado para task ${task.id}`;
      const outcome = finishTasks.length > 0;
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Projeto finalizado com ${projectAnalysis.completeness}% de completude: ${finishTasks.length} arquivos de documentação gerados`),
        await emotionMemory.createPolicyDelta('project_finish', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do FinishAgent:', error);
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
import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';

@injectable()
export class StyleAgent implements IAgent {
  public readonly name = 'StyleAgent';
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
    return 4;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se há componentes mas não há estilos definidos
    const hasComponents = this.hasReactComponents(projectState.files);
    const hasStyles = this.hasStyleFiles(projectState.files);
    
    return hasComponents && !hasStyles;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, fileSystem } = context;
    
    try {
      // Analisar componentes existentes para gerar estilos
      const components = this.extractComponents(projectState.files);
      
      if (components.length === 0) {
        return [];
      }

      // Usar LLM para gerar estilos baseados nos componentes
      const stylePrompt = this.generateStylePrompt(task.prompt, components, projectState.files);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackStyles(components);
      }

      const styleResponse = await llmService.generateResponse(stylePrompt);
      const styleTasks = this.parseStyleResponse(styleResponse, task.projectPath);
      
      // Armazenar experiência na memória emocional
      await this.storeStyleExperience(task, components, styleTasks, emotionMemory);
      
      return styleTasks;
      
    } catch (error) {
      console.error('Erro no StyleAgent:', error);
      return [];
    }
  }

  private hasReactComponents(files: Record<string, string>): boolean {
    const componentFiles = Object.keys(files).filter(file => 
      file.endsWith('.tsx') || file.endsWith('.jsx')
    );
    
    return componentFiles.length > 0;
  }

  private hasStyleFiles(files: Record<string, string>): boolean {
    const styleFiles = Object.keys(files).filter(file => 
      file.endsWith('.css') || 
      file.endsWith('.scss') || 
      file.endsWith('.less') ||
      file.includes('tailwind') ||
      file.includes('styled')
    );
    
    return styleFiles.length > 0;
  }

  private extractComponents(files: Record<string, string>): Array<{name: string, content: string, path: string}> {
    const components: Array<{name: string, content: string, path: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
        const componentName = this.extractComponentName(content, path);
        if (componentName) {
          components.push({
            name: componentName,
            content,
            path
          });
        }
      }
    }
    
    return components;
  }

  private extractComponentName(content: string, path: string): string | null {
    // Extrair nome do componente do conteúdo
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }
    
    // Fallback: usar nome do arquivo
    const fileName = path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '');
    return fileName || null;
  }

  private generateStylePrompt(prompt: string, components: Array<{name: string, content: string, path: string}>, files: Record<string, string>): string {
    const componentList = components.map(c => `- ${c.name} (${c.path}): ${c.content.substring(0, 200)}...`).join('\n');
    
    return `Analise os seguintes componentes React e gere estilos CSS modernos e responsivos:

PROMPT ORIGINAL: "${prompt}"

COMPONENTES EXISTENTES:
${componentList}

ARQUIVOS DO PROJETO:
${Object.keys(files).join(', ')}

Gere estilos que:
1. Sejam modernos e responsivos
2. Sigam as melhores práticas de CSS
3. Sejam compatíveis com os componentes existentes
4. Usem variáveis CSS para consistência
5. Incluam estados hover, focus, active
6. Sejam acessíveis

Retorne um JSON com a seguinte estrutura:
{
  "styles": [
    {
      "path": "src/styles/global.css",
      "content": "conteúdo CSS completo",
      "type": "global"
    },
    {
      "path": "src/components/ComponentName.module.css", 
      "content": "conteúdo CSS do componente",
      "type": "component"
    }
  ],
  "dependencies": ["lista de dependências CSS necessárias"],
  "instructions": "instruções de implementação"
}`;
  }

  private parseStyleResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      if (parsed.styles && Array.isArray(parsed.styles)) {
        for (const style of parsed.styles) {
          tasks.push({
            id: `style-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: style.path,
            newSnippet: style.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Adicionar dependências se necessário
      if (parsed.dependencies && Array.isArray(parsed.dependencies)) {
        for (const dep of parsed.dependencies) {
          tasks.push({
            id: `style-dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      console.error('Erro ao parsear resposta de estilos:', error);
      return this.generateFallbackStyles([]);
    }
  }

  private generateFallbackStyles(components: Array<{name: string, content: string, path: string}>): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Gerar CSS básico para cada componente
    for (const component of components) {
      const cssContent = this.generateBasicCSS(component.name);
      const cssPath = `src/styles/${component.name}.css`;
      
      tasks.push({
        id: `fallback-style-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create' as TaskType,
        path: cssPath,
        newSnippet: cssContent,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }
    
    return tasks;
  }

  private generateBasicCSS(componentName: string): string {
    return `/* Estilos para ${componentName} */
.${componentName.toLowerCase()} {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin: 0.5rem;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.${componentName.toLowerCase()}:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.${componentName.toLowerCase()}:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* Responsividade */
@media (max-width: 768px) {
  .${componentName.toLowerCase()} {
    padding: 0.5rem;
    margin: 0.25rem;
  }
}`;
  }

  private async storeStyleExperience(
    task: any, 
    components: Array<{name: string, content: string, path: string}>, 
    styleTasks: MicroTask[], 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `StyleAgent executado para task ${task.id}`;
      const outcome = styleTasks.length > 0;
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Estilos gerados para ${components.length} componentes`),
        await emotionMemory.createPolicyDelta('style_generation', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do StyleAgent:', error);
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
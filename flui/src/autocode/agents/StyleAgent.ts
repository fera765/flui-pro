import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class StyleAgent implements IAgent {
  name: AgentType = 'StyleAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should create styles if we have React components but no CSS files
    const hasReactComponents = this.hasReactComponents(projectState.files);
    const hasStyleFiles = this.hasStyleFiles(projectState.files);
    const hasPackageJson = !!projectState.files['package.json'];
    
    return hasPackageJson && hasReactComponents && !hasStyleFiles;
  }

  getPriority(): number {
    return 4; // After components are created
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 StyleAgent executando para task ${task.id}`);
    
    try {
      // Analyze existing components dynamically
      const components = this.extractComponents(projectState.files);
      
      if (components.length === 0) {
        console.log('❌ No React components found for styling');
        return [];
      }

      // Generate dynamic style prompt based on actual components
      const stylePrompt = this.generateDynamicStylePrompt(task.prompt, components, projectState.files);
      
      // Use LLM to generate styles dynamically
      const styleResponse = await this.llmService.generateResponse(stylePrompt);
      const styleTasks = this.parseDynamicStyleResponse(styleResponse);
      
      // Store memory about style generation
      await emotionMemory.storeMemory({
        taskId: task.id,
        agentName: this.name,
        action: 'generate_styles',
        context: `Generated styles for ${components.length} React components`,
        emotionVector: [0.8, 0.7, 0.9], // confidence, satisfaction, progress
        timestamp: Date.now(),
        metadata: {
          componentsCount: components.length,
          components: components.map(c => c.name),
          stylesGenerated: styleTasks.length
        }
      });

      console.log(`✅ StyleAgent criou ${styleTasks.length} micro-tasks para estilos`);
      return styleTasks;
      
    } catch (error) {
      console.error(`❌ Erro no StyleAgent:`, error);
      
      // Generate fallback styles dynamically using LLM
      return this.generateDynamicFallbackStyles(projectState.files);
    }
  }

  private hasReactComponents(files: Record<string, string>): boolean {
    const componentFiles = Object.keys(files).filter(file => 
      file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')
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
      if (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.js')) {
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
    // Extract component name from content dynamically
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }
    
    // Fallback: use filename
    const fileName = path.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '');
    return fileName || null;
  }

  private generateDynamicStylePrompt(prompt: string, components: Array<{name: string, content: string, path: string}>, files: Record<string, string>): string {
    const componentList = components.map(c => `- ${c.name} (${c.path}): ${c.content.substring(0, 200)}...`).join('\n');
    
    return `Você é um especialista em CSS moderno e React. Analise os componentes React existentes e gere estilos CSS dinâmicos e responsivos.

PROMPT ORIGINAL: "${prompt}"

COMPONENTES EXISTENTES:
${componentList}

ARQUIVOS DO PROJETO:
${Object.keys(files).join(', ')}

Gere estilos que:
1. Sejam completamente dinâmicos baseados nos componentes existentes
2. Sigam as melhores práticas de CSS moderno
3. Sejam responsivos e acessíveis
4. Usem variáveis CSS para consistência
5. Incluam estados hover, focus, active
6. Sejam compatíveis com React

Retorne APENAS um JSON com a seguinte estrutura:
{
  "styles": [
    {
      "path": "src/index.css",
      "content": "conteúdo CSS global completo",
      "type": "global"
    },
    {
      "path": "src/App.css", 
      "content": "conteúdo CSS do App component",
      "type": "component"
    }
  ]
}

NÃO inclua explicações, apenas o JSON.`;
  }

  private parseDynamicStyleResponse(response: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      if (parsed.styles && Array.isArray(parsed.styles)) {
        for (const style of parsed.styles) {
          tasks.push({
            id: `style-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create',
            path: style.path,
            oldSnippet: '',
            newSnippet: style.content,
            rollbackHash: this.calculateHash(''),
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
      return [];
    }
  }

  private async generateDynamicFallbackStyles(files: Record<string, string>): Promise<MicroTask[]> {
    try {
      // Use LLM to generate fallback styles dynamically
      const fallbackPrompt = `Gere estilos CSS básicos e modernos para uma aplicação React. 
      
      Crie dois arquivos:
      1. src/index.css - estilos globais
      2. src/App.css - estilos para o componente App
      
      Retorne APENAS JSON:
      {
        "styles": [
          {
            "path": "src/index.css",
            "content": "estilos globais completos"
          },
          {
            "path": "src/App.css", 
            "content": "estilos do App completos"
          }
        ]
      }`;

      const fallbackResponse = await this.llmService.generateResponse(fallbackPrompt);
      return this.parseDynamicStyleResponse(fallbackResponse);
      
    } catch (error) {
      console.error('Erro ao gerar fallback styles:', error);
      return [];
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

  private calculateHash(content: string): string {
    // Simple hash calculation for rollback
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}
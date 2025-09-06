import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class ConfigAgent implements IAgent {
  name: AgentType = 'ConfigAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should create tsconfig.node.json if it doesn't exist and we have a Vite project
    const hasPackageJson = !!projectState.files['package.json'];
    const hasViteConfig = !!projectState.files['vite.config.ts'] || !!projectState.files['vite.config.js'];
    const hasTsConfig = !!projectState.files['tsconfig.json'];
    const hasTsConfigNode = !!projectState.files['tsconfig.node.json'];
    const isViteProject = !!(projectState.dependencies['vite'] || projectState.dependencies['@vitejs/plugin-react']);
    
    return hasPackageJson && hasViteConfig && hasTsConfig && isViteProject && !hasTsConfigNode;
  }

  getPriority(): number {
    return 6; // After build setup
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 ConfigAgent executando para task ${task.id}`);
    
    try {
      // Analyze project configuration dynamically
      const projectConfig = this.analyzeProjectConfig(projectState);
      
      // Generate tsconfig.node.json content using LLM
      const prompt = `
Você é um especialista em configuração TypeScript para projetos Vite + React. Crie um arquivo tsconfig.node.json otimizado.

ANÁLISE DO PROJETO:
- Framework: ${projectConfig.framework}
- Bundler: ${projectConfig.bundler}
- TypeScript: ${projectConfig.typescript}
- Dependências principais: ${projectConfig.mainDeps.join(', ')}

REQUISITOS:
- Deve ser compatível com Vite
- Deve otimizar para Node.js environment
- Deve incluir configurações para build tools
- Deve ser compatível com o tsconfig.json existente
- Deve incluir apenas vite.config.ts no include

Retorne APENAS o conteúdo JSON do tsconfig.node.json, sem explicações.
`;

      const configContent = await this.llmService.generateResponse(prompt);
      
      // Create micro-task for tsconfig.node.json generation
      const microTask: MicroTask = {
        id: `config-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'tsconfig.node.json',
        oldSnippet: '',
        newSnippet: configContent.trim(),
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      // Store memory about config generation
      await emotionMemory.storeMemory({
        taskId: task.id,
        agentName: this.name,
        action: 'generate_config',
        context: 'Creating TypeScript configuration for Vite build tools',
        emotionVector: [0.9, 0.8, 0.9], // confidence, satisfaction, progress
        timestamp: Date.now(),
        metadata: {
          configFile: 'tsconfig.node.json',
          framework: projectConfig.framework,
          bundler: projectConfig.bundler
        }
      });

      console.log(`✅ ConfigAgent criou micro-task para tsconfig.node.json`);
      return [microTask];

    } catch (error) {
      console.error(`❌ Erro no ConfigAgent:`, error);
      
      // Generate fallback config dynamically using LLM
      return this.generateDynamicFallbackConfig();
    }
  }

  private analyzeProjectConfig(projectState: ProjectState): {
    framework: string;
    bundler: string;
    typescript: string;
    mainDeps: string[];
  } {
    const deps = projectState.dependencies;
    
    // Determine framework
    let framework = 'Unknown';
    if (deps['react']) framework = 'React';
    if (deps['vue']) framework = 'Vue';
    if (deps['svelte']) framework = 'Svelte';
    
    // Determine bundler
    let bundler = 'Unknown';
    if (deps['vite']) bundler = 'Vite';
    if (deps['webpack']) bundler = 'Webpack';
    if (deps['rollup']) bundler = 'Rollup';
    
    // Determine TypeScript
    const typescript = deps['typescript'] ? 'Yes' : 'No';
    
    // Get main dependencies
    const mainDeps = Object.keys(deps).filter(dep => 
      ['react', 'vue', 'svelte', 'vite', 'typescript', '@types/react'].includes(dep)
    );
    
    return {
      framework,
      bundler,
      typescript,
      mainDeps
    };
  }

  private async generateDynamicFallbackConfig(): Promise<MicroTask[]> {
    try {
      // Use LLM to generate fallback config dynamically
      const fallbackPrompt = `Gere um tsconfig.node.json básico e funcional para um projeto Vite + React + TypeScript.

      Retorne APENAS o JSON:
      {
        "compilerOptions": {
          "composite": true,
          "skipLibCheck": true,
          "module": "ESNext",
          "moduleResolution": "bundler",
          "allowSyntheticDefaultImports": true,
          "strict": true,
          "isolatedModules": true,
          "types": ["node"]
        },
        "include": ["vite.config.ts"]
      }`;

      const fallbackResponse = await this.llmService.generateResponse(fallbackPrompt);
      
      const fallbackTask: MicroTask = {
        id: `config-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'tsconfig.node.json',
        oldSnippet: '',
        newSnippet: fallbackResponse.trim(),
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      return [fallbackTask];
      
    } catch (error) {
      console.error('Erro ao gerar fallback config:', error);
      return [];
    }
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
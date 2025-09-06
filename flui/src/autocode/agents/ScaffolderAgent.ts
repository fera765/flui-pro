import { injectable, inject } from 'inversify';
import { IAgent, AgentType, MicroTask, Task, ProjectState, AgentContext } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';

@injectable()
export class ScaffolderAgent implements IAgent {
  name: AgentType = 'ScaffolderAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
  }

  canHandle(task: Task, projectState: ProjectState): boolean {
    // ScaffolderAgent pode lidar com tasks que não têm package.json
    return !projectState.files['package.json'];
  }

  getPriority(): number {
    return 1; // Prioridade mais alta
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState } = context;
    const microTasks: MicroTask[] = [];

    try {
      // Analisar prompt para determinar tipo de projeto
      const projectAnalysis = await this.analyzeProjectRequirements(task.prompt);
      
      // Gerar package.json
      const packageJsonTask = await this.createPackageJsonTask(projectAnalysis, task.id);
      microTasks.push(packageJsonTask);
      
      // Gerar tsconfig.json se for TypeScript
      if (projectAnalysis.typescript) {
        const tsconfigTask = await this.createTsconfigTask(projectAnalysis, task.id);
        microTasks.push(tsconfigTask);
      }
      
      // Gerar vite.config.ts se for Vite
      if (projectAnalysis.buildTool === 'vite') {
        const viteConfigTask = await this.createViteConfigTask(projectAnalysis, task.id);
        microTasks.push(viteConfigTask);
      }
      
      // Gerar tailwind.config.js se for Tailwind
      if (projectAnalysis.styling === 'tailwind') {
        const tailwindConfigTask = await this.createTailwindConfigTask(projectAnalysis, task.id);
        microTasks.push(tailwindConfigTask);
      }
      
      // Gerar index.html se for projeto web
      if (projectAnalysis.type === 'web') {
        const indexHtmlTask = await this.createIndexHtmlTask(projectAnalysis, task.id);
        microTasks.push(indexHtmlTask);
      }
      
      // Armazenar memória emocional sobre a criação do projeto
      await this.storeProjectCreationMemory(task.prompt, projectAnalysis);
      
    } catch (error) {
      console.error('Erro no ScaffolderAgent:', error);
    }

    return microTasks;
  }

  /**
   * Analisa prompt para determinar requisitos do projeto
   */
  private async analyzeProjectRequirements(prompt: string): Promise<{
    type: 'web' | 'node' | 'react' | 'vue' | 'svelte';
    framework: string;
    typescript: boolean;
    buildTool: 'vite' | 'webpack' | 'rollup' | 'none';
    styling: 'tailwind' | 'css' | 'scss' | 'none';
    testing: boolean;
    features: string[];
  }> {
    const analysisPrompt = `Analise o seguinte prompt de projeto e retorne um JSON com os requisitos:

Prompt: "${prompt}"

Retorne um JSON com:
{
  "type": "web|node|react|vue|svelte",
  "framework": "nome_do_framework",
  "typescript": true/false,
  "buildTool": "vite|webpack|rollup|none",
  "styling": "tailwind|css|scss|none",
  "testing": true/false,
  "features": ["lista", "de", "features"]
}`;

    try {
      const response = await this.llmService.generateResponse(analysisPrompt);
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      // Fallback para análise básica
      return this.fallbackAnalysis(prompt);
    }
  }

  /**
   * Cria task para package.json
   */
  private async createPackageJsonTask(analysis: any, taskId: string): Promise<MicroTask> {
    const packageJsonContent = await this.generatePackageJson(analysis);
    
    return {
      id: `package-json-${Date.now()}`,
      type: 'file_create',
      path: 'package.json',
      newSnippet: packageJsonContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Cria task para tsconfig.json
   */
  private async createTsconfigTask(analysis: any, taskId: string): Promise<MicroTask> {
    const tsconfigContent = await this.generateTsconfig(analysis);
    
    return {
      id: `tsconfig-${Date.now()}`,
      type: 'file_create',
      path: 'tsconfig.json',
      newSnippet: tsconfigContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Cria task para vite.config.ts
   */
  private async createViteConfigTask(analysis: any, taskId: string): Promise<MicroTask> {
    const viteConfigContent = await this.generateViteConfig(analysis);
    
    return {
      id: `vite-config-${Date.now()}`,
      type: 'file_create',
      path: 'vite.config.ts',
      newSnippet: viteConfigContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Cria task para tailwind.config.js
   */
  private async createTailwindConfigTask(analysis: any, taskId: string): Promise<MicroTask> {
    const tailwindConfigContent = await this.generateTailwindConfig(analysis);
    
    return {
      id: `tailwind-config-${Date.now()}`,
      type: 'file_create',
      path: 'tailwind.config.js',
      newSnippet: tailwindConfigContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Cria task para index.html
   */
  private async createIndexHtmlTask(analysis: any, taskId: string): Promise<MicroTask> {
    const indexHtmlContent = await this.generateIndexHtml(analysis);
    
    return {
      id: `index-html-${Date.now()}`,
      type: 'file_create',
      path: 'index.html',
      newSnippet: indexHtmlContent,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Gera conteúdo do package.json
   */
  private async generatePackageJson(analysis: any): Promise<string> {
    const packageJsonPrompt = `Gere um package.json completo para um projeto com as seguintes características:

Tipo: ${analysis.type}
Framework: ${analysis.framework}
TypeScript: ${analysis.typescript}
Build Tool: ${analysis.buildTool}
Styling: ${analysis.styling}
Testing: ${analysis.testing}
Features: ${analysis.features.join(', ')}

Retorne APENAS o JSON do package.json, sem explicações.`;

    try {
      const response = await this.llmService.generateResponse(packageJsonPrompt);
      return this.cleanJsonResponse(response);
    } catch (error) {
      return this.fallbackPackageJson(analysis);
    }
  }

  /**
   * Gera conteúdo do tsconfig.json
   */
  private async generateTsconfig(analysis: any): Promise<string> {
    const tsconfigPrompt = `Gere um tsconfig.json para um projeto ${analysis.framework} com ${analysis.buildTool}.

Retorne APENAS o JSON do tsconfig.json, sem explicações.`;

    try {
      const response = await this.llmService.generateResponse(tsconfigPrompt);
      return this.cleanJsonResponse(response);
    } catch (error) {
      return this.fallbackTsconfig();
    }
  }

  /**
   * Gera conteúdo do vite.config.ts
   */
  private async generateViteConfig(analysis: any): Promise<string> {
    const viteConfigPrompt = `Gere um vite.config.ts para um projeto ${analysis.framework} com TypeScript.

Retorne APENAS o código TypeScript do vite.config.ts, sem explicações.`;

    try {
      const response = await this.llmService.generateResponse(viteConfigPrompt);
      return response.trim();
    } catch (error) {
      return this.fallbackViteConfig();
    }
  }

  /**
   * Gera conteúdo do tailwind.config.js
   */
  private async generateTailwindConfig(analysis: any): Promise<string> {
    const tailwindConfigPrompt = `Gere um tailwind.config.js para um projeto ${analysis.framework}.

Retorne APENAS o código JavaScript do tailwind.config.js, sem explicações.`;

    try {
      const response = await this.llmService.generateResponse(tailwindConfigPrompt);
      return response.trim();
    } catch (error) {
      return this.fallbackTailwindConfig();
    }
  }

  /**
   * Gera conteúdo do index.html
   */
  private async generateIndexHtml(analysis: any): Promise<string> {
    const indexHtmlPrompt = `Gere um index.html para um projeto ${analysis.framework} com ${analysis.styling}.

Retorne APENAS o HTML, sem explicações.`;

    try {
      const response = await this.llmService.generateResponse(indexHtmlPrompt);
      return response.trim();
    } catch (error) {
      return this.fallbackIndexHtml();
    }
  }

  /**
   * Armazena memória emocional sobre criação do projeto
   */
  private async storeProjectCreationMemory(prompt: string, analysis: any): Promise<void> {
    try {
      const context = `Criação de projeto: ${prompt}`;
      const outcome = true;
      
      await this.emotionMemory.storeMemoryWithLLMAnalysis(
        `Projeto criado com sucesso: ${analysis.type} usando ${analysis.framework}`,
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar memória emocional:', error);
    }
  }

  /**
   * Limpa resposta JSON
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Análise de fallback
   */
  private fallbackAnalysis(prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();
    
    return {
      type: lowerPrompt.includes('react') ? 'react' : 'web',
      framework: lowerPrompt.includes('react') ? 'react' : 'vanilla',
      typescript: lowerPrompt.includes('typescript') || lowerPrompt.includes('ts'),
      buildTool: lowerPrompt.includes('vite') ? 'vite' : 'webpack',
      styling: lowerPrompt.includes('tailwind') ? 'tailwind' : 'css',
      testing: lowerPrompt.includes('test') || lowerPrompt.includes('jest'),
      features: []
    };
  }

  /**
   * Package.json de fallback
   */
  private fallbackPackageJson(analysis: any): string {
    return JSON.stringify({
      name: 'flui-project',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        vite: '^5.0.0'
      }
    }, null, 2);
  }

  /**
   * Tsconfig de fallback
   */
  private fallbackTsconfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    }, null, 2);
  }

  /**
   * Vite config de fallback
   */
  private fallbackViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`;
  }

  /**
   * Tailwind config de fallback
   */
  private fallbackTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  }

  /**
   * Index.html de fallback
   */
  private fallbackIndexHtml(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flui Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }
}
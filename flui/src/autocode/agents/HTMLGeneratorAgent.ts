import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class HTMLGeneratorAgent implements IAgent {
  name: AgentType = 'HTMLGeneratorAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should create index.html if it doesn't exist and we have a React project
    const hasPackageJson = !!projectState.files['package.json'];
    const hasViteConfig = !!projectState.files['vite.config.ts'] || !!projectState.files['vite.config.js'];
    const hasIndexHtml = !!projectState.files['index.html'];
    const isReactProject = !!(projectState.dependencies['react'] || projectState.dependencies['@types/react']);
    
    return hasPackageJson && hasViteConfig && isReactProject && !hasIndexHtml;
  }

  getPriority(): number {
    return 2; // High priority - needed early in the process
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 HTMLGeneratorAgent executando para task ${task.id}`);
    
    try {
      // Generate HTML content using LLM
      const prompt = `
Você é um especialista em desenvolvimento React com Vite. Crie um arquivo index.html completo e funcional para uma aplicação React com TypeScript.

REQUISITOS:
- Deve ser compatível com Vite
- Deve incluir meta tags essenciais
- Deve ter título apropriado
- Deve referenciar corretamente o ponto de entrada React
- Deve incluir viewport e charset
- Deve ter estrutura HTML5 semântica

PROJETO ATUAL:
- Framework: React + TypeScript
- Bundler: Vite
- Ponto de entrada: src/main.tsx
- Título sugerido: "React App"

Retorne APENAS o conteúdo HTML completo, sem explicações adicionais.
`;

      const htmlContent = await this.llmService.generateResponse(prompt);
      
      // Create micro-task for HTML generation
      const microTask: MicroTask = {
        id: `html-generator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'index.html',
        oldSnippet: '',
        newSnippet: htmlContent.trim(),
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      // Store memory about HTML generation
      await emotionMemory.storeMemory({
        taskId: task.id,
        agentName: this.name,
        action: 'generate_html',
        context: 'Creating main HTML file for React application',
        emotionVector: [0.8, 0.7, 0.9], // confidence, satisfaction, progress
        timestamp: Date.now(),
        metadata: {
          filePath: 'index.html',
          framework: 'React',
          bundler: 'Vite'
        }
      });

      console.log(`✅ HTMLGeneratorAgent criou micro-task para index.html`);
      return [microTask];

    } catch (error) {
      console.error(`❌ Erro no HTMLGeneratorAgent:`, error);
      
      // Fallback HTML content
      const fallbackHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

      const fallbackTask: MicroTask = {
        id: `html-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'index.html',
        oldSnippet: '',
        newSnippet: fallbackHtml,
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      return [fallbackTask];
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
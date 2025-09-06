import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class EntryPointAgent implements IAgent {
  name: AgentType = 'EntryPointAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should create main.tsx if it doesn't exist and we have React components
    const hasPackageJson = !!projectState.files['package.json'];
    const hasReactDeps = !!(projectState.dependencies['react'] || projectState.dependencies['@types/react']);
    const hasAppComponent = !!projectState.files['src/App.tsx'] || 
                           !!projectState.files['src/App.ts'] ||
                           !!projectState.files['src/App.jsx'] ||
                           !!projectState.files['src/App.js'];
    const hasMainTsx = !!projectState.files['src/main.tsx'] || 
                      !!projectState.files['src/main.ts'] ||
                      !!projectState.files['src/main.jsx'] ||
                      !!projectState.files['src/main.js'];
    
    return hasPackageJson && hasReactDeps && hasAppComponent && !hasMainTsx;
  }

  getPriority(): number {
    return 3; // High priority - needed after components are created
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 EntryPointAgent executando para task ${task.id}`);
    
    try {
      // Check what App component exists
      const appFile = projectState.files['src/App.tsx'] || 
                     projectState.files['src/App.ts'] ||
                     projectState.files['src/App.jsx'] ||
                     projectState.files['src/App.js'];
      
      const appImport = appFile?.includes('.tsx') ? './App.tsx' : 
                       appFile?.includes('.ts') ? './App.ts' :
                       appFile?.includes('.jsx') ? './App.jsx' : './App.js';

      // Generate main.tsx content using LLM
      const prompt = `
Você é um especialista em desenvolvimento React com TypeScript. Crie um arquivo src/main.tsx completo e funcional para uma aplicação React.

REQUISITOS:
- Deve importar React e ReactDOM
- Deve importar o componente App de ${appImport}
- Deve importar estilos CSS (./index.css)
- Deve renderizar o App no elemento #root
- Deve usar React.StrictMode
- Deve usar createRoot do React 18
- Deve ter tratamento de erro para elemento root

PROJETO ATUAL:
- Framework: React + TypeScript
- Componente principal: ${appImport}
- Estilos: ./index.css
- Elemento root: #root

Retorne APENAS o código TypeScript completo, sem explicações adicionais.
`;

      const mainContent = await this.llmService.generateResponse(prompt);
      
      // Create micro-task for main.tsx generation
      const microTask: MicroTask = {
        id: `entry-point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'src/main.tsx',
        oldSnippet: '',
        newSnippet: mainContent.trim(),
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      // Store memory about entry point generation
      await emotionMemory.storeMemory({
        taskId: task.id,
        agentName: this.name,
        action: 'generate_entry_point',
        context: 'Creating React entry point with proper imports and rendering',
        emotionVector: [0.9, 0.8, 0.9], // confidence, satisfaction, progress
        timestamp: Date.now(),
        metadata: {
          filePath: 'src/main.tsx',
          appImport: appImport,
          framework: 'React'
        }
      });

      console.log(`✅ EntryPointAgent criou micro-task para src/main.tsx`);
      return [microTask];

    } catch (error) {
      console.error(`❌ Erro no EntryPointAgent:`, error);
      
      // Fallback main.tsx content - static and independent
      const fallbackMain = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`;

      const fallbackTask: MicroTask = {
        id: `entry-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create',
        path: 'src/main.tsx',
        oldSnippet: '',
        newSnippet: fallbackMain,
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
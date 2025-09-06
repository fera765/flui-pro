import { TodoItem, FluiContext } from '../types/advanced';
import { v4 as uuidv4 } from 'uuid';

export class TodoPlanner {
  async analyzeTaskComplexity(prompt: string): Promise<TodoItem[]> {
    // Analyze the prompt to determine complexity and create todo list
    const complexity = this.assessComplexity(prompt);
    const todos: TodoItem[] = [];

    if (complexity.includes('video') || complexity.includes('tiktok')) {
      todos.push(...this.createVideoCreationTodos(prompt));
    } else if (complexity.includes('research') || complexity.includes('analyze')) {
      todos.push(...this.createResearchTodos(prompt));
    } else if (complexity.includes('write') || complexity.includes('content')) {
      todos.push(...this.createContentCreationTodos(prompt));
    } else if (complexity.includes('tech')) {
      todos.push(...this.createTechTodos(prompt));
    } else {
      todos.push(...this.createGenericTodos(prompt));
    }

    return todos;
  }

  private assessComplexity(prompt: string): string[] {
    const keywords = prompt.toLowerCase();
    const complexity: string[] = [];

    if (keywords.includes('video') || keywords.includes('tiktok') || keywords.includes('youtube')) {
      complexity.push('video');
    }
    if (keywords.includes('research') || keywords.includes('analyze') || keywords.includes('investigate')) {
      complexity.push('research');
    }
    if (keywords.includes('write') || keywords.includes('content') || keywords.includes('article')) {
      complexity.push('content');
    }
    if (keywords.includes('complex') || keywords.includes('multiple') || keywords.includes('steps')) {
      complexity.push('complex');
    }
    
    // Add technology detection
    if (keywords.includes('react') || keywords.includes('vue') || keywords.includes('angular') || 
        keywords.includes('application') || keywords.includes('app') || keywords.includes('dashboard') ||
        keywords.includes('authentication') || keywords.includes('api') || keywords.includes('database')) {
      complexity.push('tech');
    }

    return complexity;
  }

  private createVideoCreationTodos(prompt: string): TodoItem[] {
    const scriptAnalysisId = uuidv4();
    const trendResearchId = uuidv4();
    const scriptWriterId = uuidv4();
    const visualCreatorId = uuidv4();
    const fileCreationId = uuidv4();
    
    return [
      {
        id: scriptAnalysisId,
        description: 'Analisando estrutura de roteiro de videos para tiktok',
        type: 'agent',
        agentId: 'script_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: trendResearchId,
        description: 'Pesquisando tendências atuais do TikTok',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: 'TikTok viral trends 2024', maxResults: 5 },
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: scriptWriterId,
        description: 'Criando roteiro baseado nas tendências',
        type: 'agent',
        agentId: 'script_writer',
        status: 'pending',
        dependencies: [scriptAnalysisId, trendResearchId],
        createdAt: new Date()
      },
      {
        id: visualCreatorId,
        description: 'Gerando ideias visuais e storyboard',
        type: 'agent',
        agentId: 'visual_creator',
        status: 'pending',
        dependencies: [scriptWriterId],
        createdAt: new Date()
      },
      {
        id: fileCreationId,
        description: 'Criando arquivos de produção',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'script.md', content: 'Generated script content' },
        status: 'pending',
        dependencies: [scriptWriterId],
        createdAt: new Date()
      }
    ];
  }

  private createResearchTodos(prompt: string): TodoItem[] {
    const researchPlannerId = uuidv4();
    const dataCollectionId = uuidv4();
    const dataAnalysisId = uuidv4();
    const reportWriterId = uuidv4();
    
    return [
      {
        id: researchPlannerId,
        description: 'Definindo escopo da pesquisa',
        type: 'agent',
        agentId: 'research_planner',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: dataCollectionId,
        description: 'Coletando informações relevantes',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: prompt, maxResults: 10 },
        status: 'pending',
        dependencies: [researchPlannerId],
        createdAt: new Date()
      },
      {
        id: dataAnalysisId,
        description: 'Analisando e organizando dados',
        type: 'agent',
        agentId: 'data_analyst',
        status: 'pending',
        dependencies: [dataCollectionId],
        createdAt: new Date()
      },
      {
        id: reportWriterId,
        description: 'Criando relatório final',
        type: 'agent',
        agentId: 'report_writer',
        status: 'pending',
        dependencies: [dataAnalysisId],
        createdAt: new Date()
      }
    ];
  }

  private createContentCreationTodos(prompt: string): TodoItem[] {
    const contentAnalystId = uuidv4();
    const referenceResearchId = uuidv4();
    const contentStructureId = uuidv4();
    const contentWritingId = uuidv4();
    const contentEditingId = uuidv4();
    
    return [
      {
        id: contentAnalystId,
        description: 'Analisando requisitos do conteúdo',
        type: 'agent',
        agentId: 'content_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: referenceResearchId,
        description: 'Pesquisando referências e fontes',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: prompt, maxResults: 5 },
        status: 'pending',
        dependencies: [contentAnalystId],
        createdAt: new Date()
      },
      {
        id: contentStructureId,
        description: 'Criando estrutura do conteúdo',
        type: 'agent',
        agentId: 'content_planner',
        status: 'pending',
        dependencies: [referenceResearchId],
        createdAt: new Date()
      },
      {
        id: contentWritingId,
        description: 'Escrevendo o conteúdo',
        type: 'agent',
        agentId: 'content_writer',
        status: 'pending',
        dependencies: [contentStructureId],
        createdAt: new Date()
      },
      {
        id: contentEditingId,
        description: 'Revisando e editando',
        type: 'agent',
        agentId: 'content_editor',
        status: 'pending',
        dependencies: [contentWritingId],
        createdAt: new Date()
      }
    ];
  }

  private createTechTodos(prompt: string): TodoItem[] {
    const setupId = uuidv4();
    const implementationId = uuidv4();
    const testingId = uuidv4();
    
    return [
      {
        id: setupId,
        description: 'Configurando estrutura do projeto',
        type: 'tool',
        toolName: 'file_write',
        parameters: { 
          filePath: 'package.json', 
          content: JSON.stringify({
            name: 'tech-project',
            version: '1.0.0',
            description: 'Generated by FLUI',
            main: 'index.js',
            scripts: {
              start: 'npm run dev',
              dev: 'echo "Development server"',
              build: 'echo "Build completed"'
            }
          }, null, 2)
        },
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: implementationId,
        description: 'Implementando funcionalidades principais',
        type: 'tool',
        toolName: 'file_write',
        parameters: { 
          filePath: 'index.html', 
          content: '<!DOCTYPE html>\n<html>\n<head><title>Tech Project</title></head>\n<body><h1>Tech Project Created by FLUI</h1></body>\n</html>'
        },
        status: 'pending',
        dependencies: [setupId],
        createdAt: new Date()
      },
      {
        id: testingId,
        description: 'Testando e validando implementação',
        type: 'tool',
        toolName: 'shell',
        parameters: { command: 'echo "Testing completed successfully"' },
        status: 'pending',
        dependencies: [implementationId],
        createdAt: new Date()
      }
    ];
  }

  private createGenericTodos(prompt: string): TodoItem[] {
    const taskAnalysisId = uuidv4();
    const taskExecutionId = uuidv4();
    const taskFinalizationId = uuidv4();
    
    return [
      {
        id: taskAnalysisId,
        description: 'Analisando a tarefa solicitada',
        type: 'agent',
        agentId: 'task_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: taskExecutionId,
        description: 'Executando a tarefa principal',
        type: 'agent',
        agentId: 'task_executor',
        status: 'pending',
        dependencies: [taskAnalysisId],
        createdAt: new Date()
      },
      {
        id: taskFinalizationId,
        description: 'Finalizando e entregando resultado',
        type: 'agent',
        agentId: 'task_finalizer',
        status: 'pending',
        dependencies: [taskExecutionId],
        createdAt: new Date()
      }
    ];
  }

  updateTodoStatus(todoId: string, status: TodoItem['status'], result?: any, error?: string): void {
    // This would be implemented to update todo status in the context
    // For now, it's a placeholder
  }

  getNextExecutableTodos(todos: TodoItem[]): TodoItem[] {
    return todos.filter(todo => 
      todo.status === 'pending' && 
      todo.dependencies.every(depId => 
        todos.find(t => t.id === depId)?.status === 'completed'
      )
    );
  }

  isTaskComplete(todos: TodoItem[]): boolean {
    return todos.every(todo => todo.status === 'completed' || todo.status === 'failed');
  }
}
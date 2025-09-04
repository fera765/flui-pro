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

    return complexity;
  }

  private createVideoCreationTodos(prompt: string): TodoItem[] {
    return [
      {
        id: uuidv4(),
        description: 'Analisando estrutura de roteiro de videos para tiktok',
        type: 'agent',
        agentId: 'script_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Pesquisando tendências atuais do TikTok',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: 'TikTok viral trends 2024', maxResults: 5 },
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Criando roteiro baseado nas tendências',
        type: 'agent',
        agentId: 'script_writer',
        status: 'pending',
        dependencies: ['script_analyst', 'trend_research'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Gerando ideias visuais e storyboard',
        type: 'agent',
        agentId: 'visual_creator',
        status: 'pending',
        dependencies: ['script_writer'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Criando arquivos de produção',
        type: 'tool',
        toolName: 'file_write',
        parameters: { filePath: 'script.md', content: 'Generated script content' },
        status: 'pending',
        dependencies: ['script_writer'],
        createdAt: new Date()
      }
    ];
  }

  private createResearchTodos(prompt: string): TodoItem[] {
    return [
      {
        id: uuidv4(),
        description: 'Definindo escopo da pesquisa',
        type: 'agent',
        agentId: 'research_planner',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Coletando informações relevantes',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: prompt, maxResults: 10 },
        status: 'pending',
        dependencies: ['research_planner'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Analisando e organizando dados',
        type: 'agent',
        agentId: 'data_analyst',
        status: 'pending',
        dependencies: ['data_collection'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Criando relatório final',
        type: 'agent',
        agentId: 'report_writer',
        status: 'pending',
        dependencies: ['data_analysis'],
        createdAt: new Date()
      }
    ];
  }

  private createContentCreationTodos(prompt: string): TodoItem[] {
    return [
      {
        id: uuidv4(),
        description: 'Analisando requisitos do conteúdo',
        type: 'agent',
        agentId: 'content_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Pesquisando referências e fontes',
        type: 'tool',
        toolName: 'web_search',
        parameters: { query: prompt, maxResults: 5 },
        status: 'pending',
        dependencies: ['content_analyst'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Criando estrutura do conteúdo',
        type: 'agent',
        agentId: 'content_planner',
        status: 'pending',
        dependencies: ['reference_research'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Escrevendo o conteúdo',
        type: 'agent',
        agentId: 'content_writer',
        status: 'pending',
        dependencies: ['content_structure'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Revisando e editando',
        type: 'agent',
        agentId: 'content_editor',
        status: 'pending',
        dependencies: ['content_writing'],
        createdAt: new Date()
      }
    ];
  }

  private createGenericTodos(prompt: string): TodoItem[] {
    return [
      {
        id: uuidv4(),
        description: 'Analisando a tarefa solicitada',
        type: 'agent',
        agentId: 'task_analyst',
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Executando a tarefa principal',
        type: 'agent',
        agentId: 'task_executor',
        status: 'pending',
        dependencies: ['task_analysis'],
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        description: 'Finalizando e entregando resultado',
        type: 'agent',
        agentId: 'task_finalizer',
        status: 'pending',
        dependencies: ['task_execution'],
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
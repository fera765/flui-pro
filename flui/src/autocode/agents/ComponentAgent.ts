import { injectable, inject } from 'inversify';
import { IAgent, AgentType, MicroTask, Task, ProjectState, AgentContext } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';

@injectable()
export class ComponentAgent implements IAgent {
  name: AgentType = 'ComponentAgent';
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
    // ComponentAgent pode lidar quando dependências estão instaladas mas componentes não existem
    return !!projectState.files['package.json'] && 
           !!projectState.files['node_modules'] && 
           !projectState.files['src/App.tsx'] && 
           !projectState.files['src/App.ts'] &&
           !projectState.files['src/App.jsx'] &&
           !projectState.files['src/App.js'];
  }

  getPriority(): number {
    return 3; // Terceira prioridade
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState } = context;
    const microTasks: MicroTask[] = [];

    try {
      // Analisar prompt para determinar componentes necessários
      const componentAnalysis = await this.analyzeComponentRequirements(task.prompt, projectState);
      
      // Gerar componentes baseados na análise
      for (const component of componentAnalysis.components) {
        const componentTask = await this.createComponentTask(component, task.id);
        microTasks.push(componentTask);
      }
      
      // Gerar arquivo principal (App.tsx, main.tsx, etc.)
      const mainFileTask = await this.createMainFileTask(componentAnalysis, task.id);
      microTasks.push(mainFileTask);
      
      // Armazenar memória emocional sobre criação de componentes
      await this.storeComponentCreationMemory(componentAnalysis, task.id);
      
    } catch (error) {
      console.error('Erro no ComponentAgent:', error);
    }

    return microTasks;
  }

  /**
   * Analisa prompt para determinar componentes necessários
   */
  private async analyzeComponentRequirements(prompt: string, projectState: ProjectState): Promise<{
    components: Array<{
      name: string;
      type: 'tsx' | 'ts' | 'jsx' | 'js';
      content: string;
      path: string;
    }>;
    mainFile: {
      name: string;
      content: string;
    };
    framework: string;
  }> {
    const analysisPrompt = `Analise o seguinte prompt e gere componentes React/TypeScript:

Prompt: "${prompt}"

Baseado no prompt, gere um JSON com:
{
  "components": [
    {
      "name": "nome_do_componente",
      "type": "tsx",
      "content": "código_do_componente",
      "path": "src/components/NomeComponente.tsx"
    }
  ],
  "mainFile": {
    "name": "App.tsx",
    "content": "código_do_arquivo_principal"
  },
  "framework": "react"
}

Gere componentes funcionais e completos baseados no prompt.`;

    try {
      const response = await this.llmService.generateResponse(analysisPrompt);
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      // Fallback para análise básica
      return this.fallbackComponentAnalysis(prompt);
    }
  }

  /**
   * Cria task para componente
   */
  private async createComponentTask(component: any, taskId: string): Promise<MicroTask> {
    return {
      id: `component-${component.name}-${Date.now()}`,
      type: 'file_create',
      path: component.path,
      newSnippet: component.content,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Cria task para arquivo principal
   */
  private async createMainFileTask(analysis: any, taskId: string): Promise<MicroTask> {
    return {
      id: `main-file-${Date.now()}`,
      type: 'file_create',
      path: `src/${analysis.mainFile.name}`,
      newSnippet: analysis.mainFile.content,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Armazena memória emocional sobre criação de componentes
   */
  private async storeComponentCreationMemory(analysis: any, taskId: string): Promise<void> {
    try {
      const context = `Criação de componentes para task ${taskId}`;
      const outcome = true;
      
      await this.emotionMemory.storeMemoryWithLLMAnalysis(
        `Criados ${analysis.components.length} componentes: ${analysis.components.map((c: any) => c.name).join(', ')}`,
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
  private fallbackComponentAnalysis(prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();
    
    // Determinar tipo de componente baseado no prompt
    let componentName = 'Counter';
    let componentContent = this.generateCounterComponent();
    
    if (lowerPrompt.includes('todo') || lowerPrompt.includes('lista')) {
      componentName = 'TodoList';
      componentContent = this.generateTodoListComponent();
    } else if (lowerPrompt.includes('form') || lowerPrompt.includes('formulário')) {
      componentName = 'Form';
      componentContent = this.generateFormComponent();
    } else if (lowerPrompt.includes('card') || lowerPrompt.includes('cartão')) {
      componentName = 'Card';
      componentContent = this.generateCardComponent();
    }
    
    return {
      components: [
        {
          name: componentName,
          type: 'tsx',
          content: componentContent,
          path: `src/components/${componentName}.tsx`
        }
      ],
      mainFile: {
        name: 'App.tsx',
        content: this.generateAppComponent(componentName)
      },
      framework: 'react'
    };
  }

  /**
   * Gera componente Counter
   */
  private generateCounterComponent(): string {
    return `import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export const Counter: React.FC<CounterProps> = ({ initialValue = 0 }) => {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <div className="buttons">
        <button onClick={decrement} className="btn btn-decrement">
          -
        </button>
        <button onClick={reset} className="btn btn-reset">
          Reset
        </button>
        <button onClick={increment} className="btn btn-increment">
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
  }

  /**
   * Gera componente TodoList
   */
  private generateTodoListComponent(): string {
    return `import React, { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      <div className="add-todo">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
        />
        <button onClick={addTodo} className="btn btn-add">
          Add
        </button>
      </div>
      <ul className="todos">
        {todos.map(todo => (
          <li key={todo.id} className={\`todo \${todo.completed ? 'completed' : ''}\`}>
            <span onClick={() => toggleTodo(todo.id)} className="todo-text">
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="btn btn-delete">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;`;
  }

  /**
   * Gera componente Form
   */
  private generateFormComponent(): string {
    return `import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export const Form: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Aqui você pode adicionar lógica para enviar o formulário
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Contact Form</h2>
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="form-textarea"
        />
      </div>
      <button type="submit" className="btn btn-submit">
        Submit
      </button>
    </form>
  );
};

export default Form;`;
  }

  /**
   * Gera componente Card
   */
  private generateCardComponent(): string {
    return `import React from 'react';

interface CardProps {
  title: string;
  content: string;
  image?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ title, content, image, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      {image && (
        <div className="card-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-text">{content}</p>
      </div>
    </div>
  );
};

export default Card;`;
  }

  /**
   * Gera componente App
   */
  private generateAppComponent(componentName: string): string {
    return `import React from 'react';
import ${componentName} from './components/${componentName}';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Flui Project</h1>
        <${componentName} />
      </header>
    </div>
  );
}

export default App;`;
  }
}
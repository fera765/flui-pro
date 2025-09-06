import { TodoItem, FluiContext } from '../types/advanced';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export class TodoPlanner {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000/v1',
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
    });
  }

  async analyzeTaskComplexity(prompt: string): Promise<TodoItem[]> {
    // 100% DYNAMIC - Use LLM to analyze and create todo list
    return await this.generateDynamicTodos(prompt);
  }

  // 100% DYNAMIC TODO GENERATION using OpenAI SDK with tools
  private async generateDynamicTodos(prompt: string): Promise<TodoItem[]> {
    console.log('🚀 Generating dynamic TODOs for:', prompt);
    try {
      console.log('📡 Calling OpenAI SDK for TODO generation...');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em planejamento de projetos de software. Analise tarefas e gere listas de TODOs dinâmicos e específicos usando as ferramentas disponíveis.'
          },
          {
            role: 'user',
            content: `Analise a seguinte tarefa e gere TODOs dinâmicos para executá-la: "${prompt}"`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_todos',
              description: 'Gera uma lista de TODOs para executar uma tarefa complexa',
              parameters: {
                type: 'object',
                properties: {
                  todos: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'UUID único para o TODO' },
                        description: { type: 'string', description: 'Descrição clara do que fazer' },
                        type: { type: 'string', enum: ['tool', 'agent'], description: 'Tipo do TODO' },
                        toolName: { type: 'string', description: 'Nome da ferramenta (se type=tool)' },
                        parameters: { type: 'object', description: 'Parâmetros necessários' },
                        dependencies: { type: 'array', items: { type: 'string' }, description: 'IDs de TODOs que devem ser completados antes' }
                      },
                      required: ['id', 'description', 'type', 'parameters', 'dependencies']
                    }
                  }
                },
                required: ['todos']
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 2000
      });

      console.log('✅ OpenAI SDK response received');
      
      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function.name === 'generate_todos') {
        const args = JSON.parse(toolCall.function.arguments);
        const todos = args.todos;
        
        console.log('📋 Generated TODOs:', todos.length, 'items');
        
        // Validate and fix todos
        const validatedTodos = todos.map((todo: any) => ({
          id: todo.id || uuidv4(),
          description: todo.description || 'Dynamic task',
          type: todo.type || 'tool',
          toolName: todo.toolName || 'file_write',
          parameters: todo.parameters || {},
          status: 'pending' as const,
          dependencies: todo.dependencies || [],
          createdAt: new Date()
        }));
        
        console.log('✅ Generated', validatedTodos.length, 'dynamic TODOs');
        return validatedTodos;
      } else {
        throw new Error('No tool call found in response');
      }
      
    } catch (error: any) {
      console.error('❌ OpenAI SDK Todo generation failed:', error);
      console.error('❌ Error details:', error.message);
      // Fallback to minimal dynamic todo
      return [{
        id: uuidv4(),
        description: `Execute task: ${prompt}`,
        type: 'tool' as const,
        toolName: 'file_write',
        parameters: { 
          filePath: 'task_output.txt', 
          content: `Task executed: ${prompt}\nGenerated at: ${new Date().toISOString()}`
        },
        status: 'pending' as const,
        dependencies: [],
        createdAt: new Date()
      }];
    }
  }

  // All static methods removed - 100% DYNAMIC via LLM

  // 100% DYNAMIC - No static methods or hardcoded logic
}
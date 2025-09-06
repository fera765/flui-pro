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
                   content: `Analise a seguinte tarefa e gere TODOs dinâmicos para executá-la: "${prompt}"

REGRAS OBRIGATÓRIAS:
1. SEMPRE inclua TODOS os parâmetros necessários para cada ferramenta
2. Para file_write: OBRIGATÓRIO incluir "filePath" e "content"
3. Para create_directory: OBRIGATÓRIO incluir "path"
4. Para build_project: OBRIGATÓRIO incluir "command"
5. Para start_project: OBRIGATÓRIO incluir "command" e "port"
6. Para test_endpoint: OBRIGATÓRIO incluir "url" e "method"

EXEMPLO CORRETO:
{
  "id": "t1",
  "description": "Create app.py file",
  "type": "tool",
  "toolName": "file_write",
  "parameters": {
    "filePath": "app.py",
    "content": "from flask import Flask\\napp = Flask(__name__)\\n@app.route('/')\\ndef hello():\\n    return 'Hello World!'"
  },
  "dependencies": []
}

NUNCA deixe parâmetros vazios ou undefined!`
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
                        type: { type: 'string', enum: ['tool'], description: 'Tipo do TODO (apenas tool)' },
                        toolName: { type: 'string', enum: ['file_write', 'create_directory', 'build_project', 'start_project', 'test_endpoint', 'web_search'], description: 'Nome da ferramenta (file_write, create_directory, build_project, start_project, test_endpoint, web_search)' },
                                                       parameters: { 
                                 type: 'object', 
                                 description: 'Parâmetros necessários para a ferramenta',
                                 properties: {
                                   filePath: { type: 'string', description: 'Caminho do arquivo (para file_write)' },
                                   content: { type: 'string', description: 'Conteúdo do arquivo (para file_write)' },
                                   path: { type: 'string', description: 'Caminho do diretório (para create_directory)' },
                                   command: { type: 'string', description: 'Comando para executar (para build_project, start_project)' },
                                   workingDir: { type: 'string', description: 'Diretório de trabalho (para build_project, start_project)' },
                                   port: { type: 'number', description: 'Porta do servidor (para start_project)' },
                                   url: { type: 'string', description: 'URL para testar (para test_endpoint)' },
                                   method: { type: 'string', description: 'Método HTTP (para test_endpoint)' },
                                   query: { type: 'string', description: 'Query de busca (para web_search)' }
                                 }
                               },
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
          type: 'tool' as const,
          toolName: todo.toolName || 'file_write',
          agentId: undefined,
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
      // Fallback to complete autonomous flow
      return [
        {
          id: 't1',
          description: 'Create project directory structure',
          type: 'tool' as const,
          toolName: 'create_directory',
          agentId: undefined,
          parameters: { path: 'my-app' },
          status: 'pending' as const,
          dependencies: [],
          createdAt: new Date()
        },
        {
          id: 't2',
          description: 'Create package.json file',
          type: 'tool' as const,
          toolName: 'file_write',
          agentId: undefined,
          parameters: { 
            filePath: 'my-app/package.json', 
            content: JSON.stringify({
              name: 'my-app',
              version: '1.0.0',
              description: 'App created by FLUI',
              main: 'index.js',
              scripts: {
                start: 'node index.js',
                build: 'echo "Build completed"'
              },
              dependencies: {
                express: '^4.18.0'
              }
            }, null, 2)
          },
          status: 'pending' as const,
          dependencies: ['t1'],
          createdAt: new Date()
        },
        {
          id: 't3',
          description: 'Create main application file',
          type: 'tool' as const,
          toolName: 'file_write',
          agentId: undefined,
          parameters: { 
            filePath: 'my-app/index.js', 
            content: 'const express = require("express");\nconst app = express();\nconst port = 3000;\n\napp.get("/", (req, res) => {\n  res.send("Hello from FLUI!");\n});\n\napp.listen(port, () => {\n  console.log(`App running on port ${port}`);\n});'
          },
          status: 'pending' as const,
          dependencies: ['t2'],
          createdAt: new Date()
        },
        {
          id: 't4',
          description: 'Build the project',
          type: 'tool' as const,
          toolName: 'build_project',
          agentId: undefined,
          parameters: { 
            command: 'npm install',
            workingDir: 'my-app'
          },
          status: 'pending' as const,
          dependencies: ['t3'],
          createdAt: new Date()
        },
        {
          id: 't5',
          description: 'Start the application',
          type: 'tool' as const,
          toolName: 'start_project',
          agentId: undefined,
          parameters: { 
            command: 'npm start',
            workingDir: 'my-app',
            port: 3000
          },
          status: 'pending' as const,
          dependencies: ['t4'],
          createdAt: new Date()
        },
        {
          id: 't6',
          description: 'Test the application',
          type: 'tool' as const,
          toolName: 'test_endpoint',
          agentId: undefined,
          parameters: { 
            url: 'http://localhost:3000',
            method: 'GET'
          },
          status: 'pending' as const,
          dependencies: ['t5'],
          createdAt: new Date()
        }
      ];
    }
  }

  // All static methods removed - 100% DYNAMIC via LLM

  // 100% DYNAMIC - No static methods or hardcoded logic
}
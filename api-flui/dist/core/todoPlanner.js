"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoPlanner = void 0;
const uuid_1 = require("uuid");
const openai_1 = __importDefault(require("openai"));
class TodoPlanner {
    constructor() {
        this.openai = new openai_1.default({
            baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000/v1',
            apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
        });
    }
    async analyzeTaskComplexity(prompt) {
        return await this.generateDynamicTodos(prompt);
    }
    async generateDynamicTodos(prompt) {
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

IMPORTANTE: 
1. Gere TODOs que criem arquivos físicos específicos
2. Use ferramentas como file_write para criar arquivos reais como package.json, index.html, App.js, etc.
3. SEMPRE inclua os parâmetros corretos para cada ferramenta:
   - Para file_write: sempre inclua "filePath" e "content" (para criar arquivos)
   - Para create_directory: sempre inclua "path" (para criar diretórios)
   - Para web_search: sempre inclua "query"
4. Use a ferramenta correta para cada tarefa:
   - Use create_directory para criar diretórios
   - Use file_write para criar arquivos
5. Use IDs únicos para cada TODO (ex: t1, t2, t3, etc.)
6. Defina dependências corretas entre TODOs`
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
                                                toolName: { type: 'string', enum: ['file_write', 'create_directory', 'web_search'], description: 'Nome da ferramenta (file_write, create_directory, web_search)' },
                                                parameters: {
                                                    type: 'object',
                                                    description: 'Parâmetros necessários para a ferramenta',
                                                    properties: {
                                                        filePath: { type: 'string', description: 'Caminho do arquivo (para file_write)' },
                                                        content: { type: 'string', description: 'Conteúdo do arquivo (para file_write)' },
                                                        path: { type: 'string', description: 'Caminho do diretório (para create_directory)' },
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
                const validatedTodos = todos.map((todo) => ({
                    id: todo.id || (0, uuid_1.v4)(),
                    description: todo.description || 'Dynamic task',
                    type: 'tool',
                    toolName: todo.toolName || 'file_write',
                    agentId: undefined,
                    parameters: todo.parameters || {},
                    status: 'pending',
                    dependencies: todo.dependencies || [],
                    createdAt: new Date()
                }));
                console.log('✅ Generated', validatedTodos.length, 'dynamic TODOs');
                return validatedTodos;
            }
            else {
                throw new Error('No tool call found in response');
            }
        }
        catch (error) {
            console.error('❌ OpenAI SDK Todo generation failed:', error);
            console.error('❌ Error details:', error.message);
            return [
                {
                    id: 't1',
                    description: 'Create package.json file',
                    type: 'tool',
                    toolName: 'file_write',
                    agentId: undefined,
                    parameters: {
                        filePath: 'package.json',
                        content: JSON.stringify({
                            name: 'react-app',
                            version: '1.0.0',
                            description: 'React app created by FLUI',
                            main: 'index.js',
                            scripts: {
                                start: 'react-scripts start',
                                build: 'react-scripts build'
                            },
                            dependencies: {
                                react: '^18.0.0',
                                'react-dom': '^18.0.0'
                            }
                        }, null, 2)
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date()
                },
                {
                    id: 't2',
                    description: 'Create index.html file',
                    type: 'tool',
                    toolName: 'file_write',
                    agentId: undefined,
                    parameters: {
                        filePath: 'index.html',
                        content: '<!DOCTYPE html>\n<html>\n<head><title>React App</title></head>\n<body><div id="root"></div></body>\n</html>'
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date()
                },
                {
                    id: 't3',
                    description: 'Create App.js file',
                    type: 'tool',
                    toolName: 'file_write',
                    agentId: undefined,
                    parameters: {
                        filePath: 'App.js',
                        content: 'import React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World from FLUI!</h1>\n    </div>\n  );\n}\n\nexport default App;'
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date()
                }
            ];
        }
    }
}
exports.TodoPlanner = TodoPlanner;
//# sourceMappingURL=todoPlanner.js.map
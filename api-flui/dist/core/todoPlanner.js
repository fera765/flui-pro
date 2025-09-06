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

IMPORTANTE: Gere TODOs que criem arquivos físicos específicos. Use ferramentas como file_write para criar arquivos reais como package.json, index.html, App.js, etc.`
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
            return [{
                    id: (0, uuid_1.v4)(),
                    description: `Execute task: ${prompt}`,
                    type: 'tool',
                    toolName: 'file_write',
                    agentId: undefined,
                    parameters: {
                        filePath: 'task_output.txt',
                        content: `Task executed: ${prompt}\nGenerated at: ${new Date().toISOString()}`
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date()
                }];
        }
    }
}
exports.TodoPlanner = TodoPlanner;
//# sourceMappingURL=todoPlanner.js.map
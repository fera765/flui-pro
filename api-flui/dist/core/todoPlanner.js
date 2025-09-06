"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoPlanner = void 0;
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
class TodoPlanner {
    async analyzeTaskComplexity(prompt) {
        return await this.generateDynamicTodos(prompt);
    }
    async generateDynamicTodos(prompt) {
        console.log('🚀 Generating dynamic TODOs for:', prompt);
        try {
            const llmPrompt = `Tarefa: "${prompt}"

Gere 3 TODOs em JSON. Formato:
[{"id":"1","description":"Setup projeto","type":"tool","toolName":"file_write","parameters":{"filePath":"package.json","content":"{}"},"status":"pending","dependencies":[],"createdAt":"2025-01-01T00:00:00.000Z"},{"id":"2","description":"Criar arquivo principal","type":"tool","toolName":"file_write","parameters":{"filePath":"index.js","content":"console.log('Hello')"},"status":"pending","dependencies":["1"],"createdAt":"2025-01-01T00:00:00.000Z"},{"id":"3","description":"Testar aplicação","type":"tool","toolName":"shell","parameters":{"command":"node index.js"},"status":"pending","dependencies":["2"],"createdAt":"2025-01-01T00:00:00.000Z"}]

Retorne APENAS JSON válido.`;
            console.log('📡 Calling LLM for TODO generation...');
            const response = await axios_1.default.post(`${process.env.OPENAI_BASE_URL || 'http://localhost:4000'}/v1/chat/completions`, {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um especialista em planejamento de projetos de software. Analise tarefas e gere listas de TODOs dinâmicos e específicos.'
                    },
                    {
                        role: 'user',
                        content: llmPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ LLM response received');
            const content = response.data.choices[0].message.content.trim();
            console.log('📝 LLM content:', content);
            const todos = JSON.parse(content);
            console.log('📋 Parsed TODOs:', todos.length, 'items');
            const validatedTodos = todos.map((todo) => ({
                id: todo.id || (0, uuid_1.v4)(),
                description: todo.description || 'Dynamic task',
                type: todo.type || 'tool',
                toolName: todo.toolName || 'file_write',
                parameters: todo.parameters || {},
                status: 'pending',
                dependencies: todo.dependencies || [],
                createdAt: new Date()
            }));
            console.log('✅ Generated', validatedTodos.length, 'dynamic TODOs');
            return validatedTodos;
        }
        catch (error) {
            console.error('❌ LLM Todo generation failed:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            return [{
                    id: (0, uuid_1.v4)(),
                    description: `Execute task: ${prompt}`,
                    type: 'tool',
                    toolName: 'file_write',
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
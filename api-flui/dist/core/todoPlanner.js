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
        try {
            const llmPrompt = `Analise a seguinte tarefa e gere uma lista de TODOs dinâmicos para executá-la:

TAREFA: "${prompt}"

Gere uma lista de TODOs em formato JSON que cubra todos os aspectos necessários para completar esta tarefa. Cada TODO deve ter:
- id: UUID único
- description: Descrição clara do que fazer
- type: "tool" ou "agent" 
- toolName: nome da ferramenta (se type="tool")
- parameters: parâmetros necessários
- status: "pending"
- dependencies: array de IDs de TODOs que devem ser completados antes
- createdAt: timestamp atual

IMPORTANTE:
- Seja específico e técnico
- Considere todas as tecnologias mencionadas
- Crie dependências lógicas entre os TODOs
- Use ferramentas reais como file_write, shell, web_search, etc.
- Retorne APENAS um JSON array válido

Exemplo de formato:
[
  {
    "id": "uuid-1",
    "description": "Criar estrutura do projeto",
    "type": "tool",
    "toolName": "file_write",
    "parameters": {"filePath": "package.json", "content": "..."},
    "status": "pending",
    "dependencies": [],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]`;
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
            const content = response.data.choices[0].message.content.trim();
            const todos = JSON.parse(content);
            return todos.map((todo) => ({
                id: todo.id || (0, uuid_1.v4)(),
                description: todo.description || 'Dynamic task',
                type: todo.type || 'tool',
                toolName: todo.toolName || 'file_write',
                parameters: todo.parameters || {},
                status: 'pending',
                dependencies: todo.dependencies || [],
                createdAt: new Date()
            }));
        }
        catch (error) {
            console.error('❌ LLM Todo generation failed:', error);
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
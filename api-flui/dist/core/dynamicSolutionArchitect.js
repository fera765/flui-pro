"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicSolutionArchitect = void 0;
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
class DynamicSolutionArchitect {
    constructor(dynamicIntelligence) {
        this.dynamicIntelligence = dynamicIntelligence;
    }
    async designSolution(intent, context) {
        try {
            const llmPrompt = `Analise o seguinte intent e contexto para projetar uma arquitetura de solução dinâmica:

INTENT: ${JSON.stringify(intent, null, 2)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Gere uma arquitetura de solução em formato JSON com:
- type: tipo do projeto
- framework: framework principal
- language: linguagem principal
- buildTool: ferramenta de build
- packageManager: gerenciador de pacotes
- dependencies: array de dependências
- devDependencies: array de dev dependencies
- scripts: objeto com scripts
- structure: estrutura do projeto
- validations: validações necessárias
- estimatedTime: tempo estimado em minutos

Retorne APENAS um JSON válido.`;
            const response = await axios_1.default.post(`${process.env.OPENAI_BASE_URL || 'http://localhost:4000'}/v1/chat/completions`, {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um arquiteto de software especialista. Analise intents e gere arquiteturas de solução dinâmicas e específicas.'
                    },
                    {
                        role: 'user',
                        content: llmPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1500
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const content = response.data.choices[0].message.content.trim();
            return JSON.parse(content);
        }
        catch (error) {
            console.error('❌ LLM Solution design failed:', error);
            return {
                type: intent.domain || 'web',
                framework: intent.technology || 'vanilla',
                language: intent.language || 'javascript',
                buildTool: 'npm',
                packageManager: 'npm',
                dependencies: [],
                devDependencies: [],
                scripts: {},
                structure: { directories: [], files: [], entryPoint: '', configFiles: [] },
                validations: [],
                estimatedTime: 30
            };
        }
    }
    async generateDynamicTasks(intent, context) {
        try {
            const llmPrompt = `Analise o seguinte intent e contexto para gerar tarefas dinâmicas:

INTENT: ${JSON.stringify(intent, null, 2)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Gere uma lista de tarefas dinâmicas em formato JSON. Cada tarefa deve ter:
- id: UUID único
- description: descrição clara
- type: "tool" ou "agent"
- toolName: nome da ferramenta (se type="tool")
- parameters: parâmetros necessários
- status: "pending"
- dependencies: array de IDs
- createdAt: timestamp
- projectPhase: fase do projeto

Retorne APENAS um JSON array válido.`;
            const response = await axios_1.default.post(`${process.env.OPENAI_BASE_URL || 'http://localhost:4000'}/v1/chat/completions`, {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um especialista em planejamento de projetos. Analise intents e gere listas de tarefas dinâmicas e específicas.'
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
            const tasks = JSON.parse(content);
            return tasks.map((task) => ({
                id: task.id || (0, uuid_1.v4)(),
                description: task.description || 'Dynamic task',
                type: task.type || 'tool',
                toolName: task.toolName || 'file_write',
                parameters: task.parameters || {},
                status: 'pending',
                dependencies: task.dependencies || [],
                createdAt: new Date(),
                projectPhase: task.projectPhase || 'implementation'
            }));
        }
        catch (error) {
            console.error('❌ LLM Task generation failed:', error);
            return [{
                    id: (0, uuid_1.v4)(),
                    description: `Execute: ${intent.domain} project`,
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: 'project.txt',
                        content: `Project: ${intent.domain}\nTechnology: ${intent.technology}\nGenerated: ${new Date().toISOString()}`
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                }];
        }
    }
}
exports.DynamicSolutionArchitect = DynamicSolutionArchitect;
//# sourceMappingURL=dynamicSolutionArchitect.js.map
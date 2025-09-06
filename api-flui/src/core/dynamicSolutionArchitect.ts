import { v4 as uuidv4 } from 'uuid';
import { Intent, SolutionArchitecture, ContextAnalysis, DynamicTask } from '../types/dynamic';
import { DynamicIntelligence } from './dynamicIntelligence';
import OpenAI from 'openai';

export class DynamicSolutionArchitect {
  private dynamicIntelligence: DynamicIntelligence;
  private openai: OpenAI;

  constructor(dynamicIntelligence: DynamicIntelligence) {
    this.dynamicIntelligence = dynamicIntelligence;
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000/v1',
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
    });
  }

  // 100% DYNAMIC SOLUTION DESIGN using OpenAI SDK with tools
  async designSolution(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um arquiteto de software especialista. Analise intents e gere arquiteturas de solução dinâmicas e específicas usando as ferramentas disponíveis.'
          },
          {
            role: 'user',
            content: `Analise o seguinte intent e contexto para projetar uma arquitetura de solução dinâmica:\n\nINTENT: ${JSON.stringify(intent, null, 2)}\nCONTEXT: ${JSON.stringify(context, null, 2)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'design_solution_architecture',
              description: 'Projeta uma arquitetura de solução dinâmica baseada no intent e contexto',
              parameters: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Tipo do projeto' },
                  framework: { type: 'string', description: 'Framework principal' },
                  language: { type: 'string', description: 'Linguagem principal' },
                  buildTool: { type: 'string', description: 'Ferramenta de build' },
                  packageManager: { type: 'string', description: 'Gerenciador de pacotes' },
                  dependencies: { type: 'array', items: { type: 'string' }, description: 'Array de dependências' },
                  devDependencies: { type: 'array', items: { type: 'string' }, description: 'Array de dev dependencies' },
                  scripts: { type: 'object', description: 'Objeto com scripts' },
                  structure: { 
                    type: 'object', 
                    properties: {
                      directories: { type: 'array', items: { type: 'string' } },
                      files: { type: 'array', items: { type: 'string' } },
                      entryPoint: { type: 'string' },
                      configFiles: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  validations: { type: 'array', items: { type: 'string' }, description: 'Validações necessárias' },
                  estimatedTime: { type: 'number', description: 'Tempo estimado em minutos' }
                },
                required: ['type', 'framework', 'language', 'buildTool', 'packageManager', 'dependencies', 'devDependencies', 'scripts', 'structure', 'validations', 'estimatedTime']
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 1500
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function.name === 'design_solution_architecture') {
        return JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error('No tool call found in response');
      }
      
    } catch (error: any) {
      console.error('❌ OpenAI SDK Solution design failed:', error);
      // Fallback to minimal dynamic solution
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

  // 100% DYNAMIC TASK GENERATION using OpenAI SDK with tools
  async generateDynamicTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em planejamento de projetos. Analise intents e gere listas de tarefas dinâmicas e específicas usando as ferramentas disponíveis.'
          },
          {
            role: 'user',
            content: `Analise o seguinte intent e contexto para gerar tarefas dinâmicas:\n\nINTENT: ${JSON.stringify(intent, null, 2)}\nCONTEXT: ${JSON.stringify(context, null, 2)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_dynamic_tasks',
              description: 'Gera uma lista de tarefas dinâmicas baseada no intent e contexto',
              parameters: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'UUID único para a tarefa' },
                        description: { type: 'string', description: 'Descrição clara da tarefa' },
                        type: { type: 'string', enum: ['tool', 'agent'], description: 'Tipo da tarefa' },
                        toolName: { type: 'string', description: 'Nome da ferramenta (se type=tool)' },
                        parameters: { type: 'object', description: 'Parâmetros necessários' },
                        dependencies: { type: 'array', items: { type: 'string' }, description: 'IDs de tarefas que devem ser completadas antes' },
                        projectPhase: { type: 'string', description: 'Fase do projeto' }
                      },
                      required: ['id', 'description', 'type', 'parameters', 'dependencies', 'projectPhase']
                    }
                  }
                },
                required: ['tasks']
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 2000
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function.name === 'generate_dynamic_tasks') {
        const args = JSON.parse(toolCall.function.arguments);
        const tasks = args.tasks;
        
        return tasks.map((task: any) => ({
          id: task.id || uuidv4(),
          description: task.description || 'Dynamic task',
          type: task.type || 'tool',
          toolName: task.toolName || 'file_write',
          parameters: task.parameters || {},
          status: 'pending' as const,
          dependencies: task.dependencies || [],
          createdAt: new Date(),
          projectPhase: task.projectPhase || 'implementation'
        }));
      } else {
        throw new Error('No tool call found in response');
      }
      
    } catch (error: any) {
      console.error('❌ OpenAI SDK Task generation failed:', error);
      // Fallback to minimal dynamic task
      return [{
        id: uuidv4(),
        description: `Execute: ${intent.domain} project`,
        type: 'tool' as const,
        toolName: 'file_write',
        parameters: { 
          filePath: 'project.txt', 
          content: `Project: ${intent.domain}\nTechnology: ${intent.technology}\nGenerated: ${new Date().toISOString()}`
        },
        status: 'pending' as const,
        dependencies: [],
        createdAt: new Date(),
        projectPhase: 'implementation'
      }];
    }
  }

  // All static methods removed - 100% DYNAMIC via LLM
}

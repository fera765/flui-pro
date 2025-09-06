import { Task } from '../types';
import { PollinationsTool } from '../tools/pollinationsTool';

export interface Plan {
  subtasks: Array<{
    id: string;
    type: string;
    prompt: string;
    dependencies: string[];
  }>;
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
}

export class Planner {
  private pollinationsTool: PollinationsTool;

  constructor() {
    this.pollinationsTool = new PollinationsTool();
  }

  async createPlan(task: Task): Promise<Plan> {
    try {
      // Create planning tools for the LLM
      const planningTools = [
        {
          type: "function",
          function: {
            name: "create_plan",
            description: "Create a detailed execution plan for a task",
            parameters: {
              type: "object",
              properties: {
                subtasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", description: "Unique identifier for the subtask" },
                      type: { type: "string", description: "Type of subtask (text_generation, image_generation, audio, etc.)" },
                      prompt: { type: "string", description: "Clear prompt for the subtask" },
                      dependencies: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "Array of subtask IDs this subtask depends on"
                      }
                    },
                    required: ["id", "type", "prompt", "dependencies"]
                  },
                  description: "Array of subtasks to execute"
                },
                estimatedDuration: {
                  type: "number",
                  description: "Estimated duration in milliseconds"
                },
                complexity: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  description: "Complexity level of the overall plan"
                }
              },
              required: ["subtasks", "estimatedDuration", "complexity"]
            }
          }
        }
      ];

      const planningPrompt = `
Analise a seguinte tarefa e crie um plano detalhado de execução usando a função de planejamento.

Tarefa: "${task.prompt}"
Tipo: ${task.type}
Subtipo: ${task.metadata?.classification?.subtype || 'N/A'}
Profundidade: ${task.depth}

Crie um plano que:
1. Quebre a tarefa em subtarefas lógicas e executáveis
2. Identifique dependências entre subtarefas
3. Estime a duração total
4. Avalie a complexidade geral

Considere:
- Se a tarefa envolve múltiplas etapas, crie subtarefas sequenciais
- Se a tarefa pode ser paralelizada, crie subtarefas independentes
- Se a tarefa é simples, crie apenas uma subtarefa
- Use IDs únicos para cada subtarefa (subtask-1, subtask-2, etc.)
- Para dependências, use os IDs das subtarefas que devem ser executadas primeiro

IMPORTANTE: Use a função create_plan para estruturar sua resposta.
`;

      const response = await this.pollinationsTool.generateTextWithTools(planningPrompt, planningTools, {
        temperature: 0.3,
        maxTokens: 1000
      });

      // Check if the LLM used the planning tool
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCall = response.toolCalls[0];
        if (toolCall.function.name === 'create_plan') {
          const plan = JSON.parse(toolCall.function.arguments);
          
          // Validate the plan structure
          if (this.isValidPlan(plan)) {
            return plan;
          }
        }
      }

      // Fallback to simple plan if LLM response is invalid
      return this.createSimplePlan(task);
      
    } catch (error) {
      console.error('Error in LLM planning:', error);
      return this.createSimplePlan(task);
    }
  }

  private createSimplePlan(task: Task): Plan {
    return {
      subtasks: [{
        id: 'subtask-1',
        type: 'single',
        prompt: task.prompt,
        dependencies: []
      }],
      estimatedDuration: 30000,
      complexity: 'low'
    };
  }

  private isValidPlan(plan: any): boolean {
    return (
      plan &&
      typeof plan === 'object' &&
      Array.isArray(plan.subtasks) &&
      typeof plan.estimatedDuration === 'number' &&
      ['low', 'medium', 'high'].includes(plan.complexity)
    );
  }

  async validatePlan(plan: Plan): Promise<boolean> {
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const subtask of plan.subtasks) {
      if (this.hasCircularDependency(subtask.id, plan.subtasks, visited, recursionStack)) {
        return false;
      }
    }
    
    return true;
  }

  private hasCircularDependency(
    subtaskId: string,
    subtasks: Plan['subtasks'],
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(subtaskId)) {
      return true;
    }
    
    if (visited.has(subtaskId)) {
      return false;
    }
    
    visited.add(subtaskId);
    recursionStack.add(subtaskId);
    
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      for (const dependency of subtask.dependencies) {
        if (this.hasCircularDependency(dependency, subtasks, visited, recursionStack)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(subtaskId);
    return false;
  }
}
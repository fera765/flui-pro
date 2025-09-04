import { Task } from '../types';

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
  async createPlan(task: Task): Promise<Plan> {
    const prompt = task.prompt.toLowerCase();
    
    if (prompt.includes('first') && prompt.includes('then')) {
      return this.createSequentialPlan(task);
    }
    
    if (prompt.includes('and') && (prompt.includes('generate') || prompt.includes('create'))) {
      return this.createParallelPlan(task);
    }
    
    // Default simple plan
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

  private createSequentialPlan(task: Task): Plan {
    const parts = task.prompt.split(/\s+(?:then|after that|finally|and then)\s+/i);
    
    const subtasks = parts.map((part, index) => ({
      id: `subtask-${index + 1}`,
      type: this.determineSubtaskType(part),
      prompt: part.trim(),
      dependencies: index === 0 ? [] : [`subtask-${index}`]
    }));

    return {
      subtasks,
      estimatedDuration: subtasks.length * 30000,
      complexity: subtasks.length > 2 ? 'high' : 'medium'
    };
  }

  private createParallelPlan(task: Task): Plan {
    const parts = task.prompt.split(/\s+and\s+/i);
    
    const subtasks = parts.map((part, index) => ({
      id: `subtask-${index + 1}`,
      type: this.determineSubtaskType(part),
      prompt: part.trim(),
      dependencies: []
    }));

    return {
      subtasks,
      estimatedDuration: Math.max(...subtasks.map(() => 30000)),
      complexity: subtasks.length > 2 ? 'high' : 'medium'
    };
  }

  private determineSubtaskType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('image') || lowerPrompt.includes('generate') || lowerPrompt.includes('create')) {
      return 'image_generation';
    }
    
    if (lowerPrompt.includes('story') || lowerPrompt.includes('write') || lowerPrompt.includes('text')) {
      return 'text_generation';
    }
    
    if (lowerPrompt.includes('audio') || lowerPrompt.includes('speech') || lowerPrompt.includes('voice')) {
      return 'audio_generation';
    }
    
    return 'general';
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
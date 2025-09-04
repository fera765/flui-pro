"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Planner = void 0;
class Planner {
    async createPlan(task) {
        const prompt = task.prompt.toLowerCase();
        if (prompt.includes('first') && prompt.includes('then')) {
            return this.createSequentialPlan(task);
        }
        if (prompt.includes('and') && (prompt.includes('generate') || prompt.includes('create'))) {
            return this.createParallelPlan(task);
        }
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
    async validatePlan(plan) {
        const visited = new Set();
        const recursionStack = new Set();
        for (const subtask of plan.subtasks) {
            if (this.hasCircularDependency(subtask.id, plan.subtasks, visited, recursionStack)) {
                return false;
            }
        }
        return true;
    }
    createSequentialPlan(task) {
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
    createParallelPlan(task) {
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
    determineSubtaskType(prompt) {
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
    hasCircularDependency(subtaskId, subtasks, visited, recursionStack) {
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
exports.Planner = Planner;
//# sourceMappingURL=planner.js.map
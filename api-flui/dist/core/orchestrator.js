"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
const uuid_1 = require("uuid");
class Orchestrator {
    constructor(config, classifier, planner, worker, supervisor) {
        this.config = config;
        this.classifier = classifier;
        this.planner = planner;
        this.worker = worker;
        this.supervisor = supervisor;
        this.tasks = new Map();
        this.events = new Map();
    }
    async createTask(prompt) {
        const classification = this.classifier.classifyTask(prompt);
        const task = {
            id: (0, uuid_1.v4)(),
            type: classification.type,
            prompt,
            status: 'pending',
            depth: 0,
            retries: 0,
            maxRetries: this.config.maxRetries,
            maxDepth: this.config.maxDepth,
            createdAt: new Date(),
            updatedAt: new Date(),
            childTasks: [],
            metadata: {
                classification,
                ...classification.parameters
            }
        };
        this.tasks.set(task.id, task);
        this.emitEvent(task.id, 'task_created', { task });
        return task;
    }
    async executeTask(taskId) {
        const task = this.getTask(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        if (task.status === 'completed') {
            return {
                success: true,
                data: task.result,
                metadata: task.metadata
            };
        }
        if (task.status === 'failed' && task.retries >= task.maxRetries) {
            return {
                success: false,
                error: task.error || 'Max retries exceeded',
                metadata: task.metadata
            };
        }
        try {
            this.updateTaskStatus(taskId, 'running');
            this.emitEvent(taskId, 'task_started', { task });
            if (task.depth >= this.config.maxDepth) {
                throw new Error('Max depth exceeded');
            }
            const result = await this.worker.executeTask(task);
            if (result.success) {
                this.updateTaskStatus(taskId, 'completed', result.data);
                this.emitEvent(taskId, 'task_completed', { task, result });
            }
            else {
                throw new Error(result.error || 'Task execution failed');
            }
            return result;
        }
        catch (error) {
            const errorMessage = error.message || 'Unknown error';
            this.updateTaskStatus(taskId, 'failed', undefined, errorMessage);
            this.emitEvent(taskId, 'task_failed', { task, error: errorMessage });
            return {
                success: false,
                error: errorMessage,
                metadata: task.metadata
            };
        }
    }
    async delegateTask(taskId) {
        const task = this.getTask(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        try {
            const plan = await this.planner.createPlan(task);
            if (!this.worker.isAvailable()) {
                throw new Error('No workers available');
            }
            const subtasks = [];
            for (const subtaskPlan of plan.subtasks) {
                const subtask = await this.createTask(subtaskPlan.prompt);
                subtask.parentTaskId = taskId;
                subtask.depth = task.depth + 1;
                task.childTasks.push(subtask.id);
                subtasks.push(subtask);
            }
            this.updateTask(taskId, { childTasks: task.childTasks });
            this.emitEvent(taskId, 'task_delegated', { task, subtasks });
            return {
                success: true,
                data: { subtasks: subtasks.map(t => ({ id: t.id, prompt: t.prompt })) },
                metadata: { plan, subtaskCount: subtasks.length }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Delegation failed',
                metadata: { taskId }
            };
        }
    }
    async retryTask(taskId) {
        const task = this.getTask(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        if (task.retries >= task.maxRetries) {
            return {
                success: false,
                error: 'Max retries exceeded',
                metadata: { taskId, retries: task.retries, maxRetries: task.maxRetries }
            };
        }
        this.updateTask(taskId, {
            status: 'pending',
            retries: task.retries + 1,
            updatedAt: new Date()
        });
        this.emitEvent(taskId, 'task_retried', { task, retryCount: task.retries + 1 });
        return this.executeTask(taskId);
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getTaskStatus(taskId) {
        const task = this.getTask(taskId);
        if (!task)
            return null;
        const progress = this.calculateProgress(task);
        const estimatedCompletion = this.estimateCompletion(task);
        return {
            id: task.id,
            status: task.status,
            progress,
            estimatedCompletion,
            metadata: task.metadata
        };
    }
    listTasks(filter) {
        let tasks = Array.from(this.tasks.values());
        if (filter?.status) {
            tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter?.type) {
            tasks = tasks.filter(t => t.type === filter.type);
        }
        if (filter?.depth !== undefined) {
            tasks = tasks.filter(t => t.depth === filter.depth);
        }
        return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    getTaskEvents(taskId) {
        return this.events.get(taskId) || [];
    }
    updateTaskStatus(taskId, status, result, error) {
        const task = this.getTask(taskId);
        if (!task)
            return;
        task.status = status;
        task.updatedAt = new Date();
        if (result !== undefined) {
            task.result = result;
        }
        if (error !== undefined) {
            task.error = error;
        }
        if (status === 'completed') {
            task.completedAt = new Date();
        }
        this.tasks.set(taskId, task);
    }
    updateTask(taskId, updates) {
        const task = this.getTask(taskId);
        if (!task)
            return;
        Object.assign(task, updates);
        task.updatedAt = new Date();
        this.tasks.set(taskId, task);
    }
    calculateProgress(task) {
        if (task.status === 'completed')
            return 100;
        if (task.status === 'failed')
            return 0;
        if (task.status === 'running')
            return 50;
        return 0;
    }
    estimateCompletion(task) {
        const now = new Date();
        if (task.status === 'completed')
            return task.completedAt;
        if (task.status === 'failed')
            return now;
        const baseTime = 30000;
        const complexityMultiplier = Math.pow(2, task.depth);
        const estimatedMs = baseTime * complexityMultiplier;
        return new Date(now.getTime() + estimatedMs);
    }
    emitEvent(taskId, eventType, data) {
        const event = {
            id: (0, uuid_1.v4)(),
            taskId,
            type: eventType,
            timestamp: new Date(),
            data
        };
        if (!this.events.has(taskId)) {
            this.events.set(taskId, []);
        }
        this.events.get(taskId).push(event);
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=orchestrator.js.map
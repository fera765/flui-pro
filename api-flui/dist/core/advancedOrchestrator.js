"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedOrchestrator = void 0;
const uuid_1 = require("uuid");
const todoPlanner_1 = require("./todoPlanner");
const fluiContext_1 = require("./fluiContext");
const autonomousAgent_1 = require("../agents/autonomousAgent");
const specializedAgents_1 = require("../agents/specializedAgents");
const advancedTools_1 = require("../tools/advancedTools");
const autoCorrection_1 = require("./autoCorrection");
const fileGenerator_1 = require("./fileGenerator");
const path = __importStar(require("path"));
class AdvancedOrchestrator {
    constructor(config, classifier, planner, worker, supervisor) {
        this.config = config;
        this.classifier = classifier;
        this.planner = planner;
        this.worker = worker;
        this.supervisor = supervisor;
        this.tasks = new Map();
        this.events = new Map();
        this.agents = new Map();
        const workingDir = path.join(process.cwd(), 'flui-projects', (0, uuid_1.v4)());
        this.tools = new advancedTools_1.AdvancedTools(workingDir);
        this.contextManager = new fluiContext_1.FluiContextManager('', workingDir);
        this.todoPlanner = new todoPlanner_1.TodoPlanner();
        this.autoCorrection = new autoCorrection_1.AutoCorrectionSystem(workingDir);
        this.fileGenerator = new fileGenerator_1.FileGenerator();
        this.initializeAgents();
    }
    initializeAgents() {
        const agents = specializedAgents_1.SpecializedAgents.getAllAgents();
        agents.forEach(agent => {
            this.agents.set(agent.id, agent);
        });
    }
    async createTask(prompt) {
        const classification = this.classifier.classifyTask(prompt);
        if (classification.type === 'conversation') {
            return this.createSimpleTask(prompt, classification);
        }
        else {
            return this.createComplexTask(prompt, classification);
        }
    }
    async createSimpleTask(prompt, classification) {
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
                isSimple: true
            }
        };
        this.tasks.set(task.id, task);
        return task;
    }
    async createComplexTask(prompt, classification) {
        this.contextManager = new fluiContext_1.FluiContextManager(prompt, this.contextManager.getWorkingDirectory());
        await this.contextManager.ensureWorkingDirectory();
        const projectPath = await this.fileGenerator.createProjectStructure(this.contextManager.getContext());
        const todos = await this.todoPlanner.analyzeTaskComplexity(prompt);
        this.contextManager.addTodos(todos);
        const task = {
            id: this.contextManager.getContext().mainTaskId,
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
                isSimple: false,
                projectPath,
                todoCount: todos.length
            }
        };
        this.tasks.set(task.id, task);
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
            if (task.metadata.isSimple) {
                const result = await this.worker.executeTask(task);
                return this.handleSimpleTaskResult(taskId, result);
            }
            else {
                const result = await this.executeComplexTask(task);
                return this.handleComplexTaskResult(taskId, result);
            }
        }
        catch (error) {
            this.updateTaskStatus(taskId, 'failed', undefined, error.message);
            this.emitEvent(taskId, 'task_failed', { task, error: error.message });
            return {
                success: false,
                error: error.message,
                metadata: task.metadata
            };
        }
    }
    async executeComplexTask(task) {
        const context = this.contextManager.getContext();
        let completedTodos = 0;
        const totalTodos = context.todos.length;
        while (!this.contextManager.isTaskComplete()) {
            const executableTodos = this.contextManager.getNextExecutableTodos();
            if (executableTodos.length === 0) {
                const failedTodos = context.todos.filter(todo => todo.status === 'failed' &&
                    todo.dependencies.every(depId => context.todos.find(t => t.id === depId)?.status === 'completed'));
                if (failedTodos.length === 0) {
                    break;
                }
                for (const todo of failedTodos) {
                    const retrySuccess = await this.autoCorrection.retryFailedTodo(todo, context);
                    if (retrySuccess) {
                        executableTodos.push(todo);
                    }
                }
            }
            const executionPromises = executableTodos.map(todo => this.executeTodo(todo, context));
            await Promise.all(executionPromises);
            completedTodos = context.completedTasks.length;
            this.emitEvent(task.id, 'progress_update', {
                completed: completedTodos,
                total: totalTodos,
                progress: (completedTodos / totalTodos) * 100
            });
        }
        await this.generateFinalDeliverables(context);
        return {
            success: true,
            data: {
                message: 'Complex task completed successfully',
                projectPath: context.workingDirectory,
                generatedFiles: context.generatedFiles,
                summary: this.contextManager.generateSummary()
            },
            metadata: {
                type: 'complex_task',
                completedTodos: context.completedTasks.length,
                totalTodos: context.todos.length,
                generatedFiles: context.generatedFiles.length
            }
        };
    }
    async executeTodo(todo, context) {
        try {
            this.contextManager.updateTodoStatus(todo.id, 'running');
            this.emitEvent(context.mainTaskId, 'todo_started', { todo });
            let result;
            if (todo.type === 'agent') {
                result = await this.executeAgentTodo(todo, context);
            }
            else if (todo.type === 'tool') {
                result = await this.executeToolTodo(todo, context);
            }
            this.contextManager.updateTodoStatus(todo.id, 'completed', result);
            this.emitEvent(context.mainTaskId, 'todo_completed', { todo, result });
        }
        catch (error) {
            this.contextManager.updateTodoStatus(todo.id, 'failed', undefined, error.message);
            this.emitEvent(context.mainTaskId, 'todo_failed', { todo, error: error.message });
            const analysis = await this.autoCorrection.analyzeError(error.message, context);
            if (analysis.shouldRetry) {
                await this.autoCorrection.executeCorrection(analysis.solution, context);
            }
        }
    }
    async executeAgentTodo(todo, context) {
        const agent = this.agents.get(todo.agentId);
        if (!agent) {
            throw new Error(`Agent ${todo.agentId} not found`);
        }
        const availableTools = this.tools.getAllTools();
        const autonomousAgent = new autonomousAgent_1.AutonomousAgent(agent, availableTools);
        const agentTask = this.contextManager.createAgentTask(agent.id, todo.description, agent.tools);
        const response = await autonomousAgent.executeTask(agentTask);
        if (!response.success) {
            throw new Error(response.error || 'Agent execution failed');
        }
        this.contextManager.updateGlobalContext(`Agent ${agent.name}: ${response.data}`);
        return response.data;
    }
    async executeToolTodo(todo, context) {
        const tool = this.tools.getAllTools().find(t => t.name === todo.toolName);
        if (!tool) {
            throw new Error(`Tool ${todo.toolName} not found`);
        }
        const result = await tool.execute(todo.parameters || {});
        if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
        }
        this.contextManager.updateGlobalContext(`Tool ${tool.name}: ${result.context}`);
        return result.data;
    }
    async generateFinalDeliverables(context) {
        await this.fileGenerator.createProjectSummary(context);
        await this.contextManager.saveContextToFile();
    }
    async handleSimpleTaskResult(taskId, result) {
        if (result.success) {
            this.updateTaskStatus(taskId, 'completed', result.data);
            this.emitEvent(taskId, 'task_completed', { result });
        }
        else {
            this.updateTaskStatus(taskId, 'failed', undefined, result.error);
            this.emitEvent(taskId, 'task_failed', { error: result.error });
        }
        return result;
    }
    async handleComplexTaskResult(taskId, result) {
        if (result.success) {
            this.updateTaskStatus(taskId, 'completed', result.data);
            this.emitEvent(taskId, 'task_completed', { result });
        }
        else {
            this.updateTaskStatus(taskId, 'failed', undefined, result.error);
            this.emitEvent(taskId, 'task_failed', { error: result.error });
        }
        return result;
    }
    updateTaskStatus(taskId, status, result, error) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = status;
            task.updatedAt = new Date();
            if (result)
                task.result = result;
            if (error)
                task.error = error;
        }
    }
    emitEvent(taskId, eventType, data) {
        if (!this.events.has(taskId)) {
            this.events.set(taskId, []);
        }
        const event = {
            id: (0, uuid_1.v4)(),
            type: eventType,
            timestamp: new Date(),
            data
        };
        this.events.get(taskId).push(event);
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    getTaskEvents(taskId) {
        return this.events.get(taskId) || [];
    }
    getContext(taskId) {
        const task = this.tasks.get(taskId);
        if (task && !task.metadata.isSimple) {
            return this.contextManager.getContext();
        }
        return undefined;
    }
}
exports.AdvancedOrchestrator = AdvancedOrchestrator;
//# sourceMappingURL=advancedOrchestrator.js.map
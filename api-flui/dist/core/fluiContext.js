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
exports.FluiContextManager = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FluiContextManager {
    constructor(mainTask, workingDirectory) {
        this.context = {
            mainTask,
            mainTaskId: (0, uuid_1.v4)(),
            todos: [],
            completedTasks: [],
            globalContext: '',
            collectedData: {},
            workingDirectory,
            generatedFiles: []
        };
    }
    getContext() {
        return this.context;
    }
    updateGlobalContext(newContext) {
        this.context.globalContext += `\n${new Date().toISOString()}: ${newContext}`;
    }
    addCollectedData(key, data) {
        this.context.collectedData[key] = data;
    }
    getCollectedData(key) {
        return this.context.collectedData[key];
    }
    getAllCollectedData() {
        return this.context.collectedData;
    }
    addTodo(todo) {
        this.context.todos.push(todo);
    }
    addTodos(todos) {
        this.context.todos.push(...todos);
    }
    updateTodoStatus(todoId, status, result, error) {
        const todo = this.context.todos.find(t => t.id === todoId);
        if (todo) {
            todo.status = status;
            if (result)
                todo.result = result;
            if (error)
                todo.error = error;
            if (status === 'completed' || status === 'failed') {
                todo.completedAt = new Date();
                this.context.completedTasks.push(todo);
            }
        }
    }
    getNextExecutableTodos() {
        return this.context.todos.filter(todo => todo.status === 'pending' &&
            todo.dependencies.every(depId => this.context.todos.find(t => t.id === depId)?.status === 'completed'));
    }
    isTaskComplete() {
        return this.context.todos.every(todo => todo.status === 'completed' || todo.status === 'failed');
    }
    addGeneratedFile(filePath) {
        this.context.generatedFiles.push(filePath);
    }
    getGeneratedFiles() {
        return this.context.generatedFiles;
    }
    async saveContextToFile() {
        const contextFile = path.join(this.context.workingDirectory, 'flui_context.json');
        await fs.writeFile(contextFile, JSON.stringify(this.context, null, 2), 'utf-8');
    }
    async loadContextFromFile() {
        const contextFile = path.join(this.context.workingDirectory, 'flui_context.json');
        try {
            const data = await fs.readFile(contextFile, 'utf-8');
            this.context = JSON.parse(data);
        }
        catch (error) {
        }
    }
    generateSummary() {
        const completedCount = this.context.completedTasks.length;
        const totalCount = this.context.todos.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return `
# Flui Task Summary

## Main Task
${this.context.mainTask}

## Progress
- Completed: ${completedCount}/${totalCount} (${progress.toFixed(1)}%)
- Generated Files: ${this.context.generatedFiles.length}

## Global Context
${this.context.globalContext}

## Collected Data
${Object.keys(this.context.collectedData).length} data points collected

## Generated Files
${this.context.generatedFiles.map(file => `- ${file}`).join('\n')}
    `.trim();
    }
    createAgentTask(agentId, prompt, tools) {
        return {
            id: (0, uuid_1.v4)(),
            agentId,
            prompt,
            context: this.context.globalContext,
            systemPrompt: `You are working on: ${this.context.mainTask}\n\nContext: ${this.context.globalContext}`,
            tools,
            status: 'pending',
            createdAt: new Date()
        };
    }
    updateCurrentAgent(agentId) {
        this.context.currentAgent = agentId;
    }
    getCurrentAgent() {
        return this.context.currentAgent;
    }
    getWorkingDirectory() {
        return this.context.workingDirectory;
    }
    async ensureWorkingDirectory() {
        try {
            await fs.mkdir(this.context.workingDirectory, { recursive: true });
        }
        catch (error) {
        }
    }
}
exports.FluiContextManager = FluiContextManager;
//# sourceMappingURL=fluiContext.js.map
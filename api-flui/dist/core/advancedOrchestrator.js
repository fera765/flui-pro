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
const pluginLoader_1 = require("./pluginLoader");
const timeoutManager_1 = require("./timeoutManager");
const concurrentTaskManager_1 = require("./concurrentTaskManager");
const emotionMemory_1 = require("./emotionMemory");
const path = __importStar(require("path"));
class AdvancedOrchestrator {
    constructor(config, classifier, planner, worker, supervisor, emotionMemoryConfig) {
        this.config = config;
        this.classifier = classifier;
        this.planner = planner;
        this.worker = worker;
        this.supervisor = supervisor;
        this.tasks = new Map();
        this.events = new Map();
        this.agents = new Map();
        const workingDir = path.join(process.cwd(), 'flui-projects', (0, uuid_1.v4)());
        const timeoutConfig = {
            defaultTimeout: 30000,
            pluginTimeout: 60000,
            toolTimeout: 30000,
            longRunningTimeout: 300000,
            maxRetries: 3,
            retryDelay: 5000
        };
        this.timeoutManager = new timeoutManager_1.TimeoutManager(timeoutConfig);
        this.pluginLoader = new pluginLoader_1.PluginLoader();
        this.concurrentTaskManager = new concurrentTaskManager_1.ConcurrentTaskManager(this.timeoutManager, 3);
        const defaultEmotionConfig = {
            emotionThreshold: 0.7,
            maxMemories: 1000,
            memoryDecay: 0.95,
            contextWindow: 3,
            hashLength: 8
        };
        const emotionConfig = emotionMemoryConfig || defaultEmotionConfig;
        const episodicStore = new emotionMemory_1.EpisodicStore(emotionConfig);
        const emotionHash = new emotionMemory_1.EmotionHash();
        const contextInjector = new emotionMemory_1.ContextInjector();
        this.sriProtocol = new emotionMemory_1.SRIProtocol(episodicStore, emotionHash, contextInjector, emotionConfig);
        this.tools = new advancedTools_1.AdvancedTools(workingDir, this.pluginLoader);
        this.contextManager = new fluiContext_1.FluiContextManager('', workingDir);
        this.todoPlanner = new todoPlanner_1.TodoPlanner();
        this.autoCorrection = new autoCorrection_1.AutoCorrectionSystem(workingDir);
        this.fileGenerator = new fileGenerator_1.FileGenerator();
        this.initializeAgents();
        this.initializePlugins();
        this.setupConcurrentTaskListeners();
    }
    initializeAgents() {
        const agents = specializedAgents_1.SpecializedAgents.getAllAgents();
        agents.forEach(agent => {
            this.agents.set(agent.id, agent);
        });
    }
    async initializePlugins() {
        try {
            console.log('🔌 Initializing plugin system...');
            this.pluginLoader.on('pluginStatus', (status) => {
                console.log(`🔌 Plugin ${status.plugin}: ${status.status} - ${status.message}`);
                this.tasks.forEach((task, taskId) => {
                    if (task.status === 'running') {
                        this.emitEvent(taskId, 'plugin_status', {
                            type: 'plugin_status',
                            data: status,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            });
            await this.pluginLoader.loadAllPlugins();
            await this.pluginLoader.watchForNewPlugins();
            console.log('✅ Plugin system initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize plugin system:', error);
        }
    }
    setupConcurrentTaskListeners() {
        this.concurrentTaskManager.on('taskStarted', (data) => {
            console.log(`🚀 Task started: ${data.taskId}`);
            this.emitEvent(data.taskId, 'task_started', data);
        });
        this.concurrentTaskManager.on('taskQueued', (data) => {
            console.log(`📋 Task queued: ${data.taskId} (position: ${data.queuePosition})`);
            this.emitEvent(data.taskId, 'task_queued', data);
        });
        this.concurrentTaskManager.on('statusResponse', (data) => {
            console.log(`📊 Status response for ${data.taskId}: ${data.message}`);
            this.emitEvent(data.taskId, 'status_response', data);
        });
        this.concurrentTaskManager.on('taskInterrupted', (data) => {
            console.log(`🛑 Task interrupted: ${data.taskId} - ${data.reason}`);
            this.emitEvent(data.taskId, 'task_interrupted', data);
        });
        this.concurrentTaskManager.on('taskRetry', (data) => {
            console.log(`🔄 Task retry: ${data.taskId} (attempt ${data.retryCount})`);
            this.emitEvent(data.taskId, 'task_retry', data);
        });
        this.concurrentTaskManager.on('taskFailed', (data) => {
            console.log(`❌ Task failed: ${data.taskId} - ${data.message}`);
            this.emitEvent(data.taskId, 'task_failed', data);
        });
        this.concurrentTaskManager.on('taskForceCompleted', (data) => {
            console.log(`🛑 Task force completed: ${data.taskId} - ${data.reason}`);
            this.emitEvent(data.taskId, 'task_force_completed', data);
        });
    }
    async createTask(prompt) {
        const currentTaskId = this.getCurrentActiveTaskId();
        if (currentTaskId) {
            const request = this.timeoutManager.analyzeConcurrentRequest(prompt, currentTaskId);
            if (request.type === 'status_check') {
                const status = this.concurrentTaskManager.getTaskStatus(currentTaskId);
                this.emitEvent(currentTaskId, 'status_check', {
                    taskId: currentTaskId,
                    status: status.task ? 'running' : 'not_found',
                    queued: status.queued,
                    timeoutInfo: status.timeoutInfo
                });
                return this.tasks.get(currentTaskId) || this.createNewTask(prompt);
            }
            if (request.type === 'interrupt') {
                this.concurrentTaskManager.addTask({}, prompt);
                return this.createNewTask(prompt);
            }
        }
        return this.createNewTask(prompt);
    }
    async createNewTask(prompt) {
        const classification = await this.classifier.classifyTask(prompt);
        if (classification.type === 'conversation') {
            return this.createSimpleTask(prompt, classification);
        }
        else {
            return this.createComplexTask(prompt, classification);
        }
    }
    getCurrentActiveTaskId() {
        const activeTasks = this.concurrentTaskManager.getActiveTasks();
        return activeTasks.length > 0 ? activeTasks[0]?.id : undefined;
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
        this.tools.setWorkingDirectory(this.contextManager.getWorkingDirectory());
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
            const contextMessages = this.buildContextMessages(task);
            const sriResult = await this.sriProtocol.optimizeContext(contextMessages, taskId);
            const optimizedTask = {
                ...task,
                prompt: sriResult.context,
                metadata: {
                    ...task.metadata,
                    sriOptimization: {
                        originalTokens: sriResult.originalTokens,
                        optimizedTokens: sriResult.optimizedTokens,
                        reductionPercentage: sriResult.reductionPercentage,
                        injectedMemories: sriResult.injectedMemories.length
                    }
                }
            };
            let result;
            if (task.metadata.isSimple) {
                result = await this.worker.executeTask(optimizedTask);
            }
            else {
                result = await this.executeComplexTask(optimizedTask);
            }
            await this.sriProtocol.storeExperience(taskId, task.prompt, result);
            if (result.success) {
                return this.handleSimpleTaskResult(taskId, result);
            }
            else {
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
        let loopCount = 0;
        const maxLoops = 10;
        console.log(`\n🔄 STARTING COMPLEX TASK EXECUTION`);
        console.log(`Total Todos: ${totalTodos}`);
        console.log(`Task Complete: ${this.contextManager.isTaskComplete()}`);
        while (!this.contextManager.isTaskComplete() && loopCount < maxLoops) {
            loopCount++;
            console.log(`\n🔄 LOOP ITERATION #${loopCount}/${maxLoops}`);
            const executableTodos = this.contextManager.getNextExecutableTodos();
            console.log(`📋 Executable Todos: ${executableTodos.length}`);
            executableTodos.forEach(todo => {
                console.log(`  - ${todo.id}: ${todo.description} (${todo.status})`);
            });
            if (executableTodos.length === 0) {
                console.log(`⚠️  NO EXECUTABLE TODOS FOUND`);
                const pendingTodos = context.todos.filter(todo => todo.status === 'pending');
                const failedTodos = context.todos.filter(todo => todo.status === 'failed');
                console.log(`📊 TODO STATUS:`);
                console.log(`  - Pending: ${pendingTodos.length}`);
                console.log(`  - Failed: ${failedTodos.length}`);
                console.log(`  - Completed: ${context.todos.filter(t => t.status === 'completed').length}`);
                if (pendingTodos.length === 0) {
                    console.log(`✅ NO MORE TODOS TO EXECUTE - BREAKING LOOP`);
                    break;
                }
                const retryableFailedTodos = failedTodos.filter(todo => todo.dependencies.every(depId => context.todos.find(t => t.id === depId)?.status === 'completed'));
                if (retryableFailedTodos.length > 0) {
                    console.log(`🔄 RETRYING ${retryableFailedTodos.length} FAILED TODOS`);
                    for (const todo of retryableFailedTodos) {
                        console.log(`🔄 RETRYING FAILED TODO: ${todo.id}`);
                        const retrySuccess = await this.autoCorrection.retryFailedTodo(todo, context);
                        if (retrySuccess) {
                            console.log(`✅ RETRY SUCCESS: ${todo.id}`);
                            executableTodos.push(todo);
                        }
                        else {
                            console.log(`❌ RETRY FAILED: ${todo.id}`);
                        }
                    }
                }
                else {
                    console.log(`❌ NO RETRYABLE FAILED TODOS - STOPPING EXECUTION`);
                    break;
                }
            }
            if (executableTodos.length > 0) {
                console.log(`🚀 EXECUTING ${executableTodos.length} TODOS IN PARALLEL`);
                const executionPromises = executableTodos.map(todo => this.executeTodo(todo, context));
                await Promise.all(executionPromises);
                console.log(`✅ PARALLEL EXECUTION COMPLETED`);
            }
            completedTodos = context.completedTasks.length;
            console.log(`📊 PROGRESS: ${completedTodos}/${totalTodos} (${((completedTodos / totalTodos) * 100).toFixed(1)}%)`);
            this.emitEvent(task.id, 'progress_update', {
                completed: completedTodos,
                total: totalTodos,
                progress: (completedTodos / totalTodos) * 100
            });
        }
        if (loopCount >= maxLoops) {
            console.log(`🚨 MAX LOOPS REACHED (${maxLoops}) - STOPPING EXECUTION`);
            throw new Error(`Task execution exceeded maximum loops (${maxLoops}). Possible infinite loop detected.`);
        }
        console.log(`✅ COMPLEX TASK EXECUTION COMPLETED`);
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
        console.log(`\n🎯 EXECUTING AGENT TODO: ${todo.id}`);
        console.log(`Description: ${todo.description}`);
        console.log(`Agent ID: ${todo.agentId}`);
        console.log(`Status: ${todo.status}`);
        console.log(`Dependencies: ${todo.dependencies.join(', ')}`);
        const agent = this.agents.get(todo.agentId);
        if (!agent) {
            console.log(`❌ AGENT NOT FOUND: ${todo.agentId}`);
            throw new Error(`Agent ${todo.agentId} not found`);
        }
        console.log(`✅ AGENT FOUND: ${agent.name} (${agent.id})`);
        console.log(`Agent Role: ${agent.role}`);
        console.log(`Agent Max Depth: ${agent.maxDepth}`);
        const availableTools = this.tools.getAllTools();
        console.log(`🔧 AVAILABLE TOOLS: ${availableTools.length} tools`);
        const autonomousAgent = new autonomousAgent_1.AutonomousAgent(agent, availableTools);
        const agentTask = this.contextManager.createAgentTask(agent.id, todo.description, agent.tools);
        console.log(`📋 AGENT TASK CREATED:`);
        console.log(`  Prompt: ${agentTask.prompt}`);
        console.log(`  Context: ${agentTask.context.substring(0, 200)}...`);
        console.log(`🚀 CALLING AUTONOMOUS AGENT...`);
        const response = await autonomousAgent.executeTask(agentTask);
        console.log(`📥 AGENT RESPONSE RECEIVED:`);
        console.log(`  Success: ${response.success}`);
        console.log(`  Data: ${response.data ? response.data.substring(0, 200) + '...' : 'null'}`);
        console.log(`  Error: ${response.error || 'none'}`);
        console.log(`  Next Action: ${response.nextAction?.type || 'none'}`);
        if (!response.success) {
            console.log(`❌ AGENT EXECUTION FAILED: ${response.error}`);
            throw new Error(response.error || 'Agent execution failed');
        }
        const contextUpdate = `Agent ${agent.name}: ${response.data}`;
        console.log(`📝 UPDATING GLOBAL CONTEXT: ${contextUpdate.substring(0, 100)}...`);
        this.contextManager.updateGlobalContext(contextUpdate);
        console.log(`✅ AGENT TODO COMPLETED SUCCESSFULLY`);
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
    buildContextMessages(task) {
        const messages = [];
        messages.push({
            role: 'system',
            content: 'You are FLUI Advanced, an autonomous AI assistant with specialized agents. Use relevant memories to improve your responses.'
        });
        messages.push({
            role: 'user',
            content: task.prompt
        });
        if (task.metadata.conversationHistory) {
            for (const msg of task.metadata.conversationHistory) {
                messages.push(msg);
            }
        }
        if (!task.metadata.isSimple) {
            const context = this.contextManager.getContext();
            if (context.todos.length > 0) {
                messages.push({
                    role: 'system',
                    content: `Current todos: ${context.todos.map(t => t.description).join(', ')}`
                });
            }
        }
        return messages;
    }
    async getEmotionMemoryStats() {
        return await this.sriProtocol.getMemoryStats();
    }
    async clearEmotionMemories() {
        await this.sriProtocol.clearMemories();
    }
    async optimizeContextForAgent(agentId, context, taskId) {
        const contextMessages = [{ role: 'user', content: context }];
        return await this.sriProtocol.optimizeContextForAgent(agentId, contextMessages, taskId);
    }
    async getPerformanceMetrics() {
        return this.sriProtocol.getPerformanceMetrics();
    }
    async getAlerts() {
        return this.sriProtocol.getAlerts();
    }
    async getAgentMetrics(agentId) {
        return this.sriProtocol.getAgentMetrics(agentId);
    }
    async getMemoriesByDomain(domain) {
        return [];
    }
    async getMemoriesByAgent(agentId) {
        return [];
    }
    async getMostEffectiveMemories(limit = 10) {
        return [];
    }
    async getTuningRecommendations() {
        return [];
    }
    async applyTuningRecommendations(recommendations) {
        return this.config;
    }
}
exports.AdvancedOrchestrator = AdvancedOrchestrator;
//# sourceMappingURL=advancedOrchestrator.js.map
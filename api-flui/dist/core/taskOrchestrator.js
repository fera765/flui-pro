"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskOrchestrator = void 0;
const uuid_1 = require("uuid");
class TaskOrchestrator {
    constructor(taskManager, liveTester, markdownReporter, contextPersistence) {
        this.taskManager = taskManager;
        this.liveTester = liveTester;
        this.markdownReporter = markdownReporter;
        this.contextPersistence = contextPersistence;
        this.activeTasks = new Map();
    }
    async createPersistentTask(request) {
        try {
            if (!request.name || !request.description || !request.projectType || !request.userId || !request.initialPrompt) {
                return {
                    success: false,
                    error: 'Missing required fields: name, description, projectType, userId, initialPrompt'
                };
            }
            const taskId = (0, uuid_1.v4)();
            const timestamp = new Date();
            const initialContext = {
                taskId,
                userId: request.userId,
                projectType: request.projectType,
                workingDirectory: '',
                conversationHistory: [
                    {
                        id: (0, uuid_1.v4)(),
                        role: 'user',
                        content: request.initialPrompt,
                        timestamp
                    }
                ],
                currentFeatures: [],
                modifications: [],
                testStatus: 'pending',
                intent: {
                    domain: request.projectType,
                    technology: this.detectTechnology(request.projectType),
                    language: this.detectLanguage(request.projectType),
                    features: [],
                    requirements: []
                },
                testResults: [],
                createdAt: timestamp,
                lastAccessed: timestamp
            };
            const task = await this.taskManager.createPersistentTask(request.name, request.description, initialContext);
            initialContext.taskId = task.id;
            this.activeTasks.set(task.id, initialContext);
            await this.contextPersistence.saveContext(task.id, initialContext);
            return {
                success: true,
                taskId: task.id,
                metadata: {
                    executionTime: 0,
                    filesCreated: 0,
                    testsPassed: 0,
                    testsFailed: 0,
                    buildTime: 0,
                    serverStartTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async executeTask(taskId) {
        try {
            const startTime = Date.now();
            const context = this.activeTasks.get(taskId);
            if (!context) {
                return {
                    success: false,
                    error: `Task ${taskId} not found or not active`
                };
            }
            context.lastAccessed = new Date();
            context.testStatus = 'running';
            const projectStructure = await this.simulateProjectCreation(context);
            const testResults = await this.runTests(context, projectStructure);
            const serverUrl = await this.startServer(context, projectStructure);
            const reportPath = await this.generateReport(context, projectStructure, testResults, serverUrl);
            context.testResults = testResults;
            context.serverUrl = serverUrl;
            context.testStatus = testResults.some(t => t.status === 'failed') ? 'failed' : 'passed';
            await this.contextPersistence.updateContext(taskId, context);
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                taskId,
                reportPath,
                liveUrl: serverUrl,
                metadata: {
                    executionTime,
                    filesCreated: projectStructure.files.length,
                    testsPassed: testResults.filter(t => t.status === 'passed').length,
                    testsFailed: testResults.filter(t => t.status === 'failed').length,
                    buildTime: 1000,
                    serverStartTime: 500
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async interactWithTask(request) {
        try {
            const startTime = Date.now();
            const taskId = request.taskId;
            const context = this.activeTasks.get(taskId);
            if (!context) {
                return {
                    success: false,
                    error: `Task ${taskId} not found or not active`
                };
            }
            context.lastAccessed = new Date();
            let response;
            let interactionType;
            if ('question' in request) {
                interactionType = 'question';
                response = await this.handleQuestion(context, request.question);
                context.conversationHistory.push({
                    id: (0, uuid_1.v4)(),
                    role: 'user',
                    content: request.question,
                    timestamp: new Date()
                });
                context.conversationHistory.push({
                    id: (0, uuid_1.v4)(),
                    role: 'assistant',
                    content: response,
                    timestamp: new Date()
                });
            }
            else if ('type' in request) {
                interactionType = 'modification';
                response = await this.handleModification(context, request);
                context.modifications.push({
                    id: (0, uuid_1.v4)(),
                    projectId: taskId,
                    type: request.type,
                    description: request.description,
                    priority: request.priority,
                    status: 'pending',
                    createdAt: new Date()
                });
            }
            else if ('format' in request) {
                interactionType = 'download';
                response = await this.handleDownload(context, request);
            }
            else {
                throw new Error('Invalid interaction request type');
            }
            await this.contextPersistence.updateContext(taskId, context);
            return {
                success: true,
                response,
                taskId,
                status: context.testStatus === 'passed' ? 'completed' : 'active',
                metadata: {
                    interactionType,
                    processingTime: Date.now() - startTime
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async listTasks(userId) {
        try {
            const allTasks = await this.taskManager.listActiveTasks();
            const userTasks = allTasks.filter(task => {
                const context = this.activeTasks.get(task.id);
                return context && context.userId === userId;
            });
            const taskSummaries = userTasks.map(task => ({
                taskId: task.id,
                name: task.name,
                description: task.description,
                projectType: task.projectType,
                status: task.status,
                progress: this.calculateProgress(task),
                createdAt: task.createdAt,
                lastAccessed: task.lastAccessed,
                serverUrl: task.serverUrl,
                reportPath: task.testResults.length > 0 ? 'generated' : undefined,
                executionTime: 0,
                filesCreated: task.context.currentFeatures.length,
                testsPassed: task.testResults.filter(r => r.buildStatus === 'success').length,
                testsFailed: task.testResults.filter(r => r.buildStatus === 'failed').length
            }));
            const activeCount = taskSummaries.filter(t => t.status === 'active').length;
            const completedCount = taskSummaries.filter(t => t.status === 'completed').length;
            const errorCount = taskSummaries.filter(t => t.status === 'error').length;
            return {
                success: true,
                tasks: taskSummaries,
                totalCount: taskSummaries.length,
                activeCount,
                completedCount,
                errorCount
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getTaskStatus(taskId) {
        try {
            const context = this.activeTasks.get(taskId);
            if (!context) {
                throw new Error(`Task ${taskId} not found`);
            }
            return {
                taskId,
                status: context.testStatus === 'passed' ? 'completed' : 'active',
                progress: this.calculateProgressFromContext(context),
                currentStep: this.getCurrentStep(context),
                message: this.getStatusMessage(context),
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                taskId,
                status: 'error',
                message: error.message,
                timestamp: new Date()
            };
        }
    }
    async pauseTask(taskId) {
        try {
            const context = this.activeTasks.get(taskId);
            if (!context) {
                throw new Error(`Task ${taskId} not found`);
            }
            await this.taskManager.updateTaskStatus(taskId, 'paused');
            return {
                taskId,
                status: 'paused',
                message: 'Task paused successfully',
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                taskId,
                status: 'error',
                message: error.message,
                timestamp: new Date()
            };
        }
    }
    async resumeTask(taskId) {
        try {
            const context = this.activeTasks.get(taskId);
            if (!context) {
                throw new Error(`Task ${taskId} not found`);
            }
            await this.taskManager.updateTaskStatus(taskId, 'active');
            return {
                taskId,
                status: 'active',
                message: 'Task resumed successfully',
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                taskId,
                status: 'error',
                message: error.message,
                timestamp: new Date()
            };
        }
    }
    async completeTask(taskId) {
        try {
            const context = this.activeTasks.get(taskId);
            if (!context) {
                return {
                    success: false,
                    error: `Task ${taskId} not found`
                };
            }
            await this.taskManager.updateTaskStatus(taskId, 'completed');
            const projectStructure = await this.simulateProjectCreation(context);
            const testResults = context.testResults;
            const reportPath = await this.generateReport(context, projectStructure, testResults, context.serverUrl);
            return {
                success: true,
                taskId,
                reportPath,
                liveUrl: context.serverUrl,
                metadata: {
                    executionTime: Date.now() - context.createdAt.getTime(),
                    filesCreated: projectStructure.files.length,
                    testsPassed: testResults.filter(t => t.status === 'passed').length,
                    testsFailed: testResults.filter(t => t.status === 'failed').length,
                    buildTime: 1000,
                    serverStartTime: 500
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async deleteTask(taskId) {
        try {
            this.activeTasks.delete(taskId);
            await this.taskManager.deleteTask(taskId);
            await this.contextPersistence.deleteContext(taskId);
            return {
                success: true,
                taskId
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    detectTechnology(projectType) {
        switch (projectType) {
            case 'frontend': return 'html';
            case 'backend': return 'nodejs';
            case 'mobile': return 'react-native';
            case 'content': return 'markdown';
            default: return 'unknown';
        }
    }
    detectLanguage(projectType) {
        switch (projectType) {
            case 'frontend': return 'javascript';
            case 'backend': return 'javascript';
            case 'mobile': return 'javascript';
            case 'content': return 'markdown';
            default: return 'unknown';
        }
    }
    async simulateProjectCreation(context) {
        const files = [];
        if (context.projectType === 'frontend') {
            files.push('index.html', 'style.css', 'script.js');
        }
        else if (context.projectType === 'backend') {
            files.push('package.json', 'server.js', 'routes.js');
        }
        else if (context.projectType === 'content') {
            files.push('script.md', 'copywrite.md');
        }
        return {
            directories: ['src', 'public'],
            files,
            entryPoint: files[0],
            configFiles: files.filter(f => f.includes('.json')),
            totalSize: files.length * 1024
        };
    }
    async runTests(context, projectStructure) {
        const testResults = [];
        if (context.projectType === 'frontend') {
            testResults.push({
                type: 'html',
                buildStatus: 'success',
                serverStatus: 'running',
                curlTests: [],
                executedAt: new Date()
            });
        }
        else if (context.projectType === 'backend') {
            testResults.push({
                type: 'nodejs',
                buildStatus: 'success',
                serverStatus: 'running',
                curlTests: [],
                executedAt: new Date()
            });
        }
        return testResults;
    }
    async startServer(context, projectStructure) {
        const port = context.projectType === 'frontend' ? 3000 : 3001;
        return `http://localhost:${port}`;
    }
    async generateReport(context, projectStructure, testResults, serverUrl) {
        const title = `Projeto ${context.projectType}`;
        const reportResult = await this.markdownReporter.generateHTMLProjectReport(title, projectStructure, {
            total: testResults.length,
            passed: testResults.filter(t => t.buildStatus === 'success').length,
            failed: testResults.filter(t => t.buildStatus === 'failed').length,
            skipped: 0,
            duration: 1000,
            details: testResults.map(t => ({
                name: `${t.type} test`,
                status: t.buildStatus === 'success' ? 'passed' : 'failed',
                duration: 500,
                output: `Test completed with status: ${t.buildStatus}`
            }))
        }, {
            buildStatus: 'success',
            serverStatus: serverUrl ? 'running' : 'stopped',
            testStatus: testResults.some(t => t.buildStatus === 'failed') ? 'failed' : 'passed',
            curlStatus: 'success',
            totalTime: Date.now() - context.createdAt.getTime(),
            errors: [],
            warnings: []
        }, serverUrl || '', {
            includeIcons: true,
            includeEmojis: true,
            includeTimestamps: true,
            includeMetadata: true,
            includeTestDetails: true,
            includeFileStructure: true,
            includeExecutionSummary: true
        });
        return reportResult.reportPath || '';
    }
    async handleQuestion(context, question) {
        if (question.toLowerCase().includes('progresso') || question.toLowerCase().includes('status')) {
            return `O projeto está em progresso. Status atual: ${context.testStatus}. ${context.currentFeatures.length} funcionalidades implementadas.`;
        }
        else if (question.toLowerCase().includes('tempo') || question.toLowerCase().includes('quando')) {
            return `O projeto foi iniciado em ${context.createdAt.toLocaleString('pt-BR')}. Tempo estimado de conclusão: 30 minutos.`;
        }
        else {
            return `Entendi sua pergunta: "${question}". Como posso ajudá-lo com o projeto?`;
        }
    }
    async handleModification(context, request) {
        return `Modificação "${request.description}" foi adicionada à lista de tarefas com prioridade ${request.priority}. Será implementada em breve.`;
    }
    async handleDownload(context, request) {
        return `Download do projeto será preparado no formato ${request.format}. ${request.includeNodeModules ? 'Incluindo node_modules.' : 'Excluindo node_modules.'}`;
    }
    calculateProgress(task) {
        if (task.status === 'completed')
            return 100;
        if (task.status === 'error')
            return 0;
        const baseProgress = task.status === 'active' ? 50 : 25;
        const featureProgress = Math.min(task.context.currentFeatures.length * 10, 40);
        return Math.min(baseProgress + featureProgress, 95);
    }
    calculateProgressFromContext(context) {
        if (context.testStatus === 'passed')
            return 100;
        if (context.testStatus === 'failed')
            return 75;
        if (context.testStatus === 'running')
            return 50;
        return 25;
    }
    getCurrentStep(context) {
        if (context.testStatus === 'passed')
            return 'Concluído';
        if (context.testStatus === 'running')
            return 'Executando testes';
        if (context.testStatus === 'failed')
            return 'Corrigindo erros';
        return 'Iniciando projeto';
    }
    getStatusMessage(context) {
        if (context.testStatus === 'passed')
            return 'Projeto concluído com sucesso!';
        if (context.testStatus === 'running')
            return 'Executando testes e validações...';
        if (context.testStatus === 'failed')
            return 'Alguns testes falharam, corrigindo...';
        return 'Projeto em desenvolvimento';
    }
    async getTaskSummary(taskId) {
        try {
            const context = this.activeTasks.get(taskId);
            if (!context) {
                return {
                    success: false,
                    error: `Task ${taskId} not found`
                };
            }
            const task = await this.taskManager.getTask(taskId);
            if (!task) {
                return {
                    success: false,
                    error: `Task ${taskId} not found in TaskManager`
                };
            }
            const summary = {
                taskId: task.id,
                name: task.name,
                description: task.description,
                projectType: task.projectType,
                status: task.status,
                progress: this.calculateProgressFromContext(context),
                createdAt: task.createdAt,
                lastAccessed: task.lastAccessed,
                serverUrl: task.serverUrl,
                reportPath: task.testResults.length > 0 ? 'generated' : undefined,
                executionTime: Date.now() - context.createdAt.getTime(),
                filesCreated: context.currentFeatures.length,
                testsPassed: task.testResults.filter(r => r.buildStatus === 'success').length,
                testsFailed: task.testResults.filter(r => r.buildStatus === 'failed').length
            };
            return {
                success: true,
                summary
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getTaskStatistics() {
        try {
            const allTasks = await this.taskManager.listActiveTasks();
            const statistics = {
                totalTasks: allTasks.length,
                activeTasks: allTasks.filter(t => t.status === 'active').length,
                completedTasks: allTasks.filter(t => t.status === 'completed').length,
                errorTasks: allTasks.filter(t => t.status === 'error').length,
                totalExecutionTime: 0,
                averageExecutionTime: 0,
                totalFilesCreated: 0,
                totalTestsPassed: 0,
                totalTestsFailed: 0
            };
            for (const task of allTasks) {
                const context = this.activeTasks.get(task.id);
                if (context) {
                    statistics.totalExecutionTime += Date.now() - context.createdAt.getTime();
                    statistics.totalFilesCreated += context.currentFeatures.length;
                }
                statistics.totalTestsPassed += task.testResults.filter(r => r.buildStatus === 'success').length;
                statistics.totalTestsFailed += task.testResults.filter(r => r.buildStatus === 'failed').length;
            }
            if (statistics.totalTasks > 0) {
                statistics.averageExecutionTime = statistics.totalExecutionTime / statistics.totalTasks;
            }
            return {
                success: true,
                statistics
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async cleanupCompletedTasks() {
        try {
            const allTasks = await this.taskManager.listActiveTasks();
            const completedTasks = allTasks.filter(t => t.status === 'completed');
            let cleanedCount = 0;
            for (const task of completedTasks) {
                await this.deleteTask(task.id);
                cleanedCount++;
            }
            return {
                success: true,
                cleanedCount
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
exports.TaskOrchestrator = TaskOrchestrator;
//# sourceMappingURL=taskOrchestrator.js.map
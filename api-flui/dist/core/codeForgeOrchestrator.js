"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeForgeOrchestrator = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
const dynamicIntelligence_1 = require("./dynamicIntelligence");
const codeForgeAgent_1 = require("../agents/codeForgeAgent");
const dynamicTools_1 = require("../tools/dynamicTools");
class CodeForgeOrchestrator extends events_1.EventEmitter {
    constructor(workingDirectory = process.cwd()) {
        super();
        this.tasks = new Map();
        this.projects = new Map();
        this.modificationRequests = new Map();
        this.downloadRequests = new Map();
        this.conversationContexts = new Map();
        this.workingDirectory = workingDirectory;
        this.dynamicIntelligence = new dynamicIntelligence_1.DynamicIntelligence();
        this.dynamicTools = new dynamicTools_1.DynamicTools(workingDirectory);
        const availableTools = [
            this.dynamicTools.createProjectTypeDetector(),
            this.dynamicTools.createDependencyManager(),
            this.dynamicTools.createBuildValidator(),
            this.dynamicTools.createTestRunner(),
            this.dynamicTools.createServerValidator(),
            this.dynamicTools.createFileBackupManager(),
            this.dynamicTools.createProjectAnalyzer(),
            this.dynamicTools.createShellTool(),
            this.dynamicTools.createPackageManagerTool(),
            this.dynamicTools.createFileWriteTool()
        ];
        this.codeForgeAgent = new codeForgeAgent_1.CodeForgeAgent(availableTools);
        this.setupEventHandlers();
    }
    async processUserInput(input, userId = 'default') {
        try {
            console.log(`🎯 Processing user input: ${input}`);
            const context = this.getOrCreateConversationContext(userId);
            context.conversationHistory.push({
                id: (0, uuid_1.v4)(),
                role: 'user',
                content: input,
                timestamp: new Date()
            });
            const result = await this.dynamicIntelligence.processUserInput(input, this.workingDirectory);
            context.pendingQuestions = result.questions;
            this.emit('userInputProcessed', { userId, input, result });
            return result;
        }
        catch (error) {
            console.error('Error processing user input:', error);
            throw error;
        }
    }
    async handleUserAnswers(answers, userId) {
        try {
            console.log(`📝 Handling user answers:`, answers);
            const context = this.getOrCreateConversationContext(userId);
            context.conversationHistory.push({
                id: (0, uuid_1.v4)(),
                role: 'assistant',
                content: 'Processing your answers...',
                timestamp: new Date()
            });
            const builtInput = this.buildInputFromAnswers(answers);
            console.log(`🔍 Built input from answers: "${builtInput}"`);
            const result = await this.dynamicIntelligence.processUserInput(builtInput, this.workingDirectory);
            context.pendingQuestions = result.questions;
            this.emit('userAnswersProcessed', { userId, answers, result });
            return result;
        }
        catch (error) {
            console.error('Error handling user answers:', error);
            throw error;
        }
    }
    async executeProjectCreation(intent, userId) {
        try {
            console.log(`🚀 Starting project creation for user ${userId}`);
            const task = {
                id: (0, uuid_1.v4)(),
                type: 'task',
                prompt: `Create ${intent.domain} project with ${intent.technology}`,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                depth: 0,
                retries: 0,
                maxRetries: 3,
                maxDepth: 5,
                childTasks: [],
                metadata: { intent, userId },
                result: undefined,
                completedAt: undefined,
                error: undefined
            };
            this.tasks.set(task.id, task);
            this.emit('taskCreated', task);
            const result = await this.codeForgeAgent.executeProjectCreation(intent, this.workingDirectory);
            if (result.success && result.project) {
                this.projects.set(result.project.id, result.project);
                task.status = 'completed';
                task.result = result;
                task.completedAt = new Date();
                const context = this.getOrCreateConversationContext(userId);
                context.currentProject = result.project;
                this.emit('projectCreated', { task, project: result.project, userId });
                return result;
            }
            else {
                task.status = 'failed';
                task.error = result.error;
                this.emit('projectCreationFailed', { task, error: result.error, userId });
                return result;
            }
        }
        catch (error) {
            console.error('Error executing project creation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async handleInteractiveMessage(message, userId) {
        try {
            console.log(`💬 Handling interactive message from user ${userId}: ${message}`);
            const context = this.getOrCreateConversationContext(userId);
            if (!context.currentProject) {
                return {
                    success: false,
                    response: 'Nenhum projeto ativo encontrado. Crie um projeto primeiro.',
                    error: 'No active project'
                };
            }
            const result = await this.codeForgeAgent.handleInteractiveMessage(context.currentProject, message);
            context.conversationHistory.push({
                id: (0, uuid_1.v4)(),
                role: 'assistant',
                content: result.response,
                timestamp: new Date()
            });
            if (result.modificationRequest) {
                this.modificationRequests.set(result.modificationRequest.id, result.modificationRequest);
                this.emit('modificationRequestCreated', {
                    modificationRequest: result.modificationRequest,
                    userId
                });
            }
            if (result.downloadRequest) {
                this.downloadRequests.set(result.downloadRequest.id, result.downloadRequest);
                this.emit('downloadRequestCreated', {
                    downloadRequest: result.downloadRequest,
                    userId
                });
            }
            this.emit('interactiveMessageHandled', { userId, message, result });
            return result;
        }
        catch (error) {
            console.error('Error handling interactive message:', error);
            return {
                success: false,
                response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
                error: error.message
            };
        }
    }
    async executeModificationRequest(modificationId, userId) {
        try {
            console.log(`🔧 Executing modification request ${modificationId}`);
            const modification = this.modificationRequests.get(modificationId);
            if (!modification) {
                return {
                    success: false,
                    error: 'Modification request not found'
                };
            }
            const context = this.getOrCreateConversationContext(userId);
            if (!context.currentProject) {
                return {
                    success: false,
                    error: 'No active project found'
                };
            }
            const result = await this.codeForgeAgent.handleModificationRequest(context.currentProject, modification);
            if (result.success && result.modification) {
                this.modificationRequests.set(modificationId, result.modification);
                context.currentProject = context.currentProject;
                this.emit('modificationExecuted', {
                    modification: result.modification,
                    userId
                });
                return result;
            }
            else {
                this.emit('modificationFailed', {
                    modification,
                    error: result.error,
                    userId
                });
                return result;
            }
        }
        catch (error) {
            console.error('Error executing modification request:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async executeDownloadRequest(downloadId, userId) {
        try {
            console.log(`📦 Executing download request ${downloadId}`);
            const downloadRequest = this.downloadRequests.get(downloadId);
            if (!downloadRequest) {
                return {
                    success: false,
                    error: 'Download request not found'
                };
            }
            const context = this.getOrCreateConversationContext(userId);
            if (!context.currentProject) {
                return {
                    success: false,
                    error: 'No active project found'
                };
            }
            const result = await this.codeForgeAgent.handleDownloadRequest(context.currentProject, downloadRequest);
            if (result.success && result.downloadRequest) {
                this.downloadRequests.set(downloadId, result.downloadRequest);
                this.emit('downloadExecuted', {
                    downloadRequest: result.downloadRequest,
                    userId
                });
                return result;
            }
            else {
                this.emit('downloadFailed', {
                    downloadRequest,
                    error: result.error,
                    userId
                });
                return result;
            }
        }
        catch (error) {
            console.error('Error executing download request:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    getProject(projectId) {
        return this.projects.get(projectId);
    }
    getProjects() {
        return Array.from(this.projects.values());
    }
    getModificationRequest(modificationId) {
        return this.modificationRequests.get(modificationId);
    }
    getDownloadRequest(downloadId) {
        return this.downloadRequests.get(downloadId);
    }
    getConversationContext(userId) {
        return this.conversationContexts.get(userId);
    }
    getOrCreateConversationContext(userId) {
        let context = this.conversationContexts.get(userId);
        if (!context) {
            context = {
                userId,
                sessionId: (0, uuid_1.v4)(),
                conversationHistory: [],
                pendingQuestions: [],
                userPreferences: {}
            };
            this.conversationContexts.set(userId, context);
        }
        return context;
    }
    buildInputFromAnswers(answers) {
        console.log(`🔍 buildInputFromAnswers called with:`, answers);
        const parts = [];
        const techMapping = {
            'tech-1': 'technology',
            'lang-2': 'language',
            'purpose-3': 'purpose',
            'complexity-4': 'complexity',
            'features-5': 'features'
        };
        for (const [key, value] of Object.entries(answers)) {
            if (value) {
                const mappedKey = techMapping[key] || key;
                if (Array.isArray(value)) {
                    parts.push(`${mappedKey}: ${value.join(', ')}`);
                }
                else {
                    parts.push(`${mappedKey}: ${value}`);
                }
            }
        }
        if (answers['tech-1']) {
            const tech = answers['tech-1'].toLowerCase();
            if (tech.includes('node') || tech.includes('express')) {
                parts.push('backend Node.js Express');
            }
            else if (tech.includes('react')) {
                parts.push('frontend React');
            }
            else if (tech.includes('html')) {
                parts.push('frontend HTML');
            }
        }
        return parts.join(', ');
    }
    setupEventHandlers() {
        this.on('taskCreated', (task) => {
            console.log(`📋 Task created: ${task.prompt}`);
        });
        this.on('projectCreated', ({ task, project, userId }) => {
            console.log(`✅ Project created: ${project.name} for user ${userId}`);
        });
        this.on('projectCreationFailed', ({ task, error, userId }) => {
            console.log(`❌ Project creation failed: ${error} for user ${userId}`);
        });
        this.on('modificationRequestCreated', ({ modificationRequest, userId }) => {
            console.log(`🔧 Modification request created: ${modificationRequest.description} for user ${userId}`);
        });
        this.on('modificationExecuted', ({ modification, userId }) => {
            console.log(`✅ Modification executed: ${modification.description} for user ${userId}`);
        });
        this.on('modificationFailed', ({ modification, error, userId }) => {
            console.log(`❌ Modification failed: ${error} for user ${userId}`);
        });
        this.on('downloadRequestCreated', ({ downloadRequest, userId }) => {
            console.log(`📦 Download request created: ${downloadRequest.format} for user ${userId}`);
        });
        this.on('downloadExecuted', ({ downloadRequest, userId }) => {
            console.log(`✅ Download executed: ${downloadRequest.format} for user ${userId}`);
        });
        this.on('downloadFailed', ({ downloadRequest, error, userId }) => {
            console.log(`❌ Download failed: ${error} for user ${userId}`);
        });
        this.on('userInputProcessed', ({ userId, input, result }) => {
            console.log(`💬 User input processed for user ${userId}: ${result.confidence} confidence`);
        });
        this.on('userAnswersProcessed', ({ userId, answers, result }) => {
            console.log(`📝 User answers processed for user ${userId}`);
        });
        this.on('interactiveMessageHandled', ({ userId, message, result }) => {
            console.log(`💬 Interactive message handled for user ${userId}`);
        });
    }
}
exports.CodeForgeOrchestrator = CodeForgeOrchestrator;
//# sourceMappingURL=codeForgeOrchestrator.js.map
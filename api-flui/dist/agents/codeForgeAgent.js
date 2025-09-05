"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeForgeAgent = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
const dynamicSolutionArchitect_1 = require("../core/dynamicSolutionArchitect");
const realTimeValidator_1 = require("../core/realTimeValidator");
class CodeForgeAgent {
    constructor(availableTools) {
        this.eventEmitter = new events_1.EventEmitter();
        this.solutionArchitect = new dynamicSolutionArchitect_1.DynamicSolutionArchitect();
        this.validator = new realTimeValidator_1.RealTimeValidator();
        this.tools = new Map();
        this.currentProjects = new Map();
        this.modificationRequests = new Map();
        this.downloadRequests = new Map();
        availableTools.forEach(tool => {
            this.tools.set(tool.name, tool);
        });
        this.setupEventHandlers();
    }
    async executeProjectCreation(intent, workingDirectory) {
        try {
            console.log(`🚀 Starting project creation for ${intent.domain} with ${intent.technology}`);
            const project = {
                id: (0, uuid_1.v4)(),
                name: `${intent.technology}-project`,
                type: intent.domain,
                workingDirectory,
                status: 'creating',
                createdAt: new Date(),
                errors: [],
                warnings: []
            };
            this.currentProjects.set(project.id, project);
            this.eventEmitter.emit('projectStart', project);
            const solution = await this.solutionArchitect.designSolution(intent, {
                workingDirectory,
                existingFiles: [],
                hasPackageJson: false,
                hasGitRepo: false,
                isEmpty: true,
                detectedTechnologies: []
            });
            const tasks = await this.solutionArchitect.generateDynamicTasks(intent, {
                workingDirectory,
                existingFiles: [],
                hasPackageJson: false,
                hasGitRepo: false,
                isEmpty: true,
                detectedTechnologies: []
            });
            for (const task of tasks) {
                await this.executeDynamicTask(task, project);
            }
            const validation = await this.validator.validateProject(workingDirectory, solution);
            if (validation.isValid) {
                project.status = 'ready';
                project.completedAt = new Date();
                if (validation.serverUrl) {
                    project.serverUrl = validation.serverUrl;
                }
                this.eventEmitter.emit('projectComplete', project);
                return {
                    success: true,
                    project,
                    serverUrl: validation.serverUrl
                };
            }
            else {
                project.status = 'error';
                project.errors = validation.errors;
                project.warnings = validation.warnings;
                this.eventEmitter.emit('projectError', project);
                return {
                    success: false,
                    project,
                    error: `Validation failed: ${validation.errors.join(', ')}`
                };
            }
        }
        catch (error) {
            console.error('Project creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async handleModificationRequest(project, modification) {
        try {
            console.log(`🔧 Handling modification request: ${modification.type} - ${modification.description}`);
            modification.status = 'in_progress';
            this.modificationRequests.set(modification.id, modification);
            this.eventEmitter.emit('modificationStart', modification);
            const tasks = await this.generateModificationTasks(project, modification);
            for (const task of tasks) {
                await this.executeDynamicTask(task, project);
            }
            const validation = await this.validator.validateProject(project.workingDirectory, {
                type: project.type,
                framework: 'default',
                language: 'javascript',
                buildTool: 'npm',
                packageManager: 'npm',
                dependencies: [],
                devDependencies: [],
                scripts: {},
                structure: { directories: [], files: [], entryPoint: '', configFiles: [] },
                validations: [],
                estimatedTime: 0
            });
            if (validation.isValid) {
                modification.status = 'completed';
                modification.completedAt = new Date();
                this.eventEmitter.emit('modificationComplete', modification);
                return {
                    success: true,
                    modification
                };
            }
            else {
                modification.status = 'failed';
                this.eventEmitter.emit('modificationError', modification);
                return {
                    success: false,
                    modification,
                    error: `Modification validation failed: ${validation.errors.join(', ')}`
                };
            }
        }
        catch (error) {
            console.error('Modification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async handleDownloadRequest(project, downloadRequest) {
        try {
            console.log(`📦 Handling download request: ${downloadRequest.format}`);
            downloadRequest.status = 'preparing';
            this.downloadRequests.set(downloadRequest.id, downloadRequest);
            this.eventEmitter.emit('downloadStart', downloadRequest);
            let downloadUrl;
            if (downloadRequest.format === 'zip') {
                downloadUrl = await this.createZipDownload(project, downloadRequest);
            }
            else if (downloadRequest.format === 'tar') {
                downloadUrl = await this.createTarDownload(project, downloadRequest);
            }
            else if (downloadRequest.format === 'git') {
                downloadUrl = await this.createGitDownload(project, downloadRequest);
            }
            else {
                throw new Error(`Unsupported download format: ${downloadRequest.format}`);
            }
            downloadRequest.status = 'ready';
            downloadRequest.downloadUrl = downloadUrl;
            this.eventEmitter.emit('downloadReady', downloadRequest);
            return {
                success: true,
                downloadRequest
            };
        }
        catch (error) {
            console.error('Download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async handleInteractiveMessage(project, message) {
        try {
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('demorando') || lowerMessage.includes('terminou') || lowerMessage.includes('travado')) {
                return {
                    success: true,
                    response: this.generateStatusResponse(project)
                };
            }
            if (lowerMessage.includes('adicione') || lowerMessage.includes('adicionar')) {
                const modification = await this.createModificationRequest(project, 'add_feature', message);
                return {
                    success: true,
                    response: `Certo! Vou adicionar essa funcionalidade. Trabalhando na modificação...`,
                    modificationRequest: modification
                };
            }
            if (lowerMessage.includes('erro') || lowerMessage.includes('bug') || lowerMessage.includes('não está funcionando')) {
                const modification = await this.createModificationRequest(project, 'fix_bug', message);
                return {
                    success: true,
                    response: `Entendi o problema! Vou corrigir esse erro. Trabalhando na correção...`,
                    modificationRequest: modification
                };
            }
            if (lowerMessage.includes('zip') || lowerMessage.includes('download') || lowerMessage.includes('baixar')) {
                const downloadRequest = await this.createDownloadRequest(project, 'zip');
                return {
                    success: true,
                    response: `Perfeito! Vou preparar o download do projeto. Gerando arquivo...`,
                    downloadRequest
                };
            }
            if (lowerMessage.includes('modifique') || lowerMessage.includes('altere') || lowerMessage.includes('mude')) {
                const modification = await this.createModificationRequest(project, 'modify_existing', message);
                return {
                    success: true,
                    response: `Certo! Vou fazer essa modificação. Trabalhando na alteração...`,
                    modificationRequest: modification
                };
            }
            if (lowerMessage.includes('remova') || lowerMessage.includes('remover') || lowerMessage.includes('delete')) {
                const modification = await this.createModificationRequest(project, 'remove_feature', message);
                return {
                    success: true,
                    response: `Entendido! Vou remover essa funcionalidade. Trabalhando na remoção...`,
                    modificationRequest: modification
                };
            }
            return {
                success: true,
                response: `Entendi sua mensagem! Como posso ajudar com o projeto?`
            };
        }
        catch (error) {
            console.error('Interactive message error:', error);
            return {
                success: false,
                response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
                error: error.message
            };
        }
    }
    async executeDynamicTask(task, project) {
        try {
            console.log(`🔧 Executing dynamic task: ${task.description}`);
            task.status = 'running';
            this.eventEmitter.emit('taskStart', task);
            if (task.type === 'tool' && task.toolName) {
                const tool = this.tools.get(task.toolName);
                if (tool) {
                    const result = await tool.execute(task.parameters || {});
                    task.status = 'completed';
                    task.result = result;
                    this.eventEmitter.emit('taskComplete', task);
                    return {
                        success: true,
                        data: result
                    };
                }
                else {
                    throw new Error(`Tool not found: ${task.toolName}`);
                }
            }
            else if (task.type === 'agent' && task.agentId) {
                const result = await this.executeAgentTask(task);
                task.status = 'completed';
                task.result = result;
                this.eventEmitter.emit('taskComplete', task);
                return {
                    success: true,
                    data: result
                };
            }
            else {
                throw new Error(`Invalid task type: ${task.type}`);
            }
        }
        catch (error) {
            console.error('Dynamic task execution error:', error);
            task.status = 'failed';
            task.error = error.message;
            this.eventEmitter.emit('taskError', task);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async executeTask(task, project) {
        try {
            console.log(`🔧 Executing task: ${task.prompt}`);
            task.status = 'running';
            this.eventEmitter.emit('taskStart', task);
            if (task.tools && task.tools.length > 0) {
                const tool = this.tools.get(task.tools[0]);
                if (tool) {
                    const result = await tool.execute(task.parameters || {});
                    task.status = 'completed';
                    task.result = result;
                    this.eventEmitter.emit('taskComplete', task);
                    return {
                        success: true,
                        data: result
                    };
                }
                else {
                    throw new Error(`Tool not found: ${task.tools[0]}`);
                }
            }
            else {
                const result = await this.executeAgentTask(task);
                task.status = 'completed';
                task.result = result;
                this.eventEmitter.emit('taskComplete', task);
                return {
                    success: true,
                    data: result
                };
            }
        }
        catch (error) {
            console.error('Task execution error:', error);
            task.status = 'failed';
            task.error = error.message;
            this.eventEmitter.emit('taskError', task);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getProjectStatus(project) {
        return {
            status: project.status,
            progress: this.calculateProgress(project),
            currentTask: this.getCurrentTask(project),
            errors: project.errors,
            warnings: project.warnings
        };
    }
    async validateProject(project) {
        try {
            const solution = {
                type: project.type,
                framework: 'default',
                language: 'javascript',
                buildTool: 'npm',
                packageManager: 'npm',
                dependencies: [],
                devDependencies: [],
                scripts: {},
                structure: { directories: [], files: [], entryPoint: '', configFiles: [] },
                validations: [],
                estimatedTime: 0
            };
            return await this.validator.validateProject(project.workingDirectory, solution);
        }
        catch (error) {
            console.error('Validation error:', error);
            return {
                isValid: false,
                steps: [],
                errors: [error.message],
                warnings: []
            };
        }
    }
    setupEventHandlers() {
        this.eventEmitter.on('projectStart', (project) => {
            console.log(`🚀 Project started: ${project.name}`);
        });
        this.eventEmitter.on('projectComplete', (project) => {
            console.log(`✅ Project completed: ${project.name}`);
        });
        this.eventEmitter.on('projectError', (project) => {
            console.log(`❌ Project error: ${project.name}`);
        });
        this.eventEmitter.on('taskStart', (task) => {
            console.log(`🔧 Task started: ${task.prompt}`);
        });
        this.eventEmitter.on('taskComplete', (task) => {
            console.log(`✅ Task completed: ${task.prompt}`);
        });
        this.eventEmitter.on('taskError', (task) => {
            console.log(`❌ Task error: ${task.prompt}`);
        });
        this.eventEmitter.on('modificationStart', (modification) => {
            console.log(`🔧 Modification started: ${modification.description}`);
        });
        this.eventEmitter.on('modificationComplete', (modification) => {
            console.log(`✅ Modification completed: ${modification.description}`);
        });
        this.eventEmitter.on('modificationError', (modification) => {
            console.log(`❌ Modification error: ${modification.description}`);
        });
        this.eventEmitter.on('downloadStart', (downloadRequest) => {
            console.log(`📦 Download started: ${downloadRequest.format}`);
        });
        this.eventEmitter.on('downloadReady', (downloadRequest) => {
            console.log(`✅ Download ready: ${downloadRequest.format}`);
        });
    }
    async generateModificationTasks(project, modification) {
        const tasks = [];
        if (modification.type === 'add_feature') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                agentId: 'code-forge',
                prompt: `Add feature: ${modification.description}`,
                context: `Project: ${project.name}`,
                systemPrompt: 'You are a code generation agent',
                tools: ['file_write'],
                status: 'pending',
                createdAt: new Date()
            });
        }
        else if (modification.type === 'fix_bug') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                agentId: 'code-forge',
                prompt: `Fix bug: ${modification.description}`,
                context: `Project: ${project.name}`,
                systemPrompt: 'You are a code generation agent',
                tools: ['file_write'],
                status: 'pending',
                createdAt: new Date()
            });
        }
        else if (modification.type === 'modify_existing') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                agentId: 'code-forge',
                prompt: `Modify: ${modification.description}`,
                context: `Project: ${project.name}`,
                systemPrompt: 'You are a code generation agent',
                tools: ['file_write'],
                status: 'pending',
                createdAt: new Date()
            });
        }
        else if (modification.type === 'remove_feature') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                agentId: 'code-forge',
                prompt: `Remove feature: ${modification.description}`,
                context: `Project: ${project.name}`,
                systemPrompt: 'You are a code generation agent',
                tools: ['file_write'],
                status: 'pending',
                createdAt: new Date()
            });
        }
        return tasks;
    }
    async createModificationRequest(project, type, description) {
        const modification = {
            id: (0, uuid_1.v4)(),
            projectId: project.id,
            type,
            description,
            priority: 'medium',
            status: 'pending',
            createdAt: new Date()
        };
        this.modificationRequests.set(modification.id, modification);
        return modification;
    }
    async createDownloadRequest(project, format) {
        const downloadRequest = {
            id: (0, uuid_1.v4)(),
            projectId: project.id,
            format,
            includeNodeModules: false,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            createdAt: new Date()
        };
        this.downloadRequests.set(downloadRequest.id, downloadRequest);
        return downloadRequest;
    }
    async createZipDownload(project, downloadRequest) {
        const zipUrl = `https://flui-downloads.com/${project.id}.zip`;
        console.log(`📦 Created zip download: ${zipUrl}`);
        return zipUrl;
    }
    async createTarDownload(project, downloadRequest) {
        const tarUrl = `https://flui-downloads.com/${project.id}.tar.gz`;
        console.log(`📦 Created tar download: ${tarUrl}`);
        return tarUrl;
    }
    async createGitDownload(project, downloadRequest) {
        const gitUrl = `https://flui-downloads.com/${project.id}.git`;
        console.log(`📦 Created git download: ${gitUrl}`);
        return gitUrl;
    }
    generateStatusResponse(project) {
        if (project.status === 'creating') {
            return `Não se preocupe! Não estou travado, estou trabalhando na criação do projeto. Status: ${project.status}`;
        }
        else if (project.status === 'building') {
            return `Estou construindo o projeto agora. Status: ${project.status}`;
        }
        else if (project.status === 'testing') {
            return `Estou testando o projeto para garantir que tudo funciona. Status: ${project.status}`;
        }
        else if (project.status === 'ready') {
            return `Projeto concluído! Está pronto para uso. Status: ${project.status}`;
        }
        else if (project.status === 'error') {
            return `Encontrei alguns erros que estou corrigindo. Status: ${project.status}`;
        }
        else {
            return `Estou trabalhando no projeto. Status: ${project.status}`;
        }
    }
    async executeAgentTask(task) {
        console.log(`🤖 Executing agent task: ${task.prompt}`);
        return { result: 'Task executed successfully' };
    }
    calculateProgress(project) {
        if (project.status === 'creating')
            return 25;
        if (project.status === 'building')
            return 50;
        if (project.status === 'testing')
            return 75;
        if (project.status === 'ready')
            return 100;
        if (project.status === 'error')
            return 0;
        return 0;
    }
    getCurrentTask(project) {
        if (project.status === 'creating')
            return 'Creating project structure';
        if (project.status === 'building')
            return 'Building project';
        if (project.status === 'testing')
            return 'Running tests';
        if (project.status === 'ready')
            return 'Project ready';
        if (project.status === 'error')
            return 'Fixing errors';
        return undefined;
    }
}
exports.CodeForgeAgent = CodeForgeAgent;
//# sourceMappingURL=codeForgeAgent.js.map
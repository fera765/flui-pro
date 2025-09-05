import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import { 
  Intent, 
  Project, 
  ModificationRequest, 
  DownloadRequest,
  ValidationResult,
  DynamicTask
} from '../types/dynamic';
import { AgentTask, AgentResponse, Tool } from '../types/advanced';
import { DynamicSolutionArchitect } from '../core/dynamicSolutionArchitect';
import { DynamicIntelligence } from '../core/dynamicIntelligence';
import { RealTimeValidator } from '../core/realTimeValidator';

export class CodeForgeAgent {
  private eventEmitter: EventEmitter;
  private dynamicIntelligence: DynamicIntelligence;
  private solutionArchitect: DynamicSolutionArchitect;
  private validator: RealTimeValidator;
  private tools: Map<string, Tool>;
  private currentProjects: Map<string, Project>;
  private modificationRequests: Map<string, ModificationRequest>;
  private downloadRequests: Map<string, DownloadRequest>;

  constructor(availableTools: Tool[]) {
    this.eventEmitter = new EventEmitter();
    this.dynamicIntelligence = new DynamicIntelligence();
    this.solutionArchitect = new DynamicSolutionArchitect(this.dynamicIntelligence);
    this.validator = new RealTimeValidator();
    this.tools = new Map();
    this.currentProjects = new Map();
    this.modificationRequests = new Map();
    this.downloadRequests = new Map();
    
    // Register available tools
    availableTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
    
    this.setupEventHandlers();
  }

  async executeProjectCreation(intent: Intent, workingDirectory: string): Promise<{
    success: boolean;
    project?: Project;
    error?: string;
    serverUrl?: string;
    downloadUrl?: string;
  }> {
    try {
      console.log(`🚀 Starting project creation for ${intent.domain} with ${intent.technology}`);
      
      // Create working directory
      if (!fs.existsSync(workingDirectory)) {
        fs.mkdirSync(workingDirectory, { recursive: true });
        console.log(`📁 Created working directory: ${workingDirectory}`);
      }
      
      // Create project record
      const project: Project = {
        id: uuidv4(),
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
      
      // Generate solution architecture
      const solution = await this.solutionArchitect.designSolution(intent, {
        workingDirectory,
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      });
      
      // Generate dynamic tasks
      const tasks = await this.solutionArchitect.generateDynamicTasks(intent, {
        workingDirectory,
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      });
      
      // Execute tasks
      for (const task of tasks) {
        await this.executeDynamicTask(task, project);
      }
      
      // Validate project
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
      } else {
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
    } catch (error) {
      console.error('Project creation error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async handleModificationRequest(project: Project, modification: ModificationRequest): Promise<{
    success: boolean;
    modification?: ModificationRequest;
    error?: string;
  }> {
    try {
      console.log(`🔧 Handling modification request: ${modification.type} - ${modification.description}`);
      
      modification.status = 'in_progress';
      this.modificationRequests.set(modification.id, modification);
      
      this.eventEmitter.emit('modificationStart', modification);
      
      // Generate tasks for modification
      const tasks = await this.generateModificationTasks(project, modification);
      
      // Execute modification tasks
      for (const task of tasks) {
        await this.executeDynamicTask(task as any, project);
      }
      
      // Validate project after modification
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
      } else {
        modification.status = 'failed';
        
        this.eventEmitter.emit('modificationError', modification);
        
        return {
          success: false,
          modification,
          error: `Modification validation failed: ${validation.errors.join(', ')}`
        };
      }
    } catch (error) {
      console.error('Modification error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async handleDownloadRequest(project: Project, downloadRequest: DownloadRequest): Promise<{
    success: boolean;
    downloadRequest?: DownloadRequest;
    error?: string;
  }> {
    try {
      console.log(`📦 Handling download request: ${downloadRequest.format}`);
      
      downloadRequest.status = 'preparing';
      this.downloadRequests.set(downloadRequest.id, downloadRequest);
      
      this.eventEmitter.emit('downloadStart', downloadRequest);
      
      // Prepare download based on format
      let downloadUrl: string;
      
      if (downloadRequest.format === 'zip') {
        downloadUrl = await this.createZipDownload(project, downloadRequest);
      } else if (downloadRequest.format === 'tar') {
        downloadUrl = await this.createTarDownload(project, downloadRequest);
      } else if (downloadRequest.format === 'git') {
        downloadUrl = await this.createGitDownload(project, downloadRequest);
      } else {
        throw new Error(`Unsupported download format: ${downloadRequest.format}`);
      }
      
      downloadRequest.status = 'ready';
      downloadRequest.downloadUrl = downloadUrl;
      
      this.eventEmitter.emit('downloadReady', downloadRequest);
      
      return {
        success: true,
        downloadRequest
      };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async handleInteractiveMessage(project: Project, message: string): Promise<{
    success: boolean;
    response: string;
    modificationRequest?: ModificationRequest;
    downloadRequest?: DownloadRequest;
    error?: string;
  }> {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Handle status inquiries
      if (lowerMessage.includes('demorando') || lowerMessage.includes('terminou') || lowerMessage.includes('travado')) {
        return {
          success: true,
          response: this.generateStatusResponse(project)
        };
      }
      
      // Handle feature addition requests
      if (lowerMessage.includes('adicione') || lowerMessage.includes('adicionar')) {
        const modification = await this.createModificationRequest(project, 'add_feature', message);
        return {
          success: true,
          response: `Certo! Vou adicionar essa funcionalidade. Trabalhando na modificação...`,
          modificationRequest: modification
        };
      }
      
      // Handle bug reports
      if (lowerMessage.includes('erro') || lowerMessage.includes('bug') || lowerMessage.includes('não está funcionando')) {
        const modification = await this.createModificationRequest(project, 'fix_bug', message);
        return {
          success: true,
          response: `Entendi o problema! Vou corrigir esse erro. Trabalhando na correção...`,
          modificationRequest: modification
        };
      }
      
      // Handle download requests
      if (lowerMessage.includes('zip') || lowerMessage.includes('download') || lowerMessage.includes('baixar')) {
        const downloadRequest = await this.createDownloadRequest(project, 'zip');
        return {
          success: true,
          response: `Perfeito! Vou preparar o download do projeto. Gerando arquivo...`,
          downloadRequest
        };
      }
      
      // Handle modification requests
      if (lowerMessage.includes('modifique') || lowerMessage.includes('altere') || lowerMessage.includes('mude')) {
        const modification = await this.createModificationRequest(project, 'modify_existing', message);
        return {
          success: true,
          response: `Certo! Vou fazer essa modificação. Trabalhando na alteração...`,
          modificationRequest: modification
        };
      }
      
      // Handle removal requests
      if (lowerMessage.includes('remova') || lowerMessage.includes('remover') || lowerMessage.includes('delete')) {
        const modification = await this.createModificationRequest(project, 'remove_feature', message);
        return {
          success: true,
          response: `Entendido! Vou remover essa funcionalidade. Trabalhando na remoção...`,
          modificationRequest: modification
        };
      }
      
      // Default response
      return {
        success: true,
        response: `Entendi sua mensagem! Como posso ajudar com o projeto?`
      };
    } catch (error) {
      console.error('Interactive message error:', error);
      return {
        success: false,
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        error: (error as Error).message
      };
    }
  }

  async executeDynamicTask(task: DynamicTask, project?: Project): Promise<AgentResponse> {
    try {
      console.log(`🔧 Executing dynamic task: ${task.description}`);
      
      task.status = 'running';
      this.eventEmitter.emit('taskStart', task);
      
      // Execute task based on type
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
        } else {
          throw new Error(`Tool not found: ${task.toolName}`);
        }
      } else if (task.type === 'agent' && task.agentId) {
        // Execute agent-based task
        const result = await this.executeAgentTask(task as any);
        task.status = 'completed';
        task.result = result;
        
        this.eventEmitter.emit('taskComplete', task);
        
        return {
          success: true,
          data: result
        };
      } else {
        throw new Error(`Invalid task type: ${task.type}`);
      }
    } catch (error) {
      console.error('Dynamic task execution error:', error);
      task.status = 'failed';
      task.error = (error as Error).message;
      
      this.eventEmitter.emit('taskError', task);
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async executeTask(task: AgentTask, project?: Project): Promise<AgentResponse> {
    try {
      console.log(`🔧 Executing task: ${task.prompt}`);
      
      task.status = 'running';
      this.eventEmitter.emit('taskStart', task);
      
      // Execute task based on type
      if (task.tools && task.tools.length > 0) {
        // Execute tool-based task
        const tool = this.tools.get(task.tools[0]!);
        if (tool) {
          const result = await tool.execute((task as any).parameters || {});
          task.status = 'completed';
          task.result = result;
          
          this.eventEmitter.emit('taskComplete', task);
          
          return {
            success: true,
            data: result
          };
        } else {
          throw new Error(`Tool not found: ${task.tools[0]}`);
        }
      } else {
        // Execute agent-based task
        const result = await this.executeAgentTask(task);
        task.status = 'completed';
        task.result = result;
        
        this.eventEmitter.emit('taskComplete', task);
        
        return {
          success: true,
          data: result
        };
      }
    } catch (error) {
      console.error('Task execution error:', error);
      task.status = 'failed';
      task.error = (error as Error).message;
      
      this.eventEmitter.emit('taskError', task);
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getProjectStatus(project: Project): Promise<{
    status: string;
    progress: number;
    currentTask?: string;
    errors: string[];
    warnings: string[];
  }> {
    return {
      status: project.status,
      progress: this.calculateProgress(project),
      currentTask: this.getCurrentTask(project),
      errors: project.errors,
      warnings: project.warnings
    };
  }

  async validateProject(project: Project): Promise<ValidationResult> {
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
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        steps: [],
        errors: [(error as Error).message],
        warnings: []
      };
    }
  }

  private setupEventHandlers(): void {
    this.eventEmitter.on('projectStart', (project: Project) => {
      console.log(`🚀 Project started: ${project.name}`);
    });
    
    this.eventEmitter.on('projectComplete', (project: Project) => {
      console.log(`✅ Project completed: ${project.name}`);
    });
    
    this.eventEmitter.on('projectError', (project: Project) => {
      console.log(`❌ Project error: ${project.name}`);
    });
    
    this.eventEmitter.on('taskStart', (task: any) => {
      const taskName = task.prompt || task.description || 'Unknown task';
      console.log(`🔧 Task started: ${taskName}`);
    });
    
    this.eventEmitter.on('taskComplete', (task: any) => {
      const taskName = task.prompt || task.description || 'Unknown task';
      console.log(`✅ Task completed: ${taskName}`);
    });
    
    this.eventEmitter.on('taskError', (task: any) => {
      const taskName = task.prompt || task.description || 'Unknown task';
      console.log(`❌ Task error: ${taskName}`);
    });
    
    this.eventEmitter.on('modificationStart', (modification: ModificationRequest) => {
      console.log(`🔧 Modification started: ${modification.description}`);
    });
    
    this.eventEmitter.on('modificationComplete', (modification: ModificationRequest) => {
      console.log(`✅ Modification completed: ${modification.description}`);
    });
    
    this.eventEmitter.on('modificationError', (modification: ModificationRequest) => {
      console.log(`❌ Modification error: ${modification.description}`);
    });
    
    this.eventEmitter.on('downloadStart', (downloadRequest: DownloadRequest) => {
      console.log(`📦 Download started: ${downloadRequest.format}`);
    });
    
    this.eventEmitter.on('downloadReady', (downloadRequest: DownloadRequest) => {
      console.log(`✅ Download ready: ${downloadRequest.format}`);
    });
  }

  private async generateModificationTasks(project: Project, modification: ModificationRequest): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    
    // Generate tasks based on modification type
    if (modification.type === 'add_feature') {
      tasks.push({
        id: uuidv4(),
        agentId: 'code-forge',
        prompt: `Add feature: ${modification.description}`,
        context: `Project: ${project.name}`,
        systemPrompt: 'You are a code generation agent',
        tools: ['file_write'],
        status: 'pending',
        createdAt: new Date()
      });
    } else if (modification.type === 'fix_bug') {
      tasks.push({
        id: uuidv4(),
        agentId: 'code-forge',
        prompt: `Fix bug: ${modification.description}`,
        context: `Project: ${project.name}`,
        systemPrompt: 'You are a code generation agent',
        tools: ['file_write'],
        status: 'pending',
        createdAt: new Date()
      });
    } else if (modification.type === 'modify_existing') {
      tasks.push({
        id: uuidv4(),
        agentId: 'code-forge',
        prompt: `Modify: ${modification.description}`,
        context: `Project: ${project.name}`,
        systemPrompt: 'You are a code generation agent',
        tools: ['file_write'],
        status: 'pending',
        createdAt: new Date()
      });
    } else if (modification.type === 'remove_feature') {
      tasks.push({
        id: uuidv4(),
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

  private async createModificationRequest(project: Project, type: ModificationRequest['type'], description: string): Promise<ModificationRequest> {
    const modification: ModificationRequest = {
      id: uuidv4(),
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

  private async createDownloadRequest(project: Project, format: DownloadRequest['format']): Promise<DownloadRequest> {
    const downloadRequest: DownloadRequest = {
      id: uuidv4(),
      projectId: project.id,
      format,
      includeNodeModules: false,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date()
    };
    
    this.downloadRequests.set(downloadRequest.id, downloadRequest);
    return downloadRequest;
  }

  private async createZipDownload(project: Project, downloadRequest: DownloadRequest): Promise<string> {
    // Mock implementation - in real scenario would create actual zip file
    const zipUrl = `https://flui-downloads.com/${project.id}.zip`;
    console.log(`📦 Created zip download: ${zipUrl}`);
    return zipUrl;
  }

  private async createTarDownload(project: Project, downloadRequest: DownloadRequest): Promise<string> {
    // Mock implementation - in real scenario would create actual tar file
    const tarUrl = `https://flui-downloads.com/${project.id}.tar.gz`;
    console.log(`📦 Created tar download: ${tarUrl}`);
    return tarUrl;
  }

  private async createGitDownload(project: Project, downloadRequest: DownloadRequest): Promise<string> {
    // Mock implementation - in real scenario would create git repository
    const gitUrl = `https://flui-downloads.com/${project.id}.git`;
    console.log(`📦 Created git download: ${gitUrl}`);
    return gitUrl;
  }

  private generateStatusResponse(project: Project): string {
    if (project.status === 'creating') {
      return `Não se preocupe! Não estou travado, estou trabalhando na criação do projeto. Status: ${project.status}`;
    } else if (project.status === 'building') {
      return `Estou construindo o projeto agora. Status: ${project.status}`;
    } else if (project.status === 'testing') {
      return `Estou testando o projeto para garantir que tudo funciona. Status: ${project.status}`;
    } else if (project.status === 'ready') {
      return `Projeto concluído! Está pronto para uso. Status: ${project.status}`;
    } else if (project.status === 'error') {
      return `Encontrei alguns erros que estou corrigindo. Status: ${project.status}`;
    } else {
      return `Estou trabalhando no projeto. Status: ${project.status}`;
    }
  }

  private async executeAgentTask(task: AgentTask): Promise<any> {
    // Mock implementation - in real scenario would use LLM
    console.log(`🤖 Executing agent task: ${task.prompt}`);
    return { result: 'Task executed successfully' };
  }

  private calculateProgress(project: Project): number {
    // Mock implementation - in real scenario would calculate based on completed tasks
    if (project.status === 'creating') return 25;
    if (project.status === 'building') return 50;
    if (project.status === 'testing') return 75;
    if (project.status === 'ready') return 100;
    if (project.status === 'error') return 0;
    return 0;
  }

  private getCurrentTask(project: Project): string | undefined {
    // Mock implementation - in real scenario would return actual current task
    if (project.status === 'creating') return 'Creating project structure';
    if (project.status === 'building') return 'Building project';
    if (project.status === 'testing') return 'Running tests';
    if (project.status === 'ready') return 'Project ready';
    if (project.status === 'error') return 'Fixing errors';
    return undefined;
  }
}
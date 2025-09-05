import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import * as path from 'path';
import { 
  Intent, 
  Project, 
  ModificationRequest, 
  DownloadRequest,
  ConversationContext,
  ProcessingResult
} from '../types/dynamic';
import { TodoItem } from '../types/advanced';
import { DynamicIntelligence } from './dynamicIntelligence';
import { CodeForgeAgent } from '../agents/codeForgeAgent';
import { DynamicTools } from '../tools/dynamicTools';
import { SpecializedAgents } from '../agents/specializedAgents';
import { TaskOrchestrator } from './taskOrchestrator';
import { TaskManager } from './taskManager';
import { LiveTester } from './liveTester';
import { MarkdownReporter } from './markdownReporter';
import { ContextPersistence } from './contextPersistence';
import { TaskCreationRequest } from '../types/taskOrchestrator';

export class CodeForgeOrchestrator extends EventEmitter {
  private tasks: Map<string, any> = new Map();
  private projects: Map<string, Project> = new Map();
  private modificationRequests: Map<string, ModificationRequest> = new Map();
  private downloadRequests: Map<string, DownloadRequest> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  
  private dynamicIntelligence: DynamicIntelligence;
  private codeForgeAgent: CodeForgeAgent;
  private dynamicTools: DynamicTools;
  private workingDirectory: string;
  private taskOrchestrator: TaskOrchestrator;

  constructor(workingDirectory: string = process.cwd()) {
    super();
    this.workingDirectory = workingDirectory;
    this.dynamicIntelligence = new DynamicIntelligence();
    this.dynamicTools = new DynamicTools(workingDirectory);
    
    // Initialize CodeForge agent with available tools
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
    
    this.codeForgeAgent = new CodeForgeAgent(availableTools);
    
    // Initialize Task Orchestrator components
    const tasksDir = path.join(workingDirectory, 'tasks');
    const reportsDir = path.join(workingDirectory, 'reports');
    const contextsDir = path.join(workingDirectory, 'contexts');
    
    const taskManager = new TaskManager(tasksDir);
    const liveTester = new LiveTester();
    const markdownReporter = new MarkdownReporter(reportsDir);
    const contextPersistence = new ContextPersistence(contextsDir);
    
    this.taskOrchestrator = new TaskOrchestrator(
      taskManager,
      liveTester,
      markdownReporter,
      contextPersistence
    );
    
    // Propagate TaskOrchestrator events to CodeForgeOrchestrator
    this.propagateTaskOrchestratorEvents();
    
    this.setupEventHandlers();
  }

  private propagateTaskOrchestratorEvents(): void {
    // Propagate all TaskOrchestrator events to CodeForgeOrchestrator
    const eventTypes = [
      'taskCreated', 'taskStarted', 'taskProgress', 'taskCompleted', 'taskFailed',
      'agentStarted', 'agentCompleted', 'agentFailed',
      'toolStarted', 'toolCompleted', 'toolFailed',
      'testStarted', 'testCompleted', 'testFailed',
      'reportGenerated', 'interactionReceived', 'interactionProcessed'
    ];

    // Also propagate dynamic events
    const dynamicEventTypes = [
      'taskCreatedDynamic', 'taskStartedDynamic', 'taskProgressDynamic', 'taskCompletedDynamic', 'taskFailedDynamic',
      'agentStartedDynamic', 'agentCompletedDynamic', 'agentFailedDynamic',
      'toolStartedDynamic', 'toolCompletedDynamic', 'toolFailedDynamic',
      'testStartedDynamic', 'testCompletedDynamic', 'testFailedDynamic',
      'reportGeneratedDynamic', 'interactionReceivedDynamic', 'interactionProcessedDynamic'
    ];

    eventTypes.forEach(eventType => {
      this.taskOrchestrator.on(eventType, (data) => {
        // Re-emit the event from CodeForgeOrchestrator
        this.emit(eventType, data);
      });
    });

    dynamicEventTypes.forEach(eventType => {
      this.taskOrchestrator.on(eventType, (data) => {
        // Re-emit the dynamic event from CodeForgeOrchestrator
        this.emit(eventType, data);
      });
    });
  }

  async processUserInput(input: string, userId: string = 'default'): Promise<ProcessingResult> {
    try {
      console.log(`🎯 Processing user input: ${input}`);
      
      // Get or create conversation context
      const context = this.getOrCreateConversationContext(userId);
      
      // Add user message to conversation history
      context.conversationHistory.push({
        id: uuidv4(),
        role: 'user',
        content: input,
        timestamp: new Date()
      });
      
      // Process input with dynamic intelligence
      const result = await this.dynamicIntelligence.processUserInput(input, this.workingDirectory);
      
      // Update context with processing result
      context.pendingQuestions = result.questions;
      
      // Emit processing event
      this.emit('userInputProcessed', { userId, input, result });
      
      return result;
    } catch (error) {
      console.error('Error processing user input:', error);
      throw error;
    }
  }

  async handleUserAnswers(answers: Record<string, any>, userId: string): Promise<ProcessingResult> {
    try {
      console.log(`📝 Handling user answers:`, answers);
      
      const context = this.getOrCreateConversationContext(userId);
      
      // Add assistant message to conversation history
      context.conversationHistory.push({
        id: uuidv4(),
        role: 'assistant',
        content: 'Processing your answers...',
        timestamp: new Date()
      });
      
      // Process answers with dynamic intelligence
      const builtInput = this.buildInputFromAnswers(answers, userId);
      console.log(`🔍 Built input from answers: "${builtInput}"`);
      const result = await this.dynamicIntelligence.processUserInput(
        builtInput, 
        this.workingDirectory
      );
      
      // Update context
      context.pendingQuestions = result.questions;
      
      // Emit answers processed event
      this.emit('userAnswersProcessed', { userId, answers, result });
      
      return result;
    } catch (error) {
      console.error('Error handling user answers:', error);
      throw error;
    }
  }

  async executeProjectCreation(intent: Intent, userId: string): Promise<{
    success: boolean;
    project?: Project;
    error?: string;
    serverUrl?: string;
    downloadUrl?: string;
  }> {
    try {
      console.log(`🚀 Starting project creation for user ${userId}`);
      
      // Create task for project creation
      const task = {
        id: uuidv4(),
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
        result: undefined as any,
        completedAt: undefined as any,
        error: undefined as any
      };
      
      this.tasks.set(task.id, task);
      this.emit('taskCreated', task);
      
      // Execute project creation
      const result = await this.codeForgeAgent.executeProjectCreation(intent, this.workingDirectory);
      
      if (result.success && result.project) {
        // Store project
        this.projects.set(result.project.id, result.project);
        
        // Update task status
        task.status = 'completed';
        task.result = result;
        task.completedAt = new Date();
        
        // Update conversation context
        const context = this.getOrCreateConversationContext(userId);
        context.currentProject = result.project;
        
        this.emit('projectCreated', { task, project: result.project, userId });
        
        return result;
      } else {
        // Update task status
        task.status = 'failed';
        task.error = result.error;
        
        this.emit('projectCreationFailed', { task, error: result.error, userId });
        
        return result;
      }
    } catch (error) {
      console.error('Error executing project creation:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async handleInteractiveMessage(message: string, userId: string): Promise<{
    success: boolean;
    response: string;
    modificationRequest?: ModificationRequest;
    downloadRequest?: DownloadRequest;
    error?: string;
  }> {
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
      
      // Handle message with CodeForge agent
      const result = await this.codeForgeAgent.handleInteractiveMessage(context.currentProject, message);
      
      // Add assistant response to conversation history
      context.conversationHistory.push({
        id: uuidv4(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date()
      });
      
      // Handle modification request if present
      if (result.modificationRequest) {
        this.modificationRequests.set(result.modificationRequest.id, result.modificationRequest);
        this.emit('modificationRequestCreated', { 
          modificationRequest: result.modificationRequest, 
          userId 
        });
        
        // Execute modification automatically
        if (context.currentProject) {
          console.log(`🔧 Executing modification automatically: ${result.modificationRequest.description}`);
          try {
            const modificationResult = await this.codeForgeAgent.handleModificationRequest(
              context.currentProject, 
              result.modificationRequest
            );
            
            if (modificationResult.success) {
              console.log(`✅ Modification executed successfully: ${result.modificationRequest.description}`);
              result.response += ` ✅ Modificação executada com sucesso!`;
            } else {
              console.log(`❌ Modification failed: ${modificationResult.error}`);
              result.response += ` ⚠️ Erro na execução: ${modificationResult.error}`;
            }
          } catch (error) {
            console.error('Error executing modification:', error);
            result.response += ` ⚠️ Erro na execução da modificação.`;
          }
        }
      }
      
      // Handle download request if present
      if (result.downloadRequest) {
        this.downloadRequests.set(result.downloadRequest.id, result.downloadRequest);
        this.emit('downloadRequestCreated', { 
          downloadRequest: result.downloadRequest, 
          userId 
        });
      }
      
      this.emit('interactiveMessageHandled', { userId, message, result });
      
      return result;
    } catch (error) {
      console.error('Error handling interactive message:', error);
      return {
        success: false,
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        error: (error as Error).message
      };
    }
  }

  async executeModificationRequest(modificationId: string, userId: string): Promise<{
    success: boolean;
    modification?: ModificationRequest;
    error?: string;
  }> {
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
      
      // Execute modification
      const result = await this.codeForgeAgent.handleModificationRequest(
        context.currentProject, 
        modification
      );
      
      if (result.success && result.modification) {
        // Update modification request
        this.modificationRequests.set(modificationId, result.modification);
        
        // Update project in context
        context.currentProject = context.currentProject;
        
        this.emit('modificationExecuted', { 
          modification: result.modification, 
          userId 
        });
        
        return result;
      } else {
        this.emit('modificationFailed', { 
          modification, 
          error: result.error, 
          userId 
        });
        
        return result;
      }
    } catch (error) {
      console.error('Error executing modification request:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async executeDownloadRequest(downloadId: string, userId: string): Promise<{
    success: boolean;
    downloadRequest?: DownloadRequest;
    error?: string;
  }> {
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
      
      // Execute download
      const result = await this.codeForgeAgent.handleDownloadRequest(
        context.currentProject, 
        downloadRequest
      );
      
      if (result.success && result.downloadRequest) {
        // Update download request
        this.downloadRequests.set(downloadId, result.downloadRequest);
        
        this.emit('downloadExecuted', { 
          downloadRequest: result.downloadRequest, 
          userId 
        });
        
        return result;
      } else {
        this.emit('downloadFailed', { 
          downloadRequest, 
          error: result.error, 
          userId 
        });
        
        return result;
      }
    } catch (error) {
      console.error('Error executing download request:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getModificationRequest(modificationId: string): ModificationRequest | undefined {
    return this.modificationRequests.get(modificationId);
  }

  getDownloadRequest(downloadId: string): DownloadRequest | undefined {
    return this.downloadRequests.get(downloadId);
  }

  getConversationContext(userId: string): ConversationContext | undefined {
    return this.conversationContexts.get(userId);
  }

  private getOrCreateConversationContext(userId: string): ConversationContext {
    let context = this.conversationContexts.get(userId);
    
    if (!context) {
      context = {
        userId,
        sessionId: uuidv4(),
        conversationHistory: [],
        pendingQuestions: [],
        userPreferences: {}
      };
      
      this.conversationContexts.set(userId, context);
    }
    
    return context;
  }

  private buildInputFromAnswers(answers: Record<string, any>, userId: string): string {
    console.log(`🔍 buildInputFromAnswers called with:`, answers);
    
    // Get the current conversation context to understand what project we're creating
    const context = this.getOrCreateConversationContext(userId);
    const lastUserMessage = context.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      // Use the original user input as base and append the answers
      const baseInput = lastUserMessage.content;
      const answerParts: string[] = [];
      
      for (const [key, value] of Object.entries(answers)) {
        if (value) {
          if (Array.isArray(value)) {
            answerParts.push(`${key}: ${value.join(', ')}`);
          } else {
            answerParts.push(`${key}: ${value}`);
          }
        }
      }
      
      if (answerParts.length > 0) {
        return `${baseInput} with additional requirements: ${answerParts.join(', ')}`;
      }
      
      return baseInput;
    }
    
    // Fallback: create a meaningful input from answers
    const parts: string[] = [];
    
    // Map answer keys to meaningful technology terms
    const techMapping: Record<string, string> = {
      'ui-framework': 'UI framework',
      'auth-provider': 'authentication provider',
      'database': 'database',
      'styling': 'styling framework',
      'testing': 'testing framework'
    };
    
    for (const [key, value] of Object.entries(answers)) {
      if (value) {
        const mappedKey = techMapping[key] || key;
        if (Array.isArray(value)) {
          parts.push(`${mappedKey}: ${value.join(', ')}`);
        } else {
          parts.push(`${mappedKey}: ${value}`);
        }
      }
    }
    
    // Create a comprehensive project description
    if (parts.length > 0) {
      return `Create a complete project with the following specifications: ${parts.join(', ')}. Include all necessary files, dependencies, and configuration.`;
    }
    
    return 'Create a complete project with standard configuration and best practices.';
  }

  private setupEventHandlers(): void {
    // Task events
    this.on('taskCreated', (task: any) => {
      console.log(`📋 Task created: ${task.prompt}`);
    });
    
    this.on('projectCreated', ({ task, project, userId }: { task: any; project: Project; userId: string }) => {
      console.log(`✅ Project created: ${project.name} for user ${userId}`);
    });
    
    this.on('projectCreationFailed', ({ task, error, userId }: { task: any; error: string; userId: string }) => {
      console.log(`❌ Project creation failed: ${error} for user ${userId}`);
    });
    
    // Modification events
    this.on('modificationRequestCreated', ({ modificationRequest, userId }: { modificationRequest: ModificationRequest; userId: string }) => {
      console.log(`🔧 Modification request created: ${modificationRequest.description} for user ${userId}`);
    });
    
    this.on('modificationExecuted', ({ modification, userId }: { modification: ModificationRequest; userId: string }) => {
      console.log(`✅ Modification executed: ${modification.description} for user ${userId}`);
    });
    
    this.on('modificationFailed', ({ modification, error, userId }: { modification: ModificationRequest; error: string; userId: string }) => {
      console.log(`❌ Modification failed: ${error} for user ${userId}`);
    });
    
    // Download events
    this.on('downloadRequestCreated', ({ downloadRequest, userId }: { downloadRequest: DownloadRequest; userId: string }) => {
      console.log(`📦 Download request created: ${downloadRequest.format} for user ${userId}`);
    });
    
    this.on('downloadExecuted', ({ downloadRequest, userId }: { downloadRequest: DownloadRequest; userId: string }) => {
      console.log(`✅ Download executed: ${downloadRequest.format} for user ${userId}`);
    });
    
    this.on('downloadFailed', ({ downloadRequest, error, userId }: { downloadRequest: DownloadRequest; error: string; userId: string }) => {
      console.log(`❌ Download failed: ${error} for user ${userId}`);
    });
    
    // Conversation events
    this.on('userInputProcessed', ({ userId, input, result }: { userId: string; input: string; result: ProcessingResult }) => {
      console.log(`💬 User input processed for user ${userId}: ${result.confidence} confidence`);
    });
    
    this.on('userAnswersProcessed', ({ userId, answers, result }: { userId: string; answers: Record<string, any>; result: ProcessingResult }) => {
      console.log(`📝 User answers processed for user ${userId}`);
    });
    
    this.on('interactiveMessageHandled', ({ userId, message, result }: { userId: string; message: string; result: any }) => {
      console.log(`💬 Interactive message handled for user ${userId}`);
    });
  }

  // New Task Orchestrator methods
  async createPersistentTask(
    name: string,
    description: string,
    projectType: string,
    userId: string,
    initialPrompt: string
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const request: TaskCreationRequest = {
        name,
        description,
        projectType,
        userId,
        initialPrompt,
        options: {
          autoStartServer: true,
          autoRunTests: true,
          generateReport: true,
          keepAlive: true,
          maxExecutionTime: 300000,
          retryOnFailure: true,
          maxRetries: 3,
          cleanupOnComplete: false
        }
      };

      const result = await this.taskOrchestrator.createPersistentTask(request);
      return result;

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async executePersistentTask(taskId: string): Promise<{ success: boolean; reportPath?: string; liveUrl?: string; error?: string }> {
    try {
      const result = await this.taskOrchestrator.executeTask(taskId);
      return result;

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async interactWithPersistentTask(
    taskId: string,
    interaction: string,
    userId: string
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      // Determine interaction type
      let interactionRequest;
      
      if (interaction.toLowerCase().includes('status') || interaction.toLowerCase().includes('progresso')) {
        interactionRequest = {
          taskId,
          question: interaction,
          userId
        };
      } else if (interaction.toLowerCase().includes('adicionar') || interaction.toLowerCase().includes('modificar')) {
        interactionRequest = {
          taskId,
          type: 'add_feature' as const,
          description: interaction,
          priority: 'medium' as const,
          userId
        };
      } else if (interaction.toLowerCase().includes('download') || interaction.toLowerCase().includes('baixar')) {
        interactionRequest = {
          taskId,
          userId,
          includeNodeModules: false,
          format: 'zip' as const
        };
      } else {
        interactionRequest = {
          taskId,
          question: interaction,
          userId
        };
      }

      const result = await this.taskOrchestrator.interactWithTask(interactionRequest);
      return result;

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async listPersistentTasks(userId: string): Promise<{ success: boolean; tasks?: any[]; error?: string }> {
    try {
      const result = await this.taskOrchestrator.listTasks(userId);
      return result;

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getPersistentTaskStatus(taskId: string): Promise<{ success: boolean; status?: any; error?: string }> {
    try {
      const result = await this.taskOrchestrator.getTaskStatus(taskId);
      return {
        success: true,
        status: result
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
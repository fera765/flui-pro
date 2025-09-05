import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
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
    
    this.setupEventHandlers();
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
      const builtInput = this.buildInputFromAnswers(answers);
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

  private buildInputFromAnswers(answers: Record<string, any>): string {
    console.log(`🔍 buildInputFromAnswers called with:`, answers);
    const parts: string[] = [];
    
    // Map answer keys to meaningful technology terms
    const techMapping: Record<string, string> = {
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
        } else {
          parts.push(`${mappedKey}: ${value}`);
        }
      }
    }
    
    // Add technology context based on answers
    if (answers['tech-1']) {
      const tech = answers['tech-1'].toLowerCase();
      if (tech.includes('node') || tech.includes('express')) {
        parts.push('backend Node.js Express');
      } else if (tech.includes('react')) {
        parts.push('frontend React');
      } else if (tech.includes('html')) {
        parts.push('frontend HTML');
      }
    }
    
    return parts.join(', ');
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
}
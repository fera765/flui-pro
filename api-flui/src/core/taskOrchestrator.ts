import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { TaskManager } from './taskManager';
import { LiveTester } from './liveTester';
import { MarkdownReporter } from './markdownReporter';
import { ContextPersistence } from './contextPersistence';
import { 
  TaskOrchestratorResult,
  TaskCreationRequest,
  TaskModificationRequest,
  TaskQuestionRequest,
  TaskDownloadRequest,
  TaskInteractionResult,
  TaskStatusUpdate,
  TaskSummary,
  TaskListResult,
  TaskExecutionContext,
  TaskExecutionOptions,
  Intent,
  TestResult
} from '../types/taskOrchestrator';

export class TaskOrchestrator extends EventEmitter {
  private taskManager: TaskManager;
  private liveTester: LiveTester;
  private markdownReporter: MarkdownReporter;
  private contextPersistence: ContextPersistence;
  private activeTasks: Map<string, TaskExecutionContext>;

  constructor(
    taskManager: TaskManager,
    liveTester: LiveTester,
    markdownReporter: MarkdownReporter,
    contextPersistence: ContextPersistence
  ) {
    super();
    this.taskManager = taskManager;
    this.liveTester = liveTester;
    this.markdownReporter = markdownReporter;
    this.contextPersistence = contextPersistence;
    this.activeTasks = new Map();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Task lifecycle events
    this.on('taskCreated', (data) => {
      console.log(`📋 Task created: ${data.taskId} - ${data.name}`);
    });

    this.on('taskStarted', (data) => {
      console.log(`🚀 Task started: ${data.taskId} - ${data.name}`);
    });

    this.on('taskProgress', (data) => {
      console.log(`📊 Task progress: ${data.taskId} - ${data.progress}%`);
    });

    this.on('taskCompleted', (data) => {
      console.log(`✅ Task completed: ${data.taskId} - ${data.name}`);
    });

    this.on('taskFailed', (data) => {
      console.log(`❌ Task failed: ${data.taskId} - ${data.error}`);
    });

    // Agent events
    this.on('agentStarted', (data) => {
      console.log(`🤖 Agent started: ${data.agentName} for task ${data.taskId}`);
    });

    this.on('agentCompleted', (data) => {
      console.log(`✅ Agent completed: ${data.agentName} for task ${data.taskId}`);
    });

    this.on('agentFailed', (data) => {
      console.log(`❌ Agent failed: ${data.agentName} for task ${data.taskId} - ${data.error}`);
    });

    // Tool events
    this.on('toolStarted', (data) => {
      console.log(`🔧 Tool started: ${data.toolName} for task ${data.taskId}`);
    });

    this.on('toolCompleted', (data) => {
      console.log(`✅ Tool completed: ${data.toolName} for task ${data.taskId}`);
    });

    this.on('toolFailed', (data) => {
      console.log(`❌ Tool failed: ${data.toolName} for task ${data.taskId} - ${data.error}`);
    });

    // Test events
    this.on('testStarted', (data) => {
      console.log(`🧪 Test started: ${data.testType} for task ${data.taskId}`);
    });

    this.on('testCompleted', (data) => {
      console.log(`✅ Test completed: ${data.testType} for task ${data.taskId} - ${data.result}`);
    });

    this.on('testFailed', (data) => {
      console.log(`❌ Test failed: ${data.testType} for task ${data.taskId} - ${data.error}`);
    });

    // Report events
    this.on('reportGenerated', (data) => {
      console.log(`📊 Report generated: ${data.reportPath} for task ${data.taskId}`);
    });

    // Interaction events
    this.on('interactionReceived', (data) => {
      console.log(`💬 Interaction received: ${data.type} for task ${data.taskId}`);
    });

    this.on('interactionProcessed', (data) => {
      console.log(`✅ Interaction processed: ${data.type} for task ${data.taskId}`);
    });
  }

  async createPersistentTask(request: TaskCreationRequest): Promise<TaskOrchestratorResult> {
    try {
      // Validate request
      if (!request.name || !request.description || !request.projectType || !request.userId || !request.initialPrompt) {
        return {
          success: false,
          error: 'Missing required fields: name, description, projectType, userId, initialPrompt'
        };
      }

      const taskId = uuidv4();
      const timestamp = new Date();

      // Create initial context
      const initialContext: TaskExecutionContext = {
        taskId,
        userId: request.userId,
        projectType: request.projectType,
        workingDirectory: '',
        conversationHistory: [
          {
            id: uuidv4(),
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

      // Create task in TaskManager
      const task = await this.taskManager.createPersistentTask(
        request.name,
        request.description,
        initialContext
      );

      // Update the context with the task ID from TaskManager
      initialContext.taskId = task.id;

      // Store in active tasks using the task ID from TaskManager
      this.activeTasks.set(task.id, initialContext);

      // Save context
      await this.contextPersistence.saveContext(task.id, initialContext);

      // Emit task created callback
      this.emit('taskCreated', {
        taskId: task.id,
        name: task.name,
        description: task.description,
        projectType: task.projectType,
        userId: request.userId,
        status: task.status,
        timestamp: new Date().toISOString()
      });

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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async executeTask(taskId: string): Promise<TaskOrchestratorResult> {
    try {
      const startTime = Date.now();

      // Get task context
      const context = this.activeTasks.get(taskId);
      if (!context) {
        return {
          success: false,
          error: `Task ${taskId} not found or not active`
        };
      }

      // Emit task started callback
      this.emit('taskStarted', {
        taskId,
        name: context.projectType,
        userId: context.userId,
        timestamp: new Date().toISOString()
      });

      // Update context
      context.lastAccessed = new Date();
      context.testStatus = 'running';

      // Emit progress callback
      this.emit('taskProgress', {
        taskId,
        progress: 10,
        message: 'Iniciando criação do projeto...',
        timestamp: new Date().toISOString()
      });

      // Simulate project creation (in real implementation, this would use CodeForgeAgent)
      this.emit('agentStarted', {
        taskId,
        agentName: 'CodeForgeAgent',
        action: 'projectCreation',
        timestamp: new Date().toISOString()
      });

      const projectStructure = await this.simulateProjectCreation(context);
      
      this.emit('agentCompleted', {
        taskId,
        agentName: 'CodeForgeAgent',
        action: 'projectCreation',
        result: 'success',
        timestamp: new Date().toISOString()
      });

      // Emit progress callback
      this.emit('taskProgress', {
        taskId,
        progress: 50,
        message: 'Executando testes...',
        timestamp: new Date().toISOString()
      });
      
      // Run tests
      const testResults = await this.runTests(context, projectStructure);
      
      // Emit progress callback
      this.emit('taskProgress', {
        taskId,
        progress: 75,
        message: 'Iniciando servidor...',
        timestamp: new Date().toISOString()
      });
      
      // Start server if needed
      const serverUrl = await this.startServer(context, projectStructure);
      
      // Emit progress callback
      this.emit('taskProgress', {
        taskId,
        progress: 90,
        message: 'Gerando relatório...',
        timestamp: new Date().toISOString()
      });
      
      // Generate report
      const reportPath = await this.generateReport(context, projectStructure, testResults, serverUrl);

      // Update context with results
      context.testResults = testResults;
      context.serverUrl = serverUrl;
      context.testStatus = testResults.some(t => t.status === 'failed') ? 'failed' : 'passed';

      // Save updated context
      await this.contextPersistence.updateContext(taskId, context);

      const executionTime = Date.now() - startTime;

      // Emit task completed callback
      this.emit('taskCompleted', {
        taskId,
        name: context.projectType,
        userId: context.userId,
        executionTime,
        filesCreated: projectStructure.files.length,
        testsPassed: testResults.filter(t => t.status === 'passed').length,
        testsFailed: testResults.filter(t => t.status === 'failed').length,
        reportPath,
        liveUrl: serverUrl,
        timestamp: new Date().toISOString()
      });

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
          buildTime: 1000, // Simulated
          serverStartTime: 500 // Simulated
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async interactWithTask(request: TaskQuestionRequest | TaskModificationRequest | TaskDownloadRequest): Promise<TaskInteractionResult> {
    try {
      const startTime = Date.now();
      const taskId = request.taskId;

      // Get task context
      const context = this.activeTasks.get(taskId);
      if (!context) {
        return {
          success: false,
          error: `Task ${taskId} not found or not active`
        };
      }

      // Update last accessed
      context.lastAccessed = new Date();

      let response: string;
      let interactionType: 'question' | 'modification' | 'status' | 'download';

      if ('question' in request) {
        // Handle question
        interactionType = 'question';
        response = await this.handleQuestion(context, request.question);
        
        // Add to conversation history
        context.conversationHistory.push({
          id: uuidv4(),
          role: 'user',
          content: request.question,
          timestamp: new Date()
        });
        context.conversationHistory.push({
          id: uuidv4(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        });

      } else if ('type' in request) {
        // Handle modification
        interactionType = 'modification';
        response = await this.handleModification(context, request);
        
        // Add modification to context
        context.modifications.push({
          id: uuidv4(),
          projectId: taskId,
          type: request.type,
          description: request.description,
          priority: request.priority,
          status: 'pending',
          createdAt: new Date()
        });

      } else if ('format' in request) {
        // Handle download
        interactionType = 'download';
        response = await this.handleDownload(context, request);
      } else {
        throw new Error('Invalid interaction request type');
      }

      // Save updated context
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async listTasks(userId: string): Promise<TaskListResult> {
    try {
      const allTasks = await this.taskManager.listActiveTasks();
      const userTasks = allTasks.filter(task => {
        // Check if the task belongs to the user by looking at the context
        const context = this.activeTasks.get(task.id);
        return context && context.userId === userId;
      });

      const taskSummaries: TaskSummary[] = userTasks.map(task => ({
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
        executionTime: 0, // Will be calculated from context
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusUpdate> {
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

    } catch (error) {
      return {
        taskId,
        status: 'error',
        message: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async pauseTask(taskId: string): Promise<TaskStatusUpdate> {
    try {
      const context = this.activeTasks.get(taskId);
      if (!context) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Update task status in TaskManager
      await this.taskManager.updateTaskStatus(taskId, 'paused');

      return {
        taskId,
        status: 'paused',
        message: 'Task paused successfully',
        timestamp: new Date()
      };

    } catch (error) {
      return {
        taskId,
        status: 'error',
        message: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async resumeTask(taskId: string): Promise<TaskStatusUpdate> {
    try {
      const context = this.activeTasks.get(taskId);
      if (!context) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Update task status in TaskManager
      await this.taskManager.updateTaskStatus(taskId, 'active');

      return {
        taskId,
        status: 'active',
        message: 'Task resumed successfully',
        timestamp: new Date()
      };

    } catch (error) {
      return {
        taskId,
        status: 'error',
        message: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async completeTask(taskId: string): Promise<TaskOrchestratorResult> {
    try {
      const context = this.activeTasks.get(taskId);
      if (!context) {
        return {
          success: false,
          error: `Task ${taskId} not found`
        };
      }

      // Update task status
      await this.taskManager.updateTaskStatus(taskId, 'completed');

      // Generate final report
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async deleteTask(taskId: string): Promise<TaskOrchestratorResult> {
    try {
      // Remove from active tasks
      this.activeTasks.delete(taskId);

      // Delete from TaskManager
      await this.taskManager.deleteTask(taskId);

      // Delete context
      await this.contextPersistence.deleteContext(taskId);

      return {
        success: true,
        taskId
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Private helper methods
  private detectTechnology(projectType: string): string {
    switch (projectType) {
      case 'frontend': return 'html';
      case 'backend': return 'nodejs';
      case 'mobile': return 'react-native';
      case 'content': return 'markdown';
      default: return 'unknown';
    }
  }

  private detectLanguage(projectType: string): string {
    switch (projectType) {
      case 'frontend': return 'javascript';
      case 'backend': return 'javascript';
      case 'mobile': return 'javascript';
      case 'content': return 'markdown';
      default: return 'unknown';
    }
  }

  private async simulateProjectCreation(context: TaskExecutionContext): Promise<any> {
    // Simulate project creation based on project type
    const files = [];
    
    if (context.projectType === 'frontend') {
      files.push('index.html', 'style.css', 'script.js');
    } else if (context.projectType === 'backend') {
      files.push('package.json', 'server.js', 'routes.js');
    } else if (context.projectType === 'content') {
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

  private async runTests(context: TaskExecutionContext, projectStructure: any): Promise<any[]> {
    // Emit test started callback
    this.emit('testStarted', {
      taskId: context.taskId,
      testType: 'build',
      timestamp: new Date().toISOString()
    });

    // Simulate test execution - return simple test results for now
    const testResults = [];
    
    if (context.projectType === 'frontend') {
      testResults.push({
        type: 'html',
        buildStatus: 'success',
        serverStatus: 'running',
        curlTests: [],
        executedAt: new Date()
      });
    } else if (context.projectType === 'backend') {
      testResults.push({
        type: 'nodejs',
        buildStatus: 'success',
        serverStatus: 'running',
        curlTests: [],
        executedAt: new Date()
      });
    }

    // Emit test completed callback
    this.emit('testCompleted', {
      taskId: context.taskId,
      testType: 'build',
      result: 'success',
      timestamp: new Date().toISOString()
    });

    return testResults;
  }

  private async startServer(context: TaskExecutionContext, projectStructure: any): Promise<string> {
    // Simulate server start
    const port = context.projectType === 'frontend' ? 3000 : 3001;
    return `http://localhost:${port}`;
  }

  private async generateReport(context: TaskExecutionContext, projectStructure: any, testResults: any[], serverUrl?: string): Promise<string> {
    // Emit report generation started callback
    this.emit('toolStarted', {
      taskId: context.taskId,
      toolName: 'MarkdownReporter',
      action: 'generateReport',
      timestamp: new Date().toISOString()
    });

    // Generate report using MarkdownReporter
    const title = `Projeto ${context.projectType}`;
    
    const reportResult = await this.markdownReporter.generateHTMLProjectReport(
      title,
      projectStructure,
      {
        total: testResults.length,
        passed: testResults.filter(t => t.buildStatus === 'success').length,
        failed: testResults.filter(t => t.buildStatus === 'failed').length,
        skipped: 0,
        duration: 1000, // Simulated
        details: testResults.map(t => ({
          name: `${t.type} test`,
          status: t.buildStatus === 'success' ? 'passed' : 'failed',
          duration: 500,
          output: `Test completed with status: ${t.buildStatus}`
        }))
      },
      {
        buildStatus: 'success',
        serverStatus: serverUrl ? 'running' : 'stopped',
        testStatus: testResults.some(t => t.buildStatus === 'failed') ? 'failed' : 'passed',
        curlStatus: 'success',
        totalTime: Date.now() - context.createdAt.getTime(),
        errors: [],
        warnings: []
      },
      serverUrl || '',
      {
        includeIcons: true,
        includeEmojis: true,
        includeTimestamps: true,
        includeMetadata: true,
        includeTestDetails: true,
        includeFileStructure: true,
        includeExecutionSummary: true
      }
    );

    // Emit report generated callback
    this.emit('reportGenerated', {
      taskId: context.taskId,
      reportPath: reportResult.reportPath || '',
      timestamp: new Date().toISOString()
    });

    // Emit tool completed callback
    this.emit('toolCompleted', {
      taskId: context.taskId,
      toolName: 'MarkdownReporter',
      action: 'generateReport',
      result: 'success',
      timestamp: new Date().toISOString()
    });

    return reportResult.reportPath || '';
  }

  private async handleQuestion(context: TaskExecutionContext, question: string): Promise<string> {
    // Simulate question handling
    if (question.toLowerCase().includes('progresso') || question.toLowerCase().includes('status')) {
      return `O projeto está em progresso. Status atual: ${context.testStatus}. ${context.currentFeatures.length} funcionalidades implementadas.`;
    } else if (question.toLowerCase().includes('tempo') || question.toLowerCase().includes('quando')) {
      return `O projeto foi iniciado em ${context.createdAt.toLocaleString('pt-BR')}. Tempo estimado de conclusão: 30 minutos.`;
    } else {
      return `Entendi sua pergunta: "${question}". Como posso ajudá-lo com o projeto?`;
    }
  }

  private async handleModification(context: TaskExecutionContext, request: TaskModificationRequest): Promise<string> {
    // Simulate modification handling
    return `Modificação "${request.description}" foi adicionada à lista de tarefas com prioridade ${request.priority}. Será implementada em breve.`;
  }

  private async handleDownload(context: TaskExecutionContext, request: TaskDownloadRequest): Promise<string> {
    // Simulate download handling
    return `Download do projeto será preparado no formato ${request.format}. ${request.includeNodeModules ? 'Incluindo node_modules.' : 'Excluindo node_modules.'}`;
  }

  private calculateProgress(task: any): number {
    // Calculate progress based on task status and features
    if (task.status === 'completed') return 100;
    if (task.status === 'error') return 0;
    
    const baseProgress = task.status === 'active' ? 50 : 25;
    const featureProgress = Math.min(task.context.currentFeatures.length * 10, 40);
    
    return Math.min(baseProgress + featureProgress, 95);
  }

  private calculateProgressFromContext(context: TaskExecutionContext): number {
    if (context.testStatus === 'passed') return 100;
    if (context.testStatus === 'failed') return 75;
    if (context.testStatus === 'running') return 50;
    return 25;
  }

  private getCurrentStep(context: TaskExecutionContext): string {
    if (context.testStatus === 'passed') return 'Concluído';
    if (context.testStatus === 'running') return 'Executando testes';
    if (context.testStatus === 'failed') return 'Corrigindo erros';
    return 'Iniciando projeto';
  }

  private getStatusMessage(context: TaskExecutionContext): string {
    if (context.testStatus === 'passed') return 'Projeto concluído com sucesso!';
    if (context.testStatus === 'running') return 'Executando testes e validações...';
    if (context.testStatus === 'failed') return 'Alguns testes falharam, corrigindo...';
    return 'Projeto em desenvolvimento';
  }

  async getTaskSummary(taskId: string): Promise<{ success: boolean; summary?: TaskSummary; error?: string }> {
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

      const summary: TaskSummary = {
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getTaskStatistics(): Promise<{ 
    success: boolean; 
    statistics?: {
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
      errorTasks: number;
      totalExecutionTime: number;
      averageExecutionTime: number;
      totalFilesCreated: number;
      totalTestsPassed: number;
      totalTestsFailed: number;
    }; 
    error?: string 
  }> {
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async cleanupCompletedTasks(): Promise<{ success: boolean; cleanedCount?: number; error?: string }> {
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

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
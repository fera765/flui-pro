import { v4 as uuidv4 } from 'uuid';
import { Task, TaskResult, OrchestratorConfig, ClassificationResult } from '../types';
import { Classifier } from './classifier';
import { Planner } from './planner';
import { Worker } from './worker';
import { Supervisor } from './supervisor';
import { SRIProtocol, EpisodicStore, EmotionHash, ContextInjector } from './emotionMemory';
import { EmotionMemoryConfig } from '../types/emotionMemory';

export interface TaskStatus {
  id: string;
  status: Task['status'];
  progress: number;
  estimatedCompletion: Date;
  metadata: Record<string, any>;
}

export interface TaskFilter {
  status?: Task['status'];
  type?: Task['type'];
  depth?: number;
}

export class Orchestrator {
  private tasks: Map<string, Task> = new Map();
  private events: Map<string, any[]> = new Map();
  private sriProtocol: SRIProtocol;

  constructor(
    private config: OrchestratorConfig,
    private classifier: Classifier,
    private planner: Planner,
    private worker: Worker,
    private supervisor: Supervisor,
    emotionMemoryConfig?: EmotionMemoryConfig
  ) {
    // Initialize emotion memory system
    const defaultEmotionConfig: EmotionMemoryConfig = {
      emotionThreshold: 0.7,
      maxMemories: 1000,
      memoryDecay: 0.95,
      contextWindow: 3,
      hashLength: 8
    };

    const emotionConfig = emotionMemoryConfig || defaultEmotionConfig;
    const episodicStore = new EpisodicStore(emotionConfig);
    const emotionHash = new EmotionHash();
    const contextInjector = new ContextInjector();
    
    this.sriProtocol = new SRIProtocol(episodicStore, emotionHash, contextInjector, emotionConfig);
  }

  async createTask(prompt: string): Promise<Task> {
    const classification = await this.classifier.classifyTask(prompt);
    
    const task: Task = {
      id: uuidv4(),
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
        ...classification.parameters
      }
    };

    this.tasks.set(task.id, task);
    this.emitEvent(task.id, 'task_created', { task });
    
    return task;
  }

  async executeTask(taskId: string): Promise<TaskResult> {
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

      if (task.depth >= this.config.maxDepth) {
        throw new Error('Max depth exceeded');
      }

      // Apply SRI Protocol to optimize context before execution
      const contextMessages = this.buildContextMessages(task);
      const sriResult = await this.sriProtocol.optimizeContext(contextMessages, taskId);
      
      // Update task with optimized context
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

      const result = await this.worker.executeTask(optimizedTask);
      
      // Store experience in emotion memory
      await this.sriProtocol.storeExperience(taskId, task.prompt, result);
      
      if (result.success) {
        this.updateTaskStatus(taskId, 'completed', result.data);
        this.emitEvent(taskId, 'task_completed', { task, result });
      } else {
        throw new Error(result.error || 'Task execution failed');
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      this.updateTaskStatus(taskId, 'failed', undefined, errorMessage);
      this.emitEvent(taskId, 'task_failed', { task, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
        metadata: task.metadata
      };
    }
  }

  async delegateTask(taskId: string): Promise<TaskResult> {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      const plan = await this.planner.createPlan(task);
      
      if (!this.worker.isAvailable()) {
        throw new Error('No workers available');
      }

      // Create subtasks
      const subtasks: Task[] = [];
      for (const subtaskPlan of plan.subtasks) {
        const subtask = await this.createTask(subtaskPlan.prompt);
        subtask.parentTaskId = taskId;
        subtask.depth = task.depth + 1;
        task.childTasks.push(subtask.id);
        subtasks.push(subtask);
      }

      this.updateTask(taskId, { childTasks: task.childTasks });
      this.emitEvent(taskId, 'task_delegated', { task, subtasks });

      return {
        success: true,
        data: { subtasks: subtasks.map(t => ({ id: t.id, prompt: t.prompt })) },
        metadata: { plan, subtaskCount: subtasks.length }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Delegation failed',
        metadata: { taskId }
      };
    }
  }

  async retryTask(taskId: string): Promise<TaskResult> {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.retries >= task.maxRetries) {
      return {
        success: false,
        error: 'Max retries exceeded',
        metadata: { taskId, retries: task.retries, maxRetries: task.maxRetries }
      };
    }

    // Reset task status for retry
    this.updateTask(taskId, {
      status: 'pending',
      retries: task.retries + 1,
      updatedAt: new Date()
    });

    this.emitEvent(taskId, 'task_retried', { task, retryCount: task.retries + 1 });

    // Execute the task again
    return this.executeTask(taskId);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getTaskStatus(taskId: string): TaskStatus | null {
    const task = this.getTask(taskId);
    if (!task) return null;

    const progress = this.calculateProgress(task);
    const estimatedCompletion = this.estimateCompletion(task);

    return {
      id: task.id,
      status: task.status,
      progress,
      estimatedCompletion,
      metadata: task.metadata
    };
  }

  listTasks(filter?: TaskFilter): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }

    if (filter?.type) {
      tasks = tasks.filter(t => t.type === filter.type);
    }

    if (filter?.depth !== undefined) {
      tasks = tasks.filter(t => t.depth === filter.depth);
    }

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTaskEvents(taskId: string): any[] {
    return this.events.get(taskId) || [];
  }

  private updateTaskStatus(taskId: string, status: Task['status'], result?: any, error?: string): void {
    const task = this.getTask(taskId);
    if (!task) return;

    task.status = status;
    task.updatedAt = new Date();
    
    if (result !== undefined) {
      task.result = result;
    }
    
    if (error !== undefined) {
      task.error = error;
    }

    if (status === 'completed') {
      task.completedAt = new Date();
    }

    this.tasks.set(taskId, task);
  }

  private updateTask(taskId: string, updates: Partial<Task>): void {
    const task = this.getTask(taskId);
    if (!task) return;

    Object.assign(task, updates);
    task.updatedAt = new Date();
    this.tasks.set(taskId, task);
  }

  private calculateProgress(task: Task): number {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed') return 0;
    if (task.status === 'running') return 50;
    return 0;
  }

  private estimateCompletion(task: Task): Date {
    const now = new Date();
    if (task.status === 'completed') return task.completedAt!;
    if (task.status === 'failed') return now;
    
    // Simple estimation based on task type and complexity
    const baseTime = 30000; // 30 seconds base
    const complexityMultiplier = Math.pow(2, task.depth);
    const estimatedMs = baseTime * complexityMultiplier;
    
    return new Date(now.getTime() + estimatedMs);
  }

  private emitEvent(taskId: string, eventType: string, data: any): void {
    const event = {
      id: uuidv4(),
      taskId,
      type: eventType,
      timestamp: new Date(),
      data
    };

    if (!this.events.has(taskId)) {
      this.events.set(taskId, []);
    }

    this.events.get(taskId)!.push(event);
  }

  /**
   * Build context messages from task and conversation history
   */
  private buildContextMessages(task: Task): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const messages = [];
    
    // Add system message
    messages.push({
      role: 'system' as const,
      content: 'You are FLUI, an autonomous AI assistant. Use relevant memories to improve your responses.'
    });
    
    // Add task prompt as user message
    messages.push({
      role: 'user' as const,
      content: task.prompt
    });
    
    // Add conversation history if available
    if (task.metadata.conversationHistory) {
      for (const msg of task.metadata.conversationHistory) {
        messages.push(msg);
      }
    }
    
    return messages;
  }

  /**
   * Get emotion memory statistics
   */
  async getEmotionMemoryStats(): Promise<any> {
    return await this.sriProtocol.getMemoryStats();
  }

  /**
   * Clear emotion memories (for testing)
   */
  async clearEmotionMemories(): Promise<void> {
    await this.sriProtocol.clearMemories();
  }
}
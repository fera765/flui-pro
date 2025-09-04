import { EventEmitter } from 'events';
import { TimeoutManager } from './timeoutManager';
import { ConcurrentTaskRequest } from '../types/timeout';
import { Task } from '../types';

export class ConcurrentTaskManager extends EventEmitter {
  private activeTasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private timeoutManager: TimeoutManager;
  private maxConcurrentTasks: number;

  constructor(timeoutManager: TimeoutManager, maxConcurrentTasks: number = 3) {
    super();
    this.timeoutManager = timeoutManager;
    this.maxConcurrentTasks = maxConcurrentTasks;

    // Listen to timeout events
    this.timeoutManager.on('taskRetry', (data) => {
      this.handleTaskRetry(data.taskId, data.retryCount);
    });

    this.timeoutManager.on('taskFailed', (data) => {
      this.handleTaskFailure(data.taskId, data.retryCount, data.totalTime);
    });

    this.timeoutManager.on('taskForceCompleted', (data) => {
      this.handleTaskForceCompleted(data.taskId, data.reason);
    });
  }

  // Add new task to queue or execute immediately
  async addTask(task: Task, userInput?: string): Promise<{ taskId: string; queued: boolean }> {
    const currentTaskId = this.getCurrentActiveTaskId();
    
    if (userInput && currentTaskId) {
      // Analyze if this is a concurrent request
      const request = this.timeoutManager.analyzeConcurrentRequest(userInput, currentTaskId);
      
      switch (request.type) {
        case 'status_check':
          return this.handleStatusCheck(currentTaskId, userInput);
        
        case 'interrupt':
          return this.handleTaskInterruption(currentTaskId, userInput);
        
        case 'new_task':
          return this.handleNewConcurrentTask(task, userInput);
        
        case 'continue':
          return this.handleTaskContinuation(currentTaskId, userInput);
      }
    }

    // Normal task addition
    if (this.activeTasks.size < this.maxConcurrentTasks) {
      return this.executeTaskImmediately(task);
    } else {
      return this.queueTask(task);
    }
  }

  // Execute task immediately
  private async executeTaskImmediately(task: Task): Promise<{ taskId: string; queued: boolean }> {
    this.activeTasks.set(task.id, task);
    
    // Start timeout tracking
    const isLongRunning = this.detectLongRunningTask(task);
    this.timeoutManager.startTaskTimeout(task.id, isLongRunning);

    console.log(`🚀 Executing task immediately: ${task.id}`);
    
    this.emit('taskStarted', {
      taskId: task.id,
      prompt: task.prompt,
      queued: false
    });

    return { taskId: task.id, queued: false };
  }

  // Queue task for later execution
  private async queueTask(task: Task): Promise<{ taskId: string; queued: boolean }> {
    this.taskQueue.push(task);
    
    console.log(`📋 Task queued: ${task.id} (queue position: ${this.taskQueue.length})`);
    
    this.emit('taskQueued', {
      taskId: task.id,
      prompt: task.prompt,
      queuePosition: this.taskQueue.length
    });

    return { taskId: task.id, queued: true };
  }

  // Handle status check requests
  private async handleStatusCheck(taskId: string, userInput: string): Promise<{ taskId: string; queued: boolean }> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      this.emit('statusResponse', {
        taskId,
        status: 'not_found',
        message: 'Task not found or already completed'
      });
      return { taskId, queued: false };
    }

    const taskInfo = this.timeoutManager.getTaskStatus(taskId);
    const isLongRunning = this.timeoutManager.isLongRunningTask(taskId);
    
    let status = 'running';
    let message = 'Task is running normally';
    
    if (taskInfo) {
      const elapsed = Date.now() - taskInfo.startTime;
      const remaining = taskInfo.timeout - elapsed;
      
      if (isLongRunning) {
        message = `Task is running (long-running operation). Elapsed: ${Math.round(elapsed/1000)}s, Remaining: ${Math.round(remaining/1000)}s`;
      } else {
        message = `Task is running. Elapsed: ${Math.round(elapsed/1000)}s, Remaining: ${Math.round(remaining/1000)}s`;
      }
      
      if (taskInfo.retryCount > 0) {
        message += ` (Retry ${taskInfo.retryCount}/${taskInfo.retryCount})`;
      }
    }

    this.emit('statusResponse', {
      taskId,
      status,
      message,
      isLongRunning,
      retryCount: taskInfo?.retryCount || 0
    });

    return { taskId, queued: false };
  }

  // Handle task interruption
  private async handleTaskInterruption(taskId: string, userInput: string): Promise<{ taskId: string; queued: boolean }> {
    console.log(`🛑 User requested interruption of task: ${taskId}`);
    
    this.timeoutManager.forceCompleteTask(taskId, 'User requested interruption');
    this.activeTasks.delete(taskId);
    
    this.emit('taskInterrupted', {
      taskId,
      reason: 'User requested interruption',
      userInput
    });

    return { taskId, queued: false };
  }

  // Handle new concurrent task
  private async handleNewConcurrentTask(task: Task, userInput: string): Promise<{ taskId: string; queued: boolean }> {
    console.log(`🔄 User requested new concurrent task: ${task.id}`);
    
    if (this.activeTasks.size < this.maxConcurrentTasks) {
      return this.executeTaskImmediately(task);
    } else {
      return this.queueTask(task);
    }
  }

  // Handle task continuation
  private async handleTaskContinuation(taskId: string, userInput: string): Promise<{ taskId: string; queued: boolean }> {
    console.log(`▶️ User requested continuation of task: ${taskId}`);
    
    const task = this.activeTasks.get(taskId);
    if (task) {
      // Extend timeout for continuation
      this.timeoutManager.updateTaskTimeout(taskId, this.timeoutManager['config'].longRunningTimeout);
      
      this.emit('taskContinued', {
        taskId,
        reason: 'User requested continuation',
        userInput
      });
    }

    return { taskId, queued: false };
  }

  // Handle task retry
  private handleTaskRetry(taskId: string, retryCount: number): void {
    console.log(`🔄 Retrying task: ${taskId} (attempt ${retryCount})`);
    
    this.emit('taskRetry', {
      taskId,
      retryCount,
      message: `Retrying task after timeout (attempt ${retryCount})`
    });
  }

  // Handle task failure
  private handleTaskFailure(taskId: string, retryCount: number, totalTime: number): void {
    console.log(`❌ Task failed: ${taskId} after ${retryCount} retries (${Math.round(totalTime/1000)}s)`);
    
    this.activeTasks.delete(taskId);
    
    this.emit('taskFailed', {
      taskId,
      retryCount,
      totalTime,
      message: `Task failed after ${retryCount} retries and ${Math.round(totalTime/1000)}s`
    });

    // Process next task in queue
    this.processNextQueuedTask();
  }

  // Handle force completed task
  private handleTaskForceCompleted(taskId: string, reason: string): void {
    console.log(`🛑 Task force completed: ${taskId} - ${reason}`);
    
    this.activeTasks.delete(taskId);
    
    this.emit('taskForceCompleted', {
      taskId,
      reason,
      message: `Task was force completed: ${reason}`
    });

    // Process next task in queue
    this.processNextQueuedTask();
  }

  // Process next task in queue
  private processNextQueuedTask(): void {
    if (this.taskQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
      const nextTask = this.taskQueue.shift()!;
      this.executeTaskImmediately(nextTask);
    }
  }

  // Detect if task is long running
  private detectLongRunningTask(task: Task): boolean {
    const prompt = task.prompt.toLowerCase();
    
    // Keywords that indicate long-running operations
    const longRunningKeywords = [
      'web scraping', 'scraping', 'navegador', 'browser', 'headless',
      'download', 'upload', 'processamento', 'análise completa',
      'pesquisa extensa', 'coleta de dados', 'mineração de dados'
    ];

    return longRunningKeywords.some(keyword => prompt.includes(keyword));
  }

  // Get current active task ID (for status checks)
  private getCurrentActiveTaskId(): string | undefined {
    const activeTasks = Array.from(this.activeTasks.keys());
    return activeTasks[0]; // Return first active task
  }

  // Get task status
  getTaskStatus(taskId: string): { task: Task | null; timeoutInfo: any; queued: boolean } {
    const task = this.activeTasks.get(taskId) || null;
    const timeoutInfo = this.timeoutManager.getTaskStatus(taskId);
    const queued = this.taskQueue.some(t => t.id === taskId);

    return { task, timeoutInfo, queued };
  }

  // Get all active tasks
  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  // Get queue status
  getQueueStatus(): { queued: number; active: number; maxConcurrent: number } {
    return {
      queued: this.taskQueue.length,
      active: this.activeTasks.size,
      maxConcurrent: this.maxConcurrentTasks
    };
  }
}
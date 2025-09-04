import { TimeoutConfig, TaskTimeoutInfo, ConcurrentTaskRequest } from '../types/timeout';
import { EventEmitter } from 'events';

export class TimeoutManager extends EventEmitter {
  private activeTasks: Map<string, TaskTimeoutInfo> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: TimeoutConfig;

  constructor(config: TimeoutConfig) {
    super();
    this.config = config;
  }

  // Start timeout tracking for a task
  startTaskTimeout(taskId: string, isLongRunning: boolean = false): void {
    const timeout = isLongRunning ? this.config.longRunningTimeout : this.config.defaultTimeout;
    
    const taskInfo: TaskTimeoutInfo = {
      taskId,
      startTime: Date.now(),
      timeout,
      isLongRunning,
      retryCount: 0
    };

    this.activeTasks.set(taskId, taskInfo);

    // Set timeout
    const timeoutId = setTimeout(() => {
      this.handleTimeout(taskId);
    }, timeout);

    this.timeouts.set(taskId, timeoutId);

    console.log(`⏱️ Started timeout tracking for task ${taskId} (${timeout}ms, longRunning: ${isLongRunning})`);
  }

  // Update timeout for a specific task (useful for plugins that need more time)
  updateTaskTimeout(taskId: string, newTimeout: number): void {
    const taskInfo = this.activeTasks.get(taskId);
    if (!taskInfo) return;

    // Clear existing timeout
    const existingTimeout = this.timeouts.get(taskId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.handleTimeout(taskId);
    }, newTimeout);

    this.timeouts.set(taskId, timeoutId);
    taskInfo.timeout = newTimeout;

    console.log(`⏱️ Updated timeout for task ${taskId} to ${newTimeout}ms`);
  }

  // Mark task as completed
  completeTask(taskId: string): void {
    const timeoutId = this.timeouts.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(taskId);
    }

    this.activeTasks.delete(taskId);
    console.log(`✅ Task ${taskId} completed, timeout cleared`);
  }

  // Handle timeout event
  private handleTimeout(taskId: string): void {
    const taskInfo = this.activeTasks.get(taskId);
    if (!taskInfo) return;

    taskInfo.retryCount++;
    
    console.log(`⏰ Task ${taskId} timed out (attempt ${taskInfo.retryCount}/${this.config.maxRetries})`);

    if (taskInfo.retryCount < this.config.maxRetries) {
      // Retry with exponential backoff
      const retryDelay = this.config.retryDelay * Math.pow(2, taskInfo.retryCount - 1);
      
      console.log(`🔄 Retrying task ${taskId} in ${retryDelay}ms`);
      
      setTimeout(() => {
        this.emit('taskRetry', {
          taskId,
          retryCount: taskInfo.retryCount,
          delay: retryDelay
        });
      }, retryDelay);
    } else {
      // Max retries reached, emit failure
      console.log(`❌ Task ${taskId} failed after ${this.config.maxRetries} attempts`);
      
      this.emit('taskFailed', {
        taskId,
        retryCount: taskInfo.retryCount,
        totalTime: Date.now() - taskInfo.startTime,
        isLongRunning: taskInfo.isLongRunning
      });

      this.completeTask(taskId);
    }
  }

  // Get task status
  getTaskStatus(taskId: string): TaskTimeoutInfo | null {
    return this.activeTasks.get(taskId) || null;
  }

  // Get all active tasks
  getActiveTasks(): TaskTimeoutInfo[] {
    return Array.from(this.activeTasks.values());
  }

  // Check if task is long running
  isLongRunningTask(taskId: string): boolean {
    const taskInfo = this.activeTasks.get(taskId);
    return taskInfo?.isLongRunning || false;
  }

  // Analyze user input for concurrent task management
  analyzeConcurrentRequest(input: string, currentTaskId?: string): ConcurrentTaskRequest {
    const lowerInput = input.toLowerCase();

    // Check for status inquiries
    if (lowerInput.includes('está') && (lowerInput.includes('travado') || lowerInput.includes('funcionando') || lowerInput.includes('terminando'))) {
      return {
        type: 'status_check',
        originalTaskId: currentTaskId,
        reason: 'User asking about task status'
      };
    }

    // Check for interruption requests
    if (lowerInput.includes('parar') || lowerInput.includes('cancelar') || lowerInput.includes('interromper')) {
      return {
        type: 'interrupt',
        originalTaskId: currentTaskId,
        reason: 'User requesting task interruption'
      };
    }

    // Check for new task requests
    if (lowerInput.includes('também') || lowerInput.includes('adicional') || lowerInput.includes('além disso')) {
      return {
        type: 'new_task',
        originalTaskId: currentTaskId,
        newPrompt: input,
        reason: 'User requesting additional task'
      };
    }

    // Check for continuation requests
    if (lowerInput.includes('continuar') || lowerInput.includes('prosseguir')) {
      return {
        type: 'continue',
        originalTaskId: currentTaskId,
        reason: 'User requesting task continuation'
      };
    }

    // Default to new task if no current task
    if (!currentTaskId) {
      return {
        type: 'new_task',
        newPrompt: input,
        reason: 'New task request'
      };
    }

    // If there's a current task and input doesn't match patterns, treat as status check
    return {
      type: 'status_check',
      originalTaskId: currentTaskId,
      reason: 'Ambiguous input with active task'
    };
  }

  // Detect error loops in task execution
  detectErrorLoop(taskId: string, error: string): boolean {
    const taskInfo = this.activeTasks.get(taskId);
    if (!taskInfo) return false;

    // Check if same error occurred multiple times
    if (taskInfo.lastError === error && taskInfo.retryCount >= 3) {
      console.log(`🔄 Error loop detected for task ${taskId}: ${error}`);
      return true;
    }

    taskInfo.lastError = error;
    return false;
  }

  // Force complete a task (for error recovery)
  forceCompleteTask(taskId: string, reason: string): void {
    console.log(`🛑 Force completing task ${taskId}: ${reason}`);
    this.completeTask(taskId);
    
    this.emit('taskForceCompleted', {
      taskId,
      reason,
      totalTime: Date.now() - (this.activeTasks.get(taskId)?.startTime || Date.now())
    });
  }
}
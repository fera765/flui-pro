"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentTaskManager = void 0;
const events_1 = require("events");
class ConcurrentTaskManager extends events_1.EventEmitter {
    constructor(timeoutManager, maxConcurrentTasks = 3) {
        super();
        this.activeTasks = new Map();
        this.taskQueue = [];
        this.timeoutManager = timeoutManager;
        this.maxConcurrentTasks = maxConcurrentTasks;
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
    async addTask(task, userInput) {
        const currentTaskId = this.getCurrentActiveTaskId();
        if (userInput && currentTaskId) {
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
        if (this.activeTasks.size < this.maxConcurrentTasks) {
            return this.executeTaskImmediately(task);
        }
        else {
            return this.queueTask(task);
        }
    }
    async executeTaskImmediately(task) {
        this.activeTasks.set(task.id, task);
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
    async queueTask(task) {
        this.taskQueue.push(task);
        console.log(`📋 Task queued: ${task.id} (queue position: ${this.taskQueue.length})`);
        this.emit('taskQueued', {
            taskId: task.id,
            prompt: task.prompt,
            queuePosition: this.taskQueue.length
        });
        return { taskId: task.id, queued: true };
    }
    async handleStatusCheck(taskId, userInput) {
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
                message = `Task is running (long-running operation). Elapsed: ${Math.round(elapsed / 1000)}s, Remaining: ${Math.round(remaining / 1000)}s`;
            }
            else {
                message = `Task is running. Elapsed: ${Math.round(elapsed / 1000)}s, Remaining: ${Math.round(remaining / 1000)}s`;
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
    async handleTaskInterruption(taskId, userInput) {
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
    async handleNewConcurrentTask(task, userInput) {
        console.log(`🔄 User requested new concurrent task: ${task.id}`);
        if (this.activeTasks.size < this.maxConcurrentTasks) {
            return this.executeTaskImmediately(task);
        }
        else {
            return this.queueTask(task);
        }
    }
    async handleTaskContinuation(taskId, userInput) {
        console.log(`▶️ User requested continuation of task: ${taskId}`);
        const task = this.activeTasks.get(taskId);
        if (task) {
            this.timeoutManager.updateTaskTimeout(taskId, this.timeoutManager['config'].longRunningTimeout);
            this.emit('taskContinued', {
                taskId,
                reason: 'User requested continuation',
                userInput
            });
        }
        return { taskId, queued: false };
    }
    handleTaskRetry(taskId, retryCount) {
        console.log(`🔄 Retrying task: ${taskId} (attempt ${retryCount})`);
        this.emit('taskRetry', {
            taskId,
            retryCount,
            message: `Retrying task after timeout (attempt ${retryCount})`
        });
    }
    handleTaskFailure(taskId, retryCount, totalTime) {
        console.log(`❌ Task failed: ${taskId} after ${retryCount} retries (${Math.round(totalTime / 1000)}s)`);
        this.activeTasks.delete(taskId);
        this.emit('taskFailed', {
            taskId,
            retryCount,
            totalTime,
            message: `Task failed after ${retryCount} retries and ${Math.round(totalTime / 1000)}s`
        });
        this.processNextQueuedTask();
    }
    handleTaskForceCompleted(taskId, reason) {
        console.log(`🛑 Task force completed: ${taskId} - ${reason}`);
        this.activeTasks.delete(taskId);
        this.emit('taskForceCompleted', {
            taskId,
            reason,
            message: `Task was force completed: ${reason}`
        });
        this.processNextQueuedTask();
    }
    processNextQueuedTask() {
        if (this.taskQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
            const nextTask = this.taskQueue.shift();
            this.executeTaskImmediately(nextTask);
        }
    }
    detectLongRunningTask(task) {
        const prompt = task.prompt.toLowerCase();
        const longRunningKeywords = [
            'web scraping', 'scraping', 'navegador', 'browser', 'headless',
            'download', 'upload', 'processamento', 'análise completa',
            'pesquisa extensa', 'coleta de dados', 'mineração de dados'
        ];
        return longRunningKeywords.some(keyword => prompt.includes(keyword));
    }
    getCurrentActiveTaskId() {
        const activeTasks = Array.from(this.activeTasks.keys());
        return activeTasks[0];
    }
    getTaskStatus(taskId) {
        const task = this.activeTasks.get(taskId) || null;
        const timeoutInfo = this.timeoutManager.getTaskStatus(taskId);
        const queued = this.taskQueue.some(t => t.id === taskId);
        return { task, timeoutInfo, queued };
    }
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    getQueueStatus() {
        return {
            queued: this.taskQueue.length,
            active: this.activeTasks.size,
            maxConcurrent: this.maxConcurrentTasks
        };
    }
}
exports.ConcurrentTaskManager = ConcurrentTaskManager;
//# sourceMappingURL=concurrentTaskManager.js.map
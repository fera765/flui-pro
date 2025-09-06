"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutManager = void 0;
const events_1 = require("events");
class TimeoutManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.activeTasks = new Map();
        this.timeouts = new Map();
        this.config = config;
    }
    startTaskTimeout(taskId, isLongRunning = false) {
        const timeout = isLongRunning ? this.config.longRunningTimeout : this.config.defaultTimeout;
        const taskInfo = {
            taskId,
            startTime: Date.now(),
            timeout,
            isLongRunning,
            retryCount: 0
        };
        this.activeTasks.set(taskId, taskInfo);
        const timeoutId = setTimeout(() => {
            this.handleTimeout(taskId);
        }, timeout);
        this.timeouts.set(taskId, timeoutId);
        console.log(`⏱️ Started timeout tracking for task ${taskId} (${timeout}ms, longRunning: ${isLongRunning})`);
    }
    updateTaskTimeout(taskId, newTimeout) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo)
            return;
        const existingTimeout = this.timeouts.get(taskId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeoutId = setTimeout(() => {
            this.handleTimeout(taskId);
        }, newTimeout);
        this.timeouts.set(taskId, timeoutId);
        taskInfo.timeout = newTimeout;
        console.log(`⏱️ Updated timeout for task ${taskId} to ${newTimeout}ms`);
    }
    completeTask(taskId) {
        const timeoutId = this.timeouts.get(taskId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(taskId);
        }
        this.activeTasks.delete(taskId);
        console.log(`✅ Task ${taskId} completed, timeout cleared`);
    }
    handleTimeout(taskId) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo)
            return;
        taskInfo.retryCount++;
        console.log(`⏰ Task ${taskId} timed out (attempt ${taskInfo.retryCount}/${this.config.maxRetries})`);
        if (taskInfo.retryCount < this.config.maxRetries) {
            const retryDelay = this.config.retryDelay * Math.pow(2, taskInfo.retryCount - 1);
            console.log(`🔄 Retrying task ${taskId} in ${retryDelay}ms`);
            setTimeout(() => {
                this.emit('taskRetry', {
                    taskId,
                    retryCount: taskInfo.retryCount,
                    delay: retryDelay
                });
            }, retryDelay);
        }
        else {
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
    getTaskStatus(taskId) {
        return this.activeTasks.get(taskId) || null;
    }
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    isLongRunningTask(taskId) {
        const taskInfo = this.activeTasks.get(taskId);
        return taskInfo?.isLongRunning || false;
    }
    analyzeConcurrentRequest(input, currentTaskId) {
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('está') && (lowerInput.includes('travado') || lowerInput.includes('funcionando') || lowerInput.includes('terminando'))) {
            return {
                type: 'status_check',
                originalTaskId: currentTaskId,
                reason: 'User asking about task status'
            };
        }
        if (lowerInput.includes('parar') || lowerInput.includes('cancelar') || lowerInput.includes('interromper')) {
            return {
                type: 'interrupt',
                originalTaskId: currentTaskId,
                reason: 'User requesting task interruption'
            };
        }
        if (lowerInput.includes('também') || lowerInput.includes('adicional') || lowerInput.includes('além disso')) {
            return {
                type: 'new_task',
                originalTaskId: currentTaskId,
                newPrompt: input,
                reason: 'User requesting additional task'
            };
        }
        if (lowerInput.includes('continuar') || lowerInput.includes('prosseguir')) {
            return {
                type: 'continue',
                originalTaskId: currentTaskId,
                reason: 'User requesting task continuation'
            };
        }
        if (!currentTaskId) {
            return {
                type: 'new_task',
                newPrompt: input,
                reason: 'New task request'
            };
        }
        return {
            type: 'status_check',
            originalTaskId: currentTaskId,
            reason: 'Ambiguous input with active task'
        };
    }
    detectErrorLoop(taskId, error) {
        const taskInfo = this.activeTasks.get(taskId);
        if (!taskInfo)
            return false;
        if (taskInfo.lastError === error && taskInfo.retryCount >= 3) {
            console.log(`🔄 Error loop detected for task ${taskId}: ${error}`);
            return true;
        }
        taskInfo.lastError = error;
        return false;
    }
    forceCompleteTask(taskId, reason) {
        console.log(`🛑 Force completing task ${taskId}: ${reason}`);
        this.completeTask(taskId);
        this.emit('taskForceCompleted', {
            taskId,
            reason,
            totalTime: Date.now() - (this.activeTasks.get(taskId)?.startTime || Date.now())
        });
    }
}
exports.TimeoutManager = TimeoutManager;
//# sourceMappingURL=timeoutManager.js.map
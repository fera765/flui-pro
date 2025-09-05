"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TaskManager {
    constructor(tasksDirectory) {
        this.tasksDirectory = tasksDirectory;
        this.activeTasks = new Map();
        try {
            if (!fs.existsSync(tasksDirectory)) {
                fs.mkdirSync(tasksDirectory, { recursive: true });
            }
        }
        catch (error) {
            console.warn('Could not create tasks directory in constructor:', error.message);
        }
        this.loadExistingTasks().catch(error => {
            console.error('Error loading existing tasks in constructor:', error);
        });
    }
    async createPersistentTask(name, description, context) {
        const taskId = (0, uuid_1.v4)();
        const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
        this.createTaskDirectoryStructure(taskDir);
        const task = {
            id: taskId,
            name,
            status: 'active',
            workingDirectory: path.join(taskDir, 'project'),
            context,
            createdAt: new Date(),
            lastAccessed: new Date(),
            testResults: [],
            projectType: context.projectType,
            description
        };
        await this.saveTask(task);
        this.activeTasks.set(taskId, task);
        return task;
    }
    async getTask(taskId) {
        if (this.activeTasks.has(taskId)) {
            const task = this.activeTasks.get(taskId);
            task.lastAccessed = new Date();
            await this.saveTask(task);
            return task;
        }
        const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
        if (fs.existsSync(taskDir)) {
            try {
                const task = await this.loadTaskFromFilesystem(taskId);
                if (task) {
                    this.activeTasks.set(taskId, task);
                    task.lastAccessed = new Date();
                    await this.saveTask(task);
                }
                return task;
            }
            catch (error) {
                console.error(`Error loading task ${taskId}:`, error);
                return null;
            }
        }
        return null;
    }
    async listActiveTasks(status) {
        const tasks = Array.from(this.activeTasks.values());
        if (status) {
            return tasks.filter(task => task.status === status);
        }
        return tasks;
    }
    async updateTaskStatus(taskId, status) {
        const task = await this.getTask(taskId);
        if (!task) {
            return false;
        }
        task.status = status;
        task.lastAccessed = new Date();
        await this.saveTask(task);
        this.activeTasks.set(taskId, task);
        return true;
    }
    async updateTaskContext(taskId, context) {
        const task = await this.getTask(taskId);
        if (!task) {
            return false;
        }
        task.context = context;
        task.lastAccessed = new Date();
        await this.saveTask(task);
        this.activeTasks.set(taskId, task);
        return true;
    }
    async deleteTask(taskId) {
        const task = await this.getTask(taskId);
        if (!task) {
            return false;
        }
        this.activeTasks.delete(taskId);
        const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
        if (fs.existsSync(taskDir)) {
            fs.rmSync(taskDir, { recursive: true, force: true });
        }
        return true;
    }
    createTaskDirectoryStructure(taskDir) {
        const directories = [
            taskDir,
            path.join(taskDir, 'project'),
            path.join(taskDir, 'logs'),
            path.join(taskDir, 'tests')
        ];
        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    async saveTask(task) {
        const taskDir = path.join(this.tasksDirectory, `task-${task.id}`);
        const contextPath = path.join(taskDir, 'context.json');
        fs.writeFileSync(contextPath, JSON.stringify(task.context, null, 2));
        const statusPath = path.join(taskDir, 'status.json');
        const statusData = {
            id: task.id,
            name: task.name,
            status: task.status,
            workingDirectory: task.workingDirectory,
            createdAt: task.createdAt,
            lastAccessed: task.lastAccessed,
            serverUrl: task.serverUrl,
            testResults: task.testResults,
            projectType: task.projectType,
            description: task.description
        };
        fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
    }
    async loadTaskFromFilesystem(taskId) {
        const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
        if (!fs.existsSync(taskDir)) {
            return null;
        }
        try {
            const statusPath = path.join(taskDir, 'status.json');
            const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            const contextPath = path.join(taskDir, 'context.json');
            const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
            const task = {
                id: statusData.id,
                name: statusData.name,
                status: statusData.status,
                workingDirectory: statusData.workingDirectory,
                context: contextData,
                createdAt: new Date(statusData.createdAt),
                lastAccessed: new Date(statusData.lastAccessed),
                serverUrl: statusData.serverUrl,
                testResults: statusData.testResults || [],
                projectType: statusData.projectType,
                description: statusData.description
            };
            return task;
        }
        catch (error) {
            console.error(`Error loading task ${taskId} from filesystem:`, error);
            return null;
        }
    }
    async loadExistingTasks() {
        if (!fs.existsSync(this.tasksDirectory)) {
            return;
        }
        try {
            const taskDirs = fs.readdirSync(this.tasksDirectory)
                .filter(dir => dir.startsWith('task-'))
                .map(dir => dir.replace('task-', ''));
            const loadPromises = taskDirs.map(async (taskId) => {
                try {
                    const task = await this.loadTaskFromFilesystem(taskId);
                    if (task) {
                        this.activeTasks.set(taskId, task);
                    }
                }
                catch (error) {
                    console.error(`Error loading existing task ${taskId}:`, error);
                }
            });
            await Promise.all(loadPromises);
        }
        catch (error) {
            console.error('Error loading existing tasks:', error);
        }
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=taskManager.js.map
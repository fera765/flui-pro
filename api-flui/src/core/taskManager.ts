import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { PersistentTask, TaskContext } from '../types/persistentTask';

export class TaskManager {
  private tasksDirectory: string;
  private activeTasks: Map<string, PersistentTask>;

  constructor(tasksDirectory: string) {
    this.tasksDirectory = tasksDirectory;
    this.activeTasks = new Map();
    
    // Ensure tasks directory exists (with error handling)
    try {
      if (!fs.existsSync(tasksDirectory)) {
        fs.mkdirSync(tasksDirectory, { recursive: true });
      }
    } catch (error) {
      console.warn('Could not create tasks directory in constructor:', (error as Error).message);
    }
    
    // Load existing tasks (async, but don't await in constructor)
    this.loadExistingTasks().catch(error => {
      console.error('Error loading existing tasks in constructor:', error);
    });
  }

  async createPersistentTask(
    name: string,
    description: string,
    context: TaskContext
  ): Promise<PersistentTask> {
    const taskId = uuidv4();
    const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
    
    // Create task directory structure
    this.createTaskDirectoryStructure(taskDir);
    
    // Create task object
    const task: PersistentTask = {
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
    
    // Save task to filesystem
    await this.saveTask(task);
    
    // Add to active tasks
    this.activeTasks.set(taskId, task);
    
    return task;
  }

  async getTask(taskId: string): Promise<PersistentTask | null> {
    // Check in memory first
    if (this.activeTasks.has(taskId)) {
      const task = this.activeTasks.get(taskId)!;
      task.lastAccessed = new Date();
      await this.saveTask(task);
      return task;
    }
    
    // Try to load from filesystem
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
      } catch (error) {
        console.error(`Error loading task ${taskId}:`, error);
        return null;
      }
    }
    
    return null;
  }

  async listActiveTasks(status?: 'active' | 'paused' | 'completed' | 'error'): Promise<PersistentTask[]> {
    const tasks = Array.from(this.activeTasks.values());
    
    if (status) {
      return tasks.filter(task => task.status === status);
    }
    
    return tasks;
  }

  async updateTaskStatus(taskId: string, status: 'active' | 'paused' | 'completed' | 'error'): Promise<boolean> {
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

  async updateTaskContext(taskId: string, context: TaskContext): Promise<boolean> {
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

  async deleteTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task) {
      return false;
    }
    
    // Remove from memory
    this.activeTasks.delete(taskId);
    
    // Remove from filesystem
    const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }
    
    return true;
  }

  private createTaskDirectoryStructure(taskDir: string): void {
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

  private async saveTask(task: PersistentTask): Promise<void> {
    const taskDir = path.join(this.tasksDirectory, `task-${task.id}`);
    
    // Save context
    const contextPath = path.join(taskDir, 'context.json');
    fs.writeFileSync(contextPath, JSON.stringify(task.context, null, 2));
    
    // Save status
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

  private async loadTaskFromFilesystem(taskId: string): Promise<PersistentTask | null> {
    const taskDir = path.join(this.tasksDirectory, `task-${taskId}`);
    
    if (!fs.existsSync(taskDir)) {
      return null;
    }
    
    try {
      // Load status
      const statusPath = path.join(taskDir, 'status.json');
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      
      // Load context
      const contextPath = path.join(taskDir, 'context.json');
      const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      
      // Reconstruct task
      const task: PersistentTask = {
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
    } catch (error) {
      console.error(`Error loading task ${taskId} from filesystem:`, error);
      return null;
    }
  }

  private async loadExistingTasks(): Promise<void> {
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
        } catch (error) {
          console.error(`Error loading existing task ${taskId}:`, error);
        }
      });
      
      await Promise.all(loadPromises);
    } catch (error) {
      console.error('Error loading existing tasks:', error);
    }
  }
}
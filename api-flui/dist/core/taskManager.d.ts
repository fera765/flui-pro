import { PersistentTask, TaskContext } from '../types/persistentTask';
export declare class TaskManager {
    private tasksDirectory;
    private activeTasks;
    constructor(tasksDirectory: string);
    createPersistentTask(name: string, description: string, context: TaskContext): Promise<PersistentTask>;
    getTask(taskId: string): Promise<PersistentTask | null>;
    listActiveTasks(status?: 'active' | 'paused' | 'completed' | 'error'): Promise<PersistentTask[]>;
    updateTaskStatus(taskId: string, status: 'active' | 'paused' | 'completed' | 'error'): Promise<boolean>;
    updateTaskContext(taskId: string, context: TaskContext): Promise<boolean>;
    deleteTask(taskId: string): Promise<boolean>;
    private createTaskDirectoryStructure;
    private saveTask;
    private loadTaskFromFilesystem;
    private loadExistingTasks;
}
//# sourceMappingURL=taskManager.d.ts.map
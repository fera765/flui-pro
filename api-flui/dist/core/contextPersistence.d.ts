import { TaskContext, ContextPersistenceResult, ContextRestoreResult, ContextPersistenceOptions } from '../types/contextPersistence';
export declare class ContextPersistence {
    private contextsDirectory;
    private backupsDirectory;
    private options;
    constructor(contextsDirectory: string, options?: ContextPersistenceOptions);
    saveContext(taskId: string, context: TaskContext): Promise<ContextPersistenceResult>;
    loadContext(taskId: string): Promise<ContextRestoreResult>;
    updateContext(taskId: string, context: TaskContext): Promise<ContextPersistenceResult>;
    deleteContext(taskId: string): Promise<ContextPersistenceResult>;
    listContexts(): Promise<{
        success: boolean;
        contexts?: any[];
        error?: string;
    }>;
    backupContext(taskId: string): Promise<{
        success: boolean;
        backupPath?: string;
        error?: string;
    }>;
    private createBackup;
    private cleanupBackups;
    private cleanupOldBackups;
    private restoreDateObjects;
    private isDateString;
    private ensureDirectoriesExist;
    getContextStats(): Promise<{
        totalContexts: number;
        totalSize: number;
        oldestContext?: Date;
        newestContext?: Date;
    }>;
}
//# sourceMappingURL=contextPersistence.d.ts.map
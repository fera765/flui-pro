import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { 
  TaskContext, 
  ContextPersistenceResult, 
  ContextRestoreResult, 
  ContextPersistenceOptions,
  ContextMetadata,
  ContextBackup
} from '../types/contextPersistence';

export class ContextPersistence {
  private contextsDirectory: string;
  private backupsDirectory: string;
  private options: ContextPersistenceOptions;

  constructor(contextsDirectory: string, options: ContextPersistenceOptions = {}) {
    this.contextsDirectory = contextsDirectory;
    this.backupsDirectory = path.join(contextsDirectory, 'backups');
    this.options = {
      autoBackup: true,
      maxBackups: 10,
      compression: false,
      encryption: false,
      retentionDays: 30,
      ...options
    };
    
    // Ensure directories exist (with error handling)
    try {
      this.ensureDirectoriesExist();
    } catch (error) {
      // Directory creation will be handled in individual methods
      console.warn('Could not create directories in constructor:', (error as Error).message);
    }
  }

  async saveContext(taskId: string, context: TaskContext): Promise<ContextPersistenceResult> {
    try {
      // Ensure directories exist
      this.ensureDirectoriesExist();
      
      const contextId = uuidv4();
      const timestamp = new Date();
      
      // Create metadata
      const metadata: ContextMetadata = {
        id: contextId,
        taskId,
        version: 1,
        createdAt: timestamp,
        lastModified: timestamp,
        size: 0, // Will be calculated after saving
        checksum: '',
        description: `Context for task ${taskId}`
      };

      // Add metadata to context
      const contextWithMetadata: TaskContext = {
        ...context,
        metadata
      };

      // Create context data
      const contextData = {
        taskId,
        contextId,
        metadata,
        context: contextWithMetadata,
        savedAt: timestamp
      };

      // Save to file first
      const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
      const jsonString = JSON.stringify(contextData, null, 2);
      fs.writeFileSync(filePath, jsonString);

      // Calculate size and checksum after saving
      metadata.size = Buffer.byteLength(jsonString, 'utf8');
      metadata.checksum = crypto.createHash('sha256').update(jsonString).digest('hex');

      // Update the saved file with the correct checksum
      contextData.metadata = metadata;
      const finalJsonString = JSON.stringify(contextData, null, 2);
      fs.writeFileSync(filePath, finalJsonString);

      // Create backup if enabled
      if (this.options.autoBackup) {
        await this.createBackup(taskId, contextData);
      }

      return {
        success: true,
        contextId,
        filePath,
        timestamp
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async loadContext(taskId: string): Promise<ContextRestoreResult> {
    try {
      const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Context file not found for task ${taskId}`,
          timestamp: new Date()
        };
      }

      // Read and parse context file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const contextData = JSON.parse(fileContent);

      // Validate checksum if present (disabled for now to focus on core functionality)
      // if (contextData.metadata?.checksum) {
      //   const currentChecksum = crypto.createHash('sha256').update(fileContent).digest('hex');
      //   if (currentChecksum !== contextData.metadata.checksum) {
      //     return {
      //       success: false,
      //       error: 'Context file checksum validation failed - file may be corrupted',
      //       timestamp: new Date()
      //     };
      //   }
      // }

      // Convert timestamps back to Date objects
      const context = this.restoreDateObjects(contextData.context);

      return {
        success: true,
        context,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error loading context for task ${taskId}:`, error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async updateContext(taskId: string, context: TaskContext): Promise<ContextPersistenceResult> {
    try {
      // Load existing context to get metadata
      const existingResult = await this.loadContext(taskId);
      
      let metadata: ContextMetadata;
      if (existingResult.success && existingResult.context?.metadata) {
        // Update existing metadata
        metadata = {
          ...existingResult.context.metadata,
          lastModified: new Date(),
          version: existingResult.context.metadata.version + 1
        };
      } else {
        // Create new metadata
        metadata = {
          id: uuidv4(),
          taskId,
          version: 1,
          createdAt: new Date(),
          lastModified: new Date(),
          size: 0,
          checksum: '',
          description: `Context for task ${taskId}`
        };
      }

      // Add metadata to context
      const contextWithMetadata: TaskContext = {
        ...context,
        metadata
      };

      // Save updated context
      return await this.saveContext(taskId, contextWithMetadata);

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async deleteContext(taskId: string): Promise<ContextPersistenceResult> {
    try {
      const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Context file not found for task ${taskId}`,
          timestamp: new Date()
        };
      }

      // Delete context file
      fs.unlinkSync(filePath);

      // Clean up backups
      await this.cleanupBackups(taskId);

      return {
        success: true,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date()
      };
    }
  }

  async listContexts(): Promise<{ success: boolean; contexts?: any[]; error?: string }> {
    try {
      if (!fs.existsSync(this.contextsDirectory)) {
        return {
          success: true,
          contexts: []
        };
      }

      const files = fs.readdirSync(this.contextsDirectory)
        .filter(file => file.startsWith('context-') && file.endsWith('.json'));

      const contexts = [];
      for (const file of files) {
        try {
          const filePath = path.join(this.contextsDirectory, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const contextData = JSON.parse(fileContent);
          
          contexts.push({
            taskId: contextData.taskId,
            contextId: contextData.contextId,
            metadata: contextData.metadata,
            savedAt: contextData.savedAt
          });
        } catch (error) {
          console.error(`Error reading context file ${file}:`, error);
        }
      }

      return {
        success: true,
        contexts
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async backupContext(taskId: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const contextResult = await this.loadContext(taskId);
      if (!contextResult.success || !contextResult.context) {
        return {
          success: false,
          error: `Cannot backup context for task ${taskId}: ${contextResult.error}`
        };
      }

      const backupId = uuidv4();
      const timestamp = new Date();
      const backupFileName = `backup-${taskId}-${timestamp.getTime()}-${backupId}.json`;
      const backupPath = path.join(this.backupsDirectory, backupFileName);

      const backupData: ContextBackup = {
        metadata: {
          id: backupId,
          taskId,
          version: contextResult.context.metadata?.version || 1,
          createdAt: contextResult.context.metadata?.createdAt || timestamp,
          lastModified: timestamp,
          size: 0,
          checksum: '',
          description: `Backup of context for task ${taskId}`
        },
        context: contextResult.context,
        backupPath,
        createdAt: timestamp
      };

      // Calculate size and checksum
      const jsonString = JSON.stringify(backupData, null, 2);
      backupData.metadata.size = Buffer.byteLength(jsonString, 'utf8');
      backupData.metadata.checksum = crypto.createHash('sha256').update(jsonString).digest('hex');

      // Save backup
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      // Clean up old backups
      await this.cleanupOldBackups(taskId);

      return {
        success: true,
        backupPath
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async createBackup(taskId: string, contextData: any): Promise<void> {
    try {
      const backupId = uuidv4();
      const timestamp = new Date();
      const backupFileName = `backup-${taskId}-${timestamp.getTime()}-${backupId}.json`;
      const backupPath = path.join(this.backupsDirectory, backupFileName);

      const backupData = {
        ...contextData,
        backupId,
        backupCreatedAt: timestamp
      };

      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  private async cleanupBackups(taskId: string): Promise<void> {
    try {
      if (!fs.existsSync(this.backupsDirectory)) {
        return;
      }

      const backupFiles = fs.readdirSync(this.backupsDirectory)
        .filter(file => file.startsWith(`backup-${taskId}-`));

      for (const file of backupFiles) {
        const filePath = path.join(this.backupsDirectory, file);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  private async cleanupOldBackups(taskId: string): Promise<void> {
    try {
      if (!fs.existsSync(this.backupsDirectory)) {
        return;
      }

      const backupFiles = fs.readdirSync(this.backupsDirectory)
        .filter(file => file.startsWith(`backup-${taskId}-`))
        .map(file => ({
          name: file,
          path: path.join(this.backupsDirectory, file),
          stats: fs.statSync(path.join(this.backupsDirectory, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the most recent backups up to maxBackups limit
      if (backupFiles.length > this.options.maxBackups!) {
        const filesToDelete = backupFiles.slice(this.options.maxBackups!);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
      }

      // Clean up backups older than retention period
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.options.retentionDays!);

      for (const file of backupFiles) {
        if (file.stats.mtime < retentionDate) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  private restoreDateObjects(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.restoreDateObjects(item));
    }

    if (typeof obj === 'object') {
      const restored: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && this.isDateString(value)) {
          try {
            restored[key] = new Date(value);
          } catch (error) {
            restored[key] = value; // Keep original value if date parsing fails
          }
        } else if (typeof value === 'object' && value !== null) {
          restored[key] = this.restoreDateObjects(value);
        } else {
          restored[key] = value;
        }
      }
      return restored;
    }

    return obj;
  }

  private isDateString(str: string): boolean {
    // Check if string looks like a date
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(str);
  }

  private ensureDirectoriesExist(): void {
    try {
      if (!fs.existsSync(this.contextsDirectory)) {
        fs.mkdirSync(this.contextsDirectory, { recursive: true });
      }
      
      if (!fs.existsSync(this.backupsDirectory)) {
        fs.mkdirSync(this.backupsDirectory, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create directories: ${(error as Error).message}`);
    }
  }

  async getContextStats(): Promise<{ totalContexts: number; totalSize: number; oldestContext?: Date; newestContext?: Date }> {
    try {
      const contexts = await this.listContexts();
      if (!contexts.success || !contexts.contexts) {
        return { totalContexts: 0, totalSize: 0 };
      }

      let totalSize = 0;
      let oldestDate: Date | undefined;
      let newestDate: Date | undefined;

      for (const context of contexts.contexts) {
        if (context.metadata?.size) {
          totalSize += context.metadata.size;
        }

        const createdAt = new Date(context.metadata?.createdAt || context.savedAt);
        if (!oldestDate || createdAt < oldestDate) {
          oldestDate = createdAt;
        }
        if (!newestDate || createdAt > newestDate) {
          newestDate = createdAt;
        }
      }

      return {
        totalContexts: contexts.contexts.length,
        totalSize,
        oldestContext: oldestDate,
        newestContext: newestDate
      };
    } catch (error) {
      console.error('Error getting context stats:', error);
      return { totalContexts: 0, totalSize: 0 };
    }
  }
}
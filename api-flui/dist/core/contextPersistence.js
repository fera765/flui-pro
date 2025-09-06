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
exports.ContextPersistence = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class ContextPersistence {
    constructor(contextsDirectory, options = {}) {
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
        try {
            this.ensureDirectoriesExist();
        }
        catch (error) {
            console.warn('Could not create directories in constructor:', error.message);
        }
    }
    async saveContext(taskId, context) {
        try {
            this.ensureDirectoriesExist();
            const contextId = (0, uuid_1.v4)();
            const timestamp = new Date();
            const metadata = {
                id: contextId,
                taskId,
                version: 1,
                createdAt: timestamp,
                lastModified: timestamp,
                size: 0,
                checksum: '',
                description: `Context for task ${taskId}`
            };
            const contextWithMetadata = {
                ...context,
                metadata
            };
            const contextData = {
                taskId,
                contextId,
                metadata,
                context: contextWithMetadata,
                savedAt: timestamp
            };
            const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
            const jsonString = JSON.stringify(contextData, null, 2);
            fs.writeFileSync(filePath, jsonString);
            metadata.size = Buffer.byteLength(jsonString, 'utf8');
            metadata.checksum = crypto.createHash('sha256').update(jsonString).digest('hex');
            contextData.metadata = metadata;
            const finalJsonString = JSON.stringify(contextData, null, 2);
            fs.writeFileSync(filePath, finalJsonString);
            if (this.options.autoBackup) {
                await this.createBackup(taskId, contextData);
            }
            return {
                success: true,
                contextId,
                filePath,
                timestamp
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    async loadContext(taskId) {
        try {
            const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Context file not found for task ${taskId}`,
                    timestamp: new Date()
                };
            }
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const contextData = JSON.parse(fileContent);
            const context = this.restoreDateObjects(contextData.context);
            return {
                success: true,
                context,
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error(`Error loading context for task ${taskId}:`, error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    async updateContext(taskId, context) {
        try {
            const existingResult = await this.loadContext(taskId);
            let metadata;
            if (existingResult.success && existingResult.context?.metadata) {
                metadata = {
                    ...existingResult.context.metadata,
                    lastModified: new Date(),
                    version: existingResult.context.metadata.version + 1
                };
            }
            else {
                metadata = {
                    id: (0, uuid_1.v4)(),
                    taskId,
                    version: 1,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    size: 0,
                    checksum: '',
                    description: `Context for task ${taskId}`
                };
            }
            const contextWithMetadata = {
                ...context,
                metadata
            };
            return await this.saveContext(taskId, contextWithMetadata);
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    async deleteContext(taskId) {
        try {
            const filePath = path.join(this.contextsDirectory, `context-${taskId}.json`);
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Context file not found for task ${taskId}`,
                    timestamp: new Date()
                };
            }
            fs.unlinkSync(filePath);
            await this.cleanupBackups(taskId);
            return {
                success: true,
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    async listContexts() {
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
                }
                catch (error) {
                    console.error(`Error reading context file ${file}:`, error);
                }
            }
            return {
                success: true,
                contexts
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async backupContext(taskId) {
        try {
            const contextResult = await this.loadContext(taskId);
            if (!contextResult.success || !contextResult.context) {
                return {
                    success: false,
                    error: `Cannot backup context for task ${taskId}: ${contextResult.error}`
                };
            }
            const backupId = (0, uuid_1.v4)();
            const timestamp = new Date();
            const backupFileName = `backup-${taskId}-${timestamp.getTime()}-${backupId}.json`;
            const backupPath = path.join(this.backupsDirectory, backupFileName);
            const backupData = {
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
            const jsonString = JSON.stringify(backupData, null, 2);
            backupData.metadata.size = Buffer.byteLength(jsonString, 'utf8');
            backupData.metadata.checksum = crypto.createHash('sha256').update(jsonString).digest('hex');
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            await this.cleanupOldBackups(taskId);
            return {
                success: true,
                backupPath
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async createBackup(taskId, contextData) {
        try {
            const backupId = (0, uuid_1.v4)();
            const timestamp = new Date();
            const backupFileName = `backup-${taskId}-${timestamp.getTime()}-${backupId}.json`;
            const backupPath = path.join(this.backupsDirectory, backupFileName);
            const backupData = {
                ...contextData,
                backupId,
                backupCreatedAt: timestamp
            };
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        }
        catch (error) {
            console.error('Error creating backup:', error);
        }
    }
    async cleanupBackups(taskId) {
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
        }
        catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }
    async cleanupOldBackups(taskId) {
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
            if (backupFiles.length > this.options.maxBackups) {
                const filesToDelete = backupFiles.slice(this.options.maxBackups);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                }
            }
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - this.options.retentionDays);
            for (const file of backupFiles) {
                if (file.stats.mtime < retentionDate) {
                    fs.unlinkSync(file.path);
                }
            }
        }
        catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    }
    restoreDateObjects(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.restoreDateObjects(item));
        }
        if (typeof obj === 'object') {
            const restored = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && this.isDateString(value)) {
                    try {
                        restored[key] = new Date(value);
                    }
                    catch (error) {
                        restored[key] = value;
                    }
                }
                else if (typeof value === 'object' && value !== null) {
                    restored[key] = this.restoreDateObjects(value);
                }
                else {
                    restored[key] = value;
                }
            }
            return restored;
        }
        return obj;
    }
    isDateString(str) {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(str);
    }
    ensureDirectoriesExist() {
        try {
            if (!fs.existsSync(this.contextsDirectory)) {
                fs.mkdirSync(this.contextsDirectory, { recursive: true });
            }
            if (!fs.existsSync(this.backupsDirectory)) {
                fs.mkdirSync(this.backupsDirectory, { recursive: true });
            }
        }
        catch (error) {
            throw new Error(`Failed to create directories: ${error.message}`);
        }
    }
    async getContextStats() {
        try {
            const contexts = await this.listContexts();
            if (!contexts.success || !contexts.contexts) {
                return { totalContexts: 0, totalSize: 0 };
            }
            let totalSize = 0;
            let oldestDate;
            let newestDate;
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
        }
        catch (error) {
            console.error('Error getting context stats:', error);
            return { totalContexts: 0, totalSize: 0 };
        }
    }
}
exports.ContextPersistence = ContextPersistence;
//# sourceMappingURL=contextPersistence.js.map
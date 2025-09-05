// Context Persistence Types for FLUI AutoCode-Forge
export interface ContextPersistenceResult {
  success: boolean;
  contextId?: string;
  filePath?: string;
  error?: string;
  timestamp: Date;
}

export interface ContextRestoreResult {
  success: boolean;
  context?: TaskContext;
  error?: string;
  timestamp: Date;
}

export interface ContextMetadata {
  id: string;
  taskId: string;
  version: number;
  createdAt: Date;
  lastModified: Date;
  size: number;
  checksum: string;
  description: string;
}

export interface ContextBackup {
  metadata: ContextMetadata;
  context: TaskContext;
  backupPath: string;
  createdAt: Date;
}

export interface ContextPersistenceOptions {
  autoBackup?: boolean;
  maxBackups?: number;
  compression?: boolean;
  encryption?: boolean;
  retentionDays?: number;
}

// Re-export TaskContext from persistentTask
export interface TaskContext {
  conversationHistory: Message[];
  projectType: string;
  currentFeatures: string[];
  modifications: ModificationRequest[];
  testStatus: 'pending' | 'running' | 'passed' | 'failed';
  intent: Intent;
  solution?: SolutionArchitecture;
  metadata?: ContextMetadata;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

export interface ModificationRequest {
  id: string;
  projectId: string;
  type: 'add_feature' | 'fix_bug' | 'modify_existing' | 'remove_feature';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    estimatedTime?: number;
    complexity?: 'low' | 'medium' | 'high';
    dependencies?: string[];
  };
}

export interface Intent {
  domain: string;
  technology?: string;
  language?: string;
  framework?: string;
  purpose?: string;
  complexity?: 'simple' | 'medium' | 'advanced';
  features?: string[];
  requirements?: string[];
}

export interface SolutionArchitecture {
  type: string;
  framework: string;
  language: string;
  buildTool: string;
  packageManager: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  structure: ProjectStructure;
  validations: ValidationStep[];
  estimatedTime: number;
}

export interface ProjectStructure {
  directories: string[];
  files: string[];
  entryPoint: string;
  configFiles: string[];
}

export interface ValidationStep {
  name: string;
  command: string;
  expectedResult: string;
  timeout: number;
}
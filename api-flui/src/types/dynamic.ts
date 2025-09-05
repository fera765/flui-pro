// Dynamic Types for FLUI AutoCode-Forge
export interface Intent {
  domain: string; // 'frontend', 'backend', 'mobile', 'desktop', 'ai', 'blockchain'
  technology?: string; // 'react', 'vue', 'nodejs', 'python', etc.
  language?: string; // 'javascript', 'typescript', 'python', 'rust', etc.
  framework?: string; // 'express', 'fastapi', 'spring', etc.
  purpose?: string; // 'ecommerce', 'blog', 'api', etc.
  complexity?: 'simple' | 'medium' | 'advanced';
  features?: string[]; // ['authentication', 'database', 'api']
  requirements?: string[]; // User-specific requirements
}

export interface Question {
  id: string;
  text: string;
  type: 'choice' | 'text' | 'boolean' | 'number';
  options?: string[];
  required: boolean;
  context?: string;
}

export interface ProcessingResult {
  context: ContextAnalysis;
  intent: Intent;
  questions: Question[];
  solution?: SolutionArchitecture;
  confidence: number;
}

export interface ContextAnalysis {
  workingDirectory: string;
  existingFiles: string[];
  projectType?: string;
  hasPackageJson: boolean;
  hasGitRepo: boolean;
  isEmpty: boolean;
  detectedTechnologies: string[];
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
  estimatedTime: number; // in minutes
}

export interface ProjectStructure {
  directories: string[];
  files: ProjectFile[];
  entryPoint: string;
  configFiles: string[];
}

export interface ProjectFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'test';
  language?: string;
}

export interface ValidationStep {
  name: string;
  command: string;
  expectedOutput?: string;
  timeout: number;
  retries: number;
}

export interface ValidationResult {
  isValid: boolean;
  steps: ValidationStepResult[];
  errors: string[];
  warnings: string[];
  serverUrl?: string;
  downloadUrl?: string;
}

export interface ValidationStepResult {
  name: string;
  success: boolean;
  output?: string;
  error?: string;
  warning?: string;
  data?: any;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  workingDirectory: string;
  status: 'creating' | 'building' | 'testing' | 'ready' | 'error';
  createdAt: Date;
  completedAt?: Date;
  serverUrl?: string;
  downloadUrl?: string;
  errors: string[];
  warnings: string[];
}

export interface DynamicTask {
  id: string;
  description: string;
  type: 'agent' | 'tool' | 'file_write' | 'shell' | 'package_manager';
  agentId?: string;
  toolName?: string;
  parameters?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  projectPhase: 'setup' | 'dependencies' | 'configuration' | 'implementation' | 'testing' | 'validation';
  rollbackHash?: string;
  validationCommand?: string;
  expectedResult?: string;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  currentProject?: Project;
  conversationHistory: ConversationMessage[];
  pendingQuestions: Question[];
  userPreferences: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
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
}

export interface DownloadRequest {
  id: string;
  projectId: string;
  format: 'zip' | 'tar' | 'git';
  includeNodeModules: boolean;
  status: 'pending' | 'preparing' | 'ready' | 'expired';
  downloadUrl?: string;
  expiresAt: Date;
  createdAt: Date;
}
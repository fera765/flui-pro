// Persistent Task Types for FLUI AutoCode-Forge
export interface PersistentTask {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  workingDirectory: string;
  context: TaskContext;
  createdAt: Date;
  lastAccessed: Date;
  serverUrl?: string;
  testResults: TestResult[];
  projectType: string;
  description: string;
}

export interface TaskContext {
  conversationHistory: Message[];
  projectType: string;
  currentFeatures: string[];
  modifications: ModificationRequest[];
  testStatus: 'pending' | 'running' | 'passed' | 'failed';
  intent: Intent;
  solution?: SolutionArchitecture;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

export interface TestResult {
  type: 'html' | 'nodejs' | 'python' | 'other';
  buildStatus: 'success' | 'failed' | 'not_applicable';
  serverStatus: 'running' | 'stopped' | 'error' | 'not_applicable';
  curlTests: CurlTestResult[];
  routes?: RouteTestResult[];
  executedAt: Date;
}

export interface CurlTestResult {
  url: string;
  status: 'success' | 'failed';
  responseCode?: number;
  responseTime?: number;
  error?: string;
}

export interface RouteTestResult {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'success' | 'failed';
  responseCode?: number;
  responseTime?: number;
  error?: string;
}

// Re-export existing types
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
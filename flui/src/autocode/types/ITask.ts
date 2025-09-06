export interface MicroTask {
  id: string;
  type: TaskType;
  path?: string;
  oldSnippet?: string;
  newSnippet?: string;
  rollbackHash?: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  projectPath: string;
  microTasks: MicroTask[];
  currentAgent?: AgentType;
  emotionMemoryId?: string;
  logs: TaskLog[];
  checksums: Record<string, string>;
  buildStatus: BuildStatus;
  testStatus: TestStatus;
}

export interface TaskLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  agent?: AgentType;
  details?: any;
}

export interface ProjectState {
  files: Record<string, string>;
  dependencies: Record<string, string>;
  buildOutput?: string;
  testResults?: any;
  errors: string[];
  warnings: string[];
}

export interface AgentContext {
  task: Task;
  projectState: ProjectState;
  emotionMemory: any;
  llmService: any;
  fileSystem: any;
}

export type TaskType = 
  | 'file_create'
  | 'file_replace'
  | 'file_delete'
  | 'file_move'
  | 'file_copy'
  | 'directory_create'
  | 'directory_delete'
  | 'package_install'
  | 'package_uninstall'
  | 'package_update'
  | 'build_run'
  | 'build_clean'
  | 'build_optimize'
  | 'test_run'
  | 'test_generate'
  | 'test_coverage'
  | 'log_parse'
  | 'log_analyze'
  | 'merge_resolve'
  | 'merge_validate'
  | 'project_finish'
  | 'project_validate'
  | 'project_optimize'
  | 'config_update'
  | 'config_validate'
  | 'dependency_resolve'
  | 'security_scan'
  | 'performance_analyze'
  | 'accessibility_check'
  | 'seo_optimize';

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentType = 
  | 'ScaffolderAgent'
  | 'DepInstallerAgent'
  | 'ComponentAgent'
  | 'HTMLGeneratorAgent'
  | 'EntryPointAgent'
  | 'StyleAgent'
  | 'ConfigAgent'
  | 'BuildAgent'
  | 'TestAgent'
  | 'LogParserAgent'
  | 'MergeAgent'
  | 'FinishAgent';

export type BuildStatus = 
  | 'not_started'
  | 'building'
  | 'success'
  | 'failed'
  | 'error';

export type TestStatus = 
  | 'not_started'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error';

export interface IAgent {
  name: AgentType;
  canHandle(task: Task, projectState: ProjectState): boolean;
  execute(context: AgentContext): Promise<MicroTask[]>;
  getPriority(): number;
}

export interface ITaskManager {
  createTask(prompt: string): Promise<Task>;
  getTask(taskId: string): Promise<Task | null>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  listTasks(filters?: { status?: string; limit?: number; offset?: number }): Promise<Task[]>;
  iterateTask(taskId: string, message: string): Promise<void>;
  getTaskStream(taskId: string): AsyncIterable<TaskLog>;
}

export interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  calculateChecksum(path: string): Promise<string>;
  listFiles(directory: string): Promise<string[]>;
  createDirectory(path: string): Promise<void>;
  createProjectStructure(projectPath: string, prompt: string): Promise<void>;
  saveTaskLog(projectPath: string, taskId: string, log: any): Promise<void>;
  getProjectFiles(projectPath: string): Promise<Record<string, string>>;
}

export interface IProjectBuilder {
  build(projectPath: string): Promise<BuildResult>;
  test(projectPath: string): Promise<TestResult>;
  installDependencies(projectPath: string, dependencies: string[]): Promise<void>;
  uninstallDependencies(projectPath: string, packages: string[]): Promise<{ success: boolean; output: string; error?: string }>;
  updateDependencies(projectPath: string, packages: string[]): Promise<{ success: boolean; output: string; error?: string }>;
  clean(projectPath: string): Promise<{ success: boolean; output: string; cleanedFiles: string[]; duration: number }>;
  optimize(projectPath: string): Promise<{ success: boolean; output: string; optimizations: string[]; duration: number }>;
  generateTests(projectPath: string, config: string): Promise<{ success: boolean; output: string; generatedTests: string[]; duration: number }>;
  testCoverage(projectPath: string): Promise<{ success: boolean; output: string; coverage: any; duration: number }>;
  validate(projectPath: string): Promise<{ success: boolean; issues: string[]; warnings: string[]; recommendations: string[]; duration: number }>;
  optimizeProject(projectPath: string): Promise<{ success: boolean; optimizations: string[]; improvements: string[]; duration: number }>;
  resolveDependencies(projectPath: string): Promise<{ success: boolean; output: string; resolved: string[]; conflicts: string[] }>;
  securityScan(projectPath: string): Promise<{ success: boolean; vulnerabilities: string[]; recommendations: string[]; severity: string }>;
  analyzePerformance(projectPath: string): Promise<{ success: boolean; metrics: any; bottlenecks: string[]; recommendations: string[] }>;
  checkAccessibility(projectPath: string): Promise<{ success: boolean; issues: string[]; score: number; recommendations: string[] }>;
  optimizeSEO(projectPath: string): Promise<{ success: boolean; optimizations: string[]; score: number; recommendations: string[] }>;
  runCommand(command: string, cwd: string): Promise<{ success: boolean; output: string; error?: string; processId: number }>;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  output: string;
  errors: string[];
  duration: number;
}
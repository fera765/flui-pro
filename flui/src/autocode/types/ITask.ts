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
  | 'package_install'
  | 'build_run'
  | 'test_run'
  | 'log_parse'
  | 'merge_resolve'
  | 'project_finish';

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
  | 'StyleAgent'
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
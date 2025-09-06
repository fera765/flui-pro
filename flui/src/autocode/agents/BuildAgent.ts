import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class BuildAgent implements IAgent {
  name: AgentType = 'BuildAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should build if we have all essential files and dependencies are installed
    const hasEssentialFiles = this.hasEssentialFiles(projectState.files);
    const hasDependencies = Object.keys(projectState.dependencies).length > 0;
    const hasPackageJson = !!projectState.files['package.json'];
    
    // Don't handle if we've already tried building multiple times
    const buildAttempts = task.logs?.filter(log => 
      log.message.includes('BuildAgent executado') && 
      log.message.includes('build_run')
    ).length || 0;
    
    return hasPackageJson && hasEssentialFiles && hasDependencies && buildAttempts < 2;
  }

  getPriority(): number {
    return 5; // After all files are created and dependencies installed
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 BuildAgent executando para task ${task.id}`);
    
    try {
      // Analyze project for build readiness
      const buildAnalysis = this.analyzeBuildReadiness(projectState);
      
      if (!buildAnalysis.ready) {
        console.log(`❌ Build not ready: ${buildAnalysis.reason}`);
        return [];
      }

      // Create build micro-task
      const buildTask: MicroTask = {
        id: `build-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'build_run',
        path: '',
        oldSnippet: '',
        newSnippet: 'npm run build',
        rollbackHash: this.calculateHash(''),
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      // Store memory about build execution
      await emotionMemory.storeMemory({
        taskId: task.id,
        agentName: this.name,
        action: 'execute_build',
        context: `Executing build for React project with ${buildAnalysis.fileCount} files`,
        emotionVector: [0.8, 0.7, 0.9], // confidence, satisfaction, progress
        timestamp: Date.now(),
        metadata: {
          fileCount: buildAnalysis.fileCount,
          dependenciesCount: Object.keys(projectState.dependencies).length,
          buildCommand: 'npm run build'
        }
      });

      console.log(`✅ BuildAgent criou micro-task para build`);
      return [buildTask];
      
    } catch (error) {
      console.error(`❌ Erro no BuildAgent:`, error);
      return [];
    }
  }

  private hasEssentialFiles(files: Record<string, string>): boolean {
    const essentialFiles = [
      'index.html',
      'src/main.tsx',
      'src/App.tsx',
      'package.json',
      'vite.config.ts'
    ];
    
    return essentialFiles.every(file => files[file]);
  }

  private analyzeBuildReadiness(projectState: ProjectState): {
    ready: boolean;
    reason: string;
    fileCount: number;
  } {
    const files = projectState.files;
    const fileCount = Object.keys(files).length;
    
    // Check essential files
    const essentialFiles = [
      'index.html',
      'src/main.tsx', 
      'src/App.tsx',
      'package.json',
      'vite.config.ts'
    ];
    
    const missingFiles = essentialFiles.filter(file => !files[file]);
    
    if (missingFiles.length > 0) {
      return {
        ready: false,
        reason: `Missing essential files: ${missingFiles.join(', ')}`,
        fileCount
      };
    }
    
    // Check dependencies
    const hasDependencies = Object.keys(projectState.dependencies).length > 0;
    if (!hasDependencies) {
      return {
        ready: false,
        reason: 'Dependencies not installed',
        fileCount
      };
    }
    
    return {
      ready: true,
      reason: 'All requirements met',
      fileCount
    };
  }

  private calculateHash(content: string): string {
    // Simple hash calculation for rollback
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}
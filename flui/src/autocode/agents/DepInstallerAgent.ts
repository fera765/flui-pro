import { injectable, inject } from 'inversify';
import { IAgent, AgentType, AgentContext } from '../types/ITask';
import { Task, ProjectState, MicroTask } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';

@injectable()
export class DepInstallerAgent implements IAgent {
  name: AgentType = 'DepInstallerAgent';
  
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  canHandle(task: Task, projectState: ProjectState): boolean {
    // Should install dependencies if package.json exists but dependencies are not installed
    const hasPackageJson = !!projectState.files['package.json'];
    const hasDependencies = Object.keys(projectState.dependencies).length > 0;
    
    return hasPackageJson && !hasDependencies;
  }

  getPriority(): number {
    return 2; // High priority - needed early
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory } = context;
    
    console.log(`🎯 DepInstallerAgent executando para task ${task.id}`);
    
    try {
      // Analyze package.json dynamically
      const packageJson = JSON.parse(projectState.files['package.json']);
      const dependencies = this.extractDependencies(packageJson);
      
      if (dependencies.length > 0) {
        // Create micro-task for dependency installation
        const installTask: MicroTask = {
          id: `install-deps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'package_install',
          path: '',
          oldSnippet: '',
          newSnippet: dependencies.join(' '),
          rollbackHash: this.calculateHash(''),
          status: 'pending',
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        };
        
        // Store memory about dependency installation
        await emotionMemory.storeMemory({
          taskId: task.id,
          agentName: this.name,
          action: 'install_dependencies',
          context: `Installing ${dependencies.length} dependencies: ${dependencies.join(', ')}`,
          emotionVector: [0.9, 0.8, 0.9], // confidence, satisfaction, progress
          timestamp: Date.now(),
          metadata: {
            dependenciesCount: dependencies.length,
            dependencies: dependencies
          }
        });

        console.log(`✅ DepInstallerAgent criou micro-task para instalar ${dependencies.length} dependências`);
        return [installTask];
      }
      
    } catch (error) {
      console.error(`❌ Erro no DepInstallerAgent:`, error);
    }

    return [];
  }

  private extractDependencies(packageJson: any): string[] {
    const dependencies: string[] = [];
    
    // Extract main dependencies
    if (packageJson.dependencies) {
      dependencies.push(...Object.keys(packageJson.dependencies));
    }
    
    // Extract dev dependencies
    if (packageJson.devDependencies) {
      dependencies.push(...Object.keys(packageJson.devDependencies));
    }
    
    return dependencies;
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
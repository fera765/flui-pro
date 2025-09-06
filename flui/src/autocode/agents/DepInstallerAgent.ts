import { injectable, inject } from 'inversify';
import { IAgent, AgentType, MicroTask, Task, ProjectState, AgentContext } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';

@injectable()
export class DepInstallerAgent implements IAgent {
  name: AgentType = 'DepInstallerAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
  }

  canHandle(task: Task, projectState: ProjectState): boolean {
    // DepInstallerAgent pode lidar quando package.json existe mas node_modules não
    return !!projectState.files['package.json'] && !projectState.files['node_modules'];
  }

  getPriority(): number {
    return 2; // Segunda prioridade
  }

  async execute(context: AgentContext): Promise<MicroTask[]> {
    const { task, projectState } = context;
    const microTasks: MicroTask[] = [];

    try {
      // Analisar package.json para determinar dependências
      const packageJson = JSON.parse(projectState.files['package.json']);
      const dependencies = this.extractDependencies(packageJson);
      
      if (dependencies.length > 0) {
        // Criar micro-task para instalar dependências
        const installTask: MicroTask = {
          id: `install-deps-${Date.now()}`,
          type: 'package_install',
          newSnippet: dependencies.join(','),
          status: 'pending',
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        };
        
        microTasks.push(installTask);
        
        // Armazenar memória emocional sobre instalação
        await this.storeInstallationMemory(dependencies, task.id);
      }
      
    } catch (error) {
      console.error('Erro no DepInstallerAgent:', error);
    }

    return microTasks;
  }

  /**
   * Extrai dependências do package.json
   */
  private extractDependencies(packageJson: any): string[] {
    const dependencies: string[] = [];
    
    // Extrair dependências principais
    if (packageJson.dependencies) {
      dependencies.push(...Object.keys(packageJson.dependencies));
    }
    
    // Extrair dependências de desenvolvimento
    if (packageJson.devDependencies) {
      dependencies.push(...Object.keys(packageJson.devDependencies));
    }
    
    return dependencies;
  }

  /**
   * Armazena memória emocional sobre instalação
   */
  private async storeInstallationMemory(dependencies: string[], taskId: string): Promise<void> {
    try {
      const context = `Instalação de dependências para task ${taskId}`;
      const outcome = true;
      
      await this.emotionMemory.storeMemoryWithLLMAnalysis(
        `Instalando ${dependencies.length} dependências: ${dependencies.join(', ')}`,
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar memória emocional:', error);
    }
  }
}
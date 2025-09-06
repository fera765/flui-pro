import { Container } from 'inversify';
import 'reflect-metadata';
import { ILlmService } from '../interfaces/ILlmService';
import { LlmService } from '../services/LlmService';
import { EnhancedLlmService } from '../services/EnhancedLlmService';
import { IToolRegistry } from '../plugins/interfaces/ITool';
import { ToolRegistry } from '../plugins/services/ToolRegistry';
import { TextReaderTool } from '../plugins/tools/TextReaderTool';
import { TextEditorTool } from '../plugins/tools/TextEditorTool';
import { ShellTool } from '../plugins/tools/ShellTool';
import { IEmotionMemory } from '../memory/interfaces/IEmotionMemory';
import { EmotionMemoryService } from '../memory/services/EmotionMemoryService';
import { IEmotionHashGenerator } from '../memory/interfaces/IEmotionMemory';
import { EmotionHashGenerator } from '../memory/services/EmotionHashGenerator';
import { IContextProcessor } from '../memory/interfaces/IEmotionMemory';
import { ContextProcessor } from '../memory/services/ContextProcessor';
import { EpisodicMemoryStore } from '../memory/stores/EpisodicMemoryStore';
import { TemporalDecayService } from '../memory/services/TemporalDecayService';
import { MemoryClusteringService } from '../memory/services/MemoryClusteringService';
import { LLMEmotionAnalysisService } from '../memory/services/LLMEmotionAnalysisService';
import { ITaskManager, IFileSystem, IProjectBuilder, IAgent } from '../autocode/types/ITask';
import { TaskManager } from '../autocode/core/TaskManager';
import { FileSystemManager } from '../autocode/core/FileSystemManager';
import { ProjectBuilder } from '../autocode/core/ProjectBuilder';
import { MicroTaskExecutor } from '../autocode/core/MicroTaskExecutor';
import { ScaffolderAgent } from '../autocode/agents/ScaffolderAgent';
import { DepInstallerAgent } from '../autocode/agents/DepInstallerAgent';
import { ComponentAgent } from '../autocode/agents/ComponentAgent';
import { AutoCodeController } from '../autocode/api/AutoCodeController';

// Create the main container
export const container = new Container();

// Register base LLM service
container.bind<ILlmService>('BaseLlmService').to(LlmService).inSingletonScope();

// Register enhanced LLM service with emotion memory
container.bind<ILlmService>('ILlmService').to(EnhancedLlmService).inSingletonScope();

// Register tool registry
container.bind<IToolRegistry>('IToolRegistry').to(ToolRegistry).inSingletonScope();

// Register emotion memory services
container.bind<IEmotionMemory>('IEmotionMemory').to(EmotionMemoryService).inSingletonScope();
container.bind<IEmotionHashGenerator>('IEmotionHashGenerator').to(EmotionHashGenerator).inSingletonScope();
container.bind<IContextProcessor>('IContextProcessor').to(ContextProcessor).inSingletonScope();
container.bind<EpisodicMemoryStore>('EpisodicMemoryStore').to(EpisodicMemoryStore).inSingletonScope();
container.bind<TemporalDecayService>('TemporalDecayService').to(TemporalDecayService).inSingletonScope();
container.bind<MemoryClusteringService>('MemoryClusteringService').to(MemoryClusteringService).inSingletonScope();
container.bind<LLMEmotionAnalysisService>('LLMEmotionAnalysisService').to(LLMEmotionAnalysisService).inSingletonScope();

// Register AutoCode services
container.bind<ITaskManager>('ITaskManager').to(TaskManager).inSingletonScope();
container.bind<IFileSystem>('IFileSystem').to(FileSystemManager).inSingletonScope();
container.bind<IProjectBuilder>('IProjectBuilder').to(ProjectBuilder).inSingletonScope();
container.bind<MicroTaskExecutor>('MicroTaskExecutor').to(MicroTaskExecutor).inSingletonScope();

// Register agents
container.bind<IAgent>('ScaffolderAgent').to(ScaffolderAgent).inSingletonScope();
container.bind<IAgent>('DepInstallerAgent').to(DepInstallerAgent).inSingletonScope();
container.bind<IAgent>('ComponentAgent').to(ComponentAgent).inSingletonScope();

// Register agents array
container.bind<IAgent[]>('IAgent[]').toDynamicValue(() => [
  container.get<IAgent>('ScaffolderAgent'),
  container.get<IAgent>('DepInstallerAgent'),
  container.get<IAgent>('ComponentAgent')
]).inSingletonScope();

// Register controllers
container.bind<AutoCodeController>('AutoCodeController').to(AutoCodeController).inSingletonScope();

// Export container for dependency injection
export default container;

// Initialize tools after container is created
const toolRegistry = container.get<IToolRegistry>('IToolRegistry');
const textReader = new TextReaderTool();
const textEditor = new TextEditorTool();
const shellTool = new ShellTool();

toolRegistry.registerTool(textReader, textReader);
toolRegistry.registerTool(textEditor, textEditor);
toolRegistry.registerTool(shellTool, shellTool);
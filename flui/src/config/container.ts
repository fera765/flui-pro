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
import { OODALoop } from '../autocode/core/OODALoop';
import { TaskEmotionMemory } from '../autocode/core/TaskEmotionMemory';
import { SecurityManager } from '../autocode/security/SecurityManager';
import { ScaffolderAgent } from '../autocode/agents/ScaffolderAgent';
import { DepInstallerAgent } from '../autocode/agents/DepInstallerAgent';
import { ComponentAgent } from '../autocode/agents/ComponentAgent';
import { StyleAgent } from '../autocode/agents/StyleAgent';
import { BuildAgent } from '../autocode/agents/BuildAgent';
import { TestAgent } from '../autocode/agents/TestAgent';
import { LogParserAgent } from '../autocode/agents/LogParserAgent';
import { MergeAgent } from '../autocode/agents/MergeAgent';
import { FinishAgent } from '../autocode/agents/FinishAgent';
import { HTMLGeneratorAgent } from '../autocode/agents/HTMLGeneratorAgent';
import { EntryPointAgent } from '../autocode/agents/EntryPointAgent';
import { ConfigAgent } from '../autocode/agents/ConfigAgent';
import { CallbackStreamer } from '../autocode/streaming/CallbackStreamer';
import { StreamingController } from '../autocode/streaming/StreamingController';
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
container.bind<OODALoop>('OODALoop').to(OODALoop).inSingletonScope();
container.bind<TaskEmotionMemory>('TaskEmotionMemory').to(TaskEmotionMemory).inSingletonScope();
container.bind<SecurityManager>('SecurityManager').to(SecurityManager).inSingletonScope();

// Register streaming services with factory to resolve circular dependencies
container.bind<CallbackStreamer>('CallbackStreamer').to(CallbackStreamer).inSingletonScope();
container.bind<StreamingController>('StreamingController').to(StreamingController).inSingletonScope();

// Register agents
container.bind<ScaffolderAgent>('ScaffolderAgent').to(ScaffolderAgent).inSingletonScope();
container.bind<DepInstallerAgent>('DepInstallerAgent').to(DepInstallerAgent).inSingletonScope();
container.bind<ComponentAgent>('ComponentAgent').to(ComponentAgent).inSingletonScope();
container.bind<StyleAgent>('StyleAgent').to(StyleAgent).inSingletonScope();
container.bind<BuildAgent>('BuildAgent').to(BuildAgent).inSingletonScope();
container.bind<TestAgent>('TestAgent').to(TestAgent).inSingletonScope();
container.bind<LogParserAgent>('LogParserAgent').to(LogParserAgent).inSingletonScope();
container.bind<MergeAgent>('MergeAgent').to(MergeAgent).inSingletonScope();
container.bind<FinishAgent>('FinishAgent').to(FinishAgent).inSingletonScope();
container.bind<HTMLGeneratorAgent>('HTMLGeneratorAgent').to(HTMLGeneratorAgent).inSingletonScope();
container.bind<EntryPointAgent>('EntryPointAgent').to(EntryPointAgent).inSingletonScope();
container.bind<ConfigAgent>('ConfigAgent').to(ConfigAgent).inSingletonScope();

// Register agents array
container.bind<IAgent[]>('IAgent[]').toDynamicValue(() => [
  container.get<ScaffolderAgent>('ScaffolderAgent'),
  container.get<DepInstallerAgent>('DepInstallerAgent'),
  container.get<ComponentAgent>('ComponentAgent'),
  container.get<HTMLGeneratorAgent>('HTMLGeneratorAgent'),
  container.get<EntryPointAgent>('EntryPointAgent'),
  container.get<StyleAgent>('StyleAgent'),
  container.get<ConfigAgent>('ConfigAgent'),
  container.get<BuildAgent>('BuildAgent'),
  container.get<TestAgent>('TestAgent'),
  container.get<LogParserAgent>('LogParserAgent'),
  container.get<MergeAgent>('MergeAgent'),
  container.get<FinishAgent>('FinishAgent')
]).inSingletonScope();

// Register controllers with circular dependency support using defer
container.bind<AutoCodeController>('AutoCodeController').to(AutoCodeController).inSingletonScope();

// Export container for dependency injection
export default container;

// Lazy initialization function
export function initializeTools(): void {
  try {
    const toolRegistry = container.get<IToolRegistry>('IToolRegistry');
    const textReader = new TextReaderTool();
    const textEditor = new TextEditorTool();
    const shellTool = new ShellTool();

    toolRegistry.registerTool(textReader, textReader);
    toolRegistry.registerTool(textEditor, textEditor);
    toolRegistry.registerTool(shellTool, shellTool);
    
    console.log('✅ Tools initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing tools:', error);
  }
}
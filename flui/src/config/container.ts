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
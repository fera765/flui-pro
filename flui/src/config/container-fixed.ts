import { Container } from 'inversify';
import 'reflect-metadata';

// Create the main container
export const container = new Container();

// Register services in the correct order to avoid circular dependencies
export function registerServices(): void {
  try {
    console.log('🔧 Registering services...');

    // 1. Register base services first
    const { LlmService } = require('../services/LlmService');
    const { EnhancedLlmService } = require('../services/EnhancedLlmService');
    const { ToolRegistry } = require('../plugins/services/ToolRegistry');
    
    container.bind('BaseLlmService').to(LlmService).inSingletonScope();
    container.bind('ILlmService').to(EnhancedLlmService).inSingletonScope();
    container.bind('IToolRegistry').to(ToolRegistry).inSingletonScope();

    // 2. Register memory services
    const { EmotionMemoryService } = require('../memory/services/EmotionMemoryService');
    const { EmotionHashGenerator } = require('../memory/services/EmotionHashGenerator');
    const { ContextProcessor } = require('../memory/services/ContextProcessor');
    
    container.bind('IEmotionMemory').to(EmotionMemoryService).inSingletonScope();
    container.bind('IEmotionHashGenerator').to(EmotionHashGenerator).inSingletonScope();
    container.bind('IContextProcessor').to(ContextProcessor).inSingletonScope();

    // 3. Register AutoCode services
    const { TaskManager } = require('../autocode/core/TaskManager');
    const { FileSystemManager } = require('../autocode/core/FileSystemManager');
    const { ProjectBuilder } = require('../autocode/core/ProjectBuilder');
    const { MicroTaskExecutor } = require('../autocode/core/MicroTaskExecutor');
    
    container.bind('ITaskManager').to(TaskManager).inSingletonScope();
    container.bind('IFileSystem').to(FileSystemManager).inSingletonScope();
    container.bind('IProjectBuilder').to(ProjectBuilder).inSingletonScope();
    container.bind('MicroTaskExecutor').to(MicroTaskExecutor).inSingletonScope();

    // 4. Register streaming services
    const { CallbackStreamer } = require('../autocode/streaming/CallbackStreamer');
    const { StreamingController } = require('../autocode/streaming/StreamingController');
    
    container.bind('CallbackStreamer').to(CallbackStreamer).inSingletonScope();
    container.bind('StreamingController').to(StreamingController).inSingletonScope();

    // 5. Register controllers
    const { AutoCodeController } = require('../autocode/api/AutoCodeController');
    container.bind('AutoCodeController').to(AutoCodeController).inSingletonScope();

    console.log('✅ All services registered successfully');
    
  } catch (error) {
    console.error('❌ Error registering services:', error);
    throw error;
  }
}

// Initialize tools after all services are registered
export function initializeTools(): void {
  try {
    console.log('🔧 Initializing tools...');
    
    const toolRegistry = container.get<any>('IToolRegistry');
    const { TextReaderTool } = require('../plugins/tools/TextReaderTool');
    const { TextEditorTool } = require('../plugins/tools/TextEditorTool');
    const { ShellTool } = require('../plugins/tools/ShellTool');
    
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

export default container;
import { Container } from 'inversify';
import 'reflect-metadata';
import { ILlmService } from '../interfaces/ILlmService';
import { LlmService } from '../services/LlmService';
import { IToolRegistry } from '../plugins/interfaces/ITool';
import { ToolRegistry } from '../plugins/services/ToolRegistry';
import { TextReaderTool } from '../plugins/tools/TextReaderTool';
import { TextEditorTool } from '../plugins/tools/TextEditorTool';
import { ShellTool } from '../plugins/tools/ShellTool';

// Create the main container
export const container = new Container();

// Register services
container.bind<ILlmService>('ILlmService').to(LlmService).inSingletonScope();

// Register tool registry
container.bind<IToolRegistry>('IToolRegistry').to(ToolRegistry).inSingletonScope();

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
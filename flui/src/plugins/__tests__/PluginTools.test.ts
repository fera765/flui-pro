import { ToolRegistry } from '../services/ToolRegistry';
import { TextReaderTool } from '../tools/TextReaderTool';
import { TextEditorTool } from '../tools/TextEditorTool';
import { ShellTool } from '../tools/ShellTool';
import * as fs from 'fs';
import * as path from 'path';

describe('Plugin Tools', () => {
  let toolRegistry: ToolRegistry;
  let textReader: TextReaderTool;
  let textEditor: TextEditorTool;
  let shellTool: ShellTool;

  beforeAll(() => {
    toolRegistry = new ToolRegistry();
    textReader = new TextReaderTool();
    textEditor = new TextEditorTool();
    shellTool = new ShellTool();

    // Register tools
    toolRegistry.registerTool(textReader, textReader);
    toolRegistry.registerTool(textEditor, textEditor);
    toolRegistry.registerTool(shellTool, shellTool);

    // Create project directory for testing
    const projectDir = path.join(process.cwd(), 'project');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    const projectDir = path.join(process.cwd(), 'project');
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  describe('ToolRegistry', () => {
    it('should register tools correctly', () => {
      expect(toolRegistry.isToolRegistered('text_reader')).toBe(true);
      expect(toolRegistry.isToolRegistered('text_editor')).toBe(true);
      expect(toolRegistry.isToolRegistered('shell_executor')).toBe(true);
    });

    it('should return all registered tools', () => {
      const tools = toolRegistry.getAllTools();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('text_reader');
      expect(tools.map(t => t.name)).toContain('text_editor');
      expect(tools.map(t => t.name)).toContain('shell_executor');
    });

    it('should generate OpenAI tools format', () => {
      const openaiTools = toolRegistry.getToolsForOpenAI();
      expect(openaiTools).toHaveLength(3);
      expect(openaiTools[0]).toHaveProperty('type', 'function');
      expect(openaiTools[0]).toHaveProperty('function');
      expect(openaiTools[0].function).toHaveProperty('name');
      expect(openaiTools[0].function).toHaveProperty('description');
      expect(openaiTools[0].function).toHaveProperty('parameters');
    });
  });

  describe('TextReaderTool', () => {
    it('should have correct tool definition', () => {
      expect(textReader.name).toBe('text_reader');
      expect(textReader.description).toContain('Read text content');
      expect(textReader.parameters.required).toContain('filePath');
    });

    it('should reject invalid file paths', async () => {
      await expect(textReader.execute({ filePath: '../../../etc/passwd' }))
        .rejects.toThrow('Invalid file path: path traversal not allowed');
    });

    it('should reject missing filePath parameter', async () => {
      await expect(textReader.execute({}))
        .rejects.toThrow('filePath is required and must be a string');
    });
  });

  describe('TextEditorTool', () => {
    it('should have correct tool definition', () => {
      expect(textEditor.name).toBe('text_editor');
      expect(textEditor.description).toContain('Edit text files');
      expect(textEditor.parameters.required).toContain('filePath');
      expect(textEditor.parameters.required).toContain('operation');
    });

    it('should reject invalid file paths', async () => {
      await expect(textEditor.execute({ 
        filePath: '../../../etc/passwd', 
        operation: 'replace',
        searchText: 'test',
        replaceText: 'new'
      }))
        .rejects.toThrow('Invalid file path: path traversal not allowed');
    });

    it('should reject invalid operations', async () => {
      await expect(textEditor.execute({ 
        filePath: 'test.txt', 
        operation: 'invalid'
      }))
        .rejects.toThrow('Invalid operation: invalid');
    });
  });

  describe('ShellTool', () => {
    it('should have correct tool definition', () => {
      expect(shellTool.name).toBe('shell_executor');
      expect(shellTool.description).toContain('Execute safe shell commands');
      expect(shellTool.parameters.required).toContain('command');
    });

    it('should reject dangerous commands', async () => {
      await expect(shellTool.execute({ command: 'rm -rf /' }))
        .rejects.toThrow('Dangerous command detected');
    });

    it('should reject command chaining', async () => {
      await expect(shellTool.execute({ command: 'ls && rm -rf *' }))
        .rejects.toThrow('Command chaining not allowed');
    });

    it('should reject command substitution', async () => {
      await expect(shellTool.execute({ command: 'ls `rm -rf *`' }))
        .rejects.toThrow('Command substitution not allowed');
    });

    it('should reject unknown commands', async () => {
      await expect(shellTool.execute({ command: 'malicious_command' }))
        .rejects.toThrow('Command not allowed: malicious_command');
    });
  });

  describe('Tool Integration', () => {
    it('should execute text editor tool through registry', async () => {
      const result = await toolRegistry.executeTool('text_editor', {
        filePath: 'test.txt',
        operation: 'append',
        newContent: 'Hello, Flui!'
      });

      expect(result).toContain('Successfully appended file test.txt');
    });

    it('should execute text reader tool through registry', async () => {
      const result = await toolRegistry.executeTool('text_reader', {
        filePath: 'test.txt'
      });

      expect(result).toContain('File content from test.txt');
      expect(result).toContain('Hello, Flui!');
    });

    it('should execute shell tool through registry', async () => {
      const result = await toolRegistry.executeTool('shell_executor', {
        command: 'ls -la'
      });

      expect(result).toContain('STDOUT:');
    });
  });
});
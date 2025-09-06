import { ITool, IToolExecutor } from '../interfaces/ITool';
import * as fs from 'fs';
import * as path from 'path';

export class TextReaderTool implements ITool, IToolExecutor {
  name = 'text_reader';
  description = 'Read text content from files in the flui project directory';
  parameters = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file to read (relative to flui project directory)'
      }
    },
    required: ['filePath']
  };

  async execute(parameters: Record<string, any>): Promise<string> {
    const { filePath } = parameters;
    
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath is required and must be a string');
    }

    // Security: Only allow reading files within flui/project directory
    const safePath = this.validateAndSanitizePath(filePath);
    
    try {
      const fullPath = path.join(process.cwd(), 'project', safePath);
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      
      return `File content from ${filePath}:\n\n${content}`;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndSanitizePath(filePath: string): string {
    // Remove any path traversal attempts
    const sanitized = filePath.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Ensure path doesn't start with / or contain dangerous patterns
    if (sanitized.startsWith('/') || sanitized.includes('..')) {
      throw new Error('Invalid file path: path traversal not allowed');
    }
    
    return sanitized;
  }
}
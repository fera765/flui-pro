import { ITool, IToolExecutor } from '../interfaces/ITool';
import * as fs from 'fs';
import * as path from 'path';

export class TextEditorTool implements ITool, IToolExecutor {
  name = 'text_editor';
  description = 'Edit text files using replace operations in the flui project directory';
  parameters = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file to edit (relative to flui project directory)'
      },
      operation: {
        type: 'string',
        enum: ['replace', 'append', 'prepend'],
        description: 'Type of edit operation to perform'
      },
      searchText: {
        type: 'string',
        description: 'Text to search for (required for replace operation)'
      },
      replaceText: {
        type: 'string',
        description: 'Text to replace with (required for replace operation)'
      },
      newContent: {
        type: 'string',
        description: 'New content to add (required for append/prepend operations)'
      }
    },
    required: ['filePath', 'operation']
  };

  async execute(parameters: Record<string, any>): Promise<string> {
    const { filePath, operation, searchText, replaceText, newContent } = parameters;
    
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath is required and must be a string');
    }

    if (!operation || typeof operation !== 'string') {
      throw new Error('operation is required and must be a string');
    }

    // Security: Only allow editing files within flui/project directory
    const safePath = this.validateAndSanitizePath(filePath);
    const fullPath = path.join(process.cwd(), 'project', safePath);

    try {
      let content = '';
      
      // Read existing content if file exists
      try {
        content = await fs.promises.readFile(fullPath, 'utf-8');
      } catch (error) {
        // File doesn't exist, start with empty content
        content = '';
      }

      let newFileContent = '';

      switch (operation) {
        case 'replace':
          if (!searchText || !replaceText) {
            throw new Error('searchText and replaceText are required for replace operation');
          }
          newFileContent = content.replace(new RegExp(this.escapeRegExp(searchText), 'g'), replaceText);
          break;
          
        case 'append':
          if (!newContent) {
            throw new Error('newContent is required for append operation');
          }
          newFileContent = content + newContent;
          break;
          
        case 'prepend':
          if (!newContent) {
            throw new Error('newContent is required for prepend operation');
          }
          newFileContent = newContent + content;
          break;
          
        default:
          throw new Error(`Invalid operation: ${operation}. Supported operations: replace, append, prepend`);
      }

      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write the new content
      await fs.promises.writeFile(fullPath, newFileContent, 'utf-8');
      
      return `Successfully ${operation}ed file ${filePath}. New content length: ${newFileContent.length} characters.`;
      
    } catch (error) {
      throw new Error(`Failed to edit file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
import { Tool, ToolResponse } from '../types/advanced';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AdvancedTools {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  // Web Search Tool (Mocked)
  createWebSearchTool(): Tool {
    return {
      name: 'web_search',
      description: 'Search the web for information using keywords',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query with keywords',
          required: true
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          required: false
        }
      },
      execute: async (params: { query: string; maxResults?: number }): Promise<ToolResponse> => {
        try {
          // Mock implementation - in real scenario would use actual web search API
          const mockResults = [
            {
              title: `How to ${params.query} - Complete Guide`,
              url: `https://example.com/guide-${params.query.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Comprehensive guide on ${params.query} with step-by-step instructions.`
            },
            {
              title: `${params.query} Best Practices`,
              url: `https://example.com/best-practices-${params.query.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Learn the best practices for ${params.query} from industry experts.`
            },
            {
              title: `${params.query} Tutorial for Beginners`,
              url: `https://example.com/tutorial-${params.query.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Beginner-friendly tutorial covering all aspects of ${params.query}.`
            }
          ];

          const results = params.maxResults ? 
            mockResults.slice(0, params.maxResults) : 
            mockResults;

          return {
            success: true,
            data: results,
            context: `Found ${results.length} results for "${params.query}"`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // Fetch Tool (Mocked)
  createFetchTool(): Tool {
    return {
      name: 'fetch',
      description: 'Fetch content from a URL',
      parameters: {
        url: {
          type: 'string',
          description: 'URL to fetch content from',
          required: true
        }
      },
      execute: async (params: { url: string }): Promise<ToolResponse> => {
        try {
          // Mock implementation - in real scenario would use actual HTTP fetch
          const mockContent = `
# ${params.url.split('/').pop() || 'Page Title'}

This is mock content fetched from ${params.url}.

## Key Information
- This is a simulated web page content
- Contains relevant information about the requested topic
- Structured in a readable format with headings and sections

## Main Content
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Additional Details
- Point 1: Important information
- Point 2: More details
- Point 3: Additional context

This content would normally be fetched from the actual URL in a real implementation.
          `;

          return {
            success: true,
            data: mockContent,
            context: `Fetched content from ${params.url}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // File Read Tool
  createFileReadTool(): Tool {
    return {
      name: 'file_read',
      description: 'Read content from a file',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to the file to read (relative to working directory)',
          required: true
        }
      },
      execute: async (params: { filePath: string }): Promise<ToolResponse> => {
        try {
          const fullPath = path.join(this.workingDirectory, params.filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          return {
            success: true,
            data: content,
            context: `Read ${params.filePath} successfully`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // File Write Tool
  createFileWriteTool(): Tool {
    return {
      name: 'file_write',
      description: 'Write content to a file',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to the file to write (relative to working directory)',
          required: true
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
          required: true
        }
      },
      execute: async (params: { filePath: string; content: string }): Promise<ToolResponse> => {
        try {
          const fullPath = path.join(this.workingDirectory, params.filePath);
          await fs.writeFile(fullPath, params.content, 'utf-8');
          
          return {
            success: true,
            data: { filePath: params.filePath, size: params.content.length },
            context: `Written ${params.filePath} successfully`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // Shell Command Tool
  createShellTool(): Tool {
    return {
      name: 'shell',
      description: 'Execute shell commands safely within the working directory',
      parameters: {
        command: {
          type: 'string',
          description: 'Shell command to execute',
          required: true
        }
      },
      execute: async (params: { command: string }): Promise<ToolResponse> => {
        try {
          // Security check - only allow safe commands
          const safeCommands = ['ls', 'pwd', 'cat', 'grep', 'find', 'npm', 'pip', 'mkdir', 'touch'];
          const commandParts = params.command.split(' ');
          const baseCommand = commandParts[0];
          
          if (!baseCommand || !safeCommands.includes(baseCommand)) {
            return {
              success: false,
              error: `Command '${baseCommand}' is not allowed for security reasons`
            };
          }

          const { stdout, stderr } = await execAsync(params.command, {
            cwd: this.workingDirectory,
            timeout: 30000
          });

          return {
            success: true,
            data: { stdout, stderr },
            context: `Executed command: ${params.command}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // Text Split Tool
  createTextSplitTool(): Tool {
    return {
      name: 'text_split',
      description: 'Split text into smaller chunks while preserving paragraph integrity',
      parameters: {
        text: {
          type: 'string',
          description: 'Text to split',
          required: true
        },
        chunkSize: {
          type: 'number',
          description: 'Approximate size of each chunk in characters',
          required: false
        }
      },
      execute: async (params: { text: string; chunkSize?: number }): Promise<ToolResponse> => {
        try {
          const size = params.chunkSize || 1000;
          const paragraphs = params.text.split('\n\n');
          const chunks: string[] = [];
          let currentChunk = '';

          for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length > size && currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = paragraph;
            } else {
              currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
          }

          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }

          return {
            success: true,
            data: chunks,
            context: `Split text into ${chunks.length} chunks`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // Text Summarize Tool
  createTextSummarizeTool(): Tool {
    return {
      name: 'text_summarize',
      description: 'Summarize text content concisely',
      parameters: {
        text: {
          type: 'string',
          description: 'Text to summarize',
          required: true
        },
        maxLength: {
          type: 'number',
          description: 'Maximum length of summary in characters',
          required: false
        }
      },
      execute: async (params: { text: string; maxLength?: number }): Promise<ToolResponse> => {
        try {
          // Mock implementation - in real scenario would use AI summarization
          const maxLen = params.maxLength || 500;
          const words = params.text.split(' ');
          const summary = words.slice(0, Math.floor(maxLen / 5)).join(' ') + '...';
          
          return {
            success: true,
            data: summary,
            context: `Summarized text from ${params.text.length} to ${summary.length} characters`
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }

  // Get all available tools
  getAllTools(): Tool[] {
    return [
      this.createWebSearchTool(),
      this.createFetchTool(),
      this.createFileReadTool(),
      this.createFileWriteTool(),
      this.createShellTool(),
      this.createTextSplitTool(),
      this.createTextSummarizeTool()
    ];
  }
}
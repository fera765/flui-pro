import { Tool, ToolResponse } from '../types/advanced';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PluginTools } from './pluginTools';
import { PluginLoader } from '../core/pluginLoader';

const execAsync = promisify(exec);

export class AdvancedTools {
  private workingDirectory: string;
  private pluginTools: PluginTools;
  private pluginLoader: PluginLoader;

  constructor(workingDirectory: string, pluginLoader?: PluginLoader) {
    this.workingDirectory = workingDirectory;
    this.pluginLoader = pluginLoader || new PluginLoader();
    this.pluginTools = new PluginTools(this.pluginLoader);
  }

  setWorkingDirectory(workingDirectory: string): void {
    this.workingDirectory = workingDirectory;
  }

  // Web Search Tool (Real Implementation)
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
          // Real web search implementation using DuckDuckGo API
          const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(params.query)}&format=json&no_html=1&skip_disambig=1`;
          
          const response = await fetch(searchUrl);
          if (!response.ok) {
            throw new Error(`Search API error: ${response.status}`);
          }
          
          const data = await response.json();
          const results = [];
          
          // Process DuckDuckGo results
          const typedData = data as any;
          if (typedData.RelatedTopics && typedData.RelatedTopics.length > 0) {
            for (const topic of typedData.RelatedTopics.slice(0, params.maxResults || 5)) {
              if (topic.Text && topic.FirstURL) {
                results.push({
                  title: topic.Text.substring(0, 100) + '...',
                  url: topic.FirstURL,
                  snippet: topic.Text
                });
              }
            }
          }
          
          // Add instant answer if available
          if (typedData.Abstract && typedData.AbstractURL) {
            results.unshift({
              title: typedData.Heading || 'Instant Answer',
              url: typedData.AbstractURL,
              snippet: typedData.Abstract
            });
          }

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

  // Fetch Tool (Real Implementation)
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
          // Real HTTP fetch implementation
          const response = await fetch(params.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FluiBot/1.0)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type') || '';
          let content: string;

          if (contentType.includes('application/json')) {
            const jsonData = await response.json();
            content = JSON.stringify(jsonData, null, 2);
          } else if (contentType.includes('text/')) {
            content = await response.text();
          } else {
            content = `Binary content (${contentType}) - ${response.headers.get('content-length') || 'unknown'} bytes`;
          }

          return {
            success: true,
            data: content,
            context: `Fetched ${contentType} content from ${params.url} (${content.length} characters)`
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

  createDirectoryTool(): Tool {
    return {
      name: 'create_directory',
      description: 'Create a directory',
      parameters: {
        path: {
          type: 'string',
          description: 'Path to the directory to create (relative to working directory)',
          required: true
        }
      },
      execute: async (params: { path: string }): Promise<ToolResponse> => {
        try {
          const fullPath = path.join(this.workingDirectory, params.path);
          await fs.mkdir(fullPath, { recursive: true });
          
          return {
            success: true,
            data: { path: params.path },
            context: `Created directory ${params.path} successfully`
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

  createBuildTool(): Tool {
    return {
      name: 'build_project',
      description: 'Build/compile a project using the appropriate build command (npm run build, yarn build, cargo build, go build, etc.)',
      parameters: {
        command: {
          type: 'string',
          description: 'Build command to execute (e.g., "npm run build", "yarn build", "cargo build", "go build", "python -m build")',
          required: true
        },
        workingDir: {
          type: 'string',
          description: 'Working directory to run the command in (relative to project root)',
          required: false
        }
      },
      execute: async (params: { command: string; workingDir?: string }): Promise<ToolResponse> => {
        try {
          const workDir = params.workingDir ? path.join(this.workingDirectory, params.workingDir) : this.workingDirectory;
          console.log(`🔨 Building project with command: ${params.command} in ${workDir}`);
          
          const { stdout, stderr } = await execAsync(params.command, { cwd: workDir });
          
          return {
            success: true,
            data: { 
              command: params.command,
              stdout: stdout,
              stderr: stderr,
              workingDir: workDir
            },
            context: `Build completed successfully with command: ${params.command}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Build failed: ${error.message}`,
            data: { command: params.command, stderr: error.stderr }
          };
        }
      }
    };
  }

  createStartTool(): Tool {
    return {
      name: 'start_project',
      description: 'Start/run a project using the appropriate start command (npm start, yarn start, python app.py, go run, etc.)',
      parameters: {
        command: {
          type: 'string',
          description: 'Start command to execute (e.g., "npm start", "yarn start", "python app.py", "go run main.go")',
          required: true
        },
        workingDir: {
          type: 'string',
          description: 'Working directory to run the command in (relative to project root)',
          required: false
        },
        port: {
          type: 'number',
          description: 'Port number the application will run on (for testing purposes)',
          required: false
        }
      },
      execute: async (params: { command: string; workingDir?: string; port?: number }): Promise<ToolResponse> => {
        try {
          const workDir = params.workingDir ? path.join(this.workingDirectory, params.workingDir) : this.workingDirectory;
          console.log(`🚀 Starting project with command: ${params.command} in ${workDir}`);
          
          // Start the process in background
          const child = execAsync(params.command, { cwd: workDir });
          
          // Wait a bit for the app to start
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          return {
            success: true,
            data: { 
              command: params.command,
              workingDir: workDir,
              port: params.port
            },
            context: `Project started successfully with command: ${params.command}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Start failed: ${error.message}`,
            data: { command: params.command }
          };
        }
      }
    };
  }

  createTestTool(): Tool {
    return {
      name: 'test_endpoint',
      description: 'Test an endpoint or application to verify it is working correctly',
      parameters: {
        url: {
          type: 'string',
          description: 'URL to test (e.g., "http://localhost:3000", "http://localhost:8080/api/health")',
          required: true
        },
        method: {
          type: 'string',
          description: 'HTTP method to use (GET, POST, PUT, DELETE)',
          required: false
        },
        headers: {
          type: 'object',
          description: 'HTTP headers to send with the request',
          required: false
        },
        body: {
          type: 'string',
          description: 'Request body (for POST/PUT requests)',
          required: false
        }
      },
      execute: async (params: { url: string; method?: string; headers?: any; body?: string }): Promise<ToolResponse> => {
        try {
          const method = params.method || 'GET';
          const headers = params.headers || {};
          
          console.log(`🧪 Testing endpoint: ${method} ${params.url}`);
          
          const response = await fetch(params.url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: params.body
          });
          
          const responseText = await response.text();
          
          return {
            success: response.ok,
            data: { 
              url: params.url,
              method,
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseText
            },
            context: `Test ${response.ok ? 'passed' : 'failed'}: ${response.status} ${response.statusText}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Test failed: ${error.message}`,
            data: { url: params.url, method: params.method }
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

  // Text Summarize Tool (Real LLM Implementation)
  createTextSummarizeTool(): Tool {
    return {
      name: 'text_summarize',
      description: 'Summarize text content concisely using AI',
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
          // Real AI summarization using OpenAI
          const { PollinationsTool } = await import('./pollinationsTool');
          const pollinationsTool = new PollinationsTool();
          
          const maxLen = params.maxLength || 500;
          const prompt = `Summarize the following text in approximately ${maxLen} characters or less. Focus on the key points and main ideas:

${params.text}

Summary:`;

          const summary = await pollinationsTool.generateText(prompt, {
            model: 'openai',
            temperature: 0.3,
            maxTokens: Math.floor(maxLen / 2)
          });
          
          return {
            success: true,
            data: summary.trim(),
            context: `AI summarized text from ${params.text.length} to ${summary.length} characters`
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
    const baseTools = [
      this.createWebSearchTool(),
      this.createFetchTool(),
      this.createFileReadTool(),
      this.createFileWriteTool(),
      this.createDirectoryTool(),
      this.createBuildTool(),
      this.createStartTool(),
      this.createTestTool(),
      this.createShellTool(),
      this.createTextSplitTool(),
      this.createTextSummarizeTool()
    ];

    // Add plugin tools
    const pluginTools = this.pluginTools.getAvailableTools().map(pluginTool => ({
      name: pluginTool.name,
      description: pluginTool.description,
      parameters: pluginTool.parameters,
      execute: async (params: any): Promise<ToolResponse> => {
        try {
          const result = await this.pluginTools.executeTool(pluginTool.name, params);
          return {
            success: true,
            data: result
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message
          };
        }
      }
    }));

    return [...baseTools, ...pluginTools];
  }

  // Get all tool schemas for OpenAI SDK
  getAllToolSchemas(): any[] {
    const baseSchemas = [
      this.getWebSearchSchema(),
      this.getFetchSchema(),
      this.getFileReadSchema(),
      this.getFileWriteSchema(),
      this.getShellSchema(),
      this.getTextSplitSchema(),
      this.getTextSummarizeSchema()
    ];

    // Add plugin tool schemas
    const pluginSchemas = this.pluginTools.getAllToolSchemas();

    return [...baseSchemas, ...pluginSchemas];
  }

  // Refresh plugin tools
  refreshPluginTools(): void {
    this.pluginTools.refreshTools();
  }

  // Schema methods for OpenAI SDK
  private getWebSearchSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for information using keywords',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      }
    };
  }

  private getFetchSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'fetch',
        description: 'Fetch content from a URL',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' }
          },
          required: ['url']
        }
      }
    };
  }

  private getFileReadSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'file_read',
        description: 'Read content from a file',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' }
          },
          required: ['path']
        }
      }
    };
  }

  private getFileWriteSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'file_write',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to write' },
            content: { type: 'string', description: 'Content to write' }
          },
          required: ['path', 'content']
        }
      }
    };
  }

  private getShellSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'shell',
        description: 'Execute shell command in working directory',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Shell command to execute' }
          },
          required: ['command']
        }
      }
    };
  }

  private getTextSplitSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'text_split',
        description: 'Split text into chunks',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to split' },
            chunkSize: { type: 'number', description: 'Size of each chunk' }
          },
          required: ['text', 'chunkSize']
        }
      }
    };
  }

  private getTextSummarizeSchema(): any {
    return {
      type: 'function',
      function: {
        name: 'text_summarize',
        description: 'Summarize text content',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to summarize' }
          },
          required: ['text']
        }
      }
    };
  }
}
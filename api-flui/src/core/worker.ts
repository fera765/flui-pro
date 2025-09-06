import { Task, TaskResult } from '../types';
import { PollinationsTool } from '../tools/pollinationsTool';
import { KnowledgeManager } from './knowledgeManager';
import { AdvancedTools } from '../tools/advancedTools';

export class Worker {
  private isWorking = false;
  private currentTaskId: string | null = null;
  private advancedTools: AdvancedTools;

  constructor(
    private pollinationsTool: PollinationsTool,
    private knowledgeManager: KnowledgeManager,
    workingDirectory: string = process.cwd()
  ) {
    this.advancedTools = new AdvancedTools(workingDirectory);
  }

  async executeTask(task: Task): Promise<TaskResult> {
    if (this.isWorking) {
      throw new Error('Worker is already busy');
    }

    this.isWorking = true;
    this.currentTaskId = task.id;

    try {
      let result: TaskResult;

      switch (task.type) {
        case 'conversation':
          result = await this.handleConversation(task);
          break;
        case 'task':
          result = await this.handleTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return result;
    } finally {
      this.isWorking = false;
      this.currentTaskId = null;
    }
  }

  isAvailable(): boolean {
    return !this.isWorking;
  }

  getCurrentTaskId(): string | null {
    return this.currentTaskId;
  }

  private async handleConversation(task: Task): Promise<TaskResult> {
    try {
      // Get relevant knowledge for this conversation
      const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(task.prompt, 2);
      
      // Enhance prompt with knowledge if available
      const enhancedPrompt = contextualKnowledge 
        ? `${task.prompt}\n\n${contextualKnowledge}`
        : task.prompt;

      // For conversation tasks, use text generation with conversation context
      const response = await this.pollinationsTool.generateText(
        enhancedPrompt,
        {
          model: 'openai',
          temperature: 0.7,
          maxTokens: 500
        }
      );

      return {
        success: true,
        data: response,
        metadata: {
          type: 'conversation',
          model: 'openai',
          temperature: 0.7,
          knowledgeUsed: !!contextualKnowledge
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Conversation failed',
        metadata: { type: 'conversation' }
      };
    }
  }

  private async handleTask(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const classification = metadata?.classification;
    
    if (!classification) {
      return {
        success: false,
        error: 'Task classification not found',
        metadata: { type: 'task' }
      };
    }

    try {
      // Get available tools for intelligent execution
      const availableTools = this.advancedTools.getAllToolSchemas();
      
      // Create execution tools for the LLM
      const executionTools = [
        {
          type: "function",
          function: {
            name: "execute_task",
            description: "Execute a task using available tools and resources",
            parameters: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["generate_text", "generate_image", "generate_audio", "use_tool", "composite"],
                  description: "Type of action to perform"
                },
                parameters: {
                  type: "object",
                  description: "Parameters for the action"
                },
                reasoning: {
                  type: "string",
                  description: "Explanation of why this action was chosen"
                }
              },
              required: ["action", "parameters", "reasoning"]
            }
          }
        },
        ...availableTools
      ];

      const executionPrompt = `
Execute the following task using the available tools and resources.

Task: "${task.prompt}"
Type: ${task.type}
Subtype: ${classification.subtype}
Parameters: ${JSON.stringify(classification.parameters)}

Available tools:
- generate_text: Generate text content
- generate_image: Generate images
- generate_audio: Generate audio content
- web_search: Search the web for information
- fetch: Fetch content from URLs
- file_read: Read files
- file_write: Write files
- shell: Execute shell commands
- text_split: Split text into chunks
- text_summarize: Summarize text content

Instructions:
1. Analyze the task requirements
2. Choose the appropriate action and tools
3. Execute the task step by step
4. Provide reasoning for your choices

IMPORTANTE: Use the execute_task function to perform the main action, and use other tools as needed.
`;

      const response = await this.pollinationsTool.generateTextWithTools(executionPrompt, executionTools, {
        temperature: 0.3,
        maxTokens: 1000
      });

      // Process the LLM response and tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        return await this.processToolCalls(response.toolCalls, task);
      }

      // Fallback to traditional execution if no tools were used
      return await this.handleTraditionalExecution(task);
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Task execution failed',
        metadata: { type: 'task', subtype: classification.subtype }
      };
    }
  }

  private async processToolCalls(toolCalls: any[], task: Task): Promise<TaskResult> {
    const results: any[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        if (!toolCall || !toolCall.function) {
          console.error('Invalid toolCall:', toolCall);
          results.push({ success: false, error: 'Invalid tool call structure' });
          continue;
        }
        
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        switch (name) {
          case 'execute_task':
            console.log('Executing task action with args:', parsedArgs);
            results.push(await this.executeTaskAction(parsedArgs, task));
            break;
          case 'web_search':
            results.push(await this.advancedTools.createWebSearchTool().execute(parsedArgs));
            break;
          case 'fetch':
            results.push(await this.advancedTools.createFetchTool().execute(parsedArgs));
            break;
          case 'file_read':
            results.push(await this.advancedTools.createFileReadTool().execute(parsedArgs));
            break;
          case 'file_write':
            results.push(await this.advancedTools.createFileWriteTool().execute(parsedArgs));
            break;
          case 'shell':
            results.push(await this.advancedTools.createShellTool().execute(parsedArgs));
            break;
          case 'text_split':
            results.push(await this.advancedTools.createTextSplitTool().execute(parsedArgs));
            break;
          case 'text_summarize':
            results.push(await this.advancedTools.createTextSummarizeTool().execute(parsedArgs));
            break;
          default:
            console.warn(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        console.error(`Error executing tool ${toolCall.function.name}:`, error);
        results.push({ success: false, error: error.message });
      }
    }
    
    return {
      success: true,
      data: results,
      metadata: { 
        type: 'task', 
        subtype: task.metadata.classification.subtype,
        toolCalls: toolCalls.length,
        results: results.length
      }
    };
  }

  private async executeTaskAction(action: any, task: Task): Promise<any> {
    if (!action) {
      throw new Error('Action is undefined');
    }
    
    const { action: actionType, parameters, reasoning } = action;
    
    switch (actionType) {
      case 'generate_text':
        return await this.pollinationsTool.generateText(parameters.prompt || task.prompt, {
          model: parameters.model || 'openai',
          temperature: parameters.temperature || 0.7,
          maxTokens: parameters.maxTokens || 500
        });
      
      case 'generate_image':
        return await this.pollinationsTool.generateImage(parameters.prompt || task.prompt, {
          size: parameters.size || '1024x1024',
          model: parameters.model || 'flux'
        });
      
      case 'generate_audio':
        return await this.pollinationsTool.generateAudio(parameters.text || task.prompt, {
          voice: parameters.voice || 'alloy',
          model: parameters.model || 'openai-audio'
        });
      
      default:
        throw new Error(`Unsupported action: ${actionType}`);
    }
  }

  private async handleTraditionalExecution(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const classification = metadata.classification;

    switch (classification.subtype) {
      case 'image_generation':
        return await this.handleImageGeneration(task);
      
      case 'text_generation':
        return await this.handleTextGeneration(task);
      
      case 'audio':
        return await this.handleAudioTask(task);
      
      case 'composite':
        return await this.handleCompositeTask(task);
      
      default:
        // Try to determine task type from prompt
        if (this.isImagePrompt(task.prompt)) {
          return await this.handleImageGeneration(task);
        } else if (this.isTextPrompt(task.prompt)) {
          return await this.handleTextGeneration(task);
        } else {
          throw new Error(`Unsupported task subtype: ${classification.subtype}`);
        }
    }
  }

  private async handleImageGeneration(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const params = metadata?.classification?.parameters || {};

    try {
      const imageData = await this.pollinationsTool.generateImage(
        params.subject || task.prompt,
        {
          size: params.size || '1024x1024',
          model: params.model || 'flux',
          transparent: params.transparent || false
        }
      );

      return {
        success: true,
        data: imageData,
        metadata: {
          type: 'image_generation',
          size: params.size || '1024x1024',
          model: params.model || 'flux',
          transparent: params.transparent || false
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Image generation failed',
        metadata: { type: 'image_generation' }
      };
    }
  }

  private async handleTextGeneration(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const params = metadata?.classification?.parameters || {};

    try {
      // Get relevant knowledge for this text generation task
      const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(task.prompt, 3);
      
      // Enhance prompt with knowledge if available
      const enhancedPrompt = contextualKnowledge 
        ? `${task.prompt}\n\n${contextualKnowledge}`
        : task.prompt;

      const text = await this.pollinationsTool.generateText(
        enhancedPrompt,
        {
          model: params.model || 'openai',
          temperature: params.temperature || 0.7,
          maxTokens: params.maxWords ? params.maxWords * 10 : 500
        }
      );

      return {
        success: true,
        data: text,
        metadata: {
          type: 'text_generation',
          model: params.model || 'openai',
          temperature: params.temperature || 0.7,
          knowledgeUsed: !!contextualKnowledge,
          maxTokens: params.maxWords ? params.maxWords * 10 : 500
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Text generation failed',
        metadata: { type: 'text_generation' }
      };
    }
  }

  private async handleAudioTask(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const params = metadata?.classification?.parameters || {};

    try {
      if (params.action === 'text_to_speech') {
        const audioData = await this.pollinationsTool.generateAudio(
          task.prompt,
          {
            voice: params.voice || 'alloy',
            model: 'openai-audio'
          }
        );

        return {
          success: true,
          data: audioData,
          metadata: {
            type: 'audio_generation',
            action: 'text_to_speech',
            voice: params.voice || 'alloy',
            model: 'openai-audio'
          }
        };
      } else {
        throw new Error(`Unsupported audio action: ${params.action}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Audio task failed',
        metadata: { type: 'audio' }
      };
    }
  }

  private async handleCompositeTask(task: Task): Promise<TaskResult> {
    // For composite tasks, we return a plan rather than executing
    // The orchestrator will handle the actual execution
    return {
      success: true,
      data: {
        message: 'Composite task plan created, execution will be delegated',
        taskId: task.id,
        type: 'composite'
      },
      metadata: {
        type: 'composite',
        subtaskCount: task.childTasks.length
      }
    };
  }

  private isImagePrompt(prompt: string): boolean {
    const imageKeywords = ['image', 'picture', 'photo', 'generate', 'create', 'draw'];
    return imageKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  private isTextPrompt(prompt: string): boolean {
    const textKeywords = ['write', 'story', 'essay', 'text', 'content'];
    return textKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }
}
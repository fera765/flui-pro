import { Task, TaskResult } from '../types';
import { PollinationsTool } from '../tools/pollinationsTool';
import { KnowledgeManager } from './knowledgeManager';

export class Worker {
  private isWorking = false;
  private currentTaskId: string | null = null;

  constructor(
    private pollinationsTool: PollinationsTool,
    private knowledgeManager: KnowledgeManager
  ) {}

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
    const classification = metadata.classification;

    try {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Task execution failed',
        metadata: { type: 'task', subtype: classification.subtype }
      };
    }
  }

  private async handleImageGeneration(task: Task): Promise<TaskResult> {
    const metadata = task.metadata;
    const params = metadata.classification.parameters;

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
    const params = metadata.classification.parameters;

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
    const params = metadata.classification.parameters;

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
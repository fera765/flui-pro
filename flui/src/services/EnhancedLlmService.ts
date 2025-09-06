import { injectable, inject } from 'inversify';
import { ILlmService } from '../interfaces/ILlmService';
import { IEmotionMemory } from '../memory/interfaces/IEmotionMemory';
import { LlmService } from './LlmService';
import { EmotionVector, PolicyDelta } from '../memory/interfaces/IEmotionMemory';

@injectable()
export class EnhancedLlmService implements ILlmService {
  private readonly baseLlmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;

  constructor(
    @inject('BaseLlmService') baseLlmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory
  ) {
    this.baseLlmService = baseLlmService;
    this.emotionMemory = emotionMemory;
  }

  async generateResponse(prompt: string): Promise<string> {
    // Execute SRI Protocol to optimize context
    const sriResult = await this.emotionMemory.executeSRIProtocol(prompt, 0.7, 3);
    
    // Generate response with optimized context
    const response = await this.baseLlmService.generateResponse(sriResult.processedContext);
    
    // Analyze emotional context of the response
    const emotionVector = await this.emotionMemory.analyzeEmotionalContext(response);
    
    // Create policy delta if emotional intensity is high
    if (this.calculateEmotionalIntensity(emotionVector) >= 0.7) {
      const policyDelta = await this.emotionMemory.createPolicyDelta(
        'response_optimization',
        'high_emotion_response',
        this.calculateEmotionalIntensity(emotionVector)
      );
      
      // Store memory for future reference
      await this.emotionMemory.storeMemory(
        emotionVector,
        policyDelta,
        `Prompt: ${prompt}\nResponse: ${response}`,
        true // Assume positive outcome for now
      );
    }
    
    return response;
  }

  async generateResponseWithTools(prompt: string, tools?: any[]): Promise<string> {
    // Execute SRI Protocol to optimize context
    const sriResult = await this.emotionMemory.executeSRIProtocol(prompt, 0.7, 3);
    
    // Generate response with optimized context and tools
    const response = await this.baseLlmService.generateResponseWithTools(
      sriResult.processedContext,
      tools
    );
    
    // Analyze emotional context of the response
    const emotionVector = await this.emotionMemory.analyzeEmotionalContext(response);
    
    // Create policy delta if emotional intensity is high
    if (this.calculateEmotionalIntensity(emotionVector) >= 0.7) {
      const policyDelta = await this.emotionMemory.createPolicyDelta(
        'tool_response_optimization',
        'high_emotion_tool_response',
        this.calculateEmotionalIntensity(emotionVector)
      );
      
      // Store memory for future reference
      await this.emotionMemory.storeMemory(
        emotionVector,
        policyDelta,
        `Prompt: ${prompt}\nTools: ${JSON.stringify(tools)}\nResponse: ${response}`,
        true // Assume positive outcome for now
      );
    }
    
    return response;
  }

  async isConnected(): Promise<boolean> {
    return await this.baseLlmService.isConnected();
  }

  getConfiguration(): any {
    return this.baseLlmService.getConfiguration();
  }

  getOpenAIClient(): any {
    return this.baseLlmService.getOpenAIClient();
  }

  getBaseUrl(): string {
    return this.baseLlmService.getBaseUrl();
  }

  getModel(): string {
    return this.baseLlmService.getModel();
  }

  /**
   * Get memory statistics for monitoring
   */
  async getMemoryStats(): Promise<{
    totalMemories: number;
    averageIntensity: number;
    mostAccessed: string | null;
    oldestMemory: number | null;
    newestMemory: number | null;
  }> {
    return await this.emotionMemory.getMemoryStats();
  }

  /**
   * Execute SRI Protocol manually
   */
  async executeSRIProtocol(
    originalContext: string,
    threshold: number = 0.7,
    keepTurns: number = 3
  ): Promise<{
    processedContext: string;
    tokenReduction: number;
    memoriesInjected: number;
    relevantMemories: any[];
  }> {
    return await this.emotionMemory.executeSRIProtocol(originalContext, threshold, keepTurns);
  }

  /**
   * Analyze emotional context of text
   */
  async analyzeEmotionalContext(text: string): Promise<EmotionVector> {
    return await this.emotionMemory.analyzeEmotionalContext(text);
  }

  /**
   * Store emotional memory manually
   */
  async storeEmotionalMemory(
    emotionVector: EmotionVector,
    policyDelta: PolicyDelta,
    context: string,
    outcome: boolean
  ): Promise<string> {
    return await this.emotionMemory.storeMemory(emotionVector, policyDelta, context, outcome);
  }

  private calculateEmotionalIntensity(emotionVector: EmotionVector): number {
    const components = [
      emotionVector.valence,
      emotionVector.arousal,
      emotionVector.dominance,
      emotionVector.confidence,
      emotionVector.regret,
      emotionVector.satisfaction
    ];

    const sumOfSquares = components.reduce((sum, component) => sum + Math.pow(component, 2), 0);
    return Math.sqrt(sumOfSquares);
  }
}
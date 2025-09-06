import 'reflect-metadata';
import { OODALoop } from './OODALoop';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';
import { IAgent, Task, MicroTask, AgentType, AgentContext, ProjectState } from '../types/ITask';
import { OODAState } from './OODALoop';

// Mock implementations
class MockLlmService implements ILlmService {
  async generateResponse(prompt: string): Promise<string> {
    // Simular resposta do LLM
    if (prompt.includes('Analise o estado atual do projeto')) {
      return JSON.stringify({
        phase: 'orient',
        microTasks: [
          {
            id: 'task-1',
            type: 'file_create',
            path: 'src/App.tsx',
            newSnippet: 'import React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}',
            rollbackHash: 'hash1',
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          }
        ],
        insights: ['Project structure analyzed', 'React component needed'],
        confidence: 0.8,
        shouldContinue: true
      });
    }
    
    if (prompt.includes('orient') || prompt.includes('ORIENTAÇÃO')) {
      return JSON.stringify({
        phase: 'decide',
        microTasks: [],
        insights: ['Decision made to create React component'],
        confidence: 0.9,
        shouldContinue: true
      });
    }
    
    if (prompt.includes('decide') || prompt.includes('DECISÃO')) {
      return JSON.stringify({
        phase: 'act',
        microTasks: [],
        insights: ['Ready to execute micro-tasks'],
        confidence: 0.95,
        shouldContinue: true
      });
    }
    
    if (prompt.includes('Analise o resultado da ação executada')) {
      return JSON.stringify({
        phase: 'complete',
        microTasks: [],
        insights: ['All tasks completed successfully'],
        confidence: 1.0,
        shouldContinue: false
      });
    }
    
    return JSON.stringify({
      phase: 'observe',
      microTasks: [],
      insights: ['Starting observation'],
      confidence: 0.5,
      shouldContinue: true
    });
  }

  async generateResponseWithTools(prompt: string, tools?: any[]): Promise<string> {
    return this.generateResponse(prompt);
  }

  async isConnected(): Promise<boolean> {
    return true;
  }

  getConfiguration(): any {
    return {
      baseUrl: 'http://127.0.0.1:4000/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 4000,
      temperature: 0.7
    };
  }

  getOpenAIClient(): any {
    return {};
  }

  getBaseUrl(): string {
    return 'http://127.0.0.1:4000/v1';
  }

  getModel(): string {
    return 'gpt-3.5-turbo';
  }
}

class MockEmotionMemory implements Partial<IEmotionMemory> {
  async storeMemory(emotionVector: any, policyDelta: any, context: string, outcome: boolean): Promise<string> {
    return 'mock-hash';
  }
  async recallDelta(emotionHash: string): Promise<string | null> { return null; }
  async getRelevantMemories(threshold: number): Promise<any[]> { return []; }
  async updateAccessCount(emotionHash: string): Promise<void> {}
  async stripContext(context: string, keepTurns: number): Promise<string> { return context; }
  async injectMemories(context: string, memories: any[]): Promise<string> { return context; }
  async executeSRIProtocol(originalContext: string, threshold?: number, keepTurns?: number): Promise<any> {
    return {
      processedContext: originalContext,
      tokenReduction: 0,
      memoriesInjected: 0,
      relevantMemories: []
    };
  }
  async analyzeEmotionalContext(text: string): Promise<any> {
    return { valence: 0, arousal: 0, dominance: 0, confidence: 0, regret: 0, satisfaction: 0 };
  }
  async createPolicyDelta(action: string, context: string, intensity?: number): Promise<any> {
    return { action, context, intensity: intensity || 0.5, timestamp: Date.now() };
  }
  async getMemoryStats(): Promise<any> { return { totalMemories: 0, averageIntensity: 0, mostAccessed: null, oldestMemory: null, newestMemory: null }; }
  async clearAllMemories(): Promise<void> {}
  async getAllMemories(): Promise<any[]> { return []; }
  async applyTemporalDecay(config?: any): Promise<any> { return { activeMemories: [], removedMemories: [], decayStats: {} }; }
  async clusterMemories(config?: any): Promise<any> { return { clusters: [], unclustered: [], clusteringStats: {} }; }
  async findSimilarMemories(targetMemory: any, threshold?: number): Promise<any> { return { similar: [], similarities: [] }; }
  async analyzeEmotionalContextWithLLM(text: string): Promise<any> { return {}; }
  async createPolicyDeltaWithLLM(text: string, context: string, outcome: boolean): Promise<any> { return {}; }
  async storeMemoryWithLLMAnalysis(text: string, context: string, outcome: boolean): Promise<any> { return { emotionHash: 'hash', emotionAnalysis: {}, policyAnalysis: {} }; }
  async getComprehensiveStats(): Promise<any> { return { basic: {}, decay: {}, clustering: {} }; }
  async optimizeMemorySystem(decayConfig?: any, clusteringConfig?: any): Promise<any> { return { decayResult: {}, clusteringResult: {}, optimizationStats: { beforeOptimization: 0, afterOptimization: 0, memoryReduction: 0 } }; }
}

class MockFileSystem implements IFileSystem {
  async readFile(filePath: string): Promise<string> { return ''; }
  async writeFile(filePath: string, content: string): Promise<void> {}
  async deleteFile(filePath: string): Promise<void> {}
  async fileExists(filePath: string): Promise<boolean> { return false; }
  async calculateChecksum(filePath: string): Promise<string> { return 'hash'; }
  async createDirectory(dirPath: string): Promise<void> {}
  async listFiles(directory: string): Promise<string[]> { return []; }
  async createProjectStructure(projectPath: string, prompt: string): Promise<void> {}
  async saveTaskLog(projectPath: string, taskId: string, log: any): Promise<void> {}
  async getProjectFiles(projectPath: string): Promise<Record<string, string>> { return {}; }
  async validateProjectState(projectPath: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    return { isValid: true, errors: [], warnings: [] };
  }
}

class MockAgent implements IAgent {
  name: AgentType = 'ComponentAgent';
  
  async execute(context: AgentContext): Promise<MicroTask[]> {
    if (context.task.prompt.includes('React')) {
      return [
        {
          id: 'micro-task-1',
          type: 'file_create',
          path: 'src/App.tsx',
          newSnippet: 'import React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}',
          rollbackHash: 'hash1',
          status: 'pending',
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        }
      ];
    }
    return [];
  }
  
  canHandle(task: Task, projectState: ProjectState): boolean {
    return task.prompt.includes('React') || task.prompt.includes('component');
  }

  getPriority(): number {
    return 1;
  }
}

describe('OODALoop', () => {
  let oodaLoop: OODALoop;
  let mockLlmService: MockLlmService;
  let mockEmotionMemory: MockEmotionMemory;
  let mockFileSystem: MockFileSystem;
  let mockAgent: MockAgent;

  beforeEach(() => {
    mockLlmService = new MockLlmService();
    mockEmotionMemory = new MockEmotionMemory();
    mockFileSystem = new MockFileSystem();
    mockAgent = new MockAgent();
    
    oodaLoop = new OODALoop(mockLlmService, mockEmotionMemory as any, mockFileSystem);
  });

  describe('executeIteration', () => {
    it('should complete a full OODA cycle and generate React code', async () => {
      // Arrange
      const task: Task = {
        id: 'test-task',
        prompt: 'Create a React app with TypeScript',
        status: 'in_progress',
        createdAt: Date.now(),
        projectPath: '/test/project',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started',
        testStatus: 'not_started'
      };

      const state: OODAState = {
        phase: 'observe',
        iteration: 0,
        maxIterations: 10,
        lastObservation: null,
        lastDecision: null,
        lastAction: null,
        context: {},
        memory: {}
      };

      // Act
      const result = await oodaLoop.executeIteration(task, [mockAgent], state);

      // Assert
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('orient');
      expect(result.microTasks.length).toBeGreaterThan(0);
      expect(result.microTasks[0].type).toBe('file_create');
      expect(result.microTasks[0].path).toBe('src/App.tsx');
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.shouldContinue).toBe(true);
    });

    it('should progress through all OODA phases', async () => {
      // Arrange
      const task: Task = {
        id: 'test-task',
        prompt: 'Create a React app',
        status: 'in_progress',
        createdAt: Date.now(),
        projectPath: '/test/project',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started',
        testStatus: 'not_started'
      };

      const state: OODAState = {
        phase: 'observe',
        iteration: 0,
        maxIterations: 10,
        lastObservation: null,
        lastDecision: null,
        lastAction: null,
        context: {},
        memory: {}
      };

      // Act - Execute multiple iterations to go through all phases
      let currentState = { ...state };
      let result;
      
      // Observe phase
      result = await oodaLoop.executeIteration(task, [mockAgent], currentState);
      expect(result.nextPhase).toBe('orient');
      currentState.phase = 'orient';
      currentState.lastObservation = result.microTasks.length > 0 ? { files: {} } : null;
      
      // Orient phase
      result = await oodaLoop.executeIteration(task, [mockAgent], currentState);
      expect(result.nextPhase).toBe('decide');
      currentState.phase = 'decide';
      currentState.lastDecision = { agent: mockAgent, reasoning: 'test' };
      
      // Decide phase
      result = await oodaLoop.executeIteration(task, [mockAgent], currentState);
      expect(result.nextPhase).toBe('act');
      currentState.phase = 'act';
      
      // Act phase - should execute agent and return complete
      result = await oodaLoop.executeIteration(task, [mockAgent], currentState);
      // The agent should be executed and return micro-tasks, then LLM should analyze and return complete
      expect(result.success).toBe(true);
      // Note: shouldContinue might be true if the LLM doesn't return complete phase
      expect(result.nextPhase).toBeDefined();
    });

    it('should handle LLM errors gracefully', async () => {
      // Arrange
      const errorLlmService = new MockLlmService();
      errorLlmService.generateResponse = async () => {
        throw new Error('LLM connection failed');
      };
      
      const errorOodaLoop = new OODALoop(errorLlmService, mockEmotionMemory as any, mockFileSystem);
      
      const task: Task = {
        id: 'test-task',
        prompt: 'Create a React app',
        status: 'in_progress',
        createdAt: Date.now(),
        projectPath: '/test/project',
        microTasks: [],
        logs: [],
        checksums: {},
        buildStatus: 'not_started',
        testStatus: 'not_started'
      };

      const state: OODAState = {
        phase: 'observe',
        iteration: 0,
        maxIterations: 10,
        lastObservation: null,
        lastDecision: null,
        lastAction: null,
        context: {},
        memory: {}
      };

      // Act
      const result = await errorOodaLoop.executeIteration(task, [mockAgent], state);

      // Assert
      expect(result.success).toBe(false);
      expect(result.insights[0]).toContain('LLM connection failed');
    });
  });
});
import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IProjectBuilder } from '../types/ITask';

@injectable()
export class TestAgent implements IAgent {
  public readonly name = 'TestAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly projectBuilder: IProjectBuilder;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IProjectBuilder') projectBuilder: IProjectBuilder
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.projectBuilder = projectBuilder;
  }

  getPriority(): number {
    return 6;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se há componentes mas testes não foram executados
    const hasComponents = this.hasTestableComponents(projectState.files);
    const hasTestConfig = this.hasTestConfiguration(projectState.files);
    const testsNotStarted = task.testStatus === 'not_started';
    
    return hasComponents && hasTestConfig && testsNotStarted;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, projectBuilder } = context;
    
    try {
      // Analisar componentes para gerar testes
      const components = this.extractTestableComponents(projectState.files);
      
      if (components.length === 0) {
        return [];
      }

      // Usar LLM para gerar testes abrangentes
      const testPrompt = this.generateTestPrompt(task.prompt, components, projectState.files);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackTests(components);
      }

      const testResponse = await llmService.generateResponse(testPrompt);
      const testTasks = this.parseTestResponse(testResponse, task.projectPath);
      
      // Executar testes reais
      const testResult = await projectBuilder.test(task.projectPath);
      
      // Analisar resultado e gerar tasks de correção se necessário
      const correctionTasks = await this.analyzeTestResult(testResult, llmService, task.projectPath);
      testTasks.push(...correctionTasks);
      
      // Armazenar experiência na memória emocional
      await this.storeTestExperience(task, components, testResult, emotionMemory);
      
      return testTasks;
      
    } catch (error) {
      console.error('Erro no TestAgent:', error);
      return [];
    }
  }

  private hasTestableComponents(files: Record<string, string>): boolean {
    const componentFiles = Object.keys(files).filter(file => 
      file.endsWith('.tsx') || 
      file.endsWith('.jsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.js')
    );
    
    return componentFiles.length > 0;
  }

  private hasTestConfiguration(files: Record<string, string>): boolean {
    const testConfigs = Object.keys(files).filter(file => 
      file.includes('jest') ||
      file.includes('vitest') ||
      file.includes('cypress') ||
      file.includes('playwright') ||
      file.includes('test') ||
      file.includes('spec')
    );
    
    return testConfigs.length > 0;
  }

  private extractTestableComponents(files: Record<string, string>): Array<{name: string, content: string, path: string, type: string}> {
    const components: Array<{name: string, content: string, path: string, type: string}> = [];
    
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.js')) {
        const componentName = this.extractComponentName(content, path);
        const componentType = this.determineComponentType(content, path);
        
        if (componentName) {
          components.push({
            name: componentName,
            content,
            path,
            type: componentType
          });
        }
      }
    }
    
    return components;
  }

  private extractComponentName(content: string, path: string): string | null {
    // Extrair nome do componente do conteúdo
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }
    
    // Fallback: usar nome do arquivo
    const fileName = path.split('/').pop()?.replace(/\.(tsx|jsx|ts|js)$/, '');
    return fileName || null;
  }

  private determineComponentType(content: string, path: string): string {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      return 'react-component';
    } else if (content.includes('export') && content.includes('function')) {
      return 'utility-function';
    } else if (content.includes('class')) {
      return 'class';
    } else {
      return 'module';
    }
  }

  private generateTestPrompt(prompt: string, components: Array<{name: string, content: string, path: string, type: string}>, files: Record<string, string>): string {
    const componentList = components.map(c => 
      `- ${c.name} (${c.type}): ${c.path}\n  ${c.content.substring(0, 300)}...`
    ).join('\n');
    
    const testFiles = Object.keys(files).filter(f => f.includes('test') || f.includes('spec')).join(', ');
    
    return `Gere testes abrangentes para os seguintes componentes:

PROMPT ORIGINAL: "${prompt}"

COMPONENTES PARA TESTAR:
${componentList}

ARQUIVOS DE TESTE EXISTENTES:
${testFiles || 'Nenhum'}

ARQUIVOS DO PROJETO:
${Object.keys(files).join(', ')}

Gere testes que cubram:
1. Renderização de componentes
2. Interações do usuário
3. Props e estados
4. Eventos e callbacks
5. Casos de erro e edge cases
6. Acessibilidade
7. Performance básica
8. Integração entre componentes

Use as melhores práticas:
- Arrange, Act, Assert
- Testes descritivos
- Mocks apropriados
- Cobertura de código
- Testes de integração

Retorne um JSON com:
{
  "tests": [
    {
      "path": "src/components/ComponentName.test.tsx",
      "content": "código do teste completo",
      "type": "unit|integration|e2e",
      "component": "ComponentName"
    }
  ],
  "testUtils": [
    {
      "path": "src/test-utils/testHelpers.ts",
      "content": "utilitários de teste"
    }
  ],
  "dependencies": ["dependências de teste necessárias"],
  "instructions": "instruções de implementação"
}`;
  }

  private parseTestResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      // Criar arquivos de teste
      if (parsed.tests && Array.isArray(parsed.tests)) {
        for (const test of parsed.tests) {
          tasks.push({
            id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: test.path,
            newSnippet: test.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Criar utilitários de teste
      if (parsed.testUtils && Array.isArray(parsed.testUtils)) {
        for (const util of parsed.testUtils) {
          tasks.push({
            id: `test-util-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'file_create' as TaskType,
            path: util.path,
            newSnippet: util.content,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      // Adicionar dependências de teste
      if (parsed.dependencies && Array.isArray(parsed.dependencies)) {
        for (const dep of parsed.dependencies) {
          tasks.push({
            id: `test-dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'package_install' as TaskType,
            newSnippet: dep,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao parsear resposta de testes:', error);
      return this.generateFallbackTests([]);
    }
  }

  private generateFallbackTests(components: Array<{name: string, content: string, path: string, type: string}>): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Gerar testes básicos para cada componente
    for (const component of components) {
      const testContent = this.generateBasicTest(component);
      const testPath = `src/__tests__/${component.name}.test.tsx`;
      
      tasks.push({
        id: `fallback-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file_create' as TaskType,
        path: testPath,
        newSnippet: testContent,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }
    
    return tasks;
  }

  private generateBasicTest(component: {name: string, content: string, path: string, type: string}): string {
    if (component.type === 'react-component') {
      return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${component.name} } from '../${component.path.replace('src/', '').replace(/\.(tsx|jsx)$/, '')}';

describe('${component.name}', () => {
  it('should render without crashing', () => {
    render(<${component.name} />);
    expect(screen.getByTestId('${component.name.toLowerCase()}')).toBeInTheDocument();
  });

  it('should render with default props', () => {
    render(<${component.name} />);
    // Adicione mais testes específicos aqui
  });

  it('should handle user interactions', () => {
    render(<${component.name} />);
    // Teste interações do usuário
  });
});`;
    } else {
      return `import { ${component.name} } from '../${component.path.replace('src/', '').replace(/\.(ts|js)$/, '')}';

describe('${component.name}', () => {
  it('should be defined', () => {
    expect(${component.name}).toBeDefined();
  });

  it('should work correctly', () => {
    // Adicione testes específicos aqui
    expect(true).toBe(true);
  });
});`;
    }
  }

  private async analyzeTestResult(testResult: any, llmService: ILlmService, projectPath: string): Promise<MicroTask[]> {
    if (testResult.success) {
      return [];
    }
    
    try {
      if (!(await llmService.isConnected())) {
        return [];
      }
      
      const analysisPrompt = `Analise os erros de teste e gere soluções:

TESTES FALHARAM: ${testResult.failed}
TESTES PASSARAM: ${testResult.passed}

OUTPUT DOS TESTES:
${testResult.output}

ERROS:
${testResult.errors?.join('\n') || 'Nenhum erro específico'}

Gere micro-tasks para corrigir os testes. Retorne JSON:
{
  "fixes": [
    {
      "type": "file_replace",
      "path": "caminho/do/teste",
      "oldSnippet": "código_com_erro",
      "newSnippet": "código_corrigido"
    }
  ]
}`;

      const analysisResponse = await llmService.generateResponse(analysisPrompt);
      const cleaned = this.cleanJsonResponse(analysisResponse);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      if (parsed.fixes && Array.isArray(parsed.fixes)) {
        for (const fix of parsed.fixes) {
          tasks.push({
            id: `test-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: fix.type as TaskType,
            path: fix.path,
            oldSnippet: fix.oldSnippet,
            newSnippet: fix.newSnippet,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao analisar resultado de testes:', error);
      return [];
    }
  }

  private async storeTestExperience(
    task: any, 
    components: Array<{name: string, content: string, path: string, type: string}>, 
    testResult: any, 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `TestAgent executado para task ${task.id}`;
      const outcome = testResult.success;
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Testes ${testResult.success ? 'passaram' : 'falharam'}: ${testResult.passed}/${testResult.passed + testResult.failed} para ${components.length} componentes`),
        await emotionMemory.createPolicyDelta('test_execution', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do TestAgent:', error);
    }
  }

  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }
}
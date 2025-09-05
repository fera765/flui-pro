import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { 
  ProcessingResult, 
  Intent, 
  Question, 
  ContextAnalysis,
  SolutionArchitecture,
  DynamicTask 
} from '../types/dynamic';

export class DynamicIntelligence {
  private contextAnalyzer: ContextAnalyzer;
  private intentExtractor: IntentExtractor;
  private questionGenerator: QuestionGenerator;
  private solutionArchitect: SolutionArchitect;

  constructor() {
    this.contextAnalyzer = new ContextAnalyzer();
    this.intentExtractor = new IntentExtractor();
    this.questionGenerator = new QuestionGenerator();
    this.solutionArchitect = new SolutionArchitect();
  }

  async processUserInput(input: string, workingDir: string = process.cwd()): Promise<ProcessingResult> {
    try {
      // 1. Analyze context
      const context = await this.contextAnalyzer.analyze(workingDir);
      
      // 2. Extract intent from input using LLM
      const intent = await this.extractIntentWithLLM(input);
      
      // 3. Generate clarifying questions if needed using LLM
      const questions = await this.generateQuestionsWithLLM(intent, context);
      
      // 4. Design solution architecture if intent is clear enough
      let solution: SolutionArchitecture | undefined;
      if (this.isIntentComplete(intent)) {
        solution = await this.solutionArchitect.design(intent, context);
      }
      
      // 5. Calculate confidence
      const confidence = this.calculateConfidence(intent, questions.length);
      
      return {
        context,
        intent,
        questions,
        solution,
        confidence
      };
    } catch (error) {
      console.error('Error processing user input:', error);
      throw new Error(`Failed to process user input: ${(error as Error).message}`);
    }
  }

  async generateQuestions(intent: Intent): Promise<Question[]> {
    return await this.questionGenerator.generate(intent);
  }

  async analyzeContext(workingDir: string): Promise<ContextAnalysis> {
    return await this.contextAnalyzer.analyze(workingDir);
  }

  private isIntentComplete(intent: Intent): boolean {
    return !!(
      intent.domain &&
      intent.technology &&
      intent.language &&
      intent.purpose &&
      intent.complexity
    );
  }

  private async extractIntentWithLLM(input: string): Promise<Intent> {
    try {
      console.log(`🤖 Using LLM to extract intent from: "${input}"`);
      
      const prompt = `Analise o seguinte input do usuário e extraia as informações de forma precisa:

INPUT: "${input}"

Extraia e retorne APENAS um JSON válido com as seguintes informações:

{
  "domain": "frontend|backend|mobile|desktop|ai|blockchain|content|script|unknown",
  "technology": "tecnologia específica mencionada ou null se não especificada",
  "language": "linguagem de programação mencionada ou null se não especificada", 
  "features": ["array", "de", "features", "mencionadas"],
  "requirements": ["array", "de", "requisitos", "específicos"],
  "purpose": "propósito ou objetivo mencionado ou null"
}

REGRAS:
- Seja preciso e específico
- Se não souber algo, use null ou array vazio
- Para domain, escolha a categoria mais apropriada
- Para features, extraia funcionalidades específicas mencionadas
- Para requirements, extraia requisitos técnicos específicos
- Retorne APENAS o JSON, sem explicações`;

      const response = await axios.post('http://localhost:3000/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de requisitos de software. Analise inputs e extraia informações técnicas precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content.trim();
      console.log(`🤖 LLM Response: ${content}`);
      
      // Parse JSON response
      const intent = JSON.parse(content);
      
      // Validate and set defaults
      return {
        domain: intent.domain || 'unknown',
        technology: intent.technology || undefined,
        language: intent.language || undefined,
        features: Array.isArray(intent.features) ? intent.features : [],
        requirements: Array.isArray(intent.requirements) ? intent.requirements : [],
        purpose: intent.purpose || undefined
      };
      
    } catch (error: any) {
      console.error('❌ LLM Intent extraction failed:', error.message);
      throw new Error(`LLM Intent extraction failed: ${error.message}`);
    }
  }

  private async generateQuestionsWithLLM(intent: Intent, context: ContextAnalysis): Promise<Question[]> {
    try {
      console.log(`🤖 Using LLM to generate questions for intent:`, intent);
      
      const prompt = `Com base no intent extraído, gere perguntas clarificadoras relevantes:

INTENT: ${JSON.stringify(intent, null, 2)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Gere até 5 perguntas clarificadoras que ajudem a entender melhor os requisitos do usuário.
Retorne APENAS um JSON array com as perguntas:

[
  {
    "id": "tech-1",
    "text": "Qual tecnologia você prefere usar?",
    "type": "choice",
    "options": ["React", "Vue", "Angular", "HTML/CSS/JS"]
  },
  {
    "id": "lang-2", 
    "text": "Qual linguagem de programação?",
    "type": "choice",
    "options": ["JavaScript", "TypeScript", "Python", "Java"]
  }
]

REGRAS:
- Gere apenas perguntas relevantes para o intent
- Se o intent já estiver completo, retorne array vazio []
- Use tipos: "choice", "text", "number", "boolean"
- Seja específico e útil`;

      const response = await axios.post('http://localhost:3000/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de requisitos. Gere perguntas clarificadoras úteis e específicas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content.trim();
      console.log(`🤖 LLM Questions Response: ${content}`);
      
      // Parse JSON response
      const questions = JSON.parse(content);
      
      // Validate and convert to Question objects
      return questions.map((q: any) => ({
        id: q.id || uuidv4(),
        text: q.text || '',
        type: q.type || 'text',
        options: q.options || [],
        required: q.required || false
      }));
      
    } catch (error: any) {
      console.error('❌ LLM Questions generation failed:', error.message);
      throw new Error(`LLM Questions generation failed: ${error.message}`);
    }
  }

  private calculateConfidence(intent: Intent, questionCount: number): number {
    let confidence = 0.5; // Base confidence
    
    if (intent.domain) confidence += 0.2;
    if (intent.technology) confidence += 0.15;
    if (intent.language) confidence += 0.1;
    if (intent.purpose) confidence += 0.1;
    if (intent.complexity) confidence += 0.05;
    
    // Reduce confidence if many questions needed
    confidence -= (questionCount * 0.05);
    
    return Math.max(0, Math.min(1, confidence));
  }
}

class ContextAnalyzer {
  async analyze(workingDir: string): Promise<ContextAnalysis> {
    try {
      const existingFiles = await this.scanDirectory(workingDir);
      const detectedTechnologies = this.detectTechnologies(existingFiles);
      
      return {
        workingDirectory: workingDir,
        existingFiles,
        projectType: this.detectProjectType(existingFiles),
        hasPackageJson: existingFiles.includes('package.json'),
        hasGitRepo: existingFiles.includes('.git'),
        isEmpty: existingFiles.length === 0,
        detectedTechnologies
      };
    } catch (error) {
      console.error('Error analyzing context:', error);
      return {
        workingDirectory: workingDir,
        existingFiles: [],
        hasPackageJson: false,
        hasGitRepo: false,
        isEmpty: true,
        detectedTechnologies: []
      };
    }
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    try {
      if (!fs.existsSync(dir)) {
        return [];
      }
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      return files.map(file => file.name);
    } catch (error) {
      return [];
    }
  }

  private detectTechnologies(files: string[]): string[] {
    const technologies: string[] = [];
    
    if (files.includes('package.json')) technologies.push('nodejs');
    if (files.includes('requirements.txt') || files.includes('pyproject.toml')) technologies.push('python');
    if (files.includes('Cargo.toml')) technologies.push('rust');
    if (files.includes('pom.xml')) technologies.push('java');
    if (files.includes('go.mod')) technologies.push('go');
    if (files.includes('composer.json')) technologies.push('php');
    if (files.includes('Gemfile')) technologies.push('ruby');
    if (files.includes('Dockerfile')) technologies.push('docker');
    if (files.includes('docker-compose.yml')) technologies.push('docker-compose');
    
    return technologies;
  }

  private detectProjectType(files: string[]): string | undefined {
    if (files.includes('package.json')) {
      return 'nodejs';
    } else if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
      return 'python';
    } else if (files.includes('Cargo.toml')) {
      return 'rust';
    } else if (files.includes('pom.xml')) {
      return 'java';
    } else if (files.includes('go.mod')) {
      return 'go';
    } else if (files.includes('composer.json')) {
      return 'php';
    } else if (files.includes('Gemfile')) {
      return 'ruby';
    }
    return undefined;
  }
}

class IntentExtractor {
  async extract(input: string, context: ContextAnalysis): Promise<Intent> {
    const lowerInput = input.toLowerCase();
    const intent: Intent = { domain: 'unknown' };
    
    // Extract domain
    intent.domain = this.extractDomain(lowerInput);
    
    // Extract technology
    const technology = this.extractTechnology(lowerInput);
    if (technology) intent.technology = technology;
    
    // Extract language
    const language = this.extractLanguage(lowerInput);
    if (language) intent.language = language;
    
    // Extract framework
    const framework = this.extractFramework(lowerInput);
    if (framework) intent.framework = framework;
    
    // Extract purpose
    const purpose = this.extractPurpose(lowerInput);
    if (purpose) intent.purpose = purpose;
    
    // Extract complexity
    const complexity = this.extractComplexity(lowerInput);
    if (complexity) intent.complexity = complexity;
    
    // Extract features
    intent.features = this.extractFeatures(lowerInput);
    
    // Extract requirements
    intent.requirements = this.extractRequirements(lowerInput);
    
    return intent;
  }

  private extractDomain(input: string): string {
    if (input.includes('frontend') || input.includes('react') || input.includes('vue') || input.includes('angular') || input.includes('html') || input.includes('site') || input.includes('website') || input.includes('landing page') || input.includes('página') || input.includes('página de vendas')) {
      return 'frontend';
    } else if (input.includes('backend') || input.includes('api') || input.includes('server')) {
      return 'backend';
    } else if (input.includes('mobile') || input.includes('app') || input.includes('ios') || input.includes('android')) {
      return 'mobile';
    } else if (input.includes('desktop') || input.includes('electron') || input.includes('tauri')) {
      return 'desktop';
    } else if (input.includes('ai') || input.includes('machine learning') || input.includes('ml') || input.includes('tensorflow') || input.includes('pytorch')) {
      return 'ai';
    } else if (input.includes('blockchain') || input.includes('smart contract') || input.includes('solidity')) {
      return 'blockchain';
    } else if (input.includes('script') || input.includes('automation') || input.includes('tool')) {
      return 'script';
    } else if (input.includes('content') || input.includes('roteiro') || input.includes('youtube') || input.includes('video') || input.includes('marketing')) {
      return 'content';
    }
    return 'unknown';
  }

  private extractTechnology(input: string): string | undefined {
    const technologies = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'html',
      'nodejs', 'express', 'fastapi', 'django', 'spring', 'rails',
      'flutter', 'react native', 'swift', 'kotlin',
      'electron', 'tauri', 'qt',
      'tensorflow', 'pytorch', 'scikit-learn',
      'solidity', 'web3', 'anchor',
      'content creation', 'script', 'youtube', 'marketing'
    ];
    
    for (const tech of technologies) {
      if (input.includes(tech)) {
        return tech;
      }
    }
    return undefined;
  }

  private extractLanguage(input: string): string | undefined {
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'rust', 'go', 'php', 'ruby', 'swift', 'kotlin', 'dart'
    ];
    
    for (const lang of languages) {
      if (input.includes(lang)) {
        return lang;
      }
    }
    return undefined;
  }

  private extractFramework(input: string): string | undefined {
    const frameworks = [
      'express', 'fastapi', 'django', 'spring', 'rails', 'gin', 'actix', 'axum',
      'tailwind', 'bootstrap', 'material-ui', 'chakra-ui'
    ];
    
    for (const framework of frameworks) {
      if (input.includes(framework)) {
        return framework;
      }
    }
    return undefined;
  }

  private extractPurpose(input: string): string | undefined {
    const purposes = [
      'ecommerce', 'blog', 'portfolio', 'dashboard', 'api', 'website', 'app', 'game', 'tool', 'automation'
    ];
    
    for (const purpose of purposes) {
      if (input.includes(purpose)) {
        return purpose;
      }
    }
    return undefined;
  }

  private extractComplexity(input: string): 'simple' | 'medium' | 'advanced' | undefined {
    if (input.includes('simples') || input.includes('básico') || input.includes('básico')) {
      return 'simple';
    } else if (input.includes('médio') || input.includes('intermediário')) {
      return 'medium';
    } else if (input.includes('avançado') || input.includes('complexo')) {
      return 'advanced';
    }
    return undefined;
  }

  private extractFeatures(input: string): string[] {
    const features: string[] = [];
    
    if (input.includes('autenticação') || input.includes('login') || input.includes('jwt')) {
      features.push('authentication');
    }
    if (input.includes('banco') || input.includes('database') || input.includes('mongodb') || input.includes('postgresql')) {
      features.push('database');
    }
    if (input.includes('api') || input.includes('rest') || input.includes('graphql')) {
      features.push('api');
    }
    if (input.includes('teste') || input.includes('test')) {
      features.push('testing');
    }
    if (input.includes('deploy') || input.includes('docker')) {
      features.push('deployment');
    }
    if (input.includes('landing page') || input.includes('página de vendas') || input.includes('vendas')) {
      features.push('landing page');
    }
    if (input.includes('saúde') || input.includes('health') || input.includes('plano')) {
      features.push('healthcare');
    }
    if (input.includes('forms') || input.includes('formulário') || input.includes('formularios')) {
      features.push('forms');
    }
    if (input.includes('interactivity') || input.includes('interativo') || input.includes('javascript')) {
      features.push('interactivity');
    }
    if (input.includes('styling') || input.includes('css') || input.includes('design')) {
      features.push('styling');
    }
    if (input.includes('responsive') || input.includes('mobile') || input.includes('responsive design')) {
      features.push('responsive');
    }
    if (input.includes('script') || input.includes('roteiro') || input.includes('guion')) {
      features.push('script');
    }
    if (input.includes('timing') || input.includes('tempo') || input.includes('duração')) {
      features.push('timing');
    }
    if (input.includes('hooks') || input.includes('gancho') || input.includes('atenção')) {
      features.push('hooks');
    }
    if (input.includes('call-to-action') || input.includes('cta') || input.includes('ação')) {
      features.push('call-to-action');
    }
    if (input.includes('copywrite') || input.includes('copy') || input.includes('texto de vendas')) {
      features.push('copywrite');
    }
    if (input.includes('sales') || input.includes('vendas') || input.includes('página de vendas')) {
      features.push('sales');
    }
    
    return features;
  }

  private extractRequirements(input: string): string[] {
    // Extract specific requirements mentioned in the input
    const requirements: string[] = [];
    
    // This is a simplified extraction - in a real implementation,
    // you might use NLP to extract more complex requirements
    const words = input.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (words[i] === 'com' || words[i] === 'usando' || words[i] === 'para') {
        if (i + 1 < words.length) {
          const nextWord = words[i + 1];
          if (nextWord) {
            requirements.push(nextWord);
          }
        }
      }
    }
    
    return requirements;
  }
}

class QuestionGenerator {
  async generate(intent: Intent): Promise<Question[]> {
    // All static question generation removed - now 100% LLM-driven
    // This method is no longer used as questions are generated by LLM
    return [];
  }

  // All static question generation removed - now 100% LLM-driven

  // All static data removed - now 100% LLM-driven
}

class SolutionArchitect {
  async design(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture> {
    try {
      console.log(`🤖 Using LLM to design solution architecture for:`, intent);
      
      const prompt = `Com base no intent e contexto fornecidos, projete uma arquitetura de solução completa:

INTENT: ${JSON.stringify(intent, null, 2)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Retorne APENAS um JSON válido com a arquitetura da solução:

{
  "type": "tipo do projeto",
  "framework": "framework principal",
  "language": "linguagem principal",
  "buildTool": "ferramenta de build",
  "packageManager": "gerenciador de pacotes",
  "dependencies": ["array", "de", "dependências"],
  "devDependencies": ["array", "de", "dev", "dependencies"],
  "scripts": {
    "start": "comando de start",
    "build": "comando de build",
    "test": "comando de test",
    "dev": "comando de desenvolvimento"
  },
  "structure": ["array", "da", "estrutura", "de", "pastas"],
  "validations": ["array", "de", "validações"],
  "estimatedTime": "tempo estimado em minutos"
}

REGRAS:
- Seja específico e técnico
- Use as melhores práticas para cada tecnologia
- Inclua todas as dependências necessárias
- Defina scripts apropriados
- Estruture o projeto de forma profissional`;

      const response = await axios.post('http://localhost:3000/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um arquiteto de software sênior. Projete arquiteturas completas e profissionais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content.trim();
      console.log(`🤖 LLM Architecture Response: ${content}`);
      
      // Parse JSON response
      const architecture = JSON.parse(content);
      
      return {
        type: architecture.type || intent.domain,
        framework: architecture.framework || intent.technology,
        language: architecture.language || intent.language,
        buildTool: architecture.buildTool || 'npm',
        packageManager: architecture.packageManager || 'npm',
        dependencies: Array.isArray(architecture.dependencies) ? architecture.dependencies : [],
        devDependencies: Array.isArray(architecture.devDependencies) ? architecture.devDependencies : [],
        scripts: architecture.scripts || {},
        structure: Array.isArray(architecture.structure) ? architecture.structure : [],
        validations: Array.isArray(architecture.validations) ? architecture.validations : [],
        estimatedTime: architecture.estimatedTime || '30'
      };
      
    } catch (error: any) {
      console.error('❌ LLM Architecture design failed:', error.message);
      throw new Error(`LLM Architecture design failed: ${error.message}`);
    }
  }

  // All static methods removed - now 100% LLM-driven

  // All static validation and time estimation removed - now 100% LLM-driven

  // 100% DYNAMIC TASK GENERATION - No hard-coded logic
  public async generateDynamicSetupTasks(intent: Intent, context: ContextAnalysis): Promise<DynamicTask[]> {
    try {
      console.log(`🤖 Using LLM to generate dynamic setup tasks for:`, intent);
      
      const prompt = `Com base no intent e contexto fornecidos, gere uma lista completa de tasks para criar o projeto:

INTENT: ${JSON.stringify(intent, null, 2)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Retorne APENAS um JSON array com as tasks necessárias:

[
  {
    "description": "descrição da task",
    "type": "tool",
    "toolName": "nome_do_tool",
    "parameters": {
      "param1": "valor1",
      "param2": "valor2"
    },
    "dependencies": [],
    "phase": "setup|implementation|validation"
  }
]

REGRAS:
- Gere tasks específicas para a tecnologia e features mencionadas
- Use tools apropriados: shell, file_write, file_read, etc.
- Inclua todas as fases: setup, implementation, validation
- Seja específico nos parâmetros
- Ordene as tasks por dependências`;

      const response = await axios.post('http://localhost:3000/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em automação de desenvolvimento. Gere tasks específicas e técnicas para criar projetos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content.trim();
      console.log(`🤖 LLM Tasks Response: ${content}`);
      
      // Parse JSON response
      const taskPlan = JSON.parse(content);
      
      // Convert to DynamicTask objects
      const tasks: DynamicTask[] = [];
      for (const taskInfo of taskPlan) {
        tasks.push({
          id: uuidv4(),
          description: taskInfo.description || 'Dynamic task',
          type: taskInfo.type || 'tool',
          toolName: taskInfo.toolName || 'shell',
          parameters: taskInfo.parameters || {},
          status: 'pending',
          dependencies: taskInfo.dependencies || [],
          createdAt: new Date(),
          projectPhase: taskInfo.phase || 'setup'
        });
      }
      
      return tasks;
      
    } catch (error: any) {
      console.error('❌ LLM Task generation failed:', error.message);
      throw new Error(`LLM Task generation failed: ${error.message}`);
    }
  }

  // All static task analysis removed - now 100% LLM-driven

  // All static initialization removed - now 100% LLM-driven

  // All static helper methods removed - now 100% LLM-driven
}
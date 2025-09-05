import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { 
  ProcessingResult, 
  Intent, 
  Question, 
  ContextAnalysis,
  SolutionArchitecture 
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
      
      // 2. Extract intent from input
      const intent = await this.intentExtractor.extract(input, context);
      
      // 3. Generate clarifying questions if needed
      const questions = await this.questionGenerator.generate(intent);
      
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
    if (input.includes('frontend') || input.includes('react') || input.includes('vue') || input.includes('angular') || input.includes('html') || input.includes('site') || input.includes('website')) {
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
      'solidity', 'web3', 'anchor'
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
    const questions: Question[] = [];
    
    // Generate questions based on missing information
    if (!intent.technology) {
      questions.push(this.generateTechnologyQuestion(intent.domain));
    }
    
    if (!intent.language) {
      questions.push(this.generateLanguageQuestion(intent.domain));
    }
    
    if (!intent.purpose) {
      questions.push(this.generatePurposeQuestion(intent.domain));
    }
    
    if (!intent.complexity) {
      questions.push(this.generateComplexityQuestion());
    }
    
    if (!intent.features || intent.features.length === 0) {
      questions.push(this.generateFeaturesQuestion(intent.domain));
    }
    
    // Limit to 5 questions maximum
    return questions.slice(0, 5);
  }

  private generateTechnologyQuestion(domain: string): Question {
    const options = this.getTechnologyOptions(domain);
    
    return {
      id: uuidv4(),
      text: `Qual tecnologia você prefere para ${domain}?`,
      type: 'choice',
      options,
      required: true,
      context: 'technology_selection'
    };
  }

  private generateLanguageQuestion(domain: string): Question {
    const options = this.getLanguageOptions(domain);
    
    return {
      id: uuidv4(),
      text: `Qual linguagem de programação você prefere?`,
      type: 'choice',
      options,
      required: true,
      context: 'language_selection'
    };
  }

  private generatePurposeQuestion(domain: string): Question {
    return {
      id: uuidv4(),
      text: `Para que será usado este ${domain}? (empresa, pessoal, estudo, etc.)`,
      type: 'text',
      required: true,
      context: 'purpose_clarification'
    };
  }

  private generateComplexityQuestion(): Question {
    return {
      id: uuidv4(),
      text: `Qual o nível de complexidade?`,
      type: 'choice',
      options: ['Simples', 'Médio', 'Avançado'],
      required: true,
      context: 'complexity_selection'
    };
  }

  private generateFeaturesQuestion(domain: string): Question {
    const options = this.getFeatureOptions(domain);
    
    return {
      id: uuidv4(),
      text: `Quais funcionalidades você precisa?`,
      type: 'choice',
      options,
      required: false,
      context: 'features_selection'
    };
  }

  private getTechnologyOptions(domain: string): string[] {
    switch (domain) {
      case 'frontend':
        return ['React', 'Vue', 'Angular', 'Svelte', 'HTML/CSS/JS', 'Next.js', 'Nuxt'];
      case 'backend':
        return ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'];
      case 'mobile':
        return ['React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)', 'Ionic'];
      case 'desktop':
        return ['Electron', 'Tauri', 'Qt', 'WPF', 'GTK'];
      case 'ai':
        return ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging Face', 'OpenAI'];
      case 'blockchain':
        return ['Solidity', 'Rust (Solana)', 'Move (Aptos)', 'Web3.js'];
      default:
        return ['React', 'Node.js', 'Python', 'Java', 'Go'];
    }
  }

  private getLanguageOptions(domain: string): string[] {
    switch (domain) {
      case 'frontend':
        return ['JavaScript', 'TypeScript', 'Dart'];
      case 'backend':
        return ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'];
      case 'mobile':
        return ['JavaScript', 'TypeScript', 'Dart', 'Swift', 'Kotlin'];
      case 'desktop':
        return ['JavaScript', 'TypeScript', 'C++', 'C#', 'Rust', 'Python'];
      case 'ai':
        return ['Python', 'R', 'Julia', 'JavaScript'];
      case 'blockchain':
        return ['Solidity', 'Rust', 'Move', 'JavaScript', 'Python'];
      default:
        return ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'];
    }
  }

  private getFeatureOptions(domain: string): string[] {
    switch (domain) {
      case 'frontend':
        return ['Autenticação', 'Roteamento', 'Estado Global', 'Testes', 'PWA', 'SEO'];
      case 'backend':
        return ['Autenticação JWT', 'Banco de Dados', 'API REST', 'GraphQL', 'Testes', 'Docker'];
      case 'mobile':
        return ['Autenticação', 'Navegação', 'Notificações', 'Câmera', 'GPS', 'Testes'];
      case 'desktop':
        return ['Menu', 'Janelas', 'Sistema de Arquivos', 'Notificações', 'Auto-update'];
      case 'ai':
        return ['Treinamento', 'Inferência', 'Visualização', 'API', 'Modelo Pré-treinado'];
      case 'blockchain':
        return ['Smart Contracts', 'DeFi', 'NFTs', 'DAO', 'Web3 Integration'];
      default:
        return ['Autenticação', 'Banco de Dados', 'API', 'Testes', 'Documentação'];
    }
  }
}

class SolutionArchitect {
  async design(intent: Intent, context: ContextAnalysis): Promise<SolutionArchitecture> {
    // This is a simplified implementation
    // In a real scenario, this would be much more sophisticated
    return {
      type: intent.domain,
      framework: intent.technology || 'default',
      language: intent.language || 'javascript',
      buildTool: this.getBuildTool(intent),
      packageManager: this.getPackageManager(intent),
      dependencies: this.getDependencies(intent),
      devDependencies: this.getDevDependencies(intent),
      scripts: this.getScripts(intent),
      structure: this.getProjectStructure(intent),
      validations: this.getValidations(intent),
      estimatedTime: this.getEstimatedTime(intent)
    };
  }

  private getBuildTool(intent: Intent): string {
    if (intent.technology === 'react' || intent.technology === 'vue') {
      return 'vite';
    } else if (intent.technology === 'angular') {
      return 'angular-cli';
    } else if (intent.language === 'rust') {
      return 'cargo';
    } else if (intent.language === 'java') {
      return 'maven';
    } else if (intent.language === 'go') {
      return 'go';
    }
    return 'npm';
  }

  private getPackageManager(intent: Intent): string {
    if (intent.language === 'python') {
      return 'pip';
    } else if (intent.language === 'rust') {
      return 'cargo';
    } else if (intent.language === 'java') {
      return 'maven';
    } else if (intent.language === 'go') {
      return 'go';
    } else if (intent.language === 'php') {
      return 'composer';
    } else if (intent.language === 'ruby') {
      return 'bundler';
    }
    return 'npm';
  }

  private getDependencies(intent: Intent): string[] {
    const deps: string[] = [];
    
    if (intent.technology === 'react') {
      deps.push('react', 'react-dom');
    } else if (intent.technology === 'vue') {
      deps.push('vue');
    } else if (intent.technology === 'express') {
      deps.push('express');
    } else if (intent.technology === 'fastapi') {
      deps.push('fastapi');
    }
    
    if (intent.features?.includes('authentication')) {
      deps.push('jsonwebtoken', 'bcrypt');
    }
    
    if (intent.features?.includes('database')) {
      deps.push('mongoose', 'mongodb');
    }
    
    return deps;
  }

  private getDevDependencies(intent: Intent): string[] {
    const deps: string[] = [];
    
    if (intent.language === 'typescript') {
      deps.push('typescript', '@types/node');
    }
    
    if (intent.technology === 'react') {
      deps.push('@types/react', '@types/react-dom');
    }
    
    if (intent.features?.includes('testing')) {
      deps.push('jest', '@testing-library/react');
    }
    
    return deps;
  }

  private getScripts(intent: Intent): Record<string, string> {
    const scripts: Record<string, string> = {};
    
    if (intent.domain === 'frontend') {
      scripts.start = 'npm start';
      scripts.build = 'npm run build';
      scripts.test = 'npm test';
    } else if (intent.domain === 'backend') {
      scripts.start = 'node server.js';
      scripts.dev = 'nodemon server.js';
      scripts.test = 'jest';
    }
    
    return scripts;
  }

  private getProjectStructure(intent: Intent): any {
    // Simplified project structure
    return {
      directories: ['src', 'public', 'tests'],
      files: [],
      entryPoint: 'src/index.js',
      configFiles: ['package.json']
    };
  }

  private getValidations(intent: Intent): any[] {
    return [
      {
        name: 'Build',
        command: 'npm run build',
        timeout: 60000,
        retries: 3
      },
      {
        name: 'Test',
        command: 'npm test',
        timeout: 30000,
        retries: 2
      }
    ];
  }

  private getEstimatedTime(intent: Intent): number {
    let time = 10; // Base time in minutes
    
    if (intent.complexity === 'simple') time += 5;
    else if (intent.complexity === 'medium') time += 15;
    else if (intent.complexity === 'advanced') time += 30;
    
    if (intent.features?.includes('authentication')) time += 10;
    if (intent.features?.includes('database')) time += 15;
    if (intent.features?.includes('api')) time += 20;
    
    return time;
  }
}
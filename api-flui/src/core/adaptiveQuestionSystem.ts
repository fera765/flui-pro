import { v4 as uuidv4 } from 'uuid';
import { Intent, Question, ConversationContext } from '../types/dynamic';

export class AdaptiveQuestionSystem {
  async generateClarifyingQuestions(intent: Intent): Promise<Question[]> {
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

  async processUserAnswers(intent: Intent, answers: Record<string, any>): Promise<Intent> {
    const updatedIntent = { ...intent };
    
    // Process each answer
    for (const [questionId, answer] of Object.entries(answers)) {
      if (answer) {
        // Map question IDs to intent properties
        if (questionId.includes('technology')) {
          updatedIntent.technology = this.normalizeTechnology(answer);
        } else if (questionId.includes('language')) {
          updatedIntent.language = this.normalizeLanguage(answer);
        } else if (questionId.includes('purpose')) {
          updatedIntent.purpose = this.normalizePurpose(answer);
        } else if (questionId.includes('complexity')) {
          updatedIntent.complexity = this.normalizeComplexity(answer);
        } else if (questionId.includes('features')) {
          updatedIntent.features = Array.isArray(answer) ? answer : [answer];
        }
      }
    }
    
    return updatedIntent;
  }

  async generateFollowUpQuestions(context: ConversationContext): Promise<Question[]> {
    const questions: Question[] = [];
    
    // Analyze conversation history to determine if follow-up questions are needed
    const lastUserMessage = context.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      return questions;
    }
    
    const content = lastUserMessage.content.toLowerCase();
    
    // Check if user provided incomplete information
    if (content.includes('crie') && !content.includes('com')) {
      questions.push({
        id: uuidv4(),
        text: 'Que tipo de projeto você quer criar?',
        type: 'choice',
        options: ['Frontend', 'Backend', 'Mobile', 'Desktop', 'AI/ML', 'Blockchain'],
        required: true,
        context: 'project_type'
      });
    }
    
    if (content.includes('frontend') && !content.includes('react') && !content.includes('vue') && !content.includes('angular')) {
      questions.push({
        id: uuidv4(),
        text: 'Qual framework frontend você prefere?',
        type: 'choice',
        options: ['React', 'Vue', 'Angular', 'Svelte', 'HTML/CSS/JS'],
        required: true,
        context: 'frontend_framework'
      });
    }
    
    if (content.includes('backend') && !content.includes('node') && !content.includes('python') && !content.includes('java')) {
      questions.push({
        id: uuidv4(),
        text: 'Qual linguagem para o backend?',
        type: 'choice',
        options: ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust'],
        required: true,
        context: 'backend_language'
      });
    }
    
    return questions;
  }

  async suggestTechnologies(domain: string): Promise<string[]> {
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
        return ['Solidity', 'Web3.js', 'Rust (Solana)', 'Move (Aptos)', 'Anchor'];
      default:
        return ['React', 'Node.js', 'Python', 'Java', 'Go'];
    }
  }

  async validateAnswers(questions: Question[], answers: Record<string, any>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (const question of questions) {
      const answer = answers[question.id];
      
      // Check required questions
      if (question.required && (!answer || answer === '')) {
        errors.push(`Pergunta "${question.text}" é obrigatória`);
        continue;
      }
      
      // Skip validation if no answer provided
      if (!answer) continue;
      
      // Validate based on question type
      switch (question.type) {
        case 'choice':
          if (question.options && !question.options.includes(answer)) {
            errors.push(`Resposta inválida para "${question.text}"`);
          }
          break;
          
        case 'text':
          if (typeof answer !== 'string' || answer.trim() === '') {
            errors.push(`Resposta inválida para "${question.text}"`);
          }
          break;
          
        case 'boolean':
          if (typeof answer !== 'boolean' && answer !== 'true' && answer !== 'false') {
            errors.push(`Resposta inválida para "${question.text}"`);
          }
          break;
          
        case 'number':
          if (isNaN(Number(answer))) {
            errors.push(`Resposta inválida para "${question.text}"`);
          }
          break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
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
        return ['Solidity', 'Web3.js', 'Rust (Solana)', 'Move (Aptos)', 'Anchor'];
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

  private normalizeTechnology(technology: string): string {
    const techMap: Record<string, string> = {
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'svelte': 'svelte',
      'next.js': 'nextjs',
      'nuxt': 'nuxt',
      'node.js': 'nodejs',
      'nodejs': 'nodejs',
      'python': 'python',
      'java': 'java',
      'c#': 'csharp',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'react native': 'react-native',
      'flutter': 'flutter',
      'ios': 'ios',
      'android': 'android',
      'ionic': 'ionic',
      'electron': 'electron',
      'tauri': 'tauri',
      'qt': 'qt',
      'wpf': 'wpf',
      'gtk': 'gtk',
      'tensorflow': 'tensorflow',
      'pytorch': 'pytorch',
      'scikit-learn': 'scikit-learn',
      'hugging face': 'hugging-face',
      'openai': 'openai',
      'solidity': 'solidity',
      'web3.js': 'web3',
      'web3': 'web3',
      'solana': 'solana',
      'aptos': 'aptos',
      'anchor': 'anchor'
    };
    
    return techMap[technology.toLowerCase()] || technology.toLowerCase();
  }

  private normalizeLanguage(language: string): string {
    const langMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'c#': 'csharp',
      'csharp': 'csharp',
      'c++': 'cpp',
      'cpp': 'cpp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'dart': 'dart',
      'r': 'r',
      'julia': 'julia',
      'solidity': 'solidity',
      'move': 'move'
    };
    
    return langMap[language.toLowerCase()] || language.toLowerCase();
  }

  private normalizePurpose(purpose: string): string {
    const purposeMap: Record<string, string> = {
      'ecommerce': 'ecommerce',
      'e-commerce': 'ecommerce',
      'loja online': 'ecommerce',
      'blog': 'blog',
      'portfolio': 'portfolio',
      'dashboard': 'dashboard',
      'api': 'api',
      'website': 'website',
      'site': 'website',
      'app': 'app',
      'aplicativo': 'app',
      'game': 'game',
      'jogo': 'game',
      'tool': 'tool',
      'ferramenta': 'tool',
      'automation': 'automation',
      'automação': 'automation'
    };
    
    return purposeMap[purpose.toLowerCase()] || purpose.toLowerCase();
  }

  private normalizeComplexity(complexity: string): 'simple' | 'medium' | 'advanced' {
    const complexityMap: Record<string, 'simple' | 'medium' | 'advanced'> = {
      'simples': 'simple',
      'básico': 'simple',
      'médio': 'medium',
      'intermediário': 'medium',
      'avançado': 'advanced',
      'complexo': 'advanced'
    };
    
    return complexityMap[complexity.toLowerCase()] || 'medium';
  }
}
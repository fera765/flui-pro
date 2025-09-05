import { AdaptiveQuestionSystem } from '../adaptiveQuestionSystem';
import { Intent, Question, ConversationContext } from '../../types/dynamic';

describe('AdaptiveQuestionSystem', () => {
  let questionSystem: AdaptiveQuestionSystem;

  beforeEach(() => {
    questionSystem = new AdaptiveQuestionSystem();
  });

  describe('generateClarifyingQuestions', () => {
    it('should generate technology questions for frontend', async () => {
      const intent: Intent = { domain: 'frontend' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('tecnologia');
      expect(questions[0].options).toContain('React');
      expect(questions[0].options).toContain('Vue');
      expect(questions[0].options).toContain('Angular');
    });

    it('should generate language questions for backend', async () => {
      const intent: Intent = { domain: 'backend' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('linguagem');
      expect(questions[0].options).toContain('Node.js');
      expect(questions[0].options).toContain('Python');
      expect(questions[0].options).toContain('Java');
    });

    it('should generate platform questions for mobile', async () => {
      const intent: Intent = { domain: 'mobile' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('plataforma');
      expect(questions[0].options).toContain('React Native');
      expect(questions[0].options).toContain('Flutter');
      expect(questions[0].options).toContain('iOS');
    });

    it('should generate fewer questions when intent is specific', async () => {
      const intent: Intent = { 
        domain: 'frontend', 
        technology: 'react', 
        language: 'typescript',
        purpose: 'ecommerce'
      };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions.length).toBeLessThan(5);
      expect(questions[0].text).toContain('complexidade');
    });

    it('should generate AI-specific questions', async () => {
      const intent: Intent = { domain: 'ai' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('framework');
      expect(questions[0].options).toContain('TensorFlow');
      expect(questions[0].options).toContain('PyTorch');
    });

    it('should generate blockchain-specific questions', async () => {
      const intent: Intent = { domain: 'blockchain' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('blockchain');
      expect(questions[0].options).toContain('Ethereum');
      expect(questions[0].options).toContain('Solana');
    });

    it('should limit questions to maximum 5', async () => {
      const intent: Intent = { domain: 'unknown' };
      
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      
      expect(questions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('processUserAnswers', () => {
    it('should update intent with user answers', async () => {
      const intent: Intent = { domain: 'frontend' };
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      const answers = {
        [questions[0].id]: 'React',
        [questions[1].id]: 'TypeScript',
        [questions[2].id]: 'ecommerce',
        [questions[3].id]: 'medium',
        [questions[4].id]: ['authentication', 'routing']
      };
      
      const updatedIntent = await questionSystem.processUserAnswers(intent, answers);
      
      expect(updatedIntent.technology).toBe('react');
      expect(updatedIntent.language).toBe('typescript');
      expect(updatedIntent.purpose).toBe('ecommerce');
      expect(updatedIntent.complexity).toBe('medium');
      expect(updatedIntent.features).toContain('authentication');
      expect(updatedIntent.features).toContain('routing');
    });

    it('should handle partial answers', async () => {
      const intent: Intent = { domain: 'backend' };
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      const answers = {
        [questions[0].id]: 'Node.js',
        [questions[1].id]: 'JavaScript'
      };
      
      const updatedIntent = await questionSystem.processUserAnswers(intent, answers);
      
      expect(updatedIntent.technology).toBe('nodejs');
      expect(updatedIntent.language).toBe('javascript');
      expect(updatedIntent.purpose).toBeUndefined();
      expect(updatedIntent.complexity).toBeUndefined();
    });

    it('should handle empty answers', async () => {
      const intent: Intent = { domain: 'frontend' };
      const questions: Question[] = await questionSystem.generateClarifyingQuestions(intent);
      const answers = {};
      
      const updatedIntent = await questionSystem.processUserAnswers(intent, answers);
      
      expect(updatedIntent.technology).toBeUndefined();
      expect(updatedIntent.language).toBeUndefined();
      expect(updatedIntent.purpose).toBeUndefined();
    });
  });

  describe('generateFollowUpQuestions', () => {
    it('should generate follow-up questions based on context', async () => {
      const context: ConversationContext = {
        userId: 'user123',
        sessionId: 'session456',
        conversationHistory: [
          {
            id: '1',
            role: 'user',
            content: 'Crie um frontend React',
            timestamp: new Date()
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Vou criar um frontend React! Algumas perguntas...',
            timestamp: new Date()
          }
        ],
        pendingQuestions: [],
        userPreferences: {}
      };
      
      const followUpQuestions = await questionSystem.generateFollowUpQuestions(context);
      
      expect(followUpQuestions).toBeDefined();
      expect(followUpQuestions.length).toBeGreaterThan(0);
    });

    it('should not generate follow-up questions if context is complete', async () => {
      const context: ConversationContext = {
        userId: 'user123',
        sessionId: 'session456',
        conversationHistory: [
          {
            id: '1',
            role: 'user',
            content: 'Crie um frontend React com TypeScript para e-commerce',
            timestamp: new Date()
          }
        ],
        pendingQuestions: [],
        userPreferences: {}
      };
      
      const followUpQuestions = await questionSystem.generateFollowUpQuestions(context);
      
      expect(followUpQuestions).toHaveLength(0);
    });
  });

  describe('suggestTechnologies', () => {
    it('should suggest appropriate technologies for frontend', async () => {
      const suggestions = await questionSystem.suggestTechnologies('frontend');
      
      expect(suggestions).toContain('React');
      expect(suggestions).toContain('Vue');
      expect(suggestions).toContain('Angular');
      expect(suggestions).toContain('Svelte');
    });

    it('should suggest appropriate technologies for backend', async () => {
      const suggestions = await questionSystem.suggestTechnologies('backend');
      
      expect(suggestions).toContain('Node.js');
      expect(suggestions).toContain('Python');
      expect(suggestions).toContain('Java');
      expect(suggestions).toContain('Go');
    });

    it('should suggest appropriate technologies for mobile', async () => {
      const suggestions = await questionSystem.suggestTechnologies('mobile');
      
      expect(suggestions).toContain('React Native');
      expect(suggestions).toContain('Flutter');
      expect(suggestions).toContain('iOS');
      expect(suggestions).toContain('Android');
    });

    it('should suggest appropriate technologies for AI', async () => {
      const suggestions = await questionSystem.suggestTechnologies('ai');
      
      expect(suggestions).toContain('TensorFlow');
      expect(suggestions).toContain('PyTorch');
      expect(suggestions).toContain('Scikit-learn');
      expect(suggestions).toContain('Hugging Face');
    });

    it('should suggest appropriate technologies for blockchain', async () => {
      const suggestions = await questionSystem.suggestTechnologies('blockchain');
      
      expect(suggestions).toContain('Solidity');
      expect(suggestions).toContain('Web3.js');
      expect(suggestions).toContain('Rust');
      expect(suggestions).toContain('Move');
    });
  });

  describe('validateAnswers', () => {
    it('should validate required answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Qual tecnologia?',
          type: 'choice',
          options: ['React', 'Vue'],
          required: true
        },
        {
          id: '2',
          text: 'Qual linguagem?',
          type: 'choice',
          options: ['JavaScript', 'TypeScript'],
          required: true
        }
      ];
      
      const answers = {
        '1': 'React'
        // Missing answer for question 2
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Pergunta "Qual linguagem?" é obrigatória');
    });

    it('should validate choice answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Qual tecnologia?',
          type: 'choice',
          options: ['React', 'Vue'],
          required: true
        }
      ];
      
      const answers = {
        '1': 'Angular' // Invalid choice
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Resposta inválida para "Qual tecnologia?"');
    });

    it('should validate text answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Descreva o projeto',
          type: 'text',
          required: true
        }
      ];
      
      const answers = {
        '1': '' // Empty text
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Pergunta "Descreva o projeto" é obrigatória');
    });

    it('should validate boolean answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Precisa de autenticação?',
          type: 'boolean',
          required: true
        }
      ];
      
      const answers = {
        '1': 'maybe' // Invalid boolean
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Resposta inválida para "Precisa de autenticação?"');
    });

    it('should validate number answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Quantos usuários?',
          type: 'number',
          required: true
        }
      ];
      
      const answers = {
        '1': 'not-a-number' // Invalid number
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Resposta inválida para "Quantos usuários?"');
    });

    it('should return valid for correct answers', async () => {
      const questions: Question[] = [
        {
          id: '1',
          text: 'Qual tecnologia?',
          type: 'choice',
          options: ['React', 'Vue'],
          required: true
        },
        {
          id: '2',
          text: 'Descreva o projeto',
          type: 'text',
          required: true
        }
      ];
      
      const answers = {
        '1': 'React',
        '2': 'E-commerce com React'
      };
      
      const validation = await questionSystem.validateAnswers(questions, answers);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
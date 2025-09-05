import { DynamicIntelligence } from '../dynamicIntelligence';
import { ProcessingResult, Intent, Question } from '../../types/dynamic';

describe('DynamicIntelligence', () => {
  let dynamicIntelligence: DynamicIntelligence;

  beforeEach(() => {
    dynamicIntelligence = new DynamicIntelligence();
  });

  describe('processUserInput', () => {
    it('should analyze frontend request and generate appropriate questions', async () => {
      const input = 'Crie um frontend para mim';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('frontend');
      expect(result.questions).toHaveLength(5);
      expect(result.questions[0].text).toContain('tecnologia');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should analyze backend request and generate appropriate questions', async () => {
      const input = 'Preciso de uma API REST';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('backend');
      expect(result.questions).toHaveLength(5);
      expect(result.questions[0].text).toContain('linguagem');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should analyze mobile request and generate appropriate questions', async () => {
      const input = 'Crie um app mobile';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('mobile');
      expect(result.questions).toHaveLength(5);
      expect(result.questions[0].text).toContain('plataforma');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle specific technology requests', async () => {
      const input = 'Crie um frontend React com TypeScript';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('frontend');
      expect(result.intent.technology).toBe('react');
      expect(result.intent.language).toBe('typescript');
      expect(result.questions.length).toBeLessThan(5); // Fewer questions needed
    });

    it('should handle complex requests with multiple technologies', async () => {
      const input = 'Crie um e-commerce com React, Node.js, MongoDB e autenticação JWT';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('frontend'); // Primary domain
      expect(result.intent.technology).toBe('react');
      expect(result.intent.features).toContain('authentication');
      expect(result.intent.purpose).toBe('ecommerce');
      expect(result.questions.length).toBeLessThan(5);
    });

    it('should generate questions when information is missing', async () => {
      const input = 'Crie algo para mim';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);
      expect(result.questions[0].text).toContain('tipo');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should handle AI/ML requests', async () => {
      const input = 'Crie um modelo de machine learning';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('ai');
      expect(result.questions[0].text).toContain('framework');
      expect(result.questions[1].text).toContain('dados');
    });

    it('should handle blockchain requests', async () => {
      const input = 'Crie um smart contract';
      
      const result: ProcessingResult = await dynamicIntelligence.processUserInput(input);
      
      expect(result).toBeDefined();
      expect(result.intent.domain).toBe('blockchain');
      expect(result.questions[0].text).toContain('blockchain');
      expect(result.questions[1].text).toContain('funcionalidade');
    });
  });

  describe('generateQuestions', () => {
    it('should generate technology questions for frontend', async () => {
      const intent: Intent = { domain: 'frontend' };
      
      const questions: Question[] = await dynamicIntelligence.generateQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('tecnologia');
      expect(questions[0].options).toContain('React');
      expect(questions[0].options).toContain('Vue');
      expect(questions[0].options).toContain('Angular');
    });

    it('should generate language questions for backend', async () => {
      const intent: Intent = { domain: 'backend' };
      
      const questions: Question[] = await dynamicIntelligence.generateQuestions(intent);
      
      expect(questions).toHaveLength(5);
      expect(questions[0].text).toContain('linguagem');
      expect(questions[0].options).toContain('Node.js');
      expect(questions[0].options).toContain('Python');
      expect(questions[0].options).toContain('Java');
    });

    it('should generate platform questions for mobile', async () => {
      const intent: Intent = { domain: 'mobile' };
      
      const questions: Question[] = await dynamicIntelligence.generateQuestions(intent);
      
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
      
      const questions: Question[] = await dynamicIntelligence.generateQuestions(intent);
      
      expect(questions.length).toBeLessThan(5);
      expect(questions[0].text).toContain('complexidade');
    });
  });

  describe('analyzeContext', () => {
    it('should analyze empty directory', async () => {
      const workingDir = '/tmp/empty-project';
      
      const context = await dynamicIntelligence.analyzeContext(workingDir);
      
      expect(context.isEmpty).toBe(true);
      expect(context.existingFiles).toHaveLength(0);
      expect(context.hasPackageJson).toBe(false);
      expect(context.hasGitRepo).toBe(false);
    });

    it('should analyze Node.js project', async () => {
      const workingDir = '/tmp/node-project';
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('package.json') || path.includes('.git');
      });
      
      const context = await dynamicIntelligence.analyzeContext(workingDir);
      
      expect(context.hasPackageJson).toBe(true);
      expect(context.hasGitRepo).toBe(true);
      expect(context.detectedTechnologies).toContain('nodejs');
    });

    it('should analyze Python project', async () => {
      const workingDir = '/tmp/python-project';
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('requirements.txt') || path.includes('pyproject.toml');
      });
      
      const context = await dynamicIntelligence.analyzeContext(workingDir);
      
      expect(context.detectedTechnologies).toContain('python');
    });

    it('should analyze Rust project', async () => {
      const workingDir = '/tmp/rust-project';
      // Mock filesystem
      jest.spyOn(require('fs'), 'existsSync').mockImplementation((path: string) => {
        return path.includes('Cargo.toml');
      });
      
      const context = await dynamicIntelligence.analyzeContext(workingDir);
      
      expect(context.detectedTechnologies).toContain('rust');
    });
  });
});
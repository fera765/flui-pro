"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicIntelligence = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
class DynamicIntelligence {
    constructor() {
        this.contextAnalyzer = new ContextAnalyzer();
        this.intentExtractor = new IntentExtractor();
        this.questionGenerator = new QuestionGenerator();
        this.solutionArchitect = new SolutionArchitect();
    }
    async processUserInput(input, workingDir = process.cwd()) {
        try {
            const context = await this.contextAnalyzer.analyze(workingDir);
            const intent = await this.intentExtractor.extract(input, context);
            const questions = await this.questionGenerator.generate(intent);
            let solution;
            if (this.isIntentComplete(intent)) {
                solution = await this.solutionArchitect.design(intent, context);
            }
            const confidence = this.calculateConfidence(intent, questions.length);
            return {
                context,
                intent,
                questions,
                solution,
                confidence
            };
        }
        catch (error) {
            console.error('Error processing user input:', error);
            throw new Error(`Failed to process user input: ${error.message}`);
        }
    }
    async generateQuestions(intent) {
        return await this.questionGenerator.generate(intent);
    }
    async analyzeContext(workingDir) {
        return await this.contextAnalyzer.analyze(workingDir);
    }
    isIntentComplete(intent) {
        return !!(intent.domain &&
            intent.technology &&
            intent.language &&
            intent.purpose &&
            intent.complexity);
    }
    calculateConfidence(intent, questionCount) {
        let confidence = 0.5;
        if (intent.domain)
            confidence += 0.2;
        if (intent.technology)
            confidence += 0.15;
        if (intent.language)
            confidence += 0.1;
        if (intent.purpose)
            confidence += 0.1;
        if (intent.complexity)
            confidence += 0.05;
        confidence -= (questionCount * 0.05);
        return Math.max(0, Math.min(1, confidence));
    }
}
exports.DynamicIntelligence = DynamicIntelligence;
class ContextAnalyzer {
    async analyze(workingDir) {
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
        }
        catch (error) {
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
    async scanDirectory(dir) {
        try {
            if (!fs.existsSync(dir)) {
                return [];
            }
            const files = fs.readdirSync(dir, { withFileTypes: true });
            return files.map(file => file.name);
        }
        catch (error) {
            return [];
        }
    }
    detectTechnologies(files) {
        const technologies = [];
        if (files.includes('package.json'))
            technologies.push('nodejs');
        if (files.includes('requirements.txt') || files.includes('pyproject.toml'))
            technologies.push('python');
        if (files.includes('Cargo.toml'))
            technologies.push('rust');
        if (files.includes('pom.xml'))
            technologies.push('java');
        if (files.includes('go.mod'))
            technologies.push('go');
        if (files.includes('composer.json'))
            technologies.push('php');
        if (files.includes('Gemfile'))
            technologies.push('ruby');
        if (files.includes('Dockerfile'))
            technologies.push('docker');
        if (files.includes('docker-compose.yml'))
            technologies.push('docker-compose');
        return technologies;
    }
    detectProjectType(files) {
        if (files.includes('package.json')) {
            return 'nodejs';
        }
        else if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
            return 'python';
        }
        else if (files.includes('Cargo.toml')) {
            return 'rust';
        }
        else if (files.includes('pom.xml')) {
            return 'java';
        }
        else if (files.includes('go.mod')) {
            return 'go';
        }
        else if (files.includes('composer.json')) {
            return 'php';
        }
        else if (files.includes('Gemfile')) {
            return 'ruby';
        }
        return undefined;
    }
}
class IntentExtractor {
    async extract(input, context) {
        const lowerInput = input.toLowerCase();
        const intent = { domain: 'unknown' };
        intent.domain = this.extractDomain(lowerInput);
        const technology = this.extractTechnology(lowerInput);
        if (technology)
            intent.technology = technology;
        const language = this.extractLanguage(lowerInput);
        if (language)
            intent.language = language;
        const framework = this.extractFramework(lowerInput);
        if (framework)
            intent.framework = framework;
        const purpose = this.extractPurpose(lowerInput);
        if (purpose)
            intent.purpose = purpose;
        const complexity = this.extractComplexity(lowerInput);
        if (complexity)
            intent.complexity = complexity;
        intent.features = this.extractFeatures(lowerInput);
        intent.requirements = this.extractRequirements(lowerInput);
        return intent;
    }
    extractDomain(input) {
        if (input.includes('frontend') || input.includes('react') || input.includes('vue') || input.includes('angular') || input.includes('html') || input.includes('site') || input.includes('website')) {
            return 'frontend';
        }
        else if (input.includes('backend') || input.includes('api') || input.includes('server')) {
            return 'backend';
        }
        else if (input.includes('mobile') || input.includes('app') || input.includes('ios') || input.includes('android')) {
            return 'mobile';
        }
        else if (input.includes('desktop') || input.includes('electron') || input.includes('tauri')) {
            return 'desktop';
        }
        else if (input.includes('ai') || input.includes('machine learning') || input.includes('ml') || input.includes('tensorflow') || input.includes('pytorch')) {
            return 'ai';
        }
        else if (input.includes('blockchain') || input.includes('smart contract') || input.includes('solidity')) {
            return 'blockchain';
        }
        else if (input.includes('script') || input.includes('automation') || input.includes('tool')) {
            return 'script';
        }
        return 'unknown';
    }
    extractTechnology(input) {
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
    extractLanguage(input) {
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
    extractFramework(input) {
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
    extractPurpose(input) {
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
    extractComplexity(input) {
        if (input.includes('simples') || input.includes('básico') || input.includes('básico')) {
            return 'simple';
        }
        else if (input.includes('médio') || input.includes('intermediário')) {
            return 'medium';
        }
        else if (input.includes('avançado') || input.includes('complexo')) {
            return 'advanced';
        }
        return undefined;
    }
    extractFeatures(input) {
        const features = [];
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
    extractRequirements(input) {
        const requirements = [];
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
    async generate(intent) {
        const questions = [];
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
        return questions.slice(0, 5);
    }
    generateTechnologyQuestion(domain) {
        const options = this.getTechnologyOptions(domain);
        return {
            id: (0, uuid_1.v4)(),
            text: `Qual tecnologia você prefere para ${domain}?`,
            type: 'choice',
            options,
            required: true,
            context: 'technology_selection'
        };
    }
    generateLanguageQuestion(domain) {
        const options = this.getLanguageOptions(domain);
        return {
            id: (0, uuid_1.v4)(),
            text: `Qual linguagem de programação você prefere?`,
            type: 'choice',
            options,
            required: true,
            context: 'language_selection'
        };
    }
    generatePurposeQuestion(domain) {
        return {
            id: (0, uuid_1.v4)(),
            text: `Para que será usado este ${domain}? (empresa, pessoal, estudo, etc.)`,
            type: 'text',
            required: true,
            context: 'purpose_clarification'
        };
    }
    generateComplexityQuestion() {
        return {
            id: (0, uuid_1.v4)(),
            text: `Qual o nível de complexidade?`,
            type: 'choice',
            options: ['Simples', 'Médio', 'Avançado'],
            required: true,
            context: 'complexity_selection'
        };
    }
    generateFeaturesQuestion(domain) {
        const options = this.getFeatureOptions(domain);
        return {
            id: (0, uuid_1.v4)(),
            text: `Quais funcionalidades você precisa?`,
            type: 'choice',
            options,
            required: false,
            context: 'features_selection'
        };
    }
    getTechnologyOptions(domain) {
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
    getLanguageOptions(domain) {
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
    getFeatureOptions(domain) {
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
    async design(intent, context) {
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
    getBuildTool(intent) {
        if (intent.technology === 'react' || intent.technology === 'vue') {
            return 'vite';
        }
        else if (intent.technology === 'angular') {
            return 'angular-cli';
        }
        else if (intent.language === 'rust') {
            return 'cargo';
        }
        else if (intent.language === 'java') {
            return 'maven';
        }
        else if (intent.language === 'go') {
            return 'go';
        }
        return 'npm';
    }
    getPackageManager(intent) {
        if (intent.language === 'python') {
            return 'pip';
        }
        else if (intent.language === 'rust') {
            return 'cargo';
        }
        else if (intent.language === 'java') {
            return 'maven';
        }
        else if (intent.language === 'go') {
            return 'go';
        }
        else if (intent.language === 'php') {
            return 'composer';
        }
        else if (intent.language === 'ruby') {
            return 'bundler';
        }
        return 'npm';
    }
    getDependencies(intent) {
        const deps = [];
        if (intent.technology === 'react') {
            deps.push('react', 'react-dom');
        }
        else if (intent.technology === 'vue') {
            deps.push('vue');
        }
        else if (intent.technology === 'express') {
            deps.push('express');
        }
        else if (intent.technology === 'fastapi') {
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
    getDevDependencies(intent) {
        const deps = [];
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
    getScripts(intent) {
        const scripts = {};
        if (intent.domain === 'frontend') {
            scripts.start = 'npm start';
            scripts.build = 'npm run build';
            scripts.test = 'npm test';
        }
        else if (intent.domain === 'backend') {
            scripts.start = 'node server.js';
            scripts.dev = 'nodemon server.js';
            scripts.test = 'jest';
        }
        return scripts;
    }
    getProjectStructure(intent) {
        return {
            directories: ['src', 'public', 'tests'],
            files: [],
            entryPoint: 'src/index.js',
            configFiles: ['package.json']
        };
    }
    getValidations(intent) {
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
    getEstimatedTime(intent) {
        let time = 10;
        if (intent.complexity === 'simple')
            time += 5;
        else if (intent.complexity === 'medium')
            time += 15;
        else if (intent.complexity === 'advanced')
            time += 30;
        if (intent.features?.includes('authentication'))
            time += 10;
        if (intent.features?.includes('database'))
            time += 15;
        if (intent.features?.includes('api'))
            time += 20;
        return time;
    }
}
//# sourceMappingURL=dynamicIntelligence.js.map
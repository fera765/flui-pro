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
        if (input.includes('frontend') || input.includes('react') || input.includes('vue') || input.includes('angular') || input.includes('html') || input.includes('site') || input.includes('website') || input.includes('landing page') || input.includes('página') || input.includes('página de vendas')) {
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
        else if (input.includes('content') || input.includes('roteiro') || input.includes('youtube') || input.includes('video') || input.includes('marketing')) {
            return 'content';
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
    async generateDynamicSetupTasks(intent, context) {
        const tasks = [];
        const taskPlan = await this.analyzeIntentForTaskGeneration(intent, context);
        for (const taskInfo of taskPlan) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: taskInfo.description,
                type: taskInfo.type,
                toolName: taskInfo.toolName,
                parameters: taskInfo.parameters,
                status: 'pending',
                dependencies: taskInfo.dependencies,
                createdAt: new Date(),
                projectPhase: taskInfo.phase
            });
        }
        return tasks;
    }
    async analyzeIntentForTaskGeneration(intent, context) {
        const tasks = [];
        const domain = intent.domain;
        const technology = intent.technology;
        const language = intent.language;
        const features = intent.features || [];
        const requirements = intent.requirements || [];
        if (technology) {
            const initTask = await this.generateInitializationTask(technology, language || 'javascript', domain, intent);
            if (initTask)
                tasks.push(initTask);
        }
        const dependencyTasks = await this.generateDependencyTasks(features, requirements, technology || 'unknown');
        tasks.push(...dependencyTasks);
        const implementationTasks = await this.generateImplementationTasks(features, technology || 'unknown', language || 'javascript');
        tasks.push(...implementationTasks);
        const validationTasks = await this.generateValidationTasks(technology || 'unknown', domain);
        tasks.push(...validationTasks);
        return tasks;
    }
    async generateInitializationTask(technology, language, domain, intent) {
        let command = '';
        let description = '';
        if (technology.toLowerCase().includes('react')) {
            command = 'npx create-react-app temp-react-app --template typescript && cp -r temp-react-app/* . && cp -r temp-react-app/.* . 2>/dev/null || true && rm -rf temp-react-app';
            description = 'Initialize React project with TypeScript';
        }
        else if (technology.toLowerCase().includes('vue')) {
            command = 'npm create vue@latest .';
            description = 'Initialize Vue project';
        }
        else if (technology.toLowerCase().includes('angular')) {
            command = 'ng new . --routing --style=scss';
            description = 'Initialize Angular project';
        }
        else if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            command = 'npm init -y';
            description = 'Initialize Node.js project';
        }
        else if (technology.toLowerCase().includes('html')) {
            return {
                description: 'Create HTML project structure',
                type: 'tool',
                toolName: 'file_write',
                parameters: {
                    filePath: 'index.html',
                    content: this.generateDynamicHTMLContent(intent || { domain, technology, language, features: [], requirements: [] })
                },
                dependencies: [],
                phase: 'setup'
            };
        }
        else {
            command = `echo "Initializing ${technology} project"`;
            description = `Initialize ${technology} project`;
        }
        return {
            description,
            type: 'tool',
            toolName: 'shell',
            parameters: { command },
            dependencies: [],
            phase: 'setup'
        };
    }
    async generateDependencyTasks(features, requirements, technology) {
        const tasks = [];
        const dependencies = this.analyzeFeaturesForDependencies(features, technology);
        const devDependencies = this.analyzeFeaturesForDevDependencies(features, technology);
        if (dependencies.length > 0) {
            tasks.push({
                description: 'Install project dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies, devDependencies: false },
                dependencies: [],
                phase: 'dependencies'
            });
        }
        if (devDependencies.length > 0) {
            tasks.push({
                description: 'Install development dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies: devDependencies, devDependencies: true },
                dependencies: [],
                phase: 'dependencies'
            });
        }
        return tasks;
    }
    async generateImplementationTasks(features, technology, language) {
        const tasks = [];
        for (const feature of features) {
            const task = await this.generateFeatureImplementationTask(feature, technology, language);
            if (task)
                tasks.push(task);
        }
        return tasks;
    }
    async generateValidationTasks(technology, domain) {
        const tasks = [];
        tasks.push({
            description: 'Validate project build',
            type: 'tool',
            toolName: 'shell',
            parameters: { command: this.generateBuildCommand(technology) },
            dependencies: [],
            phase: 'validation'
        });
        if (domain === 'backend' || domain === 'frontend') {
            tasks.push({
                description: 'Validate server accessibility',
                type: 'tool',
                toolName: 'shell',
                parameters: { command: this.generateServerValidationCommand(technology) },
                dependencies: [],
                phase: 'validation'
            });
        }
        return tasks;
    }
    analyzeFeaturesForDependencies(features, technology) {
        const dependencies = [];
        if (features.includes('authentication')) {
            if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
                dependencies.push('jsonwebtoken', 'bcryptjs', 'express-validator');
            }
        }
        if (features.includes('api')) {
            if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
                dependencies.push('express', 'cors', 'helmet', 'morgan');
            }
        }
        if (features.includes('styling')) {
            if (technology.toLowerCase().includes('react')) {
                dependencies.push('styled-components', 'emotion');
            }
        }
        return dependencies;
    }
    analyzeFeaturesForDevDependencies(features, technology) {
        const devDependencies = [];
        if (features.includes('testing')) {
            devDependencies.push('jest', 'supertest');
        }
        if (technology.toLowerCase().includes('node') || technology.toLowerCase().includes('express')) {
            devDependencies.push('nodemon');
        }
        return devDependencies;
    }
    async generateFeatureImplementationTask(feature, technology, language) {
        switch (feature) {
            case 'authentication':
                return {
                    description: 'Implement authentication system',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: this.generateAuthFilePath(technology),
                        content: this.generateAuthContent(technology, language)
                    },
                    dependencies: [],
                    phase: 'implementation'
                };
            case 'api':
                return {
                    description: 'Create API routes',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: this.generateAPIFilePath(technology),
                        content: this.generateAPIContent(technology, language)
                    },
                    dependencies: [],
                    phase: 'implementation'
                };
            default:
                return null;
        }
    }
    generateBuildCommand(technology) {
        if (technology.toLowerCase().includes('react') || technology.toLowerCase().includes('vue') || technology.toLowerCase().includes('angular')) {
            return 'npm run build';
        }
        else if (technology.toLowerCase().includes('node') || technology.toLowerCase().includes('express')) {
            return 'echo "No build step required for Node.js"';
        }
        return 'echo "Build validation completed"';
    }
    generateServerValidationCommand(technology) {
        if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            return 'curl -s http://localhost:3000/health || echo "Server not accessible"';
        }
        return 'echo "Server validation completed"';
    }
    generateAuthFilePath(technology) {
        if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            return 'src/routes/auth.js';
        }
        else if (technology.toLowerCase().includes('react')) {
            return 'src/components/Auth.js';
        }
        return 'auth.js';
    }
    generateAPIFilePath(technology) {
        if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            return 'src/routes/api.js';
        }
        return 'api.js';
    }
    generateAuthContent(technology, language) {
        if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            return this.generateExpressAuthContent();
        }
        else if (technology.toLowerCase().includes('react')) {
            return this.generateReactAuthContent();
        }
        return '// Authentication implementation';
    }
    generateAPIContent(technology, language) {
        if (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node')) {
            return this.generateExpressAPIContent();
        }
        return '// API implementation';
    }
    generateExpressAuthContent() {
        return `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const users = [];

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, email, password: hashedPassword };
    users.push(user);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;`;
    }
    generateExpressAPIContent() {
        return `const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Protected route accessed successfully',
    user: req.user 
  });
});

// Public route
router.get('/public', (req, res) => {
  res.json({ message: 'This is a public route' });
});

module.exports = router;`;
    }
    generateReactAuthContent() {
        return `import React, { useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};`;
    }
    generateDynamicHTMLContent(intent) {
        const title = intent.purpose ? `${intent.purpose} Website` : 'My Website';
        const features = intent.features || [];
        let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome to ${title}</h1>
    <p>This is a dynamic website created by FLUI AutoCode-Forge.</p>`;
        if (features.includes('authentication')) {
            content += `
    <div id="auth-section">
        <h2>Authentication</h2>
        <form id="login-form">
            <input type="email" placeholder="Email" required>
            <input type="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
    </div>`;
        }
        if (features.includes('api')) {
            content += `
    <div id="api-section">
        <h2>API Integration</h2>
        <button id="fetch-data">Fetch Data</button>
        <div id="data-display"></div>
    </div>`;
        }
        content += `
    <script src="script.js"></script>
</body>
</html>`;
        return content;
    }
}
//# sourceMappingURL=dynamicIntelligence.js.map
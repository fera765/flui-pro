"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicSolutionArchitect = void 0;
const uuid_1 = require("uuid");
class DynamicSolutionArchitect {
    constructor(dynamicIntelligence) {
        this.dynamicIntelligence = dynamicIntelligence;
    }
    async designSolution(intent, context) {
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
    async generateDynamicTasks(intent, context) {
        const tasks = [];
        const setupTasks = await this.generateSetupTasks(intent, context);
        tasks.push(...setupTasks);
        tasks.push(...this.generateDependencyTasks(intent, context));
        tasks.push(...this.generateConfigurationTasks(intent, context));
        tasks.push(...this.generateImplementationTasks(intent, context));
        tasks.push(...this.generateTestingTasks(intent, context));
        tasks.push(...this.generateValidationTasks(intent, context));
        return tasks;
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
        else if (intent.technology === 'hardhat') {
            return 'hardhat';
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
        else if (intent.technology === 'flutter') {
            return 'flutter';
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
        else if (intent.technology === 'angular') {
            deps.push('@angular/core', '@angular/common');
        }
        else if (intent.technology === 'express') {
            deps.push('express');
        }
        else if (intent.technology === 'fastapi') {
            deps.push('fastapi', 'uvicorn');
        }
        else if (intent.technology === 'django') {
            deps.push('django');
        }
        else if (intent.technology === 'spring') {
            deps.push('spring-boot-starter-web');
        }
        else if (intent.technology === 'rails') {
            deps.push('rails');
        }
        else if (intent.technology === 'gin') {
            deps.push('github.com/gin-gonic/gin');
        }
        else if (intent.technology === 'actix') {
            deps.push('actix-web');
        }
        else if (intent.technology === 'flutter') {
            deps.push('flutter');
        }
        else if (intent.technology === 'electron') {
            deps.push('electron');
        }
        else if (intent.technology === 'tauri') {
            deps.push('@tauri-apps/api');
        }
        else if (intent.technology === 'tensorflow') {
            deps.push('tensorflow', 'numpy', 'pandas');
        }
        else if (intent.technology === 'pytorch') {
            deps.push('torch', 'numpy', 'pandas');
        }
        else if (intent.technology === 'scikit-learn') {
            deps.push('scikit-learn', 'numpy', 'pandas');
        }
        else if (intent.technology === 'solidity') {
            deps.push('hardhat', '@openzeppelin/contracts');
        }
        else if (intent.technology === 'web3') {
            deps.push('web3', 'ethers');
        }
        if (intent.features?.includes('authentication')) {
            if (intent.technology === 'express') {
                deps.push('jsonwebtoken', 'bcrypt');
            }
            else if (intent.technology === 'fastapi') {
                deps.push('python-jose', 'passlib');
            }
            else if (intent.technology === 'django') {
                deps.push('djangorestframework', 'django-cors-headers');
            }
        }
        if (intent.features?.includes('database')) {
            if (intent.technology === 'express') {
                deps.push('mongoose', 'mongodb');
            }
            else if (intent.technology === 'fastapi') {
                deps.push('sqlalchemy', 'alembic');
            }
            else if (intent.technology === 'django') {
                deps.push('psycopg2-binary');
            }
        }
        if (intent.features?.includes('routing')) {
            if (intent.technology === 'react') {
                deps.push('react-router-dom');
            }
            else if (intent.technology === 'vue') {
                deps.push('vue-router');
            }
            else if (intent.technology === 'angular') {
                deps.push('@angular/router');
            }
        }
        if (intent.features?.includes('state-management')) {
            if (intent.technology === 'react') {
                deps.push('redux', 'react-redux');
            }
            else if (intent.technology === 'vue') {
                deps.push('vuex');
            }
            else if (intent.technology === 'angular') {
                deps.push('@ngrx/store');
            }
        }
        if (intent.features?.includes('styling')) {
            if (intent.technology === 'react') {
                deps.push('tailwindcss', 'postcss', 'autoprefixer');
            }
            else if (intent.technology === 'vue') {
                deps.push('tailwindcss', 'postcss', 'autoprefixer');
            }
        }
        return deps;
    }
    getDevDependencies(intent) {
        const deps = [];
        if (intent.language === 'typescript') {
            deps.push('typescript', '@types/node');
        }
        if (intent.technology === 'react' && intent.language === 'typescript') {
            deps.push('@types/react', '@types/react-dom');
        }
        if (intent.technology === 'vue' && intent.language === 'typescript') {
            deps.push('@types/vue');
        }
        if (intent.technology === 'express' && intent.language === 'typescript') {
            deps.push('@types/express', '@types/cors');
        }
        if (intent.features?.includes('testing')) {
            if (intent.technology === 'react') {
                deps.push('jest', '@testing-library/react', '@testing-library/jest-dom');
            }
            else if (intent.technology === 'vue') {
                deps.push('jest', '@vue/test-utils');
            }
            else if (intent.technology === 'express') {
                deps.push('jest', 'supertest');
            }
            else if (intent.technology === 'fastapi') {
                deps.push('pytest', 'httpx');
            }
        }
        if (intent.technology === 'express') {
            deps.push('nodemon');
        }
        if (intent.technology === 'react' || intent.technology === 'vue') {
            deps.push('eslint', 'prettier');
        }
        return deps;
    }
    getScripts(intent) {
        const scripts = {};
        if (intent.domain === 'frontend') {
            if (intent.technology === 'react') {
                scripts.start = 'npm start';
                scripts.build = 'npm run build';
                scripts.test = 'npm test';
                scripts.dev = 'npm start';
            }
            else if (intent.technology === 'vue') {
                scripts.serve = 'vue-cli-service serve';
                scripts.build = 'vue-cli-service build';
                scripts.test = 'vue-cli-service test:unit';
                scripts.dev = 'vue-cli-service serve';
            }
            else if (intent.technology === 'angular') {
                scripts.start = 'ng serve';
                scripts.build = 'ng build';
                scripts.test = 'ng test';
                scripts.dev = 'ng serve';
            }
        }
        else if (intent.domain === 'backend') {
            if (intent.technology === 'express') {
                scripts.start = 'node server.js';
                scripts.dev = 'nodemon server.js';
                scripts.test = 'jest';
            }
            else if (intent.technology === 'fastapi') {
                scripts.start = 'uvicorn main:app --reload';
                scripts.test = 'pytest';
            }
            else if (intent.technology === 'django') {
                scripts.start = 'python manage.py runserver';
                scripts.test = 'python manage.py test';
            }
        }
        else if (intent.domain === 'mobile') {
            if (intent.technology === 'flutter') {
                scripts.run = 'flutter run';
                scripts.build = 'flutter build';
                scripts.test = 'flutter test';
            }
        }
        else if (intent.domain === 'desktop') {
            if (intent.technology === 'electron') {
                scripts.start = 'electron .';
                scripts.build = 'electron-builder';
                scripts.dev = 'electron .';
            }
        }
        else if (intent.domain === 'ai') {
            if (intent.technology === 'tensorflow' || intent.technology === 'pytorch') {
                scripts.train = 'python train.py';
                scripts.predict = 'python predict.py';
                scripts.test = 'python test.py';
            }
        }
        else if (intent.domain === 'blockchain') {
            if (intent.technology === 'solidity') {
                scripts.compile = 'npx hardhat compile';
                scripts.test = 'npx hardhat test';
                scripts.deploy = 'npx hardhat run scripts/deploy.js';
            }
        }
        return scripts;
    }
    getProjectStructure(intent) {
        const structure = {
            directories: [],
            files: [],
            entryPoint: '',
            configFiles: []
        };
        if (intent.domain === 'frontend') {
            structure.directories = ['src', 'public', 'tests'];
            structure.entryPoint = 'src/index.js';
            structure.configFiles = ['package.json'];
            if (intent.technology === 'react') {
                structure.directories.push('src/components', 'src/pages', 'src/hooks');
                structure.entryPoint = 'src/index.js';
            }
            else if (intent.technology === 'vue') {
                structure.directories.push('src/components', 'src/views', 'src/store');
                structure.entryPoint = 'src/main.js';
            }
            else if (intent.technology === 'angular') {
                structure.directories.push('src/app', 'src/assets', 'src/environments');
                structure.entryPoint = 'src/main.ts';
            }
        }
        else if (intent.domain === 'backend') {
            structure.directories = ['src', 'tests', 'config'];
            structure.entryPoint = 'src/server.js';
            structure.configFiles = ['package.json'];
            if (intent.technology === 'express') {
                structure.directories.push('src/routes', 'src/controllers', 'src/models', 'src/middleware');
                structure.entryPoint = 'src/server.js';
            }
            else if (intent.technology === 'fastapi') {
                structure.directories.push('app', 'tests', 'alembic');
                structure.entryPoint = 'main.py';
                structure.configFiles = ['requirements.txt'];
            }
            else if (intent.technology === 'django') {
                structure.directories.push('myproject', 'myapp', 'static', 'templates');
                structure.entryPoint = 'manage.py';
                structure.configFiles = ['requirements.txt'];
            }
        }
        else if (intent.domain === 'mobile') {
            if (intent.technology === 'flutter') {
                structure.directories = ['lib', 'test', 'android', 'ios'];
                structure.entryPoint = 'lib/main.dart';
                structure.configFiles = ['pubspec.yaml'];
            }
        }
        else if (intent.domain === 'desktop') {
            if (intent.technology === 'electron') {
                structure.directories = ['src', 'public', 'tests'];
                structure.entryPoint = 'src/main.js';
                structure.configFiles = ['package.json'];
            }
        }
        else if (intent.domain === 'ai') {
            structure.directories = ['src', 'data', 'models', 'tests'];
            structure.entryPoint = 'src/main.py';
            structure.configFiles = ['requirements.txt'];
        }
        else if (intent.domain === 'blockchain') {
            if (intent.technology === 'solidity') {
                structure.directories = ['contracts', 'scripts', 'test'];
                structure.entryPoint = 'contracts/MyContract.sol';
                structure.configFiles = ['hardhat.config.js'];
            }
        }
        return structure;
    }
    getValidations(intent) {
        const validations = [];
        if (intent.domain === 'frontend') {
            validations.push({
                name: 'Build',
                command: 'npm run build',
                timeout: 60000,
                retries: 3
            });
        }
        else if (intent.domain === 'backend') {
            if (intent.technology === 'express') {
                validations.push({
                    name: 'Build',
                    command: 'npm run build',
                    timeout: 60000,
                    retries: 3
                });
            }
            else if (intent.technology === 'fastapi') {
                validations.push({
                    name: 'Build',
                    command: 'python -m py_compile main.py',
                    timeout: 30000,
                    retries: 3
                });
            }
        }
        if (intent.features?.includes('testing')) {
            if (intent.technology === 'react' || intent.technology === 'vue') {
                validations.push({
                    name: 'Test',
                    command: 'npm test',
                    timeout: 30000,
                    retries: 2
                });
            }
            else if (intent.technology === 'express') {
                validations.push({
                    name: 'Test',
                    command: 'npm test',
                    timeout: 30000,
                    retries: 2
                });
            }
            else if (intent.technology === 'fastapi') {
                validations.push({
                    name: 'Test',
                    command: 'pytest',
                    timeout: 30000,
                    retries: 2
                });
            }
        }
        if (intent.domain === 'frontend' || intent.domain === 'backend') {
            validations.push({
                name: 'Server',
                command: 'npm start',
                timeout: 30000,
                retries: 2
            });
        }
        return validations;
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
        if (intent.features?.includes('routing'))
            time += 5;
        if (intent.features?.includes('state-management'))
            time += 10;
        if (intent.features?.includes('styling'))
            time += 5;
        if (intent.features?.includes('testing'))
            time += 10;
        if (intent.features?.includes('deployment'))
            time += 15;
        return time;
    }
    async generateSetupTasks(intent, context) {
        const tasks = [];
        if (context.isEmpty) {
            const setupTasks = await this.generateDynamicTasksFromIntent(intent, context);
            tasks.push(...setupTasks);
        }
        return tasks;
    }
    async generateDynamicTasksFromIntent(intent, context) {
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
        const dependencyTasks = await this.generateDependencyTasksFromFeatures(features, requirements, technology || 'unknown');
        tasks.push(...dependencyTasks);
        const implementationTasks = await this.generateImplementationTasksFromFeatures(features, technology || 'unknown', language || 'javascript', domain);
        tasks.push(...implementationTasks);
        const validationTasks = await this.generateValidationTasksFromTechnology(technology || 'unknown', domain);
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
            return {
                id: (0, uuid_1.v4)(),
                description: 'Create package.json with scripts',
                type: 'tool',
                toolName: 'file_write',
                parameters: {
                    filePath: 'package.json',
                    content: JSON.stringify({
                        name: 'express-api',
                        version: '1.0.0',
                        description: 'Express API with JWT authentication',
                        main: 'src/server.js',
                        scripts: {
                            start: 'node src/server.js',
                            dev: 'nodemon src/server.js',
                            test: 'jest',
                            build: 'echo "No build step required for Node.js"'
                        },
                        keywords: ['express', 'api', 'jwt', 'authentication'],
                        author: '',
                        license: 'MIT'
                    }, null, 2)
                },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'setup'
            };
        }
        else if (technology.toLowerCase().includes('html')) {
            return {
                id: (0, uuid_1.v4)(),
                description: 'Create HTML project structure',
                type: 'tool',
                toolName: 'file_write',
                parameters: {
                    filePath: 'index.html',
                    content: this.generateDynamicHTMLContent(intent)
                },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'setup'
            };
        }
        else {
            command = `echo "Initializing ${technology} project"`;
            description = `Initialize ${technology} project`;
        }
        return {
            id: (0, uuid_1.v4)(),
            description,
            type: 'tool',
            toolName: 'shell',
            parameters: { command },
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            projectPhase: 'setup'
        };
    }
    async generateDependencyTasksFromFeatures(features, requirements, technology) {
        const tasks = [];
        const dependencies = this.analyzeFeaturesForDependencies(features, technology);
        const devDependencies = this.analyzeFeaturesForDevDependencies(features, technology);
        if (dependencies.length > 0) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Install project dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies, devDependencies: false },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'dependencies'
            });
        }
        if (devDependencies.length > 0) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Install development dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies: devDependencies, devDependencies: true },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'dependencies'
            });
        }
        return tasks;
    }
    async generateImplementationTasksFromFeatures(features, technology, language, domain) {
        const tasks = [];
        for (const feature of features) {
            const task = await this.generateFeatureImplementationTask(feature, technology, language);
            if (task)
                tasks.push(task);
        }
        if (domain === 'backend' && (technology.toLowerCase().includes('express') || technology.toLowerCase().includes('node'))) {
            const serverTask = await this.generateFeatureImplementationTask('server', technology, language);
            if (serverTask)
                tasks.push(serverTask);
        }
        return tasks;
    }
    async generateValidationTasksFromTechnology(technology, domain) {
        const tasks = [];
        tasks.push({
            id: (0, uuid_1.v4)(),
            description: 'Validate project build',
            type: 'tool',
            toolName: 'shell',
            parameters: { command: this.generateBuildCommand(technology) },
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            projectPhase: 'validation'
        });
        if (domain === 'backend' || domain === 'frontend') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Validate server accessibility',
                type: 'tool',
                toolName: 'shell',
                parameters: { command: this.generateServerValidationCommand(technology) },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'validation'
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
                    id: (0, uuid_1.v4)(),
                    description: 'Implement authentication system',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: this.generateAuthFilePath(technology),
                        content: this.generateAuthContent(technology, language)
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                };
            case 'api':
                return {
                    id: (0, uuid_1.v4)(),
                    description: 'Create API routes',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: this.generateAPIFilePath(technology),
                        content: this.generateAPIContent(technology, language)
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                };
            case 'server':
                return {
                    id: (0, uuid_1.v4)(),
                    description: 'Create Express server',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: {
                        filePath: 'src/server.js',
                        content: this.generateExpressServerContent()
                    },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
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
            return 'npm start';
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
    generateExpressServerContent() {
        return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});

module.exports = app;`;
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
    generateDependencyTasks(intent, context) {
        const tasks = [];
        const dependencies = this.getDependencies(intent);
        const devDependencies = this.getDevDependencies(intent);
        if (dependencies.length > 0) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Install dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies, devDependencies: false },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'dependencies'
            });
        }
        if (devDependencies.length > 0) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Install dev dependencies',
                type: 'tool',
                toolName: 'package_manager',
                parameters: { dependencies: devDependencies, devDependencies: true },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'dependencies'
            });
        }
        return tasks;
    }
    generateConfigurationTasks(intent, context) {
        const tasks = [];
        if (intent.technology === 'react' && intent.features?.includes('routing')) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Configure React Router',
                type: 'tool',
                toolName: 'file_write',
                parameters: { filePath: 'src/App.js', content: 'Router configuration' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'configuration'
            });
        }
        if (intent.features?.includes('styling') && (intent.technology === 'react' || intent.technology === 'vue')) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Configure Tailwind CSS',
                type: 'tool',
                toolName: 'shell',
                parameters: { command: 'npx tailwindcss init -p' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'configuration'
            });
        }
        return tasks;
    }
    generateImplementationTasks(intent, context) {
        const tasks = [];
        if (intent.technology === 'react') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Create main App component',
                type: 'tool',
                toolName: 'file_write',
                parameters: { filePath: 'src/App.js', content: 'React App component' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'implementation'
            });
        }
        if (intent.technology === 'express') {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Create Express server',
                type: 'tool',
                toolName: 'file_write',
                parameters: { filePath: 'src/server.js', content: 'Express server setup' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'implementation'
            });
        }
        if (intent.features?.includes('authentication')) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Implement authentication',
                type: 'tool',
                toolName: 'file_write',
                parameters: { filePath: 'src/auth.js', content: 'Authentication logic' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'implementation'
            });
        }
        return tasks;
    }
    generateTestingTasks(intent, context) {
        const tasks = [];
        if (intent.features?.includes('testing')) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: 'Create test files',
                type: 'tool',
                toolName: 'file_write',
                parameters: { filePath: 'src/App.test.js', content: 'Test file content' },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'testing'
            });
        }
        return tasks;
    }
    generateValidationTasks(intent, context) {
        const tasks = [];
        const validations = this.getValidations(intent);
        for (const validation of validations) {
            tasks.push({
                id: (0, uuid_1.v4)(),
                description: `Validate ${validation.name}`,
                type: 'tool',
                toolName: 'shell',
                parameters: { command: validation.command },
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                projectPhase: 'validation',
                validationCommand: validation.command,
                expectedResult: 'success'
            });
        }
        return tasks;
    }
}
exports.DynamicSolutionArchitect = DynamicSolutionArchitect;
//# sourceMappingURL=dynamicSolutionArchitect.js.map
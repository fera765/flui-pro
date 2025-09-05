"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicSolutionArchitect = void 0;
const uuid_1 = require("uuid");
class DynamicSolutionArchitect {
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
        tasks.push(...this.generateSetupTasks(intent, context));
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
    generateSetupTasks(intent, context) {
        const tasks = [];
        if (context.isEmpty) {
            if (intent.technology === 'react') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize React project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'npx create-react-app temp-react-app --template typescript && cp -r temp-react-app/* . && cp -r temp-react-app/.* . 2>/dev/null || true && rm -rf temp-react-app' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
            else if (intent.technology === 'vue') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize Vue project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'npm create vue@latest .' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
            else if (intent.technology === 'angular') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize Angular project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'ng new . --routing --style=scss' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
            else if (intent.technology === 'html') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create HTML project structure',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Website</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Welcome to My Website</h1>\n    <p>This is a simple HTML website.</p>\n    <script src="script.js"></script>\n</body>\n</html>' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create CSS file',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'style.css', content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create JavaScript file',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'script.js', content: '// JavaScript functionality\nconsole.log("Website loaded successfully!");\n\n// Add interactive features\ndocument.addEventListener("DOMContentLoaded", function() {\n    console.log("DOM is ready!");\n    \n    // Example: Add click event to h1\n    const h1 = document.querySelector("h1");\n    if (h1) {\n        h1.addEventListener("click", function() {\n            alert("Hello from JavaScript!");\n        });\n    }\n});' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
            else if (intent.technology === 'express') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize Node.js project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'npm init -y' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Update package.json with scripts',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'package.json', content: '{\n  "name": "express-api",\n  "version": "1.0.0",\n  "description": "Express API with JWT authentication",\n  "main": "src/server.js",\n  "scripts": {\n    "start": "node src/server.js",\n    "dev": "nodemon src/server.js",\n    "test": "jest",\n    "build": "echo \\"No build step required for Node.js\\""\n  },\n  "keywords": ["express", "api", "jwt", "authentication"],\n  "author": "",\n  "license": "MIT"\n}' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Install Express dependencies',
                    type: 'tool',
                    toolName: 'package_manager',
                    parameters: { dependencies: ['express', 'cors', 'helmet', 'morgan', 'jsonwebtoken', 'bcryptjs', 'express-validator'], devDependencies: false },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'dependencies'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Install dev dependencies',
                    type: 'tool',
                    toolName: 'package_manager',
                    parameters: { dependencies: ['nodemon', 'jest', 'supertest'], devDependencies: true },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'dependencies'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create Express server',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'src/server.js', content: 'const express = require(\'express\');\nconst cors = require(\'cors\');\nconst helmet = require(\'helmet\');\nconst morgan = require(\'morgan\');\nconst authRoutes = require(\'./routes/auth\');\nconst apiRoutes = require(\'./routes/api\');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Middleware\napp.use(helmet());\napp.use(cors());\napp.use(morgan(\'combined\'));\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// Routes\napp.use(\'/api/auth\', authRoutes);\napp.use(\'/api\', apiRoutes);\n\n// Health check\napp.get(\'/health\', (req, res) => {\n  res.json({ status: \'healthy\', timestamp: new Date().toISOString() });\n});\n\n// Error handling\napp.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(500).json({ error: \'Something went wrong!\' });\n});\n\n// 404 handler\napp.use(\'*\', (req, res) => {\n  res.status(404).json({ error: \'Route not found\' });\n});\n\napp.listen(PORT, () => {\n  console.log(`🚀 Server running on port ${PORT}`);\n});\n\nmodule.exports = app;' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create auth routes',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'src/routes/auth.js', content: 'const express = require(\'express\');\nconst bcrypt = require(\'bcryptjs\');\nconst jwt = require(\'jsonwebtoken\');\nconst { body, validationResult } = require(\'express-validator\');\n\nconst router = express.Router();\n\n// Mock user database (in real app, use proper database)\nconst users = [];\n\n// Register\nrouter.post(\'/register\', [\n  body(\'email\').isEmail().normalizeEmail(),\n  body(\'password\').isLength({ min: 6 })\n], async (req, res) => {\n  try {\n    const errors = validationResult(req);\n    if (!errors.isEmpty()) {\n      return res.status(400).json({ errors: errors.array() });\n    }\n\n    const { email, password } = req.body;\n    \n    // Check if user exists\n    const existingUser = users.find(user => user.email === email);\n    if (existingUser) {\n      return res.status(400).json({ error: \'User already exists\' });\n    }\n\n    // Hash password\n    const hashedPassword = await bcrypt.hash(password, 10);\n    \n    // Create user\n    const user = { id: users.length + 1, email, password: hashedPassword };\n    users.push(user);\n\n    // Generate JWT\n    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || \'secret\', { expiresIn: \'24h\' });\n\n    res.status(201).json({ token, user: { id: user.id, email: user.email } });\n  } catch (error) {\n    res.status(500).json({ error: error.message });\n  }\n});\n\n// Login\nrouter.post(\'/login\', [\n  body(\'email\').isEmail().normalizeEmail(),\n  body(\'password\').exists()\n], async (req, res) => {\n  try {\n    const errors = validationResult(req);\n    if (!errors.isEmpty()) {\n      return res.status(400).json({ errors: errors.array() });\n    }\n\n    const { email, password } = req.body;\n    \n    // Find user\n    const user = users.find(user => user.email === email);\n    if (!user) {\n      return res.status(400).json({ error: \'Invalid credentials\' });\n    }\n\n    // Check password\n    const isValidPassword = await bcrypt.compare(password, user.password);\n    if (!isValidPassword) {\n      return res.status(400).json({ error: \'Invalid credentials\' });\n    }\n\n    // Generate JWT\n    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || \'secret\', { expiresIn: \'24h\' });\n\n    res.json({ token, user: { id: user.id, email: user.email } });\n  } catch (error) {\n    res.status(500).json({ error: error.message });\n  }\n});\n\nmodule.exports = router;' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Create API routes',
                    type: 'tool',
                    toolName: 'file_write',
                    parameters: { filePath: 'src/routes/api.js', content: 'const express = require(\'express\');\nconst jwt = require(\'jsonwebtoken\');\n\nconst router = express.Router();\n\n// Middleware to verify JWT\nconst authenticateToken = (req, res, next) => {\n  const authHeader = req.headers[\'authorization\'];\n  const token = authHeader && authHeader.split(\' \')[1];\n\n  if (!token) {\n    return res.status(401).json({ error: \'Access token required\' });\n  }\n\n  jwt.verify(token, process.env.JWT_SECRET || \'secret\', (err, user) => {\n    if (err) {\n      return res.status(403).json({ error: \'Invalid token\' });\n    }\n    req.user = user;\n    next();\n  });\n};\n\n// Protected route example\nrouter.get(\'/profile\', authenticateToken, (req, res) => {\n  res.json({ \n    message: \'Protected route accessed successfully\',\n    user: req.user \n  });\n});\n\n// Public route example\nrouter.get(\'/public\', (req, res) => {\n  res.json({ message: \'This is a public route\' });\n});\n\nmodule.exports = router;' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'implementation'
                });
            }
            else if (intent.technology === 'fastapi') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize Python project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'python -m venv venv' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Activate virtual environment',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'source venv/bin/activate' },
                    status: 'pending',
                    dependencies: tasks.length > 0 ? [tasks[0].id] : [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
            else if (intent.technology === 'flutter') {
                tasks.push({
                    id: (0, uuid_1.v4)(),
                    description: 'Initialize Flutter project',
                    type: 'tool',
                    toolName: 'shell',
                    parameters: { command: 'flutter create .' },
                    status: 'pending',
                    dependencies: [],
                    createdAt: new Date(),
                    projectPhase: 'setup'
                });
            }
        }
        return tasks;
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
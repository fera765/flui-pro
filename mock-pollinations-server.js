#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock OpenAI-compatible API
app.post('/v1/chat/completions', async (req, res) => {
  console.log('🤖 Mock Pollinations API called with:', req.body);
  
  const { messages, model, temperature, max_tokens } = req.body;
  const userMessage = messages[messages.length - 1].content;
  
  // Simulate LLM processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let response;
  
  if (userMessage.includes('Analise o seguinte input')) {
    // Dynamic intent extraction based on input content
    const input = userMessage.match(/INPUT: "(.+?)"/)?.[1] || userMessage;
    
    console.log('🔍 Analyzing input:', input);
    
    let domain = 'unknown';
    let technology = null;
    let language = null;
    let features = [];
    let requirements = [];
    let purpose = null;
    
    // AI/ML Detection - More specific keywords
    if (input.toLowerCase().includes('machine learning') || input.toLowerCase().includes('tensorflow') || input.toLowerCase().includes('sistema de recomendação') || input.toLowerCase().includes('processamento de dados')) {
      domain = 'ai';
      technology = 'tensorflow';
      language = 'python';
      features = ['machine-learning', 'data-processing', 'model-training', 'visualization', 'recommendation-system'];
      requirements = ['real-time', 'data-pipeline', 'web-interface'];
      purpose = 'AI/ML recommendation system';
      console.log('🤖 Detected: AI/ML System');
    }
    // Blockchain Detection - More specific keywords
    else if (input.toLowerCase().includes('defi') || input.toLowerCase().includes('smart contracts') || input.toLowerCase().includes('solidity') || input.toLowerCase().includes('metamask') || input.toLowerCase().includes('staking') || input.toLowerCase().includes('tokenomics')) {
      domain = 'blockchain';
      technology = 'solidity';
      language = 'javascript';
      features = ['smart-contracts', 'web3', 'staking', 'tokenomics', 'wallet-integration'];
      requirements = ['wallet-integration', 'decentralized', 'defi-protocols'];
      purpose = 'DeFi application with staking';
      console.log('🔗 Detected: Blockchain DeFi');
    }
    // Mobile Detection - More specific keywords
    else if (input.toLowerCase().includes('flutter') || input.toLowerCase().includes('aplicativo de delivery') || input.toLowerCase().includes('geolocalização') || input.toLowerCase().includes('chat em tempo real')) {
      domain = 'mobile';
      technology = 'flutter';
      language = 'dart';
      features = ['geolocation', 'payments', 'chat', 'notifications', 'delivery-system'];
      requirements = ['real-time', 'offline-support', 'location-tracking'];
      purpose = 'food delivery mobile app';
      console.log('📱 Detected: Mobile Delivery App');
    }
    // Frontend Detection - More specific keywords
    else if (input.toLowerCase().includes('react') || input.toLowerCase().includes('frontend') || input.toLowerCase().includes('dashboard') || input.toLowerCase().includes('interface web')) {
      domain = 'frontend';
      technology = 'react';
      language = 'typescript';
      features = ['dashboard', 'authentication', 'charts', 'reports', 'web-interface'];
      requirements = ['real-time', 'responsive', 'data-visualization'];
      purpose = 'web application dashboard';
      console.log('🌐 Detected: Frontend Web App');
    }
    // Backend Detection - More specific keywords
    else if (input.toLowerCase().includes('api') || input.toLowerCase().includes('backend') || input.toLowerCase().includes('server') || input.toLowerCase().includes('express') || input.toLowerCase().includes('node.js')) {
      domain = 'backend';
      technology = 'express';
      language = 'javascript';
      features = ['api', 'authentication', 'database', 'middleware', 'rest-api'];
      requirements = ['scalable', 'secure', 'api-endpoints'];
      purpose = 'backend API service';
      console.log('⚙️ Detected: Backend API');
    }
    // HTML/CSS/JS Detection - HIGH PRIORITY for landing pages
    else if (input.toLowerCase().includes('html') || input.toLowerCase().includes('css') || input.toLowerCase().includes('javascript') || 
             input.toLowerCase().includes('landing page') || input.toLowerCase().includes('página') || 
             (input.toLowerCase().includes('copywrite') && input.toLowerCase().includes('html'))) {
      domain = 'frontend';
      technology = 'html';
      language = 'javascript';
      features = ['styling', 'responsive', 'interactive', 'copywrite'];
      requirements = ['modern', 'responsive', 'user-friendly'];
      purpose = 'HTML landing page with copywriting';
      console.log('🌐 Detected: HTML Landing Page');
    }
    // Content Detection - More specific keywords (only for pure scripts)
    else if ((input.toLowerCase().includes('roteiro') || input.toLowerCase().includes('youtube') || input.toLowerCase().includes('script') || input.toLowerCase().includes('viral') || input.toLowerCase().includes('marketing digital')) &&
             !input.toLowerCase().includes('html') && !input.toLowerCase().includes('css') && !input.toLowerCase().includes('javascript')) {
      domain = 'content';
      technology = 'markdown';
      language = 'markdown';
      features = ['script-writing', 'content-creation', 'video-script', 'marketing-content'];
      requirements = ['engaging', 'viral', 'youtube-optimized'];
      purpose = 'YouTube viral script';
      console.log('📝 Detected: Content Script');
    }
    
    response = {
      choices: [{
        message: {
          content: JSON.stringify({
            "domain": domain,
            "technology": technology,
            "language": language,
            "features": features,
            "requirements": requirements,
            "purpose": purpose
          })
        }
      }]
    };
  } else if (userMessage.includes('Gere até 5 perguntas')) {
    // Dynamic questions generation based on intent
    const intentMatch = userMessage.match(/INTENT: ({.+?})/);
    let questions = [];
    
    if (intentMatch) {
      try {
        const intent = JSON.parse(intentMatch[1]);
        
        if (intent.domain === 'ai') {
          questions = [
            {
              "id": "ml-framework",
              "text": "Qual framework de ML você prefere?",
              "type": "choice",
              "options": ["TensorFlow", "PyTorch", "Scikit-learn", "Hugging Face"]
            },
            {
              "id": "data-source",
              "text": "Qual será a fonte dos dados?",
              "type": "choice",
              "options": ["CSV", "Database", "API", "Real-time streams"]
            }
          ];
        } else if (intent.domain === 'blockchain') {
          questions = [
            {
              "id": "blockchain-platform",
              "text": "Qual plataforma blockchain?",
              "type": "choice",
              "options": ["Ethereum", "Solana", "Polygon", "BSC"]
            },
            {
              "id": "wallet-integration",
              "text": "Qual wallet integrar?",
              "type": "choice",
              "options": ["MetaMask", "WalletConnect", "Coinbase", "Phantom"]
            }
          ];
        } else if (intent.domain === 'mobile') {
          questions = [
            {
              "id": "platform",
              "text": "Para quais plataformas?",
              "type": "choice",
              "options": ["iOS", "Android", "Ambos"]
            },
            {
              "id": "payment-method",
              "text": "Método de pagamento?",
              "type": "choice",
              "options": ["Stripe", "PayPal", "Apple Pay", "Google Pay"]
            }
          ];
        } else {
          questions = [
            {
              "id": "ui-framework",
              "text": "Qual framework de UI você prefere?",
              "type": "choice",
              "options": ["Material-UI", "Ant Design", "Chakra UI", "Bootstrap"]
            },
            {
              "id": "auth-provider",
              "text": "Qual provedor de autenticação?",
              "type": "choice",
              "options": ["Firebase", "Auth0", "Custom JWT", "OAuth"]
            }
          ];
        }
      } catch (e) {
        questions = [
          {
            "id": "tech-preference",
            "text": "Qual tecnologia você prefere?",
            "type": "choice",
            "options": ["React", "Vue", "Angular", "HTML/CSS/JS"]
          }
        ];
      }
    }
    
    response = {
      choices: [{
        message: {
          content: JSON.stringify(questions)
        }
      }]
    };
  } else if (userMessage.includes('Com base no intent e contexto fornecidos, projete uma arquitetura')) {
    // Dynamic architecture design
    const intentMatch = userMessage.match(/INTENT: ({.+?})/);
    let architecture = {};
    
    if (intentMatch) {
      try {
        const intent = JSON.parse(intentMatch[1]);
        
        if (intent.domain === 'ai') {
          architecture = {
            "type": "ai-ml-system",
            "framework": "tensorflow",
            "language": "python",
            "buildTool": "pip",
            "packageManager": "pip",
            "dependencies": ["tensorflow", "numpy", "pandas", "scikit-learn", "flask"],
            "devDependencies": ["jupyter", "pytest", "black"],
            "scripts": {
              "start": "python app.py",
              "train": "python train_model.py",
              "test": "pytest",
              "dev": "jupyter notebook"
            },
            "structure": ["src/", "models/", "data/", "notebooks/", "tests/"],
            "validations": ["model-training", "api-testing", "data-validation"],
            "estimatedTime": "45"
          };
        } else if (intent.domain === 'blockchain') {
          architecture = {
            "type": "defi-application",
            "framework": "hardhat",
            "language": "solidity",
            "buildTool": "hardhat",
            "packageManager": "npm",
            "dependencies": ["hardhat", "ethers", "web3", "react", "next.js"],
            "devDependencies": ["@nomiclabs/hardhat-ethers", "chai", "mocha"],
            "scripts": {
              "start": "npm run dev",
              "build": "hardhat compile",
              "test": "hardhat test",
              "deploy": "hardhat run scripts/deploy.js"
            },
            "structure": ["contracts/", "scripts/", "frontend/", "tests/"],
            "validations": ["contract-compilation", "frontend-build", "integration-testing"],
            "estimatedTime": "60"
          };
        } else if (intent.domain === 'mobile') {
          architecture = {
            "type": "mobile-application",
            "framework": "flutter",
            "language": "dart",
            "buildTool": "flutter",
            "packageManager": "pub",
            "dependencies": ["flutter", "geolocator", "http", "provider"],
            "devDependencies": ["flutter_test", "integration_test"],
            "scripts": {
              "start": "flutter run",
              "build": "flutter build apk",
              "test": "flutter test",
              "dev": "flutter run --debug"
            },
            "structure": ["lib/", "assets/", "test/", "android/", "ios/"],
            "validations": ["flutter-build", "unit-tests", "integration-tests"],
            "estimatedTime": "50"
          };
        } else {
          architecture = {
            "type": "web-application",
            "framework": "react",
            "language": "typescript",
            "buildTool": "vite",
            "packageManager": "npm",
            "dependencies": ["react", "react-dom", "typescript", "vite"],
            "devDependencies": ["@types/react", "@types/react-dom", "jest", "eslint"],
            "scripts": {
              "start": "npm run dev",
              "build": "npm run build",
              "test": "npm test",
              "dev": "vite"
            },
            "structure": ["src/", "public/", "tests/"],
            "validations": ["build-test", "unit-tests", "linting"],
            "estimatedTime": "30"
          };
        }
      } catch (e) {
        architecture = {
          "type": "generic-project",
          "framework": "unknown",
          "language": "javascript",
          "buildTool": "npm",
          "packageManager": "npm",
          "dependencies": [],
          "devDependencies": [],
          "scripts": {},
          "structure": [],
          "validations": [],
          "estimatedTime": "20"
        };
      }
    }
    
    response = {
      choices: [{
        message: {
          content: JSON.stringify(architecture)
        }
      }]
    };
  } else if (userMessage.includes('Com base no intent e contexto fornecidos, gere uma lista completa de tasks')) {
    // Dynamic task generation
    const intentMatch = userMessage.match(/INTENT: ({.+?})/);
    let tasks = [];
    
    if (intentMatch) {
      try {
        const intent = JSON.parse(intentMatch[1]);
        
        if (intent.domain === 'ai') {
          tasks = [
            {
              "description": "Initialize Python AI project",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "python -m venv venv && source venv/bin/activate && pip install tensorflow numpy pandas" },
              "dependencies": [],
              "phase": "setup"
            },
            {
              "description": "Create AI model structure",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "src/model.py", "content": "# AI Model implementation" },
              "dependencies": [],
              "phase": "implementation"
            },
            {
              "description": "Validate AI model training",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "python -c 'import tensorflow as tf; print(\"TensorFlow OK\")'" },
              "dependencies": [],
              "phase": "validation"
            }
          ];
        } else if (intent.domain === 'blockchain') {
          tasks = [
            {
              "description": "Initialize Hardhat project",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "npx hardhat init" },
              "dependencies": [],
              "phase": "setup"
            },
            {
              "description": "Create smart contract",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "contracts/DeFi.sol", "content": "// Smart contract implementation" },
              "dependencies": [],
              "phase": "implementation"
            },
            {
              "description": "Compile smart contracts",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "npx hardhat compile" },
              "dependencies": [],
              "phase": "validation"
            }
          ];
        } else if (intent.domain === 'mobile') {
          tasks = [
            {
              "description": "Initialize Flutter project",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "flutter create ." },
              "dependencies": [],
              "phase": "setup"
            },
            {
              "description": "Create main app structure",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "lib/main.dart", "content": "// Flutter app implementation" },
              "dependencies": [],
              "phase": "implementation"
            },
            {
              "description": "Validate Flutter build",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "flutter analyze" },
              "dependencies": [],
              "phase": "validation"
            }
          ];
        } else if (intent.domain === 'frontend' && intent.technology === 'html') {
          tasks = [
            {
              "description": "Create HTML project structure",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "index.html", "content": "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Landing Page</title>\n    <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n    <header>\n        <h1>Bem-vindo à Nossa Landing Page</h1>\n    </header>\n    <main>\n        <section class=\"hero\">\n            <h2>Descubra o Segredo que 95% das Pessoas Não Conhecem</h2>\n            <p class=\"subtitle\">Método Comprovado que Já Transformou Mais de 10.000 Negócios</p>\n            <button class=\"cta-button\">QUERO GARANTIR MINHA VAGA AGORA!</button>\n        </section>\n    </main>\n    <footer>\n        <p>© 2024 Landing Page. Todos os direitos reservados.</p>\n    </footer>\n    <script src=\"script.js\"></script>\n</body>\n</html>" },
              "dependencies": [],
              "phase": "setup"
            },
            {
              "description": "Create CSS styles",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "style.css", "content": "body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n}\n\nheader {\n    text-align: center;\n    padding: 2rem;\n}\n\n.hero {\n    text-align: center;\n    padding: 4rem 2rem;\n}\n\n.cta-button {\n    background: #ff6b6b;\n    color: white;\n    border: none;\n    padding: 1rem 2rem;\n    font-size: 1.2rem;\n    border-radius: 5px;\n    cursor: pointer;\n    margin-top: 2rem;\n}\n\n.cta-button:hover {\n    background: #ff5252;\n}" },
              "dependencies": [],
              "phase": "implementation"
            },
            {
              "description": "Create JavaScript functionality",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "script.js", "content": "document.addEventListener('DOMContentLoaded', function() {\n    const ctaButton = document.querySelector('.cta-button');\n    \n    ctaButton.addEventListener('click', function() {\n        alert('Obrigado pelo interesse! Em breve entraremos em contato.');\n    });\n});" },
              "dependencies": [],
              "phase": "implementation"
            }
          ];
        } else if (intent.domain === 'content') {
          tasks = [
            {
              "description": "Create content script structure",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "script.md", "content": "# Roteiro Viral para YouTube\n\n## ⏱️ Timing: 1 minuto (60 segundos)\n\n## 🎯 Hook (0-5 segundos)\n\"Você sabia que 90% das pessoas perdem dinheiro online porque não conhecem este segredo do marketing digital?\"\n\n## 📝 Conteúdo Principal (5-50 segundos)\n### Ponto 1: O Problema (5-20 segundos)\n- A maioria das pessoas tenta vender sem estratégia\n- Resultado: frustração e perda de tempo\n\n### Ponto 2: A Solução (20-40 segundos)\n- Marketing digital baseado em dados\n- Estratégias comprovadas que funcionam\n- Resultado: vendas consistentes\n\n### Ponto 3: Prova Social (40-50 segundos)\n- \"Mais de 1000 pessoas já transformaram seus negócios\"\n- \"Resultados em apenas 30 dias\"\n\n## 🚀 Call-to-Action (50-60 segundos)\n- \"Quer saber como? Deixe um comentário com a palavra 'QUERO' abaixo\"\n- \"Curta este vídeo se foi útil para você\"\n- \"Se inscreva no canal para mais dicas de marketing digital\"\n\n---\n*Script criado dinamicamente pelo FLUI AutoCode-Forge*" },
              "dependencies": [],
              "phase": "setup"
            }
          ];
        } else {
          tasks = [
            {
              "description": "Initialize React project",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "npx create-react-app . --template typescript" },
              "dependencies": [],
              "phase": "setup"
            },
            {
              "description": "Create main component",
              "type": "tool",
              "toolName": "file_write",
              "parameters": { "filePath": "src/App.tsx", "content": "// React component implementation" },
              "dependencies": [],
              "phase": "implementation"
            },
            {
              "description": "Validate React build",
              "type": "tool",
              "toolName": "shell",
              "parameters": { "command": "npm run build" },
              "dependencies": [],
              "phase": "validation"
            }
          ];
        }
      } catch (e) {
        tasks = [
          {
            "description": "Generic project setup",
            "type": "tool",
            "toolName": "shell",
            "parameters": { "command": "echo 'Project initialized'" },
            "dependencies": [],
            "phase": "setup"
          }
        ];
      }
    }
    
    response = {
      choices: [{
        message: {
          content: JSON.stringify(tasks)
        }
      }]
    };
  } else {
    // Default response
    response = {
      choices: [{
        message: {
          content: JSON.stringify({
            "domain": "unknown",
            "technology": null,
            "language": null,
            "features": [],
            "requirements": [],
            "purpose": null
          })
        }
      }]
    };
  }
  
  console.log('🤖 Mock API Response:', response);
  res.json(response);
});

app.get('/v1/models', (req, res) => {
  res.json({
    data: [
      { id: 'gpt-4', object: 'model' },
      { id: 'gpt-3.5-turbo', object: 'model' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Pollinations API running on http://localhost:${PORT}`);
  console.log('📡 Ready to receive LLM requests!');
});
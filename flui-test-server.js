const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'API Flui - Test Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});

// CodeForge health endpoint
app.get('/v1/code-forge/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

// CodeForge process input endpoint
app.post('/v1/code-forge/process-input', (req, res) => {
  const { input, userId } = req.body;
  
  console.log('=== CODE FORGE INPUT PROCESSING ===');
  console.log('Input:', input);
  console.log('User ID:', userId || 'default');
  console.log('===================================');
  
  res.json({
    success: true,
    data: {
      intent: {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium',
        features: ['authentication', 'routing', 'styling'],
        requirements: []
      },
      questions: [
        { id: 'tech-1', text: 'Qual tecnologia você prefere?', type: 'choice', options: ['React', 'Vue', 'Angular'] },
        { id: 'lang-2', text: 'Qual linguagem?', type: 'choice', options: ['TypeScript', 'JavaScript'] },
        { id: 'purpose-3', text: 'Qual o propósito do projeto?', type: 'text' },
        { id: 'complexity-4', text: 'Qual a complexidade?', type: 'choice', options: ['simple', 'medium', 'advanced'] },
        { id: 'features-5', text: 'Quais features você precisa?', type: 'multiselect', options: ['authentication', 'routing', 'styling', 'testing'] }
      ],
      confidence: 0.85
    }
  });
});

// CodeForge process answers endpoint
app.post('/v1/code-forge/process-answers', (req, res) => {
  const { answers, userId } = req.body;
  
  console.log('=== CODE FORGE ANSWERS PROCESSING ===');
  console.log('Answers:', answers);
  console.log('User ID:', userId || 'default');
  console.log('=====================================');
  
  res.json({
    success: true,
    data: {
      intent: {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium',
        features: ['authentication', 'routing', 'styling', 'testing'],
        requirements: []
      },
      questions: [],
      confidence: 0.95
    }
  });
});

// CodeForge create project endpoint
app.post('/v1/code-forge/create-project', (req, res) => {
  const { intent, userId } = req.body;
  
  console.log('=== CODE FORGE PROJECT CREATION ===');
  console.log('Intent:', intent);
  console.log('User ID:', userId || 'default');
  console.log('===================================');
  
  const projectId = 'project-' + Date.now();
  
  res.json({
    success: true,
    data: {
      projectId: projectId,
      status: 'creating',
      message: 'Project creation initiated'
    }
  });
});

// CodeForge project status endpoint
app.get('/v1/code-forge/project-status/:userId/:projectId', (req, res) => {
  const { userId, projectId } = req.params;
  
  console.log('=== CODE FORGE PROJECT STATUS ===');
  console.log('User ID:', userId);
  console.log('Project ID:', projectId);
  console.log('=================================');
  
  res.json({
    success: true,
    data: {
      status: 'ready',
      progress: 100,
      currentTask: 'Project completed',
      errors: [],
      warnings: []
    }
  });
});

// CodeForge interactive message endpoint
app.post('/v1/code-forge/interactive-message', (req, res) => {
  const { message, userId } = req.body;
  
  console.log('=== CODE FORGE INTERACTIVE MESSAGE ===');
  console.log('Message:', message);
  console.log('User ID:', userId || 'default');
  console.log('=====================================');
  
  res.json({
    success: true,
    data: {
      response: 'Mensagem processada com sucesso!',
      modificationRequest: null,
      downloadRequest: null
    }
  });
});

// CodeForge conversation context endpoint
app.get('/v1/code-forge/conversation-context/:userId', (req, res) => {
  const { userId } = req.params;
  
  console.log('=== CODE FORGE CONVERSATION CONTEXT ===');
  console.log('User ID:', userId);
  console.log('======================================');
  
  res.json({
    success: true,
    data: {
      userId: userId,
      sessionId: 'session-' + Date.now(),
      conversationHistory: [],
      pendingQuestions: [],
      currentProject: null
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 FLUI Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CodeForge API: http://localhost:${PORT}/v1/code-forge`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
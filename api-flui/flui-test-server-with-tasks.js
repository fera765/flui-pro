const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'API Flui - Test Server with Tasks',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});

// Mock task storage
const tasks = new Map();
const taskEvents = new Map();

// TASK ROUTES - Implementação das 3 rotas principais
// 1. POST /v1/tasks - Criar uma nova task
app.post('/v1/tasks', (req, res) => {
  const { prompt } = req.body;
  
  console.log('=== TASK CREATION ===');
  console.log('Prompt:', prompt);
  console.log('====================');
  
  if (!prompt) {
    return res.status(400).json({ 
      success: false,
      error: 'Prompt is required' 
    });
  }

  const taskId = uuidv4();
  const task = {
    id: taskId,
    prompt: prompt,
    status: 'created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 0,
    result: null,
    error: null
  };

  tasks.set(taskId, task);
  taskEvents.set(taskId, [{
    type: 'taskCreated',
    timestamp: new Date().toISOString(),
    data: { taskId, prompt }
  }]);

  res.status(201).json({
    success: true,
    data: task
  });
});

// 2. POST /v1/tasks/:id/execute - Executar uma task
app.post('/v1/tasks/:id/execute', (req, res) => {
  const { id } = req.params;
  
  console.log('=== TASK EXECUTION ===');
  console.log('Task ID:', id);
  console.log('======================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ 
      success: false,
      error: 'Task not found' 
    });
  }

  // Simular execução da task
  task.status = 'running';
  task.updatedAt = new Date().toISOString();
  task.progress = 50;

  // Adicionar evento
  const events = taskEvents.get(id) || [];
  events.push({
    type: 'taskStarted',
    timestamp: new Date().toISOString(),
    data: { taskId: id, status: 'running' }
  });
  taskEvents.set(id, events);

  // Simular resultado da execução
  setTimeout(() => {
    task.status = 'completed';
    task.updatedAt = new Date().toISOString();
    task.progress = 100;
    task.result = {
      message: 'Task executed successfully',
      output: 'Landing page created with HTML, CSS and JavaScript',
      files: ['index.html', 'style.css', 'script.js'],
      timestamp: new Date().toISOString()
    };

    // Adicionar evento de conclusão
    const events = taskEvents.get(id) || [];
    events.push({
      type: 'taskCompleted',
      timestamp: new Date().toISOString(),
      data: { taskId: id, result: task.result }
    });
    taskEvents.set(id, events);
  }, 2000);

  res.json({
    success: true,
    data: {
      taskId: id,
      status: 'executing',
      message: 'Task execution started',
      estimatedTime: '2-5 seconds'
    }
  });
});

// 3. GET /v1/tasks/:id/status - Verificar status da task
app.get('/v1/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  
  console.log('=== TASK STATUS ===');
  console.log('Task ID:', id);
  console.log('===================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ 
      success: false,
      error: 'Task not found' 
    });
  }

  res.json({
    success: true,
    data: {
      id: task.id,
      status: task.status,
      progress: task.progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      result: task.result,
      error: task.error
    }
  });
});

// ROTAS ADICIONAIS PARA COMPLETAR O TESTE

// GET /v1/tasks - Listar todas as tasks
app.get('/v1/tasks', (req, res) => {
  const { status, type, depth } = req.query;
  
  console.log('=== LIST TASKS ===');
  console.log('Filters:', { status, type, depth });
  console.log('==================');
  
  let filteredTasks = Array.from(tasks.values());
  
  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status);
  }
  
  res.json({
    success: true,
    data: {
      tasks: filteredTasks,
      count: filteredTasks.length,
      filter: { status, type, depth }
    }
  });
});

// GET /v1/tasks/:id - Obter detalhes da task
app.get('/v1/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('=== GET TASK ===');
  console.log('Task ID:', id);
  console.log('================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ 
      success: false,
      error: 'Task not found' 
    });
  }

  res.json({
    success: true,
    data: task
  });
});

// GET /v1/tasks/:id/events - Obter eventos da task
app.get('/v1/tasks/:id/events', (req, res) => {
  const { id } = req.params;
  
  console.log('=== TASK EVENTS ===');
  console.log('Task ID:', id);
  console.log('===================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const events = taskEvents.get(id) || [];
  
  res.json({
    success: true,
    data: {
      taskId: id,
      events: events,
      count: events.length
    }
  });
});

// POST /v1/tasks/:id/delegate - Delegar task
app.post('/v1/tasks/:id/delegate', (req, res) => {
  const { id } = req.params;
  
  console.log('=== TASK DELEGATION ===');
  console.log('Task ID:', id);
  console.log('=======================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ 
      success: false,
      error: 'Task not found' 
    });
  }

  res.json({
    success: true,
    data: {
      taskId: id,
      status: 'delegated',
      message: 'Task delegated to specialized agent',
      agent: 'autonomous-agent-001'
    }
  });
});

// POST /v1/tasks/:id/retry - Retry task
app.post('/v1/tasks/:id/retry', (req, res) => {
  const { id } = req.params;
  
  console.log('=== TASK RETRY ===');
  console.log('Task ID:', id);
  console.log('==================');
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Task ID is required' 
    });
  }

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ 
      success: false,
      error: 'Task not found' 
    });
  }

  // Reset task status
  task.status = 'retrying';
  task.updatedAt = new Date().toISOString();
  task.progress = 0;
  task.error = null;

  res.json({
    success: true,
    data: {
      taskId: id,
      status: 'retrying',
      message: 'Task retry initiated',
      retryCount: (task.retryCount || 0) + 1
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Flui - Test Server with Tasks',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      tasks: '/v1/tasks',
      createTask: 'POST /v1/tasks',
      executeTask: 'POST /v1/tasks/:id/execute',
      getTaskStatus: 'GET /v1/tasks/:id/status',
      getTask: 'GET /v1/tasks/:id',
      listTasks: 'GET /v1/tasks',
      getTaskEvents: 'GET /v1/tasks/:id/events',
      delegateTask: 'POST /v1/tasks/:id/delegate',
      retryTask: 'POST /v1/tasks/:id/retry'
    },
    status: 'running'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 FLUI Test Server with Tasks running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Tasks API: http://localhost:${PORT}/v1/tasks`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /v1/tasks - Create task`);
  console.log(`   POST /v1/tasks/:id/execute - Execute task`);
  console.log(`   GET /v1/tasks/:id/status - Get task status`);
  console.log(`   GET /v1/tasks - List tasks`);
  console.log(`   GET /v1/tasks/:id - Get task details`);
  console.log(`   GET /v1/tasks/:id/events - Get task events`);
  console.log(`   POST /v1/tasks/:id/delegate - Delegate task`);
  console.log(`   POST /v1/tasks/:id/retry - Retry task`);
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
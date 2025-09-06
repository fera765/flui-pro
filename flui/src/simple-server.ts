import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS manual
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Flui Agent is running',
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Simple task creation endpoint
app.post('/autocode/task', (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Simulate task creation
  const task = {
    id: `task_${Date.now()}`,
    prompt,
    status: 'created',
    createdAt: new Date().toISOString(),
    projectPath: `/tmp/project_${Date.now()}`,
    microTasks: [
      {
        id: 'mt_1',
        type: 'file_create',
        path: 'package.json',
        status: 'pending'
      },
      {
        id: 'mt_2', 
        type: 'file_create',
        path: 'src/App.tsx',
        status: 'pending'
      }
    ]
  };

  res.status(201).json({
    success: true,
    task,
    message: 'Task created successfully (simulated)'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Flui Agent is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});

export default app;
import { Router, Request, Response } from 'express';
import { AdvancedOrchestrator } from '../core/advancedOrchestrator';

export function advancedTaskRoutes(orchestrator: AdvancedOrchestrator): Router {
  const router = Router();

  // Create a new task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      console.log('=== FLUI TASK CREATION ===');
      console.log('Prompt:', prompt);
      console.log('========================');

      const task = await orchestrator.createTask(prompt);
      
      return res.status(201).json({
        success: true,
        data: task
      });
    } catch (error: any) {
      console.error('Task creation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create task',
        details: error.message 
      });
    }
  });

  // Execute a task
  router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      console.log('=== FLUI TASK EXECUTION ===');
      console.log('Task ID:', id);
      console.log('===========================');

      const result = await orchestrator.executeTask(id);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Task execution error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Task execution failed',
        details: error.message 
      });
    }
  });

  // Get task status
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      const task = orchestrator.getTask(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const context = orchestrator.getContext(id);
      
      return res.json({
        success: true,
        data: {
          task,
          context: context ? {
            mainTask: context.mainTask,
            todos: context.todos,
            completedTasks: context.completedTasks,
            generatedFiles: context.generatedFiles,
            globalContext: context.globalContext
          } : undefined
        }
      });
    } catch (error: any) {
      console.error('Task retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve task',
        details: error.message 
      });
    }
  });

  // Get task events (for streaming)
  router.get('/:id/events', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      const events = orchestrator.getTaskEvents(id);
      
      return res.json({
        success: true,
        data: events
      });
    } catch (error: any) {
      console.error('Events retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve events',
        details: error.message 
      });
    }
  });

  // Stream task events (SSE)
  router.get('/:id/stream', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }
      
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send existing events
      const existingEvents = orchestrator.getTaskEvents(id);
      for (const event of existingEvents) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      // Keep connection alive and send new events
      const interval = setInterval(() => {
        const newEvents = orchestrator.getTaskEvents(id);
        if (newEvents.length > existingEvents.length) {
          const latestEvents = newEvents.slice(existingEvents.length);
          for (const event of latestEvents) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        }
      }, 1000);

      // Clean up on disconnect
      req.on('close', () => {
        clearInterval(interval);
      });

      return; // SSE endpoint doesn't need to return a response

    } catch (error: any) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
      return;
    }
  });

  // Get all tasks
  router.get('/', async (req: Request, res: Response) => {
    try {
      const tasks = orchestrator.getAllTasks();
      
      return res.json({
        success: true,
        data: tasks
      });
    } catch (error: any) {
      console.error('Tasks retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve tasks',
        details: error.message 
      });
    }
  });

  return router;
}
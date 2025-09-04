import { Router, Request, Response } from 'express';
import { Orchestrator } from '../core/orchestrator';

export function taskRoutes(orchestrator: Orchestrator): Router {
  const router = Router();

  // Create a new task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

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

      const result = await orchestrator.executeTask(id);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Task execution error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to execute task',
        details: error.message 
      });
    }
  });

  // Delegate a task
  router.post('/:id/delegate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const result = await orchestrator.delegateTask(id);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Task delegation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delegate task',
        details: error.message 
      });
    }
  });

  // Retry a failed task
  router.post('/:id/retry', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const result = await orchestrator.retryTask(id);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Task retry error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retry task',
        details: error.message 
      });
    }
  });

  // Get task status
  router.get('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const status = orchestrator.getTaskStatus(id);
      
      if (!status) {
        return res.status(404).json({ 
          success: false,
          error: 'Task not found' 
        });
      }

      return res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('Task status error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get task status',
        details: error.message 
      });
    }
  });

  // Get task details
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const task = orchestrator.getTask(id);
      
      if (!task) {
        return res.status(404).json({ 
          success: false,
          error: 'Task not found' 
        });
      }

      return res.json({
        success: true,
        data: task
      });
    } catch (error: any) {
      console.error('Task retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get task',
        details: error.message 
      });
    }
  });

  // List all tasks
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { status, type, depth } = req.query;
      
      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (depth) filter.depth = parseInt(depth as string);

      const tasks = orchestrator.listTasks(filter);
      
      return res.json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
          filter
        }
      });
    } catch (error: any) {
      console.error('Task list error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to list tasks',
        details: error.message 
      });
    }
  });

  // Get task events
  router.get('/:id/events', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const events = orchestrator.getTaskEvents(id);
      
      return res.json({
        success: true,
        data: {
          taskId: id,
          events,
          count: events.length
        }
      });
    } catch (error: any) {
      console.error('Task events error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get task events',
        details: error.message 
      });
    }
  });

  return router;
}
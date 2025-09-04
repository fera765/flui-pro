import { Router, Request, Response } from 'express';
import { Orchestrator } from '../core/orchestrator';

export function streamRoutes(orchestrator: Orchestrator): Router {
  const router = Router();

  // SSE endpoint for task streaming
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({
      taskId: id,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established'
    })}\n\n`);

    // Get historical events
    const historicalEvents = orchestrator.getTaskEvents(id);
    for (const event of historicalEvents) {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      })}\n\n`);
    }

    // Send a separator event
    res.write(`event: stream_start\ndata: ${JSON.stringify({
      taskId: id,
      timestamp: new Date().toISOString(),
      message: 'Real-time events will follow',
      historicalCount: historicalEvents.length
    })}\n\n`);

    // Set up real-time event monitoring
    const checkInterval = setInterval(async () => {
      try {
        const currentEvents = orchestrator.getTaskEvents(id);
        const newEvents = currentEvents.slice(historicalEvents.length);
        
        for (const event of newEvents) {
          res.write(`event: ${event.type}\ndata: ${JSON.stringify({
            ...event,
            timestamp: event.timestamp.toISOString()
          })}\n\n`);
        }
        
        // Update historical events count
        historicalEvents.length = currentEvents.length;
        
        // Check if task is completed or failed
        const task = orchestrator.getTask(id);
        if (task && (task.status === 'completed' || task.status === 'failed')) {
          res.write(`event: stream_end\ndata: ${JSON.stringify({
            taskId: id,
            timestamp: new Date().toISOString(),
            message: 'Task completed, ending stream',
            finalStatus: task.status
          })}\n\n`);
          
          clearInterval(checkInterval);
          res.end();
        }
      } catch (error) {
        console.error('Stream monitoring error:', error);
        res.write(`event: error\ndata: ${JSON.stringify({
          taskId: id,
          timestamp: new Date().toISOString(),
          error: 'Stream monitoring error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`);
      }
    }, 1000); // Check every second

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(checkInterval);
      console.log(`SSE stream closed for task ${id}`);
    });

    // Handle errors
    req.on('error', (error) => {
      clearInterval(checkInterval);
      console.error(`SSE stream error for task ${id}:`, error);
    });
  });

  // Health check for SSE
  router.get('/health', (_req: Request, res: Response) => {
    return res.json({
      status: 'healthy',
      service: 'SSE Stream',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
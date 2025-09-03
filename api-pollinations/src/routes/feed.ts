import { Router, Request, Response } from 'express';
import { PollinationsClient } from '../lib/pollinationsClient';

export function feedRoutes(_client: PollinationsClient): Router {
  const router = Router();

  // GET /v1/feed/image - Image feed stream
  router.get('/image', async (req: Request, res: Response) => {
    try {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial connection message
      res.write('data: {"type": "connection", "status": "connected"}\n\n');

      // For now, we'll simulate the feed since we don't have direct access to Pollinations feed
      // In production, you'd connect to the actual Pollinations feed endpoints
      const simulateImageFeed = () => {
        const mockImageEvent = {
          type: 'image.generated',
          timestamp: new Date().toISOString(),
          data: {
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 1000000),
            model: 'flux',
            imageURL: `https://image.pollinations.ai/prompt/sample_${Date.now()}`,
            prompt: 'Sample generated image'
          }
        };

        res.write(`data: ${JSON.stringify(mockImageEvent)}\n\n`);
      };

      // Send a sample event every 10 seconds
      const interval = setInterval(simulateImageFeed, 10000);

      // Send initial event
      simulateImageFeed();

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(interval);
        res.end();
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });

    } catch (error: any) {
      console.error('Image feed error:', error);
      res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
      res.end();
    }
  });

  // GET /v1/feed/text - Text feed stream
  router.get('/text', async (req: Request, res: Response) => {
    try {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial connection message
      res.write('data: {"type": "connection", "status": "connected"}\n\n');

      // Simulate text feed
      const simulateTextFeed = () => {
        const mockTextEvent = {
          type: 'text.generated',
          timestamp: new Date().toISOString(),
          data: {
            response: 'This is a sample generated text response.',
            model: 'openai',
            messages: [
              {
                role: 'user',
                content: 'Sample user prompt'
              }
            ]
          }
        };

        res.write(`data: ${JSON.stringify(mockTextEvent)}\n\n`);
      };

      // Send a sample event every 15 seconds
      const interval = setInterval(simulateTextFeed, 15000);

      // Send initial event
      simulateTextFeed();

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(interval);
        res.end();
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });

    } catch (error: any) {
      console.error('Text feed error:', error);
      res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
      res.end();
    }
  });

  // GET /v1/feed/combined - Combined feed stream
  router.get('/combined', async (req: Request, res: Response) => {
    try {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial connection message
      res.write('data: {"type": "connection", "status": "connected"}\n\n');

      // Simulate combined feed
      let eventCounter = 0;
      const simulateCombinedFeed = () => {
        eventCounter++;
        
        if (eventCounter % 2 === 0) {
          // Image event
          const mockImageEvent = {
            type: 'image.generated',
            timestamp: new Date().toISOString(),
            data: {
              width: 1024,
              height: 1024,
              seed: Math.floor(Math.random() * 1000000),
              model: 'flux',
              imageURL: `https://image.pollinations.ai/prompt/combined_${Date.now()}`,
              prompt: 'Combined feed image'
            }
          };
          res.write(`data: ${JSON.stringify(mockImageEvent)}\n\n`);
        } else {
          // Text event
          const mockTextEvent = {
            type: 'text.generated',
            timestamp: new Date().toISOString(),
            data: {
              response: 'Combined feed text response.',
              model: 'openai',
              messages: [
                {
                  role: 'user',
                  content: 'Combined feed prompt'
                }
              ]
            }
          };
          res.write(`data: ${JSON.stringify(mockTextEvent)}\n\n`);
        }
      };

      // Send events every 8 seconds
      const interval = setInterval(simulateCombinedFeed, 8000);

      // Send initial event
      simulateCombinedFeed();

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(interval);
        res.end();
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });

    } catch (error: any) {
      console.error('Combined feed error:', error);
      res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
      res.end();
    }
  });

  // GET /v1/feed/status - Get feed status
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const status = {
        feeds: {
          image: {
            status: 'active',
            endpoint: '/v1/feed/image',
            description: 'Real-time image generation feed'
          },
          text: {
            status: 'active',
            endpoint: '/v1/feed/text',
            description: 'Real-time text generation feed'
          },
          combined: {
            status: 'active',
            endpoint: '/v1/feed/combined',
            description: 'Combined image and text feed'
          }
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };

      return res.json(status);
    } catch (error: any) {
      console.error('Feed status error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
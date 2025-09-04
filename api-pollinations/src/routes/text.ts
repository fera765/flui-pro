import { Router, Request, Response } from 'express';
import { PollinationsClient } from '../lib/pollinationsClient';

export function textRoutes(client: PollinationsClient): Router {
  const router = Router();

  // POST /completions - OpenAI-compatible chat endpoint
  router.post('/completions', async (req: Request, res: Response) => {
    try {
      const { model, messages, stream = false, ...otherParams } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages are required' });
      }

      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }

      // Map OpenAI model to Pollinations model
      const pollinationsModel = mapOpenAIModelToPollinations(model);

      // Prepare request for Pollinations
      const pollinationsRequest = {
        model: pollinationsModel,
        messages,
        stream,
        ...otherParams
      };

      if (stream) {
        // Handle streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          // For streaming, we need to handle the response differently
          // This is a simplified implementation - in production you'd want to
          // properly handle the SSE stream from Pollinations
          const response = await client.openaiCompatibleChat(pollinationsRequest);
          
          // Send the response as a single event for now
          res.write(`data: ${JSON.stringify(response)}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        } catch (error: any) {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
          return;
        }
      } else {
        // Handle non-streaming response
        const response = await client.openaiCompatibleChat(pollinationsRequest);
        return res.json(response);
      }

    } catch (error: any) {
      console.error('Chat completion error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/text/:prompt - Simple text generation endpoint
  router.get('/:prompt', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.params;
      const { 
        model = 'openai', 
        stream = false, 
        temperature, 
        top_p,
        seed,
        system,
        json: jsonResponse = false
      } = req.query;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Decode URL-encoded prompt
      const decodedPrompt = decodeURIComponent(prompt);

      // Prepare options
      const options: any = {
        model: model as string,
        stream: stream === 'true'
      };

      if (temperature) options.temperature = parseFloat(temperature as string);
      if (top_p) options.top_p = parseFloat(top_p as string);
      if (seed) options.seed = parseInt(seed as string);
      if (system) options.system = decodeURIComponent(system as string);
      if (jsonResponse === 'true') options.json = true;

      // Generate text
      const response = await client.generateText(decodedPrompt, options);

      if (stream === 'true') {
        // Handle streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        res.write(`data: ${response}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } else {
        // Handle non-streaming
        if (jsonResponse === 'true') {
          return res.json({ response, prompt: decodedPrompt, model });
        } else {
          res.setHeader('Content-Type', 'text/plain');
          return res.send(response);
        }
      }

    } catch (error: any) {
      console.error('Text generation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

function mapOpenAIModelToPollinations(openaiModel: string): string {
  const modelMap: Record<string, string> = {
    'gpt-4': 'openai',
    'gpt-4-turbo': 'openai',
    'gpt-4-32k': 'openai',
    'gpt-3.5-turbo': 'openai',
    'gpt-3.5-turbo-16k': 'openai',
    'claude-3': 'claude-hybridspace',
    'claude-3-sonnet': 'claude-hybridspace',
    'claude-3-haiku': 'claude-hybridspace',
    'mistral': 'mistral'
  };

  return modelMap[openaiModel] || 'openai';
}
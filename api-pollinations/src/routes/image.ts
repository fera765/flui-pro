import { Router, Request, Response } from 'express';
import { PollinationsClient } from '../lib/pollinationsClient';

export function imageRoutes(client: PollinationsClient): Router {
  const router = Router();

  // POST /v1/images/generations - OpenAI-compatible endpoint
  router.post('/generations', async (req: Request, res: Response) => {
    try {
      const { prompt, size = '1024x1024', model, quality, n = 1 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (n > 1) {
        return res.status(400).json({ error: 'Only n=1 is supported' });
      }

      // Parse size parameter
      const sizeMatch = size.match(/^(\d+)x(\d+)$/);
      if (!sizeMatch) {
        return res.status(400).json({ 
          error: 'Invalid size format. Expected format: WIDTHxHEIGHT' 
        });
      }

      const [, widthStr, heightStr] = sizeMatch;
      const width = parseInt(widthStr);
      const height = parseInt(heightStr);

      // Validate size constraints
      const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
      if (!validSizes.includes(size)) {
        return res.status(400).json({ 
          error: `Invalid size. Allowed sizes: ${validSizes.join(', ')}` 
        });
      }

      // Map OpenAI parameters to Pollinations parameters
      const pollinationsOptions: any = {
        width,
        height,
        model: model === 'dall-e-2' || model === 'dall-e-3' ? 'flux' : 'flux'
      };

      // Map quality to enhance parameter
      if (quality === 'hd') {
        pollinationsOptions.enhance = true;
      }

      // Generate image
      const imageBuffer = await client.generateImage(prompt, pollinationsOptions);

      // Convert to base64 URL for OpenAI compatibility
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Return OpenAI-compatible response
      return res.json({
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: imageUrl,
            revised_prompt: prompt
          }
        ]
      });

    } catch (error: any) {
      console.error('Image generation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/images/generations/:prompt - Alternative endpoint for simple requests
  router.get('/generations/:prompt', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.params;
      const { width = '1024', height = '1024', model = 'flux' } = req.query;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Decode URL-encoded prompt
      const decodedPrompt = decodeURIComponent(prompt);

      // Parse dimensions
      const widthNum = parseInt(width as string);
      const heightNum = parseInt(height as string);

      if (isNaN(widthNum) || isNaN(heightNum)) {
        return res.status(400).json({ error: 'Invalid width or height' });
      }

      // Generate image
      const imageBuffer = await client.generateImage(decodedPrompt, {
        width: widthNum,
        height: heightNum,
        model: model as string
      });

      // Convert to base64 URL for OpenAI compatibility
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      // Return OpenAI-compatible response
      return res.json({
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: imageUrl,
            revised_prompt: decodedPrompt
          }
        ]
      });

    } catch (error: any) {
      console.error('Image generation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
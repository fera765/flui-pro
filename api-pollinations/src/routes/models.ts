import { Router, Request, Response } from 'express';
import { PollinationsClient } from '../lib/pollinationsClient';

export function modelsRoutes(client: PollinationsClient): Router {
  const router = Router();

  // GET /v1/models - OpenAI-compatible models endpoint
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      let models: string[] = [];

      if (type === 'image') {
        // Return only image models
        models = await client.getModels('image');
      } else if (type === 'text') {
        // Return only text models
        models = await client.getModels('text');
      } else {
        // Return all models
        const [imageModels, textModels] = await Promise.all([
          client.getModels('image'),
          client.getModels('text')
        ]);
        models = [...imageModels, ...textModels];
      }

      // Convert to OpenAI-compatible format
      const now = Math.floor(Date.now() / 1000);
      const openaiModels = models.map(modelId => ({
        id: modelId,
        object: 'model',
        created: now,
        owned_by: 'pollinations',
        permission: [
          {
            id: `modelperm-${modelId}`,
            object: 'model_permission',
            created: now,
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: true,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        root: modelId,
        parent: null
      }));

      res.json({
        object: 'list',
        data: openaiModels
      });

    } catch (error: any) {
      console.error('Models list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/models/:id - Get specific model info
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Model ID is required' });
      }

      // Get all models to check if the requested one exists
      const [imageModels, textModels] = await Promise.all([
        client.getModels('image'),
        client.getModels('text')
      ]);

      const allModels = [...imageModels, ...textModels];

      if (!allModels.includes(id)) {
        return res.status(404).json({ 
          error: 'Model not found',
          code: 'model_not_found'
        });
      }

      // Return model info in OpenAI format
      const now = Math.floor(Date.now() / 1000);
      const modelInfo = {
        id,
        object: 'model',
        created: now,
        owned_by: 'pollinations',
        permission: [
          {
            id: `modelperm-${id}`,
            object: 'model_permission',
            created: now,
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: true,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        root: id,
        parent: null
      };

      return res.json(modelInfo);

    } catch (error: any) {
      console.error('Model info error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/models/image - Get image models
  router.get('/image', async (_req: Request, res: Response) => {
    try {
      const models = await client.getModels('image');
      const imageModels = models.map(modelId => ({
        id: modelId,
        object: 'model',
        created: Date.now(),
        owned_by: 'pollinations',
        type: 'image'
      }));
      
      return res.json({
        object: 'list',
        data: imageModels,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching image models:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/models/text - Get text models
  router.get('/text', async (_req: Request, res: Response) => {
    try {
      const models = await client.getModels('text');
      const textModels = models.map(modelId => ({
        id: modelId,
        object: 'model',
        created: Date.now(),
        owned_by: 'pollinations',
        type: 'text'
      }));
      
      return res.json({
        object: 'list',
        data: textModels,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching text models:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/models/audio - Get audio models
  router.get('/audio', async (_req: Request, res: Response) => {
    try {
      // For audio, we return the available voices since Pollinations uses openai-audio model
      const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      const audioModels = voices.map(voice => ({
        id: `openai-audio-${voice}`,
        object: 'model',
        created: Date.now(),
        owned_by: 'pollinations',
        type: 'audio',
        voice: voice
      }));
      
      return res.json({
        object: 'list',
        data: audioModels,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching audio models:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
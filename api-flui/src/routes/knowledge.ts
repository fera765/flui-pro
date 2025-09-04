import { Router, Request, Response } from 'express';
import { KnowledgeManager } from '../core/knowledgeManager';
import { CreateKnowledgeSourceRequest, UpdateKnowledgeSourceRequest } from '../types/knowledge';

export function knowledgeRoutes(knowledgeManager: KnowledgeManager): Router {
  const router = Router();

  // Create a new knowledge source
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: CreateKnowledgeSourceRequest = req.body;
      
      if (!request.title || !request.content) {
        return res.status(400).json({ 
          success: false,
          error: 'Title and content are required' 
        });
      }

      const knowledgeSource = knowledgeManager.createKnowledgeSource(request);
      
      return res.status(201).json({
        success: true,
        data: knowledgeSource
      });
    } catch (error: any) {
      console.error('Knowledge source creation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create knowledge source',
        details: error.message 
      });
    }
  });

  // Get all knowledge sources
  router.get('/', async (req: Request, res: Response) => {
    try {
      const sources = knowledgeManager.getAllKnowledgeSources();
      
      return res.json({
        success: true,
        data: sources
      });
    } catch (error: any) {
      console.error('Get knowledge sources error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get knowledge sources',
        details: error.message 
      });
    }
  });

  // Get active knowledge sources only
  router.get('/active', async (req: Request, res: Response) => {
    try {
      const sources = knowledgeManager.getActiveKnowledgeSources();
      
      return res.json({
        success: true,
        data: sources
      });
    } catch (error: any) {
      console.error('Get active knowledge sources error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get active knowledge sources',
        details: error.message 
      });
    }
  });

  // Get knowledge context
  router.get('/context', async (req: Request, res: Response) => {
    try {
      const context = knowledgeManager.getKnowledgeContext();
      
      return res.json({
        success: true,
        data: context
      });
    } catch (error: any) {
      console.error('Get knowledge context error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get knowledge context',
        details: error.message 
      });
    }
  });

  // Get a specific knowledge source
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Knowledge source ID is required' });
      }

      const source = knowledgeManager.getKnowledgeSource(id);
      
      if (!source) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge source not found'
        });
      }
      
      return res.json({
        success: true,
        data: source
      });
    } catch (error: any) {
      console.error('Get knowledge source error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get knowledge source',
        details: error.message 
      });
    }
  });

  // Update a knowledge source
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request: UpdateKnowledgeSourceRequest = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Knowledge source ID is required' });
      }

      const updatedSource = knowledgeManager.updateKnowledgeSource(id, request);
      
      if (!updatedSource) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge source not found'
        });
      }
      
      return res.json({
        success: true,
        data: updatedSource
      });
    } catch (error: any) {
      console.error('Update knowledge source error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update knowledge source',
        details: error.message 
      });
    }
  });

  // Delete a knowledge source
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Knowledge source ID is required' });
      }

      const deleted = knowledgeManager.deleteKnowledgeSource(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge source not found'
        });
      }
      
      return res.json({
        success: true,
        message: 'Knowledge source deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete knowledge source error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete knowledge source',
        details: error.message 
      });
    }
  });

  // Search knowledge sources
  router.get('/search/:query', async (req: Request, res: Response) => {
    try {
      const { query } = req.params;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = knowledgeManager.searchKnowledgeSources(query);
      
      return res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('Search knowledge sources error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to search knowledge sources',
        details: error.message 
      });
    }
  });

  // Get contextual knowledge for a specific task
  router.post('/contextual', async (req: Request, res: Response) => {
    try {
      const { taskPrompt, maxSources } = req.body;
      
      if (!taskPrompt) {
        return res.status(400).json({ error: 'Task prompt is required' });
      }

      const contextualKnowledge = knowledgeManager.getContextualKnowledge(
        taskPrompt, 
        maxSources || 5
      );
      
      return res.json({
        success: true,
        data: {
          taskPrompt,
          contextualKnowledge,
          maxSources: maxSources || 5
        }
      });
    } catch (error: any) {
      console.error('Get contextual knowledge error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get contextual knowledge',
        details: error.message 
      });
    }
  });

  return router;
}
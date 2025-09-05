import { Router, Request, Response } from 'express';
import { CodeForgeOrchestrator } from '../core/codeForgeOrchestrator';
import { Intent, ModificationRequest, DownloadRequest } from '../types/dynamic';

export function createCodeForgeRoutes(orchestrator: CodeForgeOrchestrator): Router {
  const router = Router();

  // Process user input and generate questions
  router.post('/process-input', async (req: Request, res: Response) => {
    try {
      const { input, userId } = req.body;
      
      if (!input) {
        return res.status(400).json({ error: 'Input is required' });
      }

      console.log('=== CODE FORGE INPUT PROCESSING ===');
      console.log('Input:', input);
      console.log('User ID:', userId || 'default');
      console.log('===================================');

      const result = await orchestrator.processUserInput(input, userId);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge input processing error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to process input',
        details: error.message 
      });
    }
  });

  // Handle user answers to questions
  router.post('/process-answers', async (req: Request, res: Response) => {
    try {
      const { answers, userId } = req.body;
      
      if (!answers) {
        return res.status(400).json({ error: 'Answers are required' });
      }

      console.log('=== CODE FORGE ANSWERS PROCESSING ===');
      console.log('Answers:', answers);
      console.log('User ID:', userId || 'default');
      console.log('=====================================');

      const result = await orchestrator.handleUserAnswers(answers, userId);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge answers processing error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to process answers',
        details: error.message 
      });
    }
  });

  // Create project
  router.post('/create-project', async (req: Request, res: Response) => {
    try {
      const { intent, userId } = req.body;
      
      if (!intent) {
        return res.status(400).json({ error: 'Intent is required' });
      }

      console.log('=== CODE FORGE PROJECT CREATION ===');
      console.log('Intent:', intent);
      console.log('User ID:', userId || 'default');
      console.log('===================================');

      const result = await orchestrator.executeProjectCreation(intent, userId);
      
      return res.json({
        success: result.success,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge project creation error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create project',
        details: error.message 
      });
    }
  });

  // Handle interactive messages
  router.post('/interactive-message', async (req: Request, res: Response) => {
    try {
      const { message, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      console.log('=== CODE FORGE INTERACTIVE MESSAGE ===');
      console.log('Message:', message);
      console.log('User ID:', userId || 'default');
      console.log('======================================');

      const result = await orchestrator.handleInteractiveMessage(message, userId);
      
      return res.json({
        success: result.success,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge interactive message error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to handle interactive message',
        details: error.message 
      });
    }
  });

  // Execute modification request
  router.post('/execute-modification', async (req: Request, res: Response) => {
    try {
      const { modificationId, userId } = req.body;
      
      if (!modificationId) {
        return res.status(400).json({ error: 'Modification ID is required' });
      }

      console.log('=== CODE FORGE MODIFICATION EXECUTION ===');
      console.log('Modification ID:', modificationId);
      console.log('User ID:', userId || 'default');
      console.log('==========================================');

      const result = await orchestrator.executeModificationRequest(modificationId, userId);
      
      return res.json({
        success: result.success,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge modification execution error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to execute modification',
        details: error.message 
      });
    }
  });

  // Execute download request
  router.post('/execute-download', async (req: Request, res: Response) => {
    try {
      const { downloadId, userId } = req.body;
      
      if (!downloadId) {
        return res.status(400).json({ error: 'Download ID is required' });
      }

      console.log('=== CODE FORGE DOWNLOAD EXECUTION ===');
      console.log('Download ID:', downloadId);
      console.log('User ID:', userId || 'default');
      console.log('=====================================');

      const result = await orchestrator.executeDownloadRequest(downloadId, userId);
      
      return res.json({
        success: result.success,
        data: result
      });
    } catch (error: any) {
      console.error('CodeForge download execution error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to execute download',
        details: error.message 
      });
    }
  });

  // Get project status
  router.get('/project/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const project = orchestrator.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.json({
        success: true,
        data: project
      });
    } catch (error: any) {
      console.error('CodeForge project retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve project',
        details: error.message 
      });
    }
  });

  // Get all projects
  router.get('/projects', async (req: Request, res: Response) => {
    try {
      const projects = orchestrator.getProjects();
      
      return res.json({
        success: true,
        data: projects
      });
    } catch (error: any) {
      console.error('CodeForge projects retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve projects',
        details: error.message 
      });
    }
  });

  // Get modification request
  router.get('/modification/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Modification ID is required' });
      }

      const modification = orchestrator.getModificationRequest(id);
      
      if (!modification) {
        return res.status(404).json({ error: 'Modification request not found' });
      }

      return res.json({
        success: true,
        data: modification
      });
    } catch (error: any) {
      console.error('CodeForge modification retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve modification request',
        details: error.message 
      });
    }
  });

  // Get download request
  router.get('/download/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Download ID is required' });
      }

      const downloadRequest = orchestrator.getDownloadRequest(id);
      
      if (!downloadRequest) {
        return res.status(404).json({ error: 'Download request not found' });
      }

      return res.json({
        success: true,
        data: downloadRequest
      });
    } catch (error: any) {
      console.error('CodeForge download retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve download request',
        details: error.message 
      });
    }
  });

  // Get conversation context
  router.get('/conversation/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const context = orchestrator.getConversationContext(userId);
      
      if (!context) {
        return res.status(404).json({ error: 'Conversation context not found' });
      }

      return res.json({
        success: true,
        data: context
      });
    } catch (error: any) {
      console.error('CodeForge conversation context retrieval error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve conversation context',
        details: error.message 
      });
    }
  });

  // Health check
  router.get('/health', async (req: Request, res: Response) => {
    try {
      return res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          orchestrator: 'CodeForge',
          version: '1.0.0'
        }
      });
    } catch (error: any) {
      console.error('CodeForge health check error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Health check failed',
        details: error.message 
      });
    }
  });

  return router;
}
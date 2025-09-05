import { Router } from 'express';
import { Orchestrator } from '../core/orchestrator';
import { AdvancedOrchestrator } from '../core/advancedOrchestrator';

export function createEmotionMemoryRoutes(
  orchestrator: Orchestrator,
  advancedOrchestrator: AdvancedOrchestrator
): Router {
  const router = Router();

  /**
   * GET /emotion-memory/stats
   * Get emotion memory statistics
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = await advancedOrchestrator.getEmotionMemoryStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /emotion-memory/clear
   * Clear all emotion memories (for testing)
   */
  router.post('/clear', async (req, res) => {
    try {
      await advancedOrchestrator.clearEmotionMemories();
      res.json({
        success: true,
        message: 'Emotion memories cleared successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /emotion-memory/optimize
   * Test context optimization for a given input
   */
  router.post('/optimize', async (req, res) => {
    try {
      const { context, agentId, taskId } = req.body;
      
      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context is required'
        });
      }

      const optimizedContext = await advancedOrchestrator.optimizeContextForAgent(
        agentId || 'default-agent',
        context,
        taskId || 'test-task'
      );

      return res.json({
        success: true,
        data: optimizedContext
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
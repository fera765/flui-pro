import { Router } from 'express';
import { Orchestrator } from '../core/orchestrator';
import { AdvancedOrchestrator } from '../core/advancedOrchestrator';

export function createAnalyticsRoutes(
  orchestrator: Orchestrator,
  advancedOrchestrator: AdvancedOrchestrator
): Router {
  const router = Router();

  /**
   * GET /analytics/performance
   * Get comprehensive performance metrics
   */
  router.get('/performance', async (req, res) => {
    try {
      const performanceMetrics = await advancedOrchestrator.getEmotionMemoryStats();
      const alerts = await advancedOrchestrator.getAlerts();
      
      res.json({
        success: true,
        data: {
          performance: performanceMetrics,
          alerts,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/metrics
   * Get detailed metrics for dashboard
   */
  router.get('/metrics', async (req, res) => {
    try {
      const { timeRange = '24h', agentId } = req.query;
      
      // Calculate time range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const metrics = await advancedOrchestrator.getPerformanceMetrics();
      const agentMetrics = agentId ? await advancedOrchestrator.getAgentMetrics(agentId as string) : null;
      
      res.json({
        success: true,
        data: {
          timeRange,
          startDate,
          endDate: now,
          metrics,
          agentMetrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/alerts
   * Get real-time alerts
   */
  router.get('/alerts', async (req, res) => {
    try {
      const alerts = await advancedOrchestrator.getAlerts();
      
      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/agents
   * Get agent-specific performance
   */
  router.get('/agents', async (req, res) => {
    try {
      const metrics = await advancedOrchestrator.getPerformanceMetrics();
      const agentPerformance = metrics.topPerformingAgents || [];
      
      res.json({
        success: true,
        data: {
          agents: agentPerformance,
          totalAgents: agentPerformance.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/memories
   * Get memory statistics
   */
  router.get('/memories', async (req, res) => {
    try {
      const { domain, agentId, limit = 10 } = req.query;
      
      let memories = [];
      
      if (domain) {
        memories = await advancedOrchestrator.getMemoriesByDomain(domain as string);
      } else if (agentId) {
        memories = await advancedOrchestrator.getMemoriesByAgent(agentId as string);
      } else {
        memories = await advancedOrchestrator.getMostEffectiveMemories(parseInt(limit as string));
      }
      
      res.json({
        success: true,
        data: {
          memories,
          count: memories.length,
          filters: { domain, agentId, limit },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/dashboard
   * Get complete dashboard data
   */
  router.get('/dashboard', async (req, res) => {
    try {
      const [
        performanceMetrics,
        alerts,
        hourlyStats,
        agentPerformance
      ] = await Promise.all([
        advancedOrchestrator.getPerformanceMetrics(),
        advancedOrchestrator.getAlerts(),
        advancedOrchestrator.getPerformanceMetrics(), // This includes hourly stats
        advancedOrchestrator.getPerformanceMetrics() // This includes agent performance
      ]);

      const dashboardData = {
        overview: {
          totalRequests: performanceMetrics.totalRequests || 0,
          averageReduction: performanceMetrics.averageReduction || 0,
          totalTokensSaved: performanceMetrics.totalTokensSaved || 0,
          averageInjectedMemories: performanceMetrics.averageInjectedMemories || 0,
          activeAlerts: alerts.length
        },
        performance: {
          hourlyStats: performanceMetrics.hourlyStats || [],
          topAgents: performanceMetrics.topPerformingAgents || []
        },
        alerts: alerts,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /analytics/tune
   * Apply automatic tuning recommendations
   */
  router.post('/tune', async (req, res) => {
    try {
      const { autoApply = false } = req.body;
      
      const recommendations = await advancedOrchestrator.getTuningRecommendations();
      
      if (autoApply && recommendations.length > 0) {
        const newConfig = await advancedOrchestrator.applyTuningRecommendations(recommendations);
        
        res.json({
          success: true,
          data: {
            recommendations,
            applied: true,
            newConfig,
            message: `Applied ${recommendations.length} tuning recommendations`
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            recommendations,
            applied: false,
            message: 'Recommendations generated but not applied. Use autoApply=true to apply.'
          }
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /analytics/health
   * Get system health status
   */
  router.get('/health', async (req, res) => {
    try {
      const metrics = await advancedOrchestrator.getPerformanceMetrics();
      const alerts = await advancedOrchestrator.getAlerts();
      
      const healthStatus = {
        status: 'healthy',
        issues: alerts.filter(a => a.severity === 'high').length,
        warnings: alerts.filter(a => a.severity === 'medium').length,
        info: alerts.filter(a => a.severity === 'low').length,
        performance: {
          averageReduction: metrics.averageReduction || 0,
          totalRequests: metrics.totalRequests || 0,
          efficiency: metrics.averageReduction > 50 ? 'excellent' : 
                     metrics.averageReduction > 30 ? 'good' : 
                     metrics.averageReduction > 10 ? 'fair' : 'poor'
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: healthStatus
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
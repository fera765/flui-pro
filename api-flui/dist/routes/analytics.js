"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsRoutes = createAnalyticsRoutes;
const express_1 = require("express");
function createAnalyticsRoutes(orchestrator, advancedOrchestrator) {
    const router = (0, express_1.Router)();
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.get('/metrics', async (req, res) => {
        try {
            const { timeRange = '24h', agentId } = req.query;
            const now = new Date();
            let startDate;
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
            const agentMetrics = agentId ? await advancedOrchestrator.getAgentMetrics(agentId) : null;
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.get('/memories', async (req, res) => {
        try {
            const { domain, agentId, limit = 10 } = req.query;
            let memories = [];
            if (domain) {
                memories = await advancedOrchestrator.getMemoriesByDomain(domain);
            }
            else if (agentId) {
                memories = await advancedOrchestrator.getMemoriesByAgent(agentId);
            }
            else {
                memories = await advancedOrchestrator.getMostEffectiveMemories(parseInt(limit));
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.get('/dashboard', async (req, res) => {
        try {
            const [performanceMetrics, alerts, hourlyStats, agentPerformance] = await Promise.all([
                advancedOrchestrator.getPerformanceMetrics(),
                advancedOrchestrator.getAlerts(),
                advancedOrchestrator.getPerformanceMetrics(),
                advancedOrchestrator.getPerformanceMetrics()
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
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
            }
            else {
                res.json({
                    success: true,
                    data: {
                        recommendations,
                        applied: false,
                        message: 'Recommendations generated but not applied. Use autoApply=true to apply.'
                    }
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=analytics.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmotionMemoryRoutes = createEmotionMemoryRoutes;
const express_1 = require("express");
function createEmotionMemoryRoutes(orchestrator, advancedOrchestrator) {
    const router = (0, express_1.Router)();
    router.get('/stats', async (req, res) => {
        try {
            const stats = await advancedOrchestrator.getEmotionMemoryStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.post('/clear', async (req, res) => {
        try {
            await advancedOrchestrator.clearEmotionMemories();
            res.json({
                success: true,
                message: 'Emotion memories cleared successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.post('/optimize', async (req, res) => {
        try {
            const { context, agentId, taskId } = req.body;
            if (!context) {
                return res.status(400).json({
                    success: false,
                    error: 'Context is required'
                });
            }
            const optimizedContext = await advancedOrchestrator.optimizeContextForAgent(agentId || 'default-agent', context, taskId || 'test-task');
            return res.json({
                success: true,
                data: optimizedContext
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=emotionMemory.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeRoutes = knowledgeRoutes;
const express_1 = require("express");
function knowledgeRoutes(knowledgeManager) {
    const router = (0, express_1.Router)();
    router.post('/', async (req, res) => {
        try {
            const request = req.body;
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
        }
        catch (error) {
            console.error('Knowledge source creation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create knowledge source',
                details: error.message
            });
        }
    });
    router.get('/', async (req, res) => {
        try {
            const sources = knowledgeManager.getAllKnowledgeSources();
            return res.json({
                success: true,
                data: sources
            });
        }
        catch (error) {
            console.error('Get knowledge sources error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get knowledge sources',
                details: error.message
            });
        }
    });
    router.get('/active', async (req, res) => {
        try {
            const sources = knowledgeManager.getActiveKnowledgeSources();
            return res.json({
                success: true,
                data: sources
            });
        }
        catch (error) {
            console.error('Get active knowledge sources error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get active knowledge sources',
                details: error.message
            });
        }
    });
    router.get('/context', async (req, res) => {
        try {
            const context = knowledgeManager.getKnowledgeContext();
            return res.json({
                success: true,
                data: context
            });
        }
        catch (error) {
            console.error('Get knowledge context error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get knowledge context',
                details: error.message
            });
        }
    });
    router.get('/:id', async (req, res) => {
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
        }
        catch (error) {
            console.error('Get knowledge source error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get knowledge source',
                details: error.message
            });
        }
    });
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const request = req.body;
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
        }
        catch (error) {
            console.error('Update knowledge source error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update knowledge source',
                details: error.message
            });
        }
    });
    router.delete('/:id', async (req, res) => {
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
        }
        catch (error) {
            console.error('Delete knowledge source error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete knowledge source',
                details: error.message
            });
        }
    });
    router.get('/search/:query', async (req, res) => {
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
        }
        catch (error) {
            console.error('Search knowledge sources error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to search knowledge sources',
                details: error.message
            });
        }
    });
    router.post('/contextual', async (req, res) => {
        try {
            const { taskPrompt, maxSources } = req.body;
            if (!taskPrompt) {
                return res.status(400).json({ error: 'Task prompt is required' });
            }
            const contextualKnowledge = knowledgeManager.getContextualKnowledge(taskPrompt, maxSources || 5);
            return res.json({
                success: true,
                data: {
                    taskPrompt,
                    contextualKnowledge,
                    maxSources: maxSources || 5
                }
            });
        }
        catch (error) {
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
//# sourceMappingURL=knowledge.js.map
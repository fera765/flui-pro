"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelsRoutes = modelsRoutes;
const express_1 = require("express");
function modelsRoutes(client) {
    const router = (0, express_1.Router)();
    router.get('/', async (req, res) => {
        try {
            const { type } = req.query;
            let models = [];
            if (type === 'image') {
                models = await client.getModels('image');
            }
            else if (type === 'text') {
                models = await client.getModels('text');
            }
            else {
                const [imageModels, textModels] = await Promise.all([
                    client.getModels('image'),
                    client.getModels('text')
                ]);
                models = [...imageModels, ...textModels];
            }
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
        }
        catch (error) {
            console.error('Models list error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Model ID is required' });
            }
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
        }
        catch (error) {
            console.error('Model info error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/image', async (_req, res) => {
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
        }
        catch (error) {
            console.error('Error fetching image models:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/text', async (_req, res) => {
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
        }
        catch (error) {
            console.error('Error fetching text models:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/audio', async (_req, res) => {
        try {
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
        }
        catch (error) {
            console.error('Error fetching audio models:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
}
//# sourceMappingURL=models.js.map
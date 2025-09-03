"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageRoutes = imageRoutes;
const express_1 = require("express");
function imageRoutes(client) {
    const router = (0, express_1.Router)();
    router.post('/generations', async (req, res) => {
        try {
            const { prompt, size = '1024x1024', model, quality, n = 1 } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            if (n > 1) {
                return res.status(400).json({ error: 'Only n=1 is supported' });
            }
            const sizeMatch = size.match(/^(\d+)x(\d+)$/);
            if (!sizeMatch) {
                return res.status(400).json({
                    error: 'Invalid size format. Expected format: WIDTHxHEIGHT'
                });
            }
            const [, widthStr, heightStr] = sizeMatch;
            const width = parseInt(widthStr);
            const height = parseInt(heightStr);
            const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
            if (!validSizes.includes(size)) {
                return res.status(400).json({
                    error: `Invalid size. Allowed sizes: ${validSizes.join(', ')}`
                });
            }
            const pollinationsOptions = {
                width,
                height,
                model: model === 'dall-e-2' || model === 'dall-e-3' ? 'flux' : 'flux'
            };
            if (quality === 'hd') {
                pollinationsOptions.enhance = true;
            }
            const imageBuffer = await client.generateImage(prompt, pollinationsOptions);
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            return res.json({
                created: Math.floor(Date.now() / 1000),
                data: [
                    {
                        url: imageUrl,
                        revised_prompt: prompt
                    }
                ]
            });
        }
        catch (error) {
            console.error('Image generation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/generations/:prompt', async (req, res) => {
        try {
            const { prompt } = req.params;
            const { width = '1024', height = '1024', model = 'flux' } = req.query;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            const decodedPrompt = decodeURIComponent(prompt);
            const widthNum = parseInt(width);
            const heightNum = parseInt(height);
            if (isNaN(widthNum) || isNaN(heightNum)) {
                return res.status(400).json({ error: 'Invalid width or height' });
            }
            const imageBuffer = await client.generateImage(decodedPrompt, {
                width: widthNum,
                height: heightNum,
                model: model
            });
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            return res.json({
                created: Math.floor(Date.now() / 1000),
                data: [
                    {
                        url: imageUrl,
                        revised_prompt: decodedPrompt
                    }
                ]
            });
        }
        catch (error) {
            console.error('Image generation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
}
//# sourceMappingURL=image.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedRoutes = feedRoutes;
const express_1 = require("express");
function feedRoutes(_client) {
    const router = (0, express_1.Router)();
    router.get('/image', async (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
            res.write('data: {"type": "connection", "status": "connected"}\n\n');
            const simulateImageFeed = () => {
                const mockImageEvent = {
                    type: 'image.generated',
                    timestamp: new Date().toISOString(),
                    data: {
                        width: 1024,
                        height: 1024,
                        seed: Math.floor(Math.random() * 1000000),
                        model: 'flux',
                        imageURL: `https://image.pollinations.ai/prompt/sample_${Date.now()}`,
                        prompt: 'Sample generated image'
                    }
                };
                res.write(`data: ${JSON.stringify(mockImageEvent)}\n\n`);
            };
            const interval = setInterval(simulateImageFeed, 10000);
            simulateImageFeed();
            req.on('close', () => {
                clearInterval(interval);
                res.end();
            });
            const keepAlive = setInterval(() => {
                res.write(': keepalive\n\n');
            }, 30000);
            req.on('close', () => {
                clearInterval(keepAlive);
            });
        }
        catch (error) {
            console.error('Image feed error:', error);
            res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
            res.end();
        }
    });
    router.get('/text', async (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
            res.write('data: {"type": "connection", "status": "connected"}\n\n');
            const simulateTextFeed = () => {
                const mockTextEvent = {
                    type: 'text.generated',
                    timestamp: new Date().toISOString(),
                    data: {
                        response: 'This is a sample generated text response.',
                        model: 'openai',
                        messages: [
                            {
                                role: 'user',
                                content: 'Sample user prompt'
                            }
                        ]
                    }
                };
                res.write(`data: ${JSON.stringify(mockTextEvent)}\n\n`);
            };
            const interval = setInterval(simulateTextFeed, 15000);
            simulateTextFeed();
            req.on('close', () => {
                clearInterval(interval);
                res.end();
            });
            const keepAlive = setInterval(() => {
                res.write(': keepalive\n\n');
            }, 30000);
            req.on('close', () => {
                clearInterval(keepAlive);
            });
        }
        catch (error) {
            console.error('Text feed error:', error);
            res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
            res.end();
        }
    });
    router.get('/combined', async (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
            res.write('data: {"type": "connection", "status": "connected"}\n\n');
            let eventCounter = 0;
            const simulateCombinedFeed = () => {
                eventCounter++;
                if (eventCounter % 2 === 0) {
                    const mockImageEvent = {
                        type: 'image.generated',
                        timestamp: new Date().toISOString(),
                        data: {
                            width: 1024,
                            height: 1024,
                            seed: Math.floor(Math.random() * 1000000),
                            model: 'flux',
                            imageURL: `https://image.pollinations.ai/prompt/combined_${Date.now()}`,
                            prompt: 'Combined feed image'
                        }
                    };
                    res.write(`data: ${JSON.stringify(mockImageEvent)}\n\n`);
                }
                else {
                    const mockTextEvent = {
                        type: 'text.generated',
                        timestamp: new Date().toISOString(),
                        data: {
                            response: 'Combined feed text response.',
                            model: 'openai',
                            messages: [
                                {
                                    role: 'user',
                                    content: 'Combined feed prompt'
                                }
                            ]
                        }
                    };
                    res.write(`data: ${JSON.stringify(mockTextEvent)}\n\n`);
                }
            };
            const interval = setInterval(simulateCombinedFeed, 8000);
            simulateCombinedFeed();
            req.on('close', () => {
                clearInterval(interval);
                res.end();
            });
            const keepAlive = setInterval(() => {
                res.write(': keepalive\n\n');
            }, 30000);
            req.on('close', () => {
                clearInterval(keepAlive);
            });
        }
        catch (error) {
            console.error('Combined feed error:', error);
            res.write(`data: {"type": "error", "message": "Feed error"}\n\n`);
            res.end();
        }
    });
    router.get('/status', async (_req, res) => {
        try {
            const status = {
                feeds: {
                    image: {
                        status: 'active',
                        endpoint: '/v1/feed/image',
                        description: 'Real-time image generation feed'
                    },
                    text: {
                        status: 'active',
                        endpoint: '/v1/feed/text',
                        description: 'Real-time text generation feed'
                    },
                    combined: {
                        status: 'active',
                        endpoint: '/v1/feed/combined',
                        description: 'Combined image and text feed'
                    }
                },
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
            return res.json(status);
        }
        catch (error) {
            console.error('Feed status error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
}
//# sourceMappingURL=feed.js.map
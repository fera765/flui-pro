"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textRoutes = textRoutes;
const express_1 = require("express");
function textRoutes(client) {
    const router = (0, express_1.Router)();
    router.post('/completions', async (req, res) => {
        try {
            console.log('=== TEXT ROUTE REQUEST ===');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Body:', JSON.stringify(req.body, null, 2));
            console.log('URL:', req.url);
            console.log('Method:', req.method);
            console.log('========================');
            const { model, messages, stream = false, ...otherParams } = req.body;
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({ error: 'Messages are required' });
            }
            if (!model) {
                return res.status(400).json({ error: 'Model is required' });
            }
            const pollinationsModel = mapOpenAIModelToPollinations(model);
            const { temperature, ...paramsWithoutTemperature } = otherParams;
            const pollinationsRequest = {
                model: pollinationsModel,
                messages,
                stream,
                ...paramsWithoutTemperature
            };
            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                try {
                    const response = await client.openaiCompatibleChat(pollinationsRequest);
                    res.write(`data: ${JSON.stringify(response)}\n\n`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                }
                catch (error) {
                    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                    res.end();
                    return;
                }
            }
            else {
                console.log('=== CALLING POLLINATIONS CLIENT ===');
                console.log('Request to client:', JSON.stringify(pollinationsRequest, null, 2));
                const response = await client.openaiCompatibleChat(pollinationsRequest);
                console.log('=== POLLINATIONS CLIENT RESPONSE ===');
                console.log('Response:', JSON.stringify(response, null, 2));
                console.log('====================================');
                return res.json(response);
            }
        }
        catch (error) {
            console.log('=== TEXT ROUTE ERROR ===');
            console.error('Chat completion error:', error);
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            console.log('=======================');
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/:prompt', async (req, res) => {
        try {
            const { prompt } = req.params;
            const { model = 'openai', stream = false, temperature, top_p, seed, system, json: jsonResponse = false } = req.query;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            const decodedPrompt = decodeURIComponent(prompt);
            const options = {
                model: model,
                stream: stream === 'true'
            };
            if (temperature)
                options.temperature = parseFloat(temperature);
            if (top_p)
                options.top_p = parseFloat(top_p);
            if (seed)
                options.seed = parseInt(seed);
            if (system)
                options.system = decodeURIComponent(system);
            if (jsonResponse === 'true')
                options.json = true;
            const response = await client.generateText(decodedPrompt, options);
            if (stream === 'true') {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.write(`data: ${response}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }
            else {
                if (jsonResponse === 'true') {
                    return res.json({ response, prompt: decodedPrompt, model });
                }
                else {
                    res.setHeader('Content-Type', 'text/plain');
                    return res.send(response);
                }
            }
        }
        catch (error) {
            console.error('Text generation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
}
function mapOpenAIModelToPollinations(openaiModel) {
    const modelMap = {
        'gpt-4': 'openai',
        'gpt-4-turbo': 'openai',
        'gpt-4-32k': 'openai',
        'gpt-3.5-turbo': 'openai',
        'gpt-3.5-turbo-16k': 'openai',
        'claude-3': 'claude-hybridspace',
        'claude-3-sonnet': 'claude-hybridspace',
        'claude-3-haiku': 'claude-hybridspace',
        'mistral': 'mistral'
    };
    return modelMap[openaiModel] || 'openai';
}
//# sourceMappingURL=text.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioRoutes = audioRoutes;
const express_1 = require("express");
function audioRoutes(client) {
    const router = (0, express_1.Router)();
    router.post('/speech', async (req, res) => {
        try {
            const { model, input, voice = 'alloy' } = req.body;
            if (!input) {
                return res.status(400).json({ error: 'Input text is required' });
            }
            if (!model) {
                return res.status(400).json({ error: 'Model is required' });
            }
            const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
            if (!validVoices.includes(voice)) {
                return res.status(400).json({
                    error: `Invalid voice. Allowed voices: ${validVoices.join(', ')}`
                });
            }
            const audioBuffer = await client.generateAudio(input, {
                voice,
                model: 'openai-audio'
            });
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.length.toString());
            return res.send(audioBuffer);
        }
        catch (error) {
            console.error('Audio generation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.get('/speech/:text', async (req, res) => {
        try {
            const { text } = req.params;
            const { voice = 'alloy', model = 'openai-audio' } = req.query;
            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }
            const decodedText = decodeURIComponent(text);
            const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
            if (!validVoices.includes(voice)) {
                return res.status(400).json({
                    error: `Invalid voice. Allowed voices: ${validVoices.join(', ')}`
                });
            }
            const audioBuffer = await client.generateAudio(decodedText, {
                voice: voice,
                model: model
            });
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.length.toString());
            return res.send(audioBuffer);
        }
        catch (error) {
            console.error('Audio generation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.post('/transcriptions', async (req, res) => {
        try {
            const { model, file, response_format = 'text', language } = req.body;
            if (!file) {
                return res.status(400).json({ error: 'Audio file is required' });
            }
            if (!model) {
                return res.status(400).json({ error: 'Model is required' });
            }
            let base64Audio;
            if (Buffer.isBuffer(file)) {
                base64Audio = file.toString('base64');
            }
            else if (typeof file === 'string') {
                base64Audio = file;
            }
            else {
                return res.status(400).json({ error: 'Invalid file format' });
            }
            let format = 'mp3';
            if (base64Audio.startsWith('data:audio/')) {
                const match = base64Audio.match(/data:audio\/([^;]+);base64,/);
                if (match && match[1]) {
                    format = match[1];
                }
            }
            const transcription = await client.speechToText(base64Audio, format);
            if (response_format === 'json') {
                return res.json({
                    text: transcription,
                    language: language || 'en'
                });
            }
            else {
                res.setHeader('Content-Type', 'text/plain');
                return res.send(transcription);
            }
        }
        catch (error) {
            console.error('Audio transcription error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.post('/transcriptions/multipart', async (_req, res) => {
        return res.status(501).json({
            error: 'Not implemented',
            message: 'Multipart form uploads not yet supported. Use base64 data instead.'
        });
    });
    return router;
}
//# sourceMappingURL=audio.js.map
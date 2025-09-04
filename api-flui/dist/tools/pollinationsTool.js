"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollinationsTool = void 0;
const openai_1 = __importDefault(require("openai"));
class PollinationsTool {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000',
            dangerouslyAllowBrowser: true
        });
    }
    async generateImage(prompt, options = {}) {
        try {
            const response = await this.openai.images.generate({
                prompt,
                n: 1,
                size: options.size || '1024x1024',
                model: options.model || 'flux',
                response_format: 'b64_json'
            });
            if (response.data && response.data[0]?.b64_json) {
                return `data:image/png;base64,${response.data[0].b64_json}`;
            }
            throw new Error('No image data received');
        }
        catch (error) {
            try {
                const altResponse = await fetch(`${this.openai.baseURL}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.openai.apiKey}`
                    },
                    body: JSON.stringify({
                        prompt,
                        size: options.size || '1024x1024',
                        model: options.model || 'flux',
                        n: 1
                    })
                });
                if (altResponse.ok) {
                    const data = await altResponse.json();
                    if (data.data && data.data[0]?.url) {
                        return data.data[0].url;
                    }
                }
            }
            catch (altError) {
            }
            throw new Error(`Image generation failed: ${error.message}`);
        }
    }
    async generateText(prompt, options = {}) {
        try {
            const response = await this.openai.chat.completions.create({
                model: options.model || 'openai',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500,
                stream: false
            });
            if (response.choices && response.choices[0]?.message?.content) {
                return response.choices[0].message.content;
            }
            throw new Error('No text response received');
        }
        catch (error) {
            try {
                const altResponse = await fetch(`${this.openai.baseURL}/v1/chat/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.openai.apiKey}`
                    },
                    body: JSON.stringify({
                        model: options.model || 'openai',
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: options.temperature || 0.7,
                        max_tokens: options.maxTokens || 500
                    })
                });
                if (altResponse.ok) {
                    const data = await altResponse.json();
                    if (data.choices && data.choices[0]?.message?.content) {
                        return data.choices[0].message.content;
                    }
                }
            }
            catch (altError) {
            }
            throw new Error(`Text generation failed: ${error.message}`);
        }
    }
    async generateAudio(text, options = {}) {
        try {
            const response = await this.openai.audio.speech.create({
                model: options.model || 'openai-audio',
                voice: options.voice || 'alloy',
                input: text,
                response_format: 'mp3'
            });
            if (typeof response === 'string') {
                return `data:audio/mp3;base64,${response}`;
            }
            if (response instanceof ArrayBuffer) {
                const buffer = Buffer.from(response);
                return `data:audio/mp3;base64,${buffer.toString('base64')}`;
            }
            throw new Error('Unexpected audio response format');
        }
        catch (error) {
            throw new Error(`Audio generation failed: ${error.message}`);
        }
    }
    async speechToText(audioData, options = {}) {
        try {
            const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
            const response = await this.openai.audio.transcriptions.create({
                file: Buffer.from(base64Data, 'base64'),
                model: options.model || 'openai-audio',
                response_format: 'text'
            });
            if (typeof response === 'string') {
                return response;
            }
            throw new Error('Unexpected transcription response format');
        }
        catch (error) {
            throw new Error(`Speech to text failed: ${error.message}`);
        }
    }
    async listModels() {
        try {
            const response = await this.openai.models.list();
            return response.data || [];
        }
        catch (error) {
            throw new Error(`Failed to list models: ${error.message}`);
        }
    }
    async getModelInfo(modelId) {
        try {
            const response = await this.openai.models.retrieve(modelId);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to get model info: ${error.message}`);
        }
    }
}
exports.PollinationsTool = PollinationsTool;
//# sourceMappingURL=pollinationsTool.js.map
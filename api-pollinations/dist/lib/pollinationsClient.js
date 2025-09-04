"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollinationsClient = void 0;
const axios_1 = __importDefault(require("axios"));
class PollinationsClient {
    constructor(imageBaseUrl, textBaseUrl) {
        this.imageBaseUrl = imageBaseUrl || process.env['UPSTREAM_BASE_IMAGE'] || 'https://image.pollinations.ai';
        this.textBaseUrl = textBaseUrl || process.env['UPSTREAM_BASE_TEXT'] || 'https://text.pollinations.ai';
        this.apiKey = process.env['POLLINATIONS_API_KEY'] || '';
        this.maxRetries = parseInt(process.env['MAX_RETRIES'] || '3');
        this.retryDelay = parseInt(process.env['RETRY_DELAY_MS'] || '1000');
        this.retryBackoffMultiplier = parseFloat(process.env['RETRY_BACKOFF_MULTIPLIER'] || '2');
        if (!this.apiKey) {
            throw new Error('POLLINATIONS_API_KEY is required');
        }
    }
    async makeRequestWithRetry(requestFn, retryCount = 0) {
        try {
            const response = await requestFn();
            return response.data;
        }
        catch (error) {
            if (retryCount >= this.maxRetries) {
                throw new Error('Max retries exceeded');
            }
            if (error.response?.status >= 500) {
                const delay = this.retryDelay * Math.pow(this.retryBackoffMultiplier, retryCount);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequestWithRetry(requestFn, retryCount + 1);
            }
            throw error;
        }
    }
    async generateImage(prompt, options = {}) {
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `${this.imageBaseUrl}/prompt/${encodedPrompt}`;
        const config = {
            params: options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'image/*'
            },
            responseType: 'arraybuffer',
            timeout: parseInt(process.env['IMAGE_GENERATION_TIMEOUT_MS'] || '300000')
        };
        return this.makeRequestWithRetry(() => axios_1.default.get(url, config));
    }
    async generateText(prompt, options = {}) {
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `${this.textBaseUrl}/${encodedPrompt}`;
        const config = {
            params: options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': options.stream ? 'text/event-stream' : 'text/plain'
            },
            timeout: parseInt(process.env['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
        };
        return this.makeRequestWithRetry(() => axios_1.default.get(url, config));
    }
    async generateAudio(text, options = {}) {
        const encodedText = encodeURIComponent(text);
        const url = `${this.textBaseUrl}/${encodedText}`;
        const config = {
            params: {
                model: 'openai-audio',
                voice: options.voice || 'alloy',
                ...options
            },
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'audio/*'
            },
            responseType: 'arraybuffer',
            timeout: parseInt(process.env['AUDIO_GENERATION_TIMEOUT_MS'] || '300000')
        };
        return this.makeRequestWithRetry(() => axios_1.default.get(url, config));
    }
    async speechToText(audioData, format) {
        const url = `${this.textBaseUrl}/openai`;
        const payload = {
            model: 'openai-audio',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Transcribe this:' },
                        {
                            type: 'input_audio',
                            input_audio: {
                                data: audioData,
                                format: format
                            }
                        }
                    ]
                }
            ]
        };
        const config = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
        };
        const response = await this.makeRequestWithRetry(() => axios_1.default.post(url, payload, config));
        return response.choices?.[0]?.message?.content || '';
    }
    async getModels(type) {
        const baseUrl = type === 'image' ? this.imageBaseUrl : this.textBaseUrl;
        const url = `${baseUrl}/models`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json'
            },
            timeout: parseInt(process.env['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
        };
        return this.makeRequestWithRetry(() => axios_1.default.get(url, config));
    }
    async openaiCompatibleChat(request) {
        const url = `${this.textBaseUrl}/openai`;
        console.log('=== POLLINATIONS CLIENT - openaiCompatibleChat ===');
        console.log('URL:', url);
        console.log('Request:', JSON.stringify(request, null, 2));
        console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
        const config = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: parseInt(process.env['TEXT_GENERATION_TIMEOUT_MS'] || '30000')
        };
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('================================================');
        try {
            const result = await this.makeRequestWithRetry(() => axios_1.default.post(url, request, config));
            console.log('=== POLLINATIONS CLIENT - SUCCESS ===');
            console.log('Result:', JSON.stringify(result, null, 2));
            console.log('=====================================');
            return result;
        }
        catch (error) {
            console.log('=== POLLINATIONS CLIENT - ERROR ===');
            console.log('Error:', error.message);
            console.log('Error response:', error.response?.data);
            console.log('Error status:', error.response?.status);
            console.log('===================================');
            throw error;
        }
    }
    async healthCheck() {
        try {
            await axios_1.default.get(`${this.imageBaseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                timeout: 5000
            });
            return {
                ok: true,
                upstream: 'ok',
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                ok: false,
                upstream: 'error',
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}
exports.PollinationsClient = PollinationsClient;
//# sourceMappingURL=pollinationsClient.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
class OpenAIAdapter {
    constructor(client) {
        this.images = {
            generate: async (request) => {
                if (!request.prompt) {
                    throw new Error('Prompt is required for image generation');
                }
                const size = request.size || '1024x1024';
                const { width, height } = this.parseSize(size);
                const pollinationsOptions = {
                    width,
                    height,
                    model: this.mapOpenAIModelToPollinations(request.model || 'dall-e-3', 'image')
                };
                if (request.quality === 'hd') {
                    pollinationsOptions.enhance = true;
                }
                const imageBuffer = await this.client.generateImage(request.prompt, pollinationsOptions);
                return {
                    created: Math.floor(Date.now() / 1000),
                    data: [
                        {
                            url: this.bufferToBase64Url(imageBuffer),
                            revised_prompt: request.prompt
                        }
                    ]
                };
            }
        };
        this.chat = {
            completions: {
                create: async (request) => {
                    if (!request.messages || request.messages.length === 0) {
                        throw new Error('Messages are required for chat completion');
                    }
                    const pollinationsRequest = {
                        model: this.mapOpenAIModelToPollinations(request.model, 'text'),
                        messages: request.messages
                    };
                    if (request.temperature !== undefined)
                        pollinationsRequest.temperature = request.temperature;
                    if (request.top_p !== undefined)
                        pollinationsRequest.top_p = request.top_p;
                    if (request.n !== undefined)
                        pollinationsRequest.n = request.n;
                    if (request.stream !== undefined)
                        pollinationsRequest.stream = request.stream;
                    if (request.max_tokens !== undefined)
                        pollinationsRequest.max_tokens = request.max_tokens;
                    if (request.presence_penalty !== undefined)
                        pollinationsRequest.presence_penalty = request.presence_penalty;
                    if (request.frequency_penalty !== undefined)
                        pollinationsRequest.frequency_penalty = request.frequency_penalty;
                    if (request.logit_bias !== undefined)
                        pollinationsRequest.logit_bias = request.logit_bias;
                    if (request.user !== undefined)
                        pollinationsRequest.user = request.user;
                    if (request.response_format !== undefined)
                        pollinationsRequest.response_format = request.response_format;
                    if (request.tools !== undefined)
                        pollinationsRequest.tools = request.tools;
                    if (request.tool_choice !== undefined)
                        pollinationsRequest.tool_choice = request.tool_choice;
                    if (request.seed !== undefined)
                        pollinationsRequest.seed = request.seed;
                    return await this.client.openaiCompatibleChat(pollinationsRequest);
                }
            }
        };
        this.audio = {
            speech: {
                create: async (request) => {
                    if (!request.input) {
                        throw new Error('Input text is required for audio generation');
                    }
                    const pollinationsOptions = {
                        voice: request.voice,
                        model: this.mapOpenAIModelToPollinations(request.model, 'audio')
                    };
                    return await this.client.generateAudio(request.input, pollinationsOptions);
                }
            },
            transcriptions: {
                create: async (request) => {
                    if (!request.file) {
                        throw new Error('Audio file is required for transcription');
                    }
                    const base64Audio = request.file.toString('base64');
                    let format = 'mp3';
                    if (request.file.length > 0) {
                        format = 'mp3';
                    }
                    return await this.client.speechToText(base64Audio, format);
                }
            }
        };
        this.models = {
            list: async () => {
                const [imageModels, textModels] = await Promise.all([
                    this.client.getModels('image'),
                    this.client.getModels('text')
                ]);
                const allModels = [...imageModels, ...textModels];
                const now = Math.floor(Date.now() / 1000);
                return {
                    object: 'list',
                    data: allModels.map(modelId => ({
                        id: modelId,
                        object: 'model',
                        created: now,
                        owned_by: 'pollinations'
                    }))
                };
            }
        };
        this.client = client;
    }
    mapOpenAIModelToPollinations(openaiModel, type) {
        if (type === 'image') {
            const imageModelMap = {
                'dall-e-2': 'flux',
                'dall-e-3': 'flux'
            };
            return imageModelMap[openaiModel] || 'flux';
        }
        if (type === 'text') {
            const textModelMap = {
                'gpt-4': 'openai',
                'gpt-3.5-turbo': 'openai',
                'gpt-3.5-turbo-16k': 'openai',
                'claude-3': 'claude-hybridspace',
                'claude-3-sonnet': 'claude-hybridspace',
                'claude-3-haiku': 'claude-hybridspace'
            };
            return textModelMap[openaiModel] || 'openai';
        }
        if (type === 'audio') {
            const audioModelMap = {
                'tts-1': 'openai-audio',
                'tts-1-hd': 'openai-audio'
            };
            return audioModelMap[openaiModel] || 'openai-audio';
        }
        return 'openai';
    }
    parseSize(size) {
        const parts = size.split('x');
        if (parts.length !== 2) {
            throw new Error('Invalid size format');
        }
        const widthStr = parts[0];
        const heightStr = parts[1];
        const width = parseInt(widthStr);
        const height = parseInt(heightStr);
        if (isNaN(width) || isNaN(height)) {
            throw new Error('Invalid size format');
        }
        return { width, height };
    }
    bufferToBase64Url(buffer, mimeType = 'image/jpeg') {
        const base64 = buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
//# sourceMappingURL=openaiAdapter.js.map
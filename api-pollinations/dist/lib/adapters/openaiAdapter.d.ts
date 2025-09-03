import { PollinationsClient } from '../pollinationsClient';
export interface OpenAIImageGenerationRequest {
    prompt: string;
    n?: number;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    model?: string;
    quality?: 'standard' | 'hd';
    response_format?: 'url' | 'b64_json';
    style?: 'vivid' | 'natural';
    user?: string;
}
export interface OpenAIChatCompletionRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: string | Array<any>;
        name?: string;
        tool_call_id?: string;
    }>;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
    response_format?: {
        type: string;
    };
    tools?: Array<any>;
    tool_choice?: any;
    seed?: number;
}
export interface OpenAIAudioSpeechRequest {
    model: string;
    input: string;
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
    speed?: number;
}
export interface OpenAIAudioTranscriptionRequest {
    file: Buffer;
    model: string;
    prompt?: string;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json';
    temperature?: number;
    language?: string;
}
export declare class OpenAIAdapter {
    private client;
    constructor(client: PollinationsClient);
    private mapOpenAIModelToPollinations;
    private parseSize;
    private bufferToBase64Url;
    images: {
        generate: (request: OpenAIImageGenerationRequest) => Promise<{
            created: number;
            data: {
                url: string;
                revised_prompt: string;
            }[];
        }>;
    };
    chat: {
        completions: {
            create: (request: OpenAIChatCompletionRequest) => Promise<any>;
        };
    };
    audio: {
        speech: {
            create: (request: OpenAIAudioSpeechRequest) => Promise<Buffer<ArrayBufferLike>>;
        };
        transcriptions: {
            create: (request: OpenAIAudioTranscriptionRequest) => Promise<string>;
        };
    };
    models: {
        list: () => Promise<{
            object: string;
            data: {
                id: string;
                object: string;
                created: number;
                owned_by: string;
            }[];
        }>;
    };
}
//# sourceMappingURL=openaiAdapter.d.ts.map
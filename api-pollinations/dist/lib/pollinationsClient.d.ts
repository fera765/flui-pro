export interface ImageGenerationOptions {
    model?: string;
    seed?: number;
    width?: number;
    height?: number;
    image?: string;
    nologo?: boolean;
    private?: boolean;
    enhance?: boolean;
    safe?: boolean;
    referrer?: string;
}
export interface TextGenerationOptions {
    model?: string;
    seed?: number;
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    json?: boolean;
    system?: string;
    stream?: boolean;
    private?: boolean;
    referrer?: string;
}
export interface AudioGenerationOptions {
    voice?: string;
    model?: string;
}
export interface OpenAIChatRequest {
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
    private?: boolean;
    referrer?: string;
}
export interface HealthCheckResult {
    ok: boolean;
    upstream: 'ok' | 'error';
    error?: string;
    timestamp: Date;
}
export declare class PollinationsClient {
    private readonly imageBaseUrl;
    private readonly textBaseUrl;
    private readonly apiKey;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly retryBackoffMultiplier;
    constructor(imageBaseUrl?: string, textBaseUrl?: string);
    private makeRequestWithRetry;
    generateImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
    generateAudio(text: string, options?: AudioGenerationOptions): Promise<Buffer>;
    speechToText(audioData: string, format: string): Promise<string>;
    getModels(type: 'image' | 'text'): Promise<string[]>;
    openaiCompatibleChat(request: OpenAIChatRequest): Promise<any>;
    healthCheck(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=pollinationsClient.d.ts.map
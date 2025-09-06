export interface ImageGenerationOptions {
    size?: string;
    model?: string;
    transparent?: boolean;
}
export interface TextGenerationOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: any[];
}
export interface AudioGenerationOptions {
    voice?: string;
    model?: string;
}
export declare class PollinationsTool {
    private openai;
    constructor();
    generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
    generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
    generateTextWithTools(prompt: string, tools: any[], options?: TextGenerationOptions): Promise<any>;
    generateAudio(text: string, options?: AudioGenerationOptions): Promise<string>;
    speechToText(audioData: string, options?: {
        model?: string;
    }): Promise<string>;
    listModels(): Promise<any[]>;
    getModelInfo(modelId: string): Promise<any>;
}
//# sourceMappingURL=pollinationsTool.d.ts.map
import { EmotionVector } from '../../types/emotionMemory';
export declare class EmotionHash {
    private readonly hashLength;
    generateHash(emotionVector: EmotionVector): string;
    generateHashFromContext(context: string): string;
    validateHash(hash: string): boolean;
    private serializeEmotionVector;
    generateCompositeHash(emotionVectors: EmotionVector[]): string;
    generateContextualHash(emotionVector: EmotionVector, context: string): string;
}
//# sourceMappingURL=emotionHash.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmotionHash = void 0;
const crypto_1 = require("crypto");
class EmotionHash {
    constructor() {
        this.hashLength = 8;
    }
    generateHash(emotionVector) {
        const emotionString = this.serializeEmotionVector(emotionVector);
        const hash = (0, crypto_1.createHash)('sha256').update(emotionString).digest();
        return hash.slice(0, this.hashLength).toString('hex');
    }
    generateHashFromContext(context) {
        const normalizedContext = context.toLowerCase().trim().replace(/\s+/g, ' ');
        const hash = (0, crypto_1.createHash)('sha256').update(normalizedContext).digest();
        return hash.slice(0, this.hashLength).toString('hex');
    }
    validateHash(hash) {
        return /^[0-9a-f]{16}$/.test(hash);
    }
    serializeEmotionVector(emotionVector) {
        const valence = Math.round(emotionVector.valence * 1000) / 1000;
        const arousal = Math.round(emotionVector.arousal * 1000) / 1000;
        const dominance = Math.round(emotionVector.dominance * 1000) / 1000;
        const confidence = Math.round(emotionVector.confidence * 1000) / 1000;
        const timestamp = emotionVector.timestamp.toISOString();
        return `v:${valence},a:${arousal},d:${dominance},c:${confidence},t:${timestamp}`;
    }
    generateCompositeHash(emotionVectors) {
        const serializedVectors = emotionVectors
            .map(v => this.serializeEmotionVector(v))
            .sort()
            .join('|');
        const hash = (0, crypto_1.createHash)('sha256').update(serializedVectors).digest();
        return hash.slice(0, this.hashLength).toString('hex');
    }
    generateContextualHash(emotionVector, context) {
        const emotionString = this.serializeEmotionVector(emotionVector);
        const normalizedContext = context.toLowerCase().trim().replace(/\s+/g, ' ');
        const combined = `${emotionString}|${normalizedContext}`;
        const hash = (0, crypto_1.createHash)('sha256').update(combined).digest();
        return hash.slice(0, this.hashLength).toString('hex');
    }
}
exports.EmotionHash = EmotionHash;
//# sourceMappingURL=emotionHash.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classifier = void 0;
class Classifier {
    constructor() {
        this.imageKeywords = [
            'generate', 'create', 'make', 'draw', 'design', 'render', 'produce',
            'image', 'picture', 'photo', 'artwork', 'illustration', 'visual'
        ];
        this.textKeywords = [
            'write', 'compose', 'create', 'generate', 'draft', 'produce',
            'story', 'essay', 'article', 'text', 'content', 'narrative'
        ];
        this.audioKeywords = [
            'convert', 'transform', 'speech', 'audio', 'voice', 'narration',
            'tts', 'text-to-speech', 'audio narration'
        ];
        this.conversationKeywords = [
            'hello', 'hi', 'how are you', 'what\'s up', 'tell me', 'explain',
            'weather', 'joke', 'time', 'date', 'help', 'assist'
        ];
        this.sizePattern = /(\d{3,4})x(\d{3,4})/i;
        this.modelPattern = /(flux|dalle|openai|gpt-4)/i;
        this.voicePattern = /(alloy|echo|fable|onyx|nova|shimmer)/i;
        this.temperaturePattern = /temperature\s*(\d*\.?\d+)/i;
        this.wordCountPattern = /(\d+)-?word/i;
    }
    classifyTask(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (this.isConversation(lowerPrompt)) {
            return {
                type: 'conversation',
                confidence: 0.95,
                parameters: {}
            };
        }
        if (this.isCompositeTask(lowerPrompt)) {
            return {
                type: 'task',
                subtype: 'composite',
                confidence: 0.85,
                parameters: this.extractCompositeParameters(lowerPrompt)
            };
        }
        if (this.isImageGeneration(lowerPrompt)) {
            return {
                type: 'task',
                subtype: 'image_generation',
                confidence: 0.9,
                parameters: this.extractImageParameters(lowerPrompt)
            };
        }
        if (this.isTextGeneration(lowerPrompt)) {
            return {
                type: 'task',
                subtype: 'text_generation',
                confidence: 0.9,
                parameters: this.extractTextParameters(lowerPrompt)
            };
        }
        if (this.isAudioTask(lowerPrompt)) {
            return {
                type: 'task',
                subtype: 'audio',
                confidence: 0.9,
                parameters: this.extractAudioParameters(lowerPrompt)
            };
        }
        return {
            type: 'task',
            confidence: 0.5,
            parameters: {}
        };
    }
    isConversation(prompt) {
        return this.conversationKeywords.some(keyword => prompt.includes(keyword));
    }
    isCompositeTask(prompt) {
        const compositeIndicators = ['first', 'then', 'finally', 'and then', 'after that'];
        return compositeIndicators.some(indicator => prompt.includes(indicator));
    }
    isImageGeneration(prompt) {
        return this.imageKeywords.some(keyword => prompt.includes(keyword));
    }
    isTextGeneration(prompt) {
        return this.textKeywords.some(keyword => prompt.includes(keyword));
    }
    isAudioTask(prompt) {
        return this.audioKeywords.some(keyword => prompt.includes(keyword));
    }
    extractImageParameters(prompt) {
        const params = {};
        const sizeMatch = prompt.match(this.sizePattern);
        if (sizeMatch) {
            params.size = sizeMatch[0];
        }
        const modelMatch = prompt.match(this.modelPattern);
        if (modelMatch) {
            params.model = modelMatch[1];
        }
        const subjectMatch = prompt.match(/(?:of|a|an)\s+([^,]+?)(?:\s+\d{3,4}x\d{3,4}|\s+(?:using|with)|$)/i);
        if (subjectMatch && subjectMatch[1]) {
            params.subject = subjectMatch[1].trim();
        }
        if (prompt.includes('transparent')) {
            params.transparent = true;
        }
        return params;
    }
    extractTextParameters(prompt) {
        const params = {};
        const wordMatch = prompt.match(this.wordCountPattern);
        if (wordMatch && wordMatch[1]) {
            params.maxWords = parseInt(wordMatch[1]);
        }
        const tempMatch = prompt.match(this.temperaturePattern);
        if (tempMatch && tempMatch[1]) {
            params.temperature = parseFloat(tempMatch[1]);
        }
        const subjectMatch = prompt.match(/(?:about|on|regarding)\s+([^,]+?)(?:\s+\d+|\s+with|$)/i);
        if (subjectMatch && subjectMatch[1]) {
            params.subject = subjectMatch[1].trim();
        }
        return params;
    }
    extractAudioParameters(prompt) {
        const params = {};
        const voiceMatch = prompt.match(this.voicePattern);
        if (voiceMatch) {
            params.voice = voiceMatch[1];
        }
        if (prompt.includes('text to speech') || prompt.includes('tts')) {
            params.action = 'text_to_speech';
        }
        else if (prompt.includes('speech to text') || prompt.includes('stt')) {
            params.action = 'speech_to_text';
        }
        return params;
    }
    extractCompositeParameters(prompt) {
        const params = {};
        const subtaskIndicators = ['first', 'then', 'finally', 'and then', 'after that'];
        params.subtaskCount = subtaskIndicators.filter(indicator => prompt.includes(indicator)).length + 1;
        const subjects = prompt.match(/(?:generate|create|write|make)\s+(?:an?\s+)?([^,]+?)(?:\s+then|\s+finally|$)/gi);
        if (subjects) {
            params.subjects = subjects.map(s => s.replace(/(?:generate|create|write|make)\s+(?:an?\s+)?/i, '').trim());
        }
        return params;
    }
}
exports.Classifier = Classifier;
//# sourceMappingURL=classifier.js.map
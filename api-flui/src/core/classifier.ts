export interface ClassificationResult {
  type: 'conversation' | 'task';
  subtype?: string;
  confidence: number;
  parameters: Record<string, any>;
}

export class Classifier {
  private readonly imageKeywords = [
    'generate', 'create', 'make', 'draw', 'design', 'render', 'produce',
    'image', 'picture', 'photo', 'artwork', 'illustration', 'visual'
  ];

  private readonly textKeywords = [
    'write', 'compose', 'create', 'generate', 'draft', 'produce',
    'story', 'essay', 'article', 'text', 'content', 'narrative'
  ];

  private readonly audioKeywords = [
    'convert', 'transform', 'speech', 'audio', 'voice', 'narration',
    'tts', 'text-to-speech', 'audio narration'
  ];

  private readonly conversationKeywords = [
    'hello', 'hi', 'how are you', 'what\'s up', 'tell me', 'explain',
    'weather', 'joke', 'time', 'date', 'help', 'assist'
  ];

  private readonly sizePattern = /(\d{3,4})x(\d{3,4})/i;
  private readonly modelPattern = /(flux|dalle|openai|gpt-4)/i;
  private readonly voicePattern = /(alloy|echo|fable|onyx|nova|shimmer)/i;
  private readonly temperaturePattern = /temperature\s*(\d*\.?\d+)/i;
  private readonly wordCountPattern = /(\d+)-?word/i;

  classifyTask(prompt: string): ClassificationResult {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for conversation patterns
    if (this.isConversation(lowerPrompt)) {
      return {
        type: 'conversation',
        confidence: 0.95,
        parameters: {}
      };
    }

    // Check for composite tasks
    if (this.isCompositeTask(lowerPrompt)) {
      return {
        type: 'task',
        subtype: 'composite',
        confidence: 0.85,
        parameters: this.extractCompositeParameters(lowerPrompt)
      };
    }

    // Check for image generation
    if (this.isImageGeneration(lowerPrompt)) {
      return {
        type: 'task',
        subtype: 'image_generation',
        confidence: 0.9,
        parameters: this.extractImageParameters(lowerPrompt)
      };
    }

    // Check for text generation
    if (this.isTextGeneration(lowerPrompt)) {
      return {
        type: 'task',
        subtype: 'text_generation',
        confidence: 0.9,
        parameters: this.extractTextParameters(lowerPrompt)
      };
    }

    // Check for audio tasks
    if (this.isAudioTask(lowerPrompt)) {
      return {
        type: 'task',
        subtype: 'audio',
        confidence: 0.9,
        parameters: this.extractAudioParameters(lowerPrompt)
      };
    }

    // Default to task with low confidence
    return {
      type: 'task',
      confidence: 0.5,
      parameters: {}
    };
  }

  private isConversation(prompt: string): boolean {
    return this.conversationKeywords.some(keyword => prompt.includes(keyword));
  }

  private isCompositeTask(prompt: string): boolean {
    const compositeIndicators = ['first', 'then', 'finally', 'and then', 'after that'];
    return compositeIndicators.some(indicator => prompt.includes(indicator));
  }

  private isImageGeneration(prompt: string): boolean {
    return this.imageKeywords.some(keyword => prompt.includes(keyword));
  }

  private isTextGeneration(prompt: string): boolean {
    return this.textKeywords.some(keyword => prompt.includes(keyword));
  }

  private isAudioTask(prompt: string): boolean {
    return this.audioKeywords.some(keyword => prompt.includes(keyword));
  }

  private extractImageParameters(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract size
    const sizeMatch = prompt.match(this.sizePattern);
    if (sizeMatch) {
      params.size = sizeMatch[0];
    }

    // Extract model
    const modelMatch = prompt.match(this.modelPattern);
    if (modelMatch) {
      params.model = modelMatch[1];
    }

    // Extract subject (everything after "of" or "a" before size/model)
    const subjectMatch = prompt.match(/(?:of|a|an)\s+([^,]+?)(?:\s+\d{3,4}x\d{3,4}|\s+(?:using|with)|$)/i);
    if (subjectMatch && subjectMatch[1]) {
      params.subject = subjectMatch[1].trim();
    }

    // Check for transparent background
    if (prompt.includes('transparent')) {
      params.transparent = true;
    }

    return params;
  }

  private extractTextParameters(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract word count
    const wordMatch = prompt.match(this.wordCountPattern);
    if (wordMatch && wordMatch[1]) {
      params.maxWords = parseInt(wordMatch[1]);
    }

    // Extract temperature
    const tempMatch = prompt.match(this.temperaturePattern);
    if (tempMatch && tempMatch[1]) {
      params.temperature = parseFloat(tempMatch[1]);
    }

    // Extract subject
    const subjectMatch = prompt.match(/(?:about|on|regarding)\s+([^,]+?)(?:\s+\d+|\s+with|$)/i);
    if (subjectMatch && subjectMatch[1]) {
      params.subject = subjectMatch[1].trim();
    }

    return params;
  }

  private extractAudioParameters(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract voice
    const voiceMatch = prompt.match(this.voicePattern);
    if (voiceMatch) {
      params.voice = voiceMatch[1];
    }

    // Determine action
    if (prompt.includes('text to speech') || prompt.includes('tts')) {
      params.action = 'text_to_speech';
    } else if (prompt.includes('speech to text') || prompt.includes('stt')) {
      params.action = 'speech_to_text';
    }

    return params;
  }

  private extractCompositeParameters(prompt: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Count subtasks
    const subtaskIndicators = ['first', 'then', 'finally', 'and then', 'after that'];
    params.subtaskCount = subtaskIndicators.filter(indicator => prompt.includes(indicator)).length + 1;

    // Extract main subjects
    const subjects = prompt.match(/(?:generate|create|write|make)\s+(?:an?\s+)?([^,]+?)(?:\s+then|\s+finally|$)/gi);
    if (subjects) {
      params.subjects = subjects.map(s => s.replace(/(?:generate|create|write|make)\s+(?:an?\s+)?/i, '').trim());
    }

    return params;
  }
}
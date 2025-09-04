"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.textToUppercase = exports.countWords = exports.reverseText = void 0;
exports.reverseText = {
    name: 'reverseText',
    description: 'Reverse the order of characters in a text string',
    parameters: {
        text: {
            type: 'string',
            required: true,
            description: 'Text to reverse'
        }
    },
    execute: async (params) => {
        const { text } = params;
        const reversed = text.split('').reverse().join('');
        return {
            original: text,
            reversed: reversed,
            length: text.length
        };
    }
};
exports.countWords = {
    name: 'countWords',
    description: 'Count words, characters, and lines in a text',
    parameters: {
        text: {
            type: 'string',
            required: true,
            description: 'Text to analyze'
        }
    },
    execute: async (params) => {
        const { text } = params;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const lines = text.split('\n').length;
        return {
            text: text,
            wordCount: words.length,
            characterCount: characters,
            characterCountNoSpaces: charactersNoSpaces,
            lineCount: lines,
            averageWordLength: words.length > 0 ? charactersNoSpaces / words.length : 0
        };
    }
};
exports.textToUppercase = {
    name: 'textToUppercase',
    description: 'Convert text to uppercase',
    parameters: {
        text: {
            type: 'string',
            required: true,
            description: 'Text to convert to uppercase'
        }
    },
    execute: async (params) => {
        const { text } = params;
        return {
            original: text,
            uppercase: text.toUpperCase(),
            lowercase: text.toLowerCase(),
            titleCase: text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        };
    }
};
exports.plugin = {
    name: 'text-utils',
    version: '1.0.0',
    description: 'Text utilities plugin providing text manipulation functions',
    functions: [exports.reverseText, exports.countWords, exports.textToUppercase],
    dependencies: [],
    path: '',
    status: 'active'
};
//# sourceMappingURL=index.js.map
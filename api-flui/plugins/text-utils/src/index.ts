// Plugin interfaces (copied to avoid import issues)
interface PluginFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

interface Plugin {
  name: string;
  version: string;
  description: string;
  functions: PluginFunction[];
  dependencies: string[];
  path: string;
  status: 'loading' | 'installing' | 'testing' | 'active' | 'error' | 'deleted';
  error?: string;
}

export const reverseText: PluginFunction = {
  name: 'reverseText',
  description: 'Reverse the order of characters in a text string',
  parameters: {
    text: { 
      type: 'string', 
      required: true, 
      description: 'Text to reverse' 
    }
  },
  execute: async (params: { text: string }) => {
    const { text } = params;
    const reversed = text.split('').reverse().join('');
    
    return {
      original: text,
      reversed: reversed,
      length: text.length
    };
  }
};

export const countWords: PluginFunction = {
  name: 'countWords',
  description: 'Count words, characters, and lines in a text',
  parameters: {
    text: { 
      type: 'string', 
      required: true, 
      description: 'Text to analyze' 
    }
  },
  execute: async (params: { text: string }) => {
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

export const textToUppercase: PluginFunction = {
  name: 'textToUppercase',
  description: 'Convert text to uppercase',
  parameters: {
    text: { 
      type: 'string', 
      required: true, 
      description: 'Text to convert to uppercase' 
    }
  },
  execute: async (params: { text: string }) => {
    const { text } = params;
    
    return {
      original: text,
      uppercase: text.toUpperCase(),
      lowercase: text.toLowerCase(),
      titleCase: text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    };
  }
};

export const plugin: Plugin = {
  name: 'text-utils',
  version: '1.0.0',
  description: 'Text utilities plugin providing text manipulation functions',
  functions: [reverseText, countWords, textToUppercase],
  dependencies: [],
  path: '',
  status: 'active'
};
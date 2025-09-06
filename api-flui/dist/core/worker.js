"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const advancedTools_1 = require("../tools/advancedTools");
class Worker {
    constructor(pollinationsTool, knowledgeManager, workingDirectory = process.cwd()) {
        this.pollinationsTool = pollinationsTool;
        this.knowledgeManager = knowledgeManager;
        this.isWorking = false;
        this.currentTaskId = null;
        this.advancedTools = new advancedTools_1.AdvancedTools(workingDirectory);
    }
    async executeTask(task) {
        if (this.isWorking) {
            throw new Error('Worker is already busy');
        }
        this.isWorking = true;
        this.currentTaskId = task.id;
        try {
            let result;
            switch (task.type) {
                case 'conversation':
                    result = await this.handleConversation(task);
                    break;
                case 'task':
                    result = await this.handleTask(task);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            return result;
        }
        finally {
            this.isWorking = false;
            this.currentTaskId = null;
        }
    }
    isAvailable() {
        return !this.isWorking;
    }
    getCurrentTaskId() {
        return this.currentTaskId;
    }
    async handleConversation(task) {
        try {
            const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(task.prompt, 2);
            const enhancedPrompt = contextualKnowledge
                ? `${task.prompt}\n\n${contextualKnowledge}`
                : task.prompt;
            const response = await this.pollinationsTool.generateText(enhancedPrompt, {
                model: 'openai',
                temperature: 0.7,
                maxTokens: 500
            });
            return {
                success: true,
                data: response,
                metadata: {
                    type: 'conversation',
                    model: 'openai',
                    temperature: 0.7,
                    knowledgeUsed: !!contextualKnowledge
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Conversation failed',
                metadata: { type: 'conversation' }
            };
        }
    }
    async handleTask(task) {
        const metadata = task.metadata;
        const classification = metadata?.classification;
        if (!classification) {
            return {
                success: false,
                error: 'Task classification not found',
                metadata: { type: 'task' }
            };
        }
        try {
            const availableTools = this.advancedTools.getAllToolSchemas();
            const executionTools = [
                {
                    type: "function",
                    function: {
                        name: "execute_task",
                        description: "Execute a task using available tools and resources",
                        parameters: {
                            type: "object",
                            properties: {
                                action: {
                                    type: "string",
                                    enum: ["generate_text", "generate_image", "generate_audio", "use_tool", "composite"],
                                    description: "Type of action to perform"
                                },
                                parameters: {
                                    type: "object",
                                    description: "Parameters for the action"
                                },
                                reasoning: {
                                    type: "string",
                                    description: "Explanation of why this action was chosen"
                                }
                            },
                            required: ["action", "parameters", "reasoning"]
                        }
                    }
                },
                ...availableTools
            ];
            const executionPrompt = `
Execute the following task using the available tools and resources.

Task: "${task.prompt}"
Type: ${task.type}
Subtype: ${classification.subtype}
Parameters: ${JSON.stringify(classification.parameters)}

Available tools:
- generate_text: Generate text content
- generate_image: Generate images
- generate_audio: Generate audio content
- web_search: Search the web for information
- fetch: Fetch content from URLs
- file_read: Read files
- file_write: Write files
- shell: Execute shell commands
- text_split: Split text into chunks
- text_summarize: Summarize text content

Instructions:
1. Analyze the task requirements
2. Choose the appropriate action and tools
3. Execute the task step by step
4. Provide reasoning for your choices

IMPORTANTE: Use the execute_task function to perform the main action, and use other tools as needed.
`;
            const response = await this.pollinationsTool.generateTextWithTools(executionPrompt, executionTools, {
                temperature: 0.3,
                maxTokens: 1000
            });
            if (response.toolCalls && response.toolCalls.length > 0) {
                return await this.processToolCalls(response.toolCalls, task);
            }
            return await this.handleTraditionalExecution(task);
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Task execution failed',
                metadata: { type: 'task', subtype: classification.subtype }
            };
        }
    }
    async processToolCalls(toolCalls, task) {
        const results = [];
        for (const toolCall of toolCalls) {
            try {
                if (!toolCall || !toolCall.function) {
                    console.error('Invalid toolCall:', toolCall);
                    results.push({ success: false, error: 'Invalid tool call structure' });
                    continue;
                }
                const { name, arguments: args } = toolCall.function;
                const parsedArgs = JSON.parse(args);
                switch (name) {
                    case 'execute_task':
                        console.log('Executing task action with args:', parsedArgs);
                        results.push(await this.executeTaskAction(parsedArgs, task));
                        break;
                    case 'web_search':
                        results.push(await this.advancedTools.createWebSearchTool().execute(parsedArgs));
                        break;
                    case 'fetch':
                        results.push(await this.advancedTools.createFetchTool().execute(parsedArgs));
                        break;
                    case 'file_read':
                        results.push(await this.advancedTools.createFileReadTool().execute(parsedArgs));
                        break;
                    case 'file_write':
                        results.push(await this.advancedTools.createFileWriteTool().execute(parsedArgs));
                        break;
                    case 'shell':
                        results.push(await this.advancedTools.createShellTool().execute(parsedArgs));
                        break;
                    case 'text_split':
                        results.push(await this.advancedTools.createTextSplitTool().execute(parsedArgs));
                        break;
                    case 'text_summarize':
                        results.push(await this.advancedTools.createTextSummarizeTool().execute(parsedArgs));
                        break;
                    default:
                        console.warn(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                console.error(`Error executing tool ${toolCall.function.name}:`, error);
                results.push({ success: false, error: error.message });
            }
        }
        return {
            success: true,
            data: results,
            metadata: {
                type: 'task',
                subtype: task.metadata.classification.subtype,
                toolCalls: toolCalls.length,
                results: results.length
            }
        };
    }
    async executeTaskAction(action, task) {
        if (!action) {
            throw new Error('Action is undefined');
        }
        const { action: actionType, parameters, reasoning } = action;
        switch (actionType) {
            case 'generate_text':
                return await this.pollinationsTool.generateText(parameters.prompt || task.prompt, {
                    model: parameters.model || 'openai',
                    temperature: parameters.temperature || 0.7,
                    maxTokens: parameters.maxTokens || 500
                });
            case 'generate_image':
                return await this.pollinationsTool.generateImage(parameters.prompt || task.prompt, {
                    size: parameters.size || '1024x1024',
                    model: parameters.model || 'flux'
                });
            case 'generate_audio':
                return await this.pollinationsTool.generateAudio(parameters.text || task.prompt, {
                    voice: parameters.voice || 'alloy',
                    model: parameters.model || 'openai-audio'
                });
            default:
                throw new Error(`Unsupported action: ${actionType}`);
        }
    }
    async handleTraditionalExecution(task) {
        const metadata = task.metadata;
        const classification = metadata.classification;
        switch (classification.subtype) {
            case 'image_generation':
                return await this.handleImageGeneration(task);
            case 'text_generation':
                return await this.handleTextGeneration(task);
            case 'audio':
                return await this.handleAudioTask(task);
            case 'composite':
                return await this.handleCompositeTask(task);
            default:
                if (this.isImagePrompt(task.prompt)) {
                    return await this.handleImageGeneration(task);
                }
                else if (this.isTextPrompt(task.prompt)) {
                    return await this.handleTextGeneration(task);
                }
                else {
                    throw new Error(`Unsupported task subtype: ${classification.subtype}`);
                }
        }
    }
    async handleImageGeneration(task) {
        const metadata = task.metadata;
        const params = metadata?.classification?.parameters || {};
        try {
            const imageData = await this.pollinationsTool.generateImage(params.subject || task.prompt, {
                size: params.size || '1024x1024',
                model: params.model || 'flux',
                transparent: params.transparent || false
            });
            return {
                success: true,
                data: imageData,
                metadata: {
                    type: 'image_generation',
                    size: params.size || '1024x1024',
                    model: params.model || 'flux',
                    transparent: params.transparent || false
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Image generation failed',
                metadata: { type: 'image_generation' }
            };
        }
    }
    async handleTextGeneration(task) {
        const metadata = task.metadata;
        const params = metadata?.classification?.parameters || {};
        try {
            const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(task.prompt, 3);
            const enhancedPrompt = contextualKnowledge
                ? `${task.prompt}\n\n${contextualKnowledge}`
                : task.prompt;
            const text = await this.pollinationsTool.generateText(enhancedPrompt, {
                model: params.model || 'openai',
                temperature: params.temperature || 0.7,
                maxTokens: params.maxWords ? params.maxWords * 10 : 500
            });
            return {
                success: true,
                data: text,
                metadata: {
                    type: 'text_generation',
                    model: params.model || 'openai',
                    temperature: params.temperature || 0.7,
                    knowledgeUsed: !!contextualKnowledge,
                    maxTokens: params.maxWords ? params.maxWords * 10 : 500
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Text generation failed',
                metadata: { type: 'text_generation' }
            };
        }
    }
    async handleAudioTask(task) {
        const metadata = task.metadata;
        const params = metadata?.classification?.parameters || {};
        try {
            if (params.action === 'text_to_speech') {
                const audioData = await this.pollinationsTool.generateAudio(task.prompt, {
                    voice: params.voice || 'alloy',
                    model: 'openai-audio'
                });
                return {
                    success: true,
                    data: audioData,
                    metadata: {
                        type: 'audio_generation',
                        action: 'text_to_speech',
                        voice: params.voice || 'alloy',
                        model: 'openai-audio'
                    }
                };
            }
            else {
                throw new Error(`Unsupported audio action: ${params.action}`);
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Audio task failed',
                metadata: { type: 'audio' }
            };
        }
    }
    async handleCompositeTask(task) {
        return {
            success: true,
            data: {
                message: 'Composite task plan created, execution will be delegated',
                taskId: task.id,
                type: 'composite'
            },
            metadata: {
                type: 'composite',
                subtaskCount: task.childTasks.length
            }
        };
    }
    isImagePrompt(prompt) {
        const imageKeywords = ['image', 'picture', 'photo', 'generate', 'create', 'draw'];
        return imageKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    }
    isTextPrompt(prompt) {
        const textKeywords = ['write', 'story', 'essay', 'text', 'content'];
        return textKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    }
}
exports.Worker = Worker;
//# sourceMappingURL=worker.js.map
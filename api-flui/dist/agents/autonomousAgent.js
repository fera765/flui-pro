"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousAgent = void 0;
const openai_1 = __importDefault(require("openai"));
class AutonomousAgent {
    constructor(agent, availableTools) {
        this.agent = agent;
        this.availableTools = availableTools;
        this.tools = new Map();
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000',
            dangerouslyAllowBrowser: true
        });
        availableTools.forEach(tool => {
            this.tools.set(tool.name, tool);
        });
    }
    async executeTask(task) {
        try {
            const systemPrompt = this.createSystemPrompt(task);
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: task.prompt
                }
            ];
            const openaiTools = this.prepareToolsForOpenAI();
            const response = await this.openai.chat.completions.create({
                model: 'openai',
                messages,
                tools: openaiTools,
                tool_choice: 'auto',
                temperature: 0.7,
                max_tokens: 2000
            });
            const message = response.choices[0]?.message;
            if (!message) {
                return {
                    success: false,
                    error: 'No response from agent'
                };
            }
            if (message.tool_calls && message.tool_calls.length > 0) {
                return await this.handleToolCalls(message.tool_calls, task);
            }
            return {
                success: true,
                data: message.content,
                nextAction: {
                    type: 'complete'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Agent execution failed'
            };
        }
    }
    createSystemPrompt(task) {
        return `
# ${this.agent.name} - ${this.agent.role}

## Persona
${this.agent.persona}

## Objective
${this.agent.systemPrompt}

## Current Context
${task.context}

## Available Tools
You have access to the following tools:
${this.availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

## Instructions
1. Analyze the current task carefully
2. Use the available tools when necessary
3. You can delegate to other agents or use tools
4. Always provide clear reasoning for your actions
5. If you need to delegate, specify the target agent and parameters
6. If you need to use a tool, call it with appropriate parameters
7. Always return structured responses

## Response Format
- If completing the task directly: return the result
- If delegating: specify nextAction with type 'delegate'
- If using tools: call the appropriate tool
- Always explain your reasoning

Current depth: ${this.agent.currentDepth}/${this.agent.maxDepth}
`;
    }
    prepareToolsForOpenAI() {
        return this.availableTools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: tool.parameters,
                    required: Object.keys(tool.parameters).filter(key => tool.parameters[key].required)
                }
            }
        }));
    }
    async handleToolCalls(toolCalls, task) {
        const results = [];
        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const toolParams = JSON.parse(toolCall.function.arguments);
            const tool = this.tools.get(toolName);
            if (!tool) {
                results.push({
                    tool_call_id: toolCall.id,
                    output: `Tool ${toolName} not found`
                });
                continue;
            }
            try {
                const result = await tool.execute(toolParams);
                results.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(result)
                });
            }
            catch (error) {
                results.push({
                    tool_call_id: toolCall.id,
                    output: `Error: ${error.message}`
                });
            }
        }
        const messages = [
            {
                role: 'system',
                content: this.createSystemPrompt(task)
            },
            {
                role: 'user',
                content: task.prompt
            },
            {
                role: 'assistant',
                content: 'I will use the available tools to complete this task.',
                tool_calls: toolCalls
            },
            {
                role: 'tool',
                content: results.map(r => r.output).join('\n'),
                tool_call_id: toolCalls[0]?.id
            }
        ];
        const response = await this.openai.chat.completions.create({
            model: 'openai',
            messages,
            temperature: 0.7,
            max_tokens: 2000
        });
        const message = response.choices[0]?.message;
        return {
            success: true,
            data: message?.content,
            nextAction: {
                type: 'complete'
            }
        };
    }
}
exports.AutonomousAgent = AutonomousAgent;
//# sourceMappingURL=autonomousAgent.js.map
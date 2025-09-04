import OpenAI from 'openai';
import { Agent, AgentTask, AgentResponse, Tool } from '../types/advanced';

export class AutonomousAgent {
  private openai: OpenAI;
  private tools: Map<string, Tool> = new Map();

  constructor(
    private agent: Agent,
    private availableTools: Tool[]
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000',
      dangerouslyAllowBrowser: true
    });

    // Register available tools
    availableTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    try {
      // Create system prompt with engineering
      const systemPrompt = this.createSystemPrompt(task);
      
      // Prepare messages
      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: task.prompt
        }
      ];

      // Prepare tools for OpenAI
      const openaiTools = this.prepareToolsForOpenAI();

      // Call OpenAI with tools
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

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        return await this.handleToolCalls(message.tool_calls, task);
      }

      // Direct response
      return {
        success: true,
        data: message.content,
        nextAction: {
          type: 'complete'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Agent execution failed'
      };
    }
  }

  private createSystemPrompt(task: AgentTask): string {
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

  private prepareToolsForOpenAI(): any[] {
    return this.availableTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
          required: Object.keys(tool.parameters).filter(key => 
            tool.parameters[key].required
          )
        }
      }
    }));
  }

  private async handleToolCalls(toolCalls: any[], task: AgentTask): Promise<AgentResponse> {
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
      } catch (error: any) {
        results.push({
          tool_call_id: toolCall.id,
          output: `Error: ${error.message}`
        });
      }
    }

    // Continue conversation with tool results
    const messages = [
      {
        role: 'system' as const,
        content: this.createSystemPrompt(task)
      },
      {
        role: 'user' as const,
        content: task.prompt
      },
      {
        role: 'assistant' as const,
        content: 'I will use the available tools to complete this task.',
        tool_calls: toolCalls
      },
      {
        role: 'tool' as const,
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
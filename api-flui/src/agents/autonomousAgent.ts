import OpenAI from 'openai';
import { Agent, AgentTask, AgentResponse, Tool } from '../types/advanced';

export class AutonomousAgent {
  private openai: OpenAI;
  private tools: Map<string, Tool> = new Map();
  private executionCount: number = 0;
  private maxExecutions: number = 3; // Limit executions to prevent loops

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
      // DEBUG: Log execution start
      this.executionCount++;
      console.log(`\n=== AUTONOMOUS AGENT EXECUTION #${this.executionCount} ===`);
      console.log(`Agent: ${this.agent.name} (${this.agent.id})`);
      console.log(`Task: ${task.prompt}`);
      console.log(`Context: ${task.context.substring(0, 200)}...`);
      console.log(`Execution Count: ${this.executionCount}/${this.maxExecutions}`);
      console.log(`================================================`);

      // Check execution limit
      if (this.executionCount > this.maxExecutions) {
        console.log(`🚨 LOOP DETECTED: Agent ${this.agent.name} exceeded max executions (${this.maxExecutions})`);
        return {
          success: false,
          error: `Agent exceeded maximum executions (${this.maxExecutions}). Possible loop detected.`,
          nextAction: {
            type: 'complete'
          }
        };
      }

      // Create system prompt with engineering
      const systemPrompt = this.createSystemPrompt(task);
      
      // DEBUG: Log system prompt
      console.log(`\n=== SYSTEM PROMPT ===`);
      console.log(systemPrompt.substring(0, 500) + '...');
      console.log(`====================`);
      
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

      // DEBUG: Log OpenAI request
      console.log(`\n=== OPENAI REQUEST ===`);
      console.log(`Model: openai`);
      console.log(`Messages count: ${messages.length}`);
      console.log(`Tools count: ${openaiTools.length}`);
      console.log(`Base URL: ${this.openai.baseURL}`);
      console.log(`======================`);

      // Call OpenAI - Pollinations API doesn't support tools, so we'll use a simple approach
      let response;
      if (this.openai.baseURL?.includes('localhost:4000')) {
        // Pollinations API - no tools support
        console.log(`🔧 POLLINATIONS API: Skipping tools parameter`);
        response = await this.openai.chat.completions.create({
          model: 'openai',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        });
      } else {
        // Standard OpenAI API - with tools
        console.log(`🔧 STANDARD OPENAI API: Using tools`);
        response = await this.openai.chat.completions.create({
          model: 'openai',
          messages,
          tools: openaiTools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2000
        });
      }

      // DEBUG: Log OpenAI response
      console.log(`\n=== OPENAI RESPONSE ===`);
      console.log(`Response ID: ${response.id}`);
      console.log(`Choices count: ${response.choices.length}`);
      console.log(`Usage: ${JSON.stringify(response.usage)}`);
      console.log(`=======================`);

      const message = response.choices[0]?.message;
      
      if (!message) {
        console.log(`❌ ERROR: No message in response`);
        return {
          success: false,
          error: 'No response from agent'
        };
      }

      // DEBUG: Log message details
      console.log(`\n=== MESSAGE DETAILS ===`);
      console.log(`Content: ${message.content ? message.content.substring(0, 200) + '...' : 'null'}`);
      console.log(`Tool calls: ${message.tool_calls ? message.tool_calls.length : 0}`);
      if (message.tool_calls) {
        message.tool_calls.forEach((call, index) => {
          console.log(`  Tool call ${index + 1}: ${call.function.name}`);
        });
      }
      console.log(`=======================`);

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 EXECUTING TOOL CALLS: ${message.tool_calls.length} tools`);
        const result = await this.handleToolCalls(message.tool_calls, task);
        console.log(`✅ TOOL CALLS RESULT: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
          console.log(`❌ TOOL ERROR: ${result.error}`);
        }
        return result;
      }

      // Direct response
      console.log(`💬 DIRECT RESPONSE: ${message.content ? 'HAS CONTENT' : 'NO CONTENT'}`);
      const response_result = {
        success: true,
        data: message.content,
        nextAction: {
          type: 'complete' as const
        }
      };
      console.log(`✅ AGENT EXECUTION COMPLETED SUCCESSFULLY`);
      return response_result;

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
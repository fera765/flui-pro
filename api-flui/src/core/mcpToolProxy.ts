import { MCPRegistry } from './mcpRegistry';
import { MCPTool } from '../types/mcp';

export interface MCPToolProxyResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class MCPToolProxy {
  private registry: MCPRegistry;

  constructor(registry: MCPRegistry) {
    this.registry = registry;
  }

  async callTool(toolName: string, args: any): Promise<MCPToolProxyResult> {
    try {
      // Find the tool across all connected MCPs
      const allTools = this.registry.getAllTools();
      const tool = allTools.find(t => t.name === toolName);

      if (!tool) {
        return {
          success: false,
          error: `Tool '${toolName}' not found in any connected MCP`
        };
      }

      // Call the tool via the registry
      const result = await this.registry.callMCPTool(tool.mcpName, toolName, args);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Tool call failed'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to call MCP tool'
      };
    }
  }

  getAvailableTools(): MCPTool[] {
    return this.registry.getAllTools();
  }

  getToolsByMCP(mcpName: string): MCPTool[] {
    return this.registry.getMCPTools(mcpName);
  }

  async listAllTools(): Promise<{
    mcpTools: MCPTool[];
    nativeTools: string[];
  }> {
    const mcpTools = this.getAvailableTools();
    const nativeTools = [
      'generateText',
      'generateImage', 
      'generateAudio',
      'speechToText',
      'listModels',
      'getModelInfo'
    ];

    return {
      mcpTools,
      nativeTools
    };
  }

  async executeTool(toolName: string, args: any): Promise<MCPToolProxyResult> {
    // First try MCP tools
    const mcpResult = await this.callTool(toolName, args);
    if (mcpResult.success) {
      return mcpResult;
    }

    // If not found in MCP tools, it might be a native tool
    // This would be handled by the main orchestrator
    return {
      success: false,
      error: `Tool '${toolName}' not found in MCP tools or native tools`
    };
  }

  isToolAvailable(toolName: string): boolean {
    const allTools = this.getAvailableTools();
    return allTools.some(tool => tool.name === toolName);
  }

  getToolInfo(toolName: string): MCPTool | null {
    const allTools = this.getAvailableTools();
    return allTools.find(tool => tool.name === toolName) || null;
  }

  async refreshTools(): Promise<void> {
    // Refresh tools for all connected MCPs
    const mcpList = this.registry.listMCPs();
    for (const mcp of mcpList) {
      if (this.registry.isMCPConnected(mcp.name)) {
        await this.registry.loadMCPTools(mcp.name);
      }
    }
  }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPToolProxy = void 0;
class MCPToolProxy {
    constructor(registry) {
        this.registry = registry;
    }
    async callTool(toolName, args) {
        try {
            const allTools = this.registry.getAllTools();
            const tool = allTools.find(t => t.name === toolName);
            if (!tool) {
                return {
                    success: false,
                    error: `Tool '${toolName}' not found in any connected MCP`
                };
            }
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to call MCP tool'
            };
        }
    }
    getAvailableTools() {
        return this.registry.getAllTools();
    }
    getToolsByMCP(mcpName) {
        return this.registry.getMCPTools(mcpName);
    }
    async listAllTools() {
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
    async executeTool(toolName, args) {
        const mcpResult = await this.callTool(toolName, args);
        if (mcpResult.success) {
            return mcpResult;
        }
        return {
            success: false,
            error: `Tool '${toolName}' not found in MCP tools or native tools`
        };
    }
    isToolAvailable(toolName) {
        const allTools = this.getAvailableTools();
        return allTools.some(tool => tool.name === toolName);
    }
    getToolInfo(toolName) {
        const allTools = this.getAvailableTools();
        return allTools.find(tool => tool.name === toolName) || null;
    }
    async refreshTools() {
        const mcpList = this.registry.listMCPs();
        for (const mcp of mcpList) {
            if (this.registry.isMCPConnected(mcp.name)) {
                await this.registry.loadMCPTools(mcp.name);
            }
        }
    }
}
exports.MCPToolProxy = MCPToolProxy;
//# sourceMappingURL=mcpToolProxy.js.map
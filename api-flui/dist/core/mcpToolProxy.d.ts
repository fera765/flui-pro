import { MCPRegistry } from './mcpRegistry';
import { MCPTool } from '../types/mcp';
export interface MCPToolProxyResult {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class MCPToolProxy {
    private registry;
    constructor(registry: MCPRegistry);
    callTool(toolName: string, args: any): Promise<MCPToolProxyResult>;
    getAvailableTools(): MCPTool[];
    getToolsByMCP(mcpName: string): MCPTool[];
    listAllTools(): Promise<{
        mcpTools: MCPTool[];
        nativeTools: string[];
    }>;
    executeTool(toolName: string, args: any): Promise<MCPToolProxyResult>;
    isToolAvailable(toolName: string): boolean;
    getToolInfo(toolName: string): MCPTool | null;
    refreshTools(): Promise<void>;
}
//# sourceMappingURL=mcpToolProxy.d.ts.map
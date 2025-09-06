import { MCPConfig, MCPTool } from '../types/mcp';
export interface MCPRegistryResult {
    success: boolean;
    data?: MCPConfig;
    error?: string;
}
export declare class MCPRegistry {
    private mcpConfigs;
    private mcpConnections;
    private connector;
    constructor();
    addMCP(config: MCPConfig): Promise<MCPRegistryResult>;
    removeMCP(name: string): Promise<MCPRegistryResult>;
    listMCPs(): MCPConfig[];
    getMCP(name: string): MCPConfig | undefined;
    connectMCP(name: string): Promise<MCPRegistryResult>;
    disconnectMCP(name: string): Promise<MCPRegistryResult>;
    loadMCPTools(name: string): Promise<void>;
    getAllTools(): MCPTool[];
    getMCPTools(name: string): MCPTool[];
    getConnectionStatus(): Array<{
        name: string;
        status: string;
        toolsCount: number;
        lastError?: string;
        connectedAt?: Date;
    }>;
    callMCPTool(mcpName: string, toolName: string, args: any): Promise<any>;
    isMCPConnected(name: string): boolean;
    enableMCP(name: string): Promise<MCPRegistryResult>;
    disableMCP(name: string): Promise<MCPRegistryResult>;
}
//# sourceMappingURL=mcpRegistry.d.ts.map
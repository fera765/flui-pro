export interface MCPConfig {
    name: string;
    type: 'process' | 'url';
    command?: string;
    args?: string[];
    url?: string;
    description?: string;
    enabled?: boolean;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    mcpName: string;
}
export interface MCPConnection {
    config: MCPConfig;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    tools: MCPTool[];
    lastError?: string;
    connectedAt?: Date;
}
export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface MCPInitializeRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: 'initialize';
    params: {
        protocolVersion: string;
        capabilities: {
            tools?: {};
        };
        clientInfo: {
            name: string;
            version: string;
        };
    };
}
export interface MCPInitializeResponse {
    jsonrpc: '2.0';
    id: string | number;
    result: {
        protocolVersion: string;
        capabilities: {
            tools?: {};
        };
        serverInfo: {
            name: string;
            version: string;
        };
    };
}
export interface MCPListToolsRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: 'tools/list';
}
export interface MCPListToolsResponse {
    jsonrpc: '2.0';
    id: string | number;
    result: {
        tools: Array<{
            name: string;
            description: string;
            inputSchema: any;
        }>;
    };
}
export interface MCPCallToolRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: 'tools/call';
    params: {
        name: string;
        arguments: any;
    };
}
export interface MCPCallToolResponse {
    jsonrpc: '2.0';
    id: string | number;
    result: {
        content: Array<{
            type: string;
            text?: string;
            data?: string;
        }>;
    };
}
//# sourceMappingURL=mcp.d.ts.map
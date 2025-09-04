import { MCPConfig } from '../types/mcp';
export interface MCPConnectorResult {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class MCPConnector {
    private connections;
    private requestId;
    connect(config: MCPConfig): Promise<MCPConnectorResult>;
    private connectProcess;
    private connectURL;
    private performHandshake;
    private performHTTPHandshake;
    private sendRequest;
    private sendProcessRequest;
    private sendHTTPRequest;
    disconnect(name: string): Promise<MCPConnectorResult>;
    disconnectAll(): Promise<void>;
    listTools(name: string): Promise<MCPConnectorResult>;
    callTool(name: string, toolName: string, args: any): Promise<MCPConnectorResult>;
    isConnected(name: string): boolean;
    getConnectionStatus(): Array<{
        name: string;
        status: string;
        lastError?: string;
        connectedAt?: Date;
    }>;
    private updateConnectionStatus;
    private getNextRequestId;
}
//# sourceMappingURL=mcpConnector.d.ts.map
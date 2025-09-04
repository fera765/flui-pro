import { spawn, ChildProcess } from 'child_process';
import { MCPConfig, MCPConnection, MCPTool, MCPRequest, MCPResponse, MCPInitializeRequest, MCPInitializeResponse, MCPListToolsRequest, MCPListToolsResponse, MCPCallToolRequest, MCPCallToolResponse } from '../types/mcp';

export interface MCPConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class MCPConnector {
  private connections: Map<string, {
    process?: ChildProcess;
    config: MCPConfig;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    lastError?: string;
    connectedAt?: Date;
  }> = new Map();

  private requestId = 0;

  async connect(config: MCPConfig): Promise<MCPConnectorResult> {
    try {
      // Check if already connected
      if (this.connections.has(config.name)) {
        const connection = this.connections.get(config.name)!;
        if (connection.status === 'connected') {
          return {
            success: false,
            error: `MCP '${config.name}' is already connected`
          };
        }
      }

      // Update status to connecting
      this.connections.set(config.name, {
        config,
        status: 'connecting'
      });

      if (config.type === 'process') {
        return await this.connectProcess(config);
      } else if (config.type === 'url') {
        return await this.connectURL(config);
      } else {
        return {
          success: false,
          error: 'Unsupported MCP type'
        };
      }
    } catch (error: any) {
      this.updateConnectionStatus(config.name, 'error', error.message);
      return {
        success: false,
        error: error.message || 'Failed to connect to MCP'
      };
    }
  }

  private async connectProcess(config: MCPConfig): Promise<MCPConnectorResult> {
    try {
      if (!config.command || !config.args) {
        return {
          success: false,
          error: 'Command and args are required for process type'
        };
      }

      // Spawn the process
      const childProcess = spawn(config.command, config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      // Store the process
      this.connections.set(config.name, {
        process: childProcess,
        config,
        status: 'connecting'
      });

      // Set up error handling
      childProcess.on('error', (error: Error) => {
        console.error(`MCP process error for ${config.name}:`, error);
        this.updateConnectionStatus(config.name, 'error', error.message);
      });

      childProcess.on('exit', (code: number | null, signal: string | null) => {
        console.log(`MCP process exited for ${config.name}: code=${code}, signal=${signal}`);
        this.updateConnectionStatus(config.name, 'disconnected');
      });

      // Wait a bit for process to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Perform MCP handshake
      const handshakeResult = await this.performHandshake(config.name);
      if (!handshakeResult.success) {
        childProcess.kill();
        return handshakeResult;
      }

      this.updateConnectionStatus(config.name, 'connected');
      return {
        success: true,
        data: { type: 'process', pid: childProcess.pid }
      };
    } catch (error: any) {
      this.updateConnectionStatus(config.name, 'error', error.message);
      return {
        success: false,
        error: error.message || 'Failed to connect to process MCP'
      };
    }
  }

  private async connectURL(config: MCPConfig): Promise<MCPConnectorResult> {
    try {
      if (!config.url) {
        return {
          success: false,
          error: 'URL is required for url type'
        };
      }

      // For now, we'll implement a simple HTTP-based connection
      // In the future, this could be WebSocket or SSE
      this.connections.set(config.name, {
        config,
        status: 'connecting'
      });

      // Perform MCP handshake via HTTP
      const handshakeResult = await this.performHTTPHandshake(config.name, config.url);
      if (!handshakeResult.success) {
        return handshakeResult;
      }

      this.updateConnectionStatus(config.name, 'connected');
      return {
        success: true,
        data: { type: 'url', url: config.url }
      };
    } catch (error: any) {
      this.updateConnectionStatus(config.name, 'error', error.message);
      return {
        success: false,
        error: error.message || 'Failed to connect to URL MCP'
      };
    }
  }

  private async performHandshake(mcpName: string): Promise<MCPConnectorResult> {
    try {
      const connection = this.connections.get(mcpName);
      if (!connection || !connection.process) {
        return {
          success: false,
          error: 'No process connection found'
        };
      }

      // Send initialize request
      const initRequest: MCPInitializeRequest = {
        jsonrpc: '2.0',
        id: this.getNextRequestId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'flui-mcp-client',
            version: '1.0.0'
          }
        }
      };

      const response = await this.sendRequest(mcpName, initRequest);
      if (!response.success) {
        return response;
      }

      // Validate response
      const initResponse = response.data as MCPInitializeResponse;
      if (!initResponse.result || !initResponse.result.serverInfo) {
        return {
          success: false,
          error: 'Invalid initialize response'
        };
      }

      return {
        success: true,
        data: initResponse.result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Handshake failed'
      };
    }
  }

  private async performHTTPHandshake(mcpName: string, url: string): Promise<MCPConnectorResult> {
    try {
      // For HTTP-based MCPs, we'll implement a simple POST request
      // This is a placeholder implementation
      const initRequest: MCPInitializeRequest = {
        jsonrpc: '2.0',
        id: this.getNextRequestId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'flui-mcp-client',
            version: '1.0.0'
          }
        }
      };

      // In a real implementation, this would make an HTTP request
      // For now, we'll simulate success
      return {
        success: true,
        data: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'http-mcp-server',
            version: '1.0.0'
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'HTTP handshake failed'
      };
    }
  }

  private async sendRequest(mcpName: string, request: MCPRequest): Promise<MCPConnectorResult> {
    try {
      const connection = this.connections.get(mcpName);
      if (!connection) {
        return {
          success: false,
          error: 'No connection found'
        };
      }

      if (connection.config.type === 'process') {
        return await this.sendProcessRequest(mcpName, request);
      } else if (connection.config.type === 'url') {
        return await this.sendHTTPRequest(mcpName, request);
      } else {
        return {
          success: false,
          error: 'Unsupported connection type'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send request'
      };
    }
  }

  private async sendProcessRequest(mcpName: string, request: MCPRequest): Promise<MCPConnectorResult> {
    return new Promise((resolve) => {
      const connection = this.connections.get(mcpName);
      if (!connection || !connection.process) {
        resolve({
          success: false,
          error: 'No process connection found'
        });
        return;
      }

      const requestData = JSON.stringify(request) + '\n';
      
      // Set up response handler
      let responseData = '';
      const onData = (data: Buffer) => {
        responseData += data.toString();
        
        // Check if we have a complete JSON response
        const lines = responseData.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line) as MCPResponse;
              if (response.id === request.id) {
                connection.process?.stdout?.off('data', onData);
                resolve({
                  success: true,
                  data: response
                });
                return;
              }
            } catch (e) {
              // Continue reading
            }
          }
        }
      };

      connection.process.stdout?.on('data', onData);

      // Send the request
      connection.process.stdin?.write(requestData);

      // Timeout after 10 seconds
      setTimeout(() => {
        connection.process?.stdout?.off('data', onData);
        resolve({
          success: false,
          error: 'Request timeout'
        });
      }, 10000);
    });
  }

  private async sendHTTPRequest(mcpName: string, request: MCPRequest): Promise<MCPConnectorResult> {
    // Placeholder for HTTP-based MCP communication
    // In a real implementation, this would make HTTP requests
    return {
      success: true,
      data: {
        jsonrpc: '2.0',
        id: request.id,
        result: {}
      }
    };
  }

  async disconnect(name: string): Promise<MCPConnectorResult> {
    try {
      const connection = this.connections.get(name);
      if (!connection) {
        return {
          success: false,
          error: `MCP '${name}' is not connected`
        };
      }

      if (connection.process) {
        connection.process.kill();
      }

      this.connections.delete(name);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to disconnect MCP'
      };
    }
  }

  async disconnectAll(): Promise<void> {
    const names = Array.from(this.connections.keys());
    for (const name of names) {
      await this.disconnect(name);
    }
  }

  async listTools(name: string): Promise<MCPConnectorResult> {
    try {
      if (!this.isConnected(name)) {
        return {
          success: false,
          error: `MCP '${name}' is not connected`
        };
      }

      const request: MCPListToolsRequest = {
        jsonrpc: '2.0',
        id: this.getNextRequestId(),
        method: 'tools/list'
      };

      const response = await this.sendRequest(name, request);
      if (!response.success) {
        return response;
      }

      const listResponse = response.data as MCPListToolsResponse;
      return {
        success: true,
        data: listResponse.result?.tools || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list tools'
      };
    }
  }

  async callTool(name: string, toolName: string, args: any): Promise<MCPConnectorResult> {
    try {
      if (!this.isConnected(name)) {
        return {
          success: false,
          error: `MCP '${name}' is not connected`
        };
      }

      const request: MCPCallToolRequest = {
        jsonrpc: '2.0',
        id: this.getNextRequestId(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      const response = await this.sendRequest(name, request);
      if (!response.success) {
        return response;
      }

      const callResponse = response.data as MCPCallToolResponse;
      return {
        success: true,
        data: callResponse.result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to call tool'
      };
    }
  }

  isConnected(name: string): boolean {
    const connection = this.connections.get(name);
    return connection?.status === 'connected';
  }

  getConnectionStatus(): Array<{
    name: string;
    status: string;
    lastError?: string;
    connectedAt?: Date;
  }> {
    return Array.from(this.connections.values()).map(connection => {
      const result: {
        name: string;
        status: string;
        lastError?: string;
        connectedAt?: Date;
      } = {
        name: connection.config.name,
        status: connection.status
      };
      
      if (connection.lastError) {
        result.lastError = connection.lastError;
      }
      
      if (connection.connectedAt) {
        result.connectedAt = connection.connectedAt;
      }
      
      return result;
    });
  }

  private updateConnectionStatus(name: string, status: 'disconnected' | 'connecting' | 'connected' | 'error', error?: string): void {
    const connection = this.connections.get(name);
    if (connection) {
      connection.status = status;
      if (error) {
        connection.lastError = error;
      }
      if (status === 'connected') {
        connection.connectedAt = new Date();
      }
    }
  }

  private getNextRequestId(): number {
    return ++this.requestId;
  }
}
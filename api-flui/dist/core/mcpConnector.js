"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPConnector = void 0;
const child_process_1 = require("child_process");
class MCPConnector {
    constructor() {
        this.connections = new Map();
        this.requestId = 0;
    }
    async connect(config) {
        try {
            if (this.connections.has(config.name)) {
                const connection = this.connections.get(config.name);
                if (connection.status === 'connected') {
                    return {
                        success: false,
                        error: `MCP '${config.name}' is already connected`
                    };
                }
            }
            this.connections.set(config.name, {
                config,
                status: 'connecting'
            });
            if (config.type === 'process') {
                return await this.connectProcess(config);
            }
            else if (config.type === 'url') {
                return await this.connectURL(config);
            }
            else {
                return {
                    success: false,
                    error: 'Unsupported MCP type'
                };
            }
        }
        catch (error) {
            this.updateConnectionStatus(config.name, 'error', error.message);
            return {
                success: false,
                error: error.message || 'Failed to connect to MCP'
            };
        }
    }
    async connectProcess(config) {
        try {
            if (!config.command || !config.args) {
                return {
                    success: false,
                    error: 'Command and args are required for process type'
                };
            }
            const childProcess = (0, child_process_1.spawn)(config.command, config.args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });
            this.connections.set(config.name, {
                process: childProcess,
                config,
                status: 'connecting'
            });
            childProcess.on('error', (error) => {
                console.error(`MCP process error for ${config.name}:`, error);
                this.updateConnectionStatus(config.name, 'error', error.message);
            });
            childProcess.on('exit', (code, signal) => {
                console.log(`MCP process exited for ${config.name}: code=${code}, signal=${signal}`);
                this.updateConnectionStatus(config.name, 'disconnected');
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        }
        catch (error) {
            this.updateConnectionStatus(config.name, 'error', error.message);
            return {
                success: false,
                error: error.message || 'Failed to connect to process MCP'
            };
        }
    }
    async connectURL(config) {
        try {
            if (!config.url) {
                return {
                    success: false,
                    error: 'URL is required for url type'
                };
            }
            this.connections.set(config.name, {
                config,
                status: 'connecting'
            });
            const handshakeResult = await this.performHTTPHandshake(config.name, config.url);
            if (!handshakeResult.success) {
                return handshakeResult;
            }
            this.updateConnectionStatus(config.name, 'connected');
            return {
                success: true,
                data: { type: 'url', url: config.url }
            };
        }
        catch (error) {
            this.updateConnectionStatus(config.name, 'error', error.message);
            return {
                success: false,
                error: error.message || 'Failed to connect to URL MCP'
            };
        }
    }
    async performHandshake(mcpName) {
        try {
            const connection = this.connections.get(mcpName);
            if (!connection || !connection.process) {
                return {
                    success: false,
                    error: 'No process connection found'
                };
            }
            const initRequest = {
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
            const initResponse = response.data;
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Handshake failed'
            };
        }
    }
    async performHTTPHandshake(mcpName, url) {
        try {
            const initRequest = {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'HTTP handshake failed'
            };
        }
    }
    async sendRequest(mcpName, request) {
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
            }
            else if (connection.config.type === 'url') {
                return await this.sendHTTPRequest(mcpName, request);
            }
            else {
                return {
                    success: false,
                    error: 'Unsupported connection type'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to send request'
            };
        }
    }
    async sendProcessRequest(mcpName, request) {
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
            let responseData = '';
            const onData = (data) => {
                responseData += data.toString();
                const lines = responseData.split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === request.id) {
                                connection.process?.stdout?.off('data', onData);
                                resolve({
                                    success: true,
                                    data: response
                                });
                                return;
                            }
                        }
                        catch (e) {
                        }
                    }
                }
            };
            connection.process.stdout?.on('data', onData);
            connection.process.stdin?.write(requestData);
            setTimeout(() => {
                connection.process?.stdout?.off('data', onData);
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            }, 10000);
        });
    }
    async sendHTTPRequest(mcpName, request) {
        return {
            success: true,
            data: {
                jsonrpc: '2.0',
                id: request.id,
                result: {}
            }
        };
    }
    async disconnect(name) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to disconnect MCP'
            };
        }
    }
    async disconnectAll() {
        const names = Array.from(this.connections.keys());
        for (const name of names) {
            await this.disconnect(name);
        }
    }
    async listTools(name) {
        try {
            if (!this.isConnected(name)) {
                return {
                    success: false,
                    error: `MCP '${name}' is not connected`
                };
            }
            const request = {
                jsonrpc: '2.0',
                id: this.getNextRequestId(),
                method: 'tools/list'
            };
            const response = await this.sendRequest(name, request);
            if (!response.success) {
                return response;
            }
            const listResponse = response.data;
            return {
                success: true,
                data: listResponse.result?.tools || []
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to list tools'
            };
        }
    }
    async callTool(name, toolName, args) {
        try {
            if (!this.isConnected(name)) {
                return {
                    success: false,
                    error: `MCP '${name}' is not connected`
                };
            }
            const request = {
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
            const callResponse = response.data;
            return {
                success: true,
                data: callResponse.result
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to call tool'
            };
        }
    }
    isConnected(name) {
        const connection = this.connections.get(name);
        return connection?.status === 'connected';
    }
    getConnectionStatus() {
        return Array.from(this.connections.values()).map(connection => {
            const result = {
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
    updateConnectionStatus(name, status, error) {
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
    getNextRequestId() {
        return ++this.requestId;
    }
}
exports.MCPConnector = MCPConnector;
//# sourceMappingURL=mcpConnector.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPRegistry = void 0;
const mcpConnector_1 = require("./mcpConnector");
class MCPRegistry {
    constructor() {
        this.mcpConfigs = new Map();
        this.mcpConnections = new Map();
        this.connector = new mcpConnector_1.MCPConnector();
    }
    async addMCP(config) {
        try {
            if (!config.name || !config.type) {
                return {
                    success: false,
                    error: 'Name and type are required'
                };
            }
            if (this.mcpConfigs.has(config.name)) {
                return {
                    success: false,
                    error: `MCP with name '${config.name}' already exists`
                };
            }
            if (config.type === 'process') {
                if (!config.command || !config.args) {
                    return {
                        success: false,
                        error: 'Command and args are required for process type'
                    };
                }
            }
            else if (config.type === 'url') {
                if (!config.url) {
                    return {
                        success: false,
                        error: 'URL is required for url type'
                    };
                }
            }
            else {
                return {
                    success: false,
                    error: 'Invalid MCP type. Must be "process" or "url"'
                };
            }
            const mcpConfig = {
                ...config,
                enabled: config.enabled !== false
            };
            this.mcpConfigs.set(config.name, mcpConfig);
            const connection = {
                config: mcpConfig,
                status: 'disconnected',
                tools: []
            };
            this.mcpConnections.set(config.name, connection);
            return {
                success: true,
                data: mcpConfig
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to add MCP'
            };
        }
    }
    async removeMCP(name) {
        try {
            if (!this.mcpConfigs.has(name)) {
                return {
                    success: false,
                    error: `MCP with name '${name}' not found`
                };
            }
            if (this.connector.isConnected(name)) {
                await this.connector.disconnect(name);
            }
            const config = this.mcpConfigs.get(name);
            this.mcpConfigs.delete(name);
            this.mcpConnections.delete(name);
            return {
                success: true,
                data: config
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to remove MCP'
            };
        }
    }
    listMCPs() {
        return Array.from(this.mcpConfigs.values());
    }
    getMCP(name) {
        return this.mcpConfigs.get(name);
    }
    async connectMCP(name) {
        try {
            const config = this.mcpConfigs.get(name);
            if (!config) {
                return {
                    success: false,
                    error: `MCP with name '${name}' not found`
                };
            }
            if (!config.enabled) {
                return {
                    success: false,
                    error: `MCP '${name}' is disabled`
                };
            }
            const result = await this.connector.connect(config);
            if (!result.success) {
                return result;
            }
            const connection = this.mcpConnections.get(name);
            if (connection) {
                connection.status = 'connected';
                connection.connectedAt = new Date();
                connection.lastError = undefined;
            }
            await this.loadMCPTools(name);
            return {
                success: true,
                data: config
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to connect MCP'
            };
        }
    }
    async disconnectMCP(name) {
        try {
            const config = this.mcpConfigs.get(name);
            if (!config) {
                return {
                    success: false,
                    error: `MCP with name '${name}' not found`
                };
            }
            const result = await this.connector.disconnect(name);
            if (!result.success) {
                return result;
            }
            const connection = this.mcpConnections.get(name);
            if (connection) {
                connection.status = 'disconnected';
                connection.tools = [];
            }
            return {
                success: true,
                data: config
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to disconnect MCP'
            };
        }
    }
    async loadMCPTools(name) {
        try {
            const toolsResult = await this.connector.listTools(name);
            if (toolsResult.success && toolsResult.data) {
                const connection = this.mcpConnections.get(name);
                if (connection) {
                    connection.tools = toolsResult.data.map((tool) => ({
                        ...tool,
                        mcpName: name
                    }));
                }
            }
        }
        catch (error) {
            console.error(`Failed to load tools for MCP ${name}:`, error);
        }
    }
    getAllTools() {
        const allTools = [];
        for (const connection of this.mcpConnections.values()) {
            if (connection.status === 'connected') {
                allTools.push(...connection.tools);
            }
        }
        return allTools;
    }
    getMCPTools(name) {
        const connection = this.mcpConnections.get(name);
        return connection?.tools || [];
    }
    getConnectionStatus() {
        return Array.from(this.mcpConnections.values()).map(connection => {
            const result = {
                name: connection.config.name,
                status: connection.status,
                toolsCount: connection.tools.length
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
    async callMCPTool(mcpName, toolName, args) {
        return await this.connector.callTool(mcpName, toolName, args);
    }
    isMCPConnected(name) {
        return this.connector.isConnected(name);
    }
    async enableMCP(name) {
        const config = this.mcpConfigs.get(name);
        if (!config) {
            return {
                success: false,
                error: `MCP with name '${name}' not found`
            };
        }
        config.enabled = true;
        return {
            success: true,
            data: config
        };
    }
    async disableMCP(name) {
        const config = this.mcpConfigs.get(name);
        if (!config) {
            return {
                success: false,
                error: `MCP with name '${name}' not found`
            };
        }
        config.enabled = false;
        if (this.connector.isConnected(name)) {
            await this.disconnectMCP(name);
        }
        return {
            success: true,
            data: config
        };
    }
}
exports.MCPRegistry = MCPRegistry;
//# sourceMappingURL=mcpRegistry.js.map
import { MCPConfig, MCPConnection, MCPTool } from '../types/mcp';
import { MCPConnector } from './mcpConnector';

export interface MCPRegistryResult {
  success: boolean;
  data?: MCPConfig;
  error?: string;
}

export class MCPRegistry {
  private mcpConfigs: Map<string, MCPConfig> = new Map();
  private mcpConnections: Map<string, MCPConnection> = new Map();
  private connector: MCPConnector;

  constructor() {
    this.connector = new MCPConnector();
  }

  async addMCP(config: MCPConfig): Promise<MCPRegistryResult> {
    try {
      // Validate required fields
      if (!config.name || !config.type) {
        return {
          success: false,
          error: 'Name and type are required'
        };
      }

      // Check for duplicates
      if (this.mcpConfigs.has(config.name)) {
        return {
          success: false,
          error: `MCP with name '${config.name}' already exists`
        };
      }

      // Validate type-specific fields
      if (config.type === 'process') {
        if (!config.command || !config.args) {
          return {
            success: false,
            error: 'Command and args are required for process type'
          };
        }
      } else if (config.type === 'url') {
        if (!config.url) {
          return {
            success: false,
            error: 'URL is required for url type'
          };
        }
      } else {
        return {
          success: false,
          error: 'Invalid MCP type. Must be "process" or "url"'
        };
      }

      // Set default values
      const mcpConfig: MCPConfig = {
        ...config,
        enabled: config.enabled !== false // Default to true
      };

      // Store the configuration
      this.mcpConfigs.set(config.name, mcpConfig);

      // Create connection entry
      const connection: MCPConnection = {
        config: mcpConfig,
        status: 'disconnected',
        tools: []
      };
      this.mcpConnections.set(config.name, connection);

      return {
        success: true,
        data: mcpConfig
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add MCP'
      };
    }
  }

  async removeMCP(name: string): Promise<MCPRegistryResult> {
    try {
      if (!this.mcpConfigs.has(name)) {
        return {
          success: false,
          error: `MCP with name '${name}' not found`
        };
      }

      // Disconnect if connected
      if (this.connector.isConnected(name)) {
        await this.connector.disconnect(name);
      }

      // Remove from registry
      const config = this.mcpConfigs.get(name);
      this.mcpConfigs.delete(name);
      this.mcpConnections.delete(name);

      return {
        success: true,
        data: config!
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove MCP'
      };
    }
  }

  listMCPs(): MCPConfig[] {
    return Array.from(this.mcpConfigs.values());
  }

  getMCP(name: string): MCPConfig | undefined {
    return this.mcpConfigs.get(name);
  }

  async connectMCP(name: string): Promise<MCPRegistryResult> {
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

      // Connect using connector
      const result = await this.connector.connect(config);
      if (!result.success) {
        return result;
      }

      // Update connection status
      const connection = this.mcpConnections.get(name);
      if (connection) {
        connection.status = 'connected';
        connection.connectedAt = new Date();
        connection.lastError = undefined as any;
      }

      // Load tools
      await this.loadMCPTools(name);

      return {
        success: true,
        data: config
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect MCP'
      };
    }
  }

  async disconnectMCP(name: string): Promise<MCPRegistryResult> {
    try {
      const config = this.mcpConfigs.get(name);
      if (!config) {
        return {
          success: false,
          error: `MCP with name '${name}' not found`
        };
      }

      // Disconnect using connector
      const result = await this.connector.disconnect(name);
      if (!result.success) {
        return result;
      }

      // Update connection status
      const connection = this.mcpConnections.get(name);
      if (connection) {
        connection.status = 'disconnected';
        connection.tools = [];
      }

      return {
        success: true,
        data: config
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to disconnect MCP'
      };
    }
  }

  async loadMCPTools(name: string): Promise<void> {
    try {
      const toolsResult = await this.connector.listTools(name);
      if (toolsResult.success && toolsResult.data) {
        const connection = this.mcpConnections.get(name);
        if (connection) {
          connection.tools = toolsResult.data.map((tool: any) => ({
            ...tool,
            mcpName: name
          }));
        }
      }
    } catch (error) {
      console.error(`Failed to load tools for MCP ${name}:`, error);
    }
  }

  getAllTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    
    for (const connection of this.mcpConnections.values()) {
      if (connection.status === 'connected') {
        allTools.push(...connection.tools);
      }
    }
    
    return allTools;
  }

  getMCPTools(name: string): MCPTool[] {
    const connection = this.mcpConnections.get(name);
    return connection?.tools || [];
  }

  getConnectionStatus(): Array<{
    name: string;
    status: string;
    toolsCount: number;
    lastError?: string;
    connectedAt?: Date;
  }> {
    return Array.from(this.mcpConnections.values()).map(connection => {
      const result: {
        name: string;
        status: string;
        toolsCount: number;
        lastError?: string;
        connectedAt?: Date;
      } = {
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

  async callMCPTool(mcpName: string, toolName: string, args: any): Promise<any> {
    return await this.connector.callTool(mcpName, toolName, args);
  }

  isMCPConnected(name: string): boolean {
    return this.connector.isConnected(name);
  }

  async enableMCP(name: string): Promise<MCPRegistryResult> {
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

  async disableMCP(name: string): Promise<MCPRegistryResult> {
    const config = this.mcpConfigs.get(name);
    if (!config) {
      return {
        success: false,
        error: `MCP with name '${name}' not found`
      };
    }

    config.enabled = false;
    
    // Disconnect if connected
    if (this.connector.isConnected(name)) {
      await this.disconnectMCP(name);
    }

    return {
      success: true,
      data: config
    };
  }
}
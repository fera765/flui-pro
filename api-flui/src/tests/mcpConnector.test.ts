import { MCPConnector } from '../core/mcpConnector';
import { MCPConfig } from '../types/mcp';

describe('MCPConnector', () => {
  let connector: MCPConnector;

  beforeEach(() => {
    connector = new MCPConnector();
  });

  afterEach(async () => {
    await connector.disconnectAll();
  });

  describe('connect', () => {
    it('should connect to process MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      const result = await connector.connect(config);
      
      expect(result.success).toBe(true);
      expect(connector.isConnected('test-mcp')).toBe(true);
    });

    it('should handle connection failure gracefully', async () => {
      const config: MCPConfig = {
        name: 'invalid-mcp',
        type: 'process',
        command: 'invalid-command',
        args: ['non-existent-package']
      };

      const result = await connector.connect(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not allow duplicate connections', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      const result = await connector.connect(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect existing connection', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      const result = await connector.disconnect('test-mcp');
      
      expect(result.success).toBe(true);
      expect(connector.isConnected('test-mcp')).toBe(false);
    });

    it('should handle disconnection of non-existent connection', async () => {
      const result = await connector.disconnect('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not connected');
    });
  });

  describe('listTools', () => {
    it('should return empty list for disconnected MCP', async () => {
      const tools = await connector.listTools('non-existent');
      
      expect(tools.success).toBe(false);
      expect(tools.error).toContain('not connected');
    });

    it('should return tools for connected MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      const tools = await connector.listTools('test-mcp');
      
      expect(tools.success).toBe(true);
      expect(Array.isArray(tools.data)).toBe(true);
    });
  });

  describe('callTool', () => {
    it('should handle tool call for disconnected MCP', async () => {
      const result = await connector.callTool('non-existent', 'test-tool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not connected');
    });

    it('should call tool for connected MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      const result = await connector.callTool('test-mcp', 'test-tool', {});
      
      expect(result.success).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('should return false for non-existent connection', () => {
      expect(connector.isConnected('non-existent')).toBe(false);
    });

    it('should return true for connected MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      expect(connector.isConnected('test-mcp')).toBe(true);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return status for all connections', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await connector.connect(config);
      const status = connector.getConnectionStatus();
      
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('test-mcp');
      expect(status[0].status).toBe('connected');
    });
  });
});
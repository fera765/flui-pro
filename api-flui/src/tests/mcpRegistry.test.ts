import { MCPRegistry } from '../core/mcpRegistry';
import { MCPConfig } from '../types/mcp';

describe('MCPRegistry', () => {
  let registry: MCPRegistry;

  beforeEach(() => {
    registry = new MCPRegistry();
  });

  describe('addMCP', () => {
    it('should add a process MCP successfully', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp'],
        description: 'Test MCP'
      };

      const result = await registry.addMCP(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('test-mcp');
    });

    it('should add a URL MCP successfully', async () => {
      const config: MCPConfig = {
        name: 'remote-mcp',
        type: 'url',
        url: 'https://api.example.com/mcp',
        description: 'Remote MCP'
      };

      const result = await registry.addMCP(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('remote-mcp');
    });

    it('should reject duplicate MCP names', async () => {
      const config: MCPConfig = {
        name: 'duplicate-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await registry.addMCP(config);
      const result = await registry.addMCP(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should validate required fields for process type', async () => {
      const config: MCPConfig = {
        name: 'invalid-process',
        type: 'process'
        // Missing command and args
      };

      const result = await registry.addMCP(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('command and args are required');
    });

    it('should validate required fields for URL type', async () => {
      const config: MCPConfig = {
        name: 'invalid-url',
        type: 'url'
        // Missing url
      };

      const result = await registry.addMCP(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('url is required');
    });
  });

  describe('listMCPs', () => {
    it('should return empty list initially', () => {
      const mcpList = registry.listMCPs();
      expect(mcpList).toEqual([]);
    });

    it('should return added MCPs', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await registry.addMCP(config);
      const mcpList = registry.listMCPs();
      
      expect(mcpList).toHaveLength(1);
      expect(mcpList[0].name).toBe('test-mcp');
    });
  });

  describe('removeMCP', () => {
    it('should remove existing MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await registry.addMCP(config);
      const result = await registry.removeMCP('test-mcp');
      
      expect(result.success).toBe(true);
      expect(registry.listMCPs()).toHaveLength(0);
    });

    it('should handle removal of non-existent MCP', async () => {
      const result = await registry.removeMCP('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getMCP', () => {
    it('should return existing MCP', async () => {
      const config: MCPConfig = {
        name: 'test-mcp',
        type: 'process',
        command: 'npx',
        args: ['@test/mcp']
      };

      await registry.addMCP(config);
      const mcp = registry.getMCP('test-mcp');
      
      expect(mcp).toBeDefined();
      expect(mcp?.name).toBe('test-mcp');
    });

    it('should return undefined for non-existent MCP', () => {
      const mcp = registry.getMCP('non-existent');
      expect(mcp).toBeUndefined();
    });
  });

  describe('getAllTools', () => {
    it('should return empty list when no MCPs are connected', () => {
      const tools = registry.getAllTools();
      expect(tools).toEqual([]);
    });

    it('should return tools from connected MCPs', async () => {
      // This test will be expanded when we implement the connector
      const tools = registry.getAllTools();
      expect(Array.isArray(tools)).toBe(true);
    });
  });
});
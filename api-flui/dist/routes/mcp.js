"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRoutes = mcpRoutes;
const express_1 = require("express");
function mcpRoutes(registry, toolProxy) {
    const router = (0, express_1.Router)();
    router.post('/add', async (req, res) => {
        try {
            const config = req.body;
            if (!config.name || !config.type) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and type are required'
                });
            }
            const result = await registry.addMCP(config);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.status(201).json({
                success: true,
                data: result.data,
                message: `MCP '${config.name}' added successfully`
            });
        }
        catch (error) {
            console.error('MCP add error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to add MCP',
                details: error.message
            });
        }
    });
    router.get('/list', async (req, res) => {
        try {
            const mcpList = registry.listMCPs();
            const connectionStatus = registry.getConnectionStatus();
            const mcpListWithStatus = mcpList.map(mcp => {
                const status = connectionStatus.find(s => s.name === mcp.name);
                return {
                    ...mcp,
                    connectionStatus: status?.status || 'disconnected',
                    toolsCount: status?.toolsCount || 0,
                    lastError: status?.lastError,
                    connectedAt: status?.connectedAt
                };
            });
            return res.json({
                success: true,
                data: mcpListWithStatus,
                total: mcpListWithStatus.length
            });
        }
        catch (error) {
            console.error('MCP list error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to list MCPs',
                details: error.message
            });
        }
    });
    router.get('/:name', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const mcp = registry.getMCP(name);
            if (!mcp) {
                return res.status(404).json({
                    success: false,
                    error: 'MCP not found'
                });
            }
            const connectionStatus = registry.getConnectionStatus();
            const status = connectionStatus.find(s => s.name === name);
            const tools = registry.getMCPTools(name);
            return res.json({
                success: true,
                data: {
                    ...mcp,
                    connectionStatus: status?.status || 'disconnected',
                    toolsCount: status?.toolsCount || 0,
                    lastError: status?.lastError,
                    connectedAt: status?.connectedAt,
                    tools
                }
            });
        }
        catch (error) {
            console.error('MCP get error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get MCP',
                details: error.message
            });
        }
    });
    router.delete('/remove/:name', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const result = await registry.removeMCP(name);
            if (!result.success) {
                return res.status(404).json(result);
            }
            return res.json({
                success: true,
                message: `MCP '${name}' removed successfully`
            });
        }
        catch (error) {
            console.error('MCP remove error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to remove MCP',
                details: error.message
            });
        }
    });
    router.post('/:name/connect', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const result = await registry.connectMCP(name);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json({
                success: true,
                message: `MCP '${name}' connected successfully`
            });
        }
        catch (error) {
            console.error('MCP connect error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to connect MCP',
                details: error.message
            });
        }
    });
    router.post('/:name/disconnect', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const result = await registry.disconnectMCP(name);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json({
                success: true,
                message: `MCP '${name}' disconnected successfully`
            });
        }
        catch (error) {
            console.error('MCP disconnect error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to disconnect MCP',
                details: error.message
            });
        }
    });
    router.get('/tools/list', async (req, res) => {
        try {
            const toolsInfo = await toolProxy.listAllTools();
            return res.json({
                success: true,
                data: toolsInfo
            });
        }
        catch (error) {
            console.error('MCP tools list error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to list tools',
                details: error.message
            });
        }
    });
    router.post('/tools/call', async (req, res) => {
        try {
            const { toolName, args } = req.body;
            if (!toolName) {
                return res.status(400).json({
                    success: false,
                    error: 'Tool name is required'
                });
            }
            const result = await toolProxy.executeTool(toolName, args || {});
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('MCP tool call error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to call tool',
                details: error.message
            });
        }
    });
    router.get('/tools/:toolName', async (req, res) => {
        try {
            const { toolName } = req.params;
            if (!toolName) {
                return res.status(400).json({
                    success: false,
                    error: 'Tool name is required'
                });
            }
            const toolInfo = toolProxy.getToolInfo(toolName);
            if (!toolInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Tool not found'
                });
            }
            return res.json({
                success: true,
                data: toolInfo
            });
        }
        catch (error) {
            console.error('MCP tool info error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get tool info',
                details: error.message
            });
        }
    });
    router.post('/:name/enable', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const result = await registry.enableMCP(name);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json({
                success: true,
                message: `MCP '${name}' enabled successfully`
            });
        }
        catch (error) {
            console.error('MCP enable error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to enable MCP',
                details: error.message
            });
        }
    });
    router.post('/:name/disable', async (req, res) => {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'MCP name is required'
                });
            }
            const result = await registry.disableMCP(name);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json({
                success: true,
                message: `MCP '${name}' disabled successfully`
            });
        }
        catch (error) {
            console.error('MCP disable error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to disable MCP',
                details: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=mcp.js.map
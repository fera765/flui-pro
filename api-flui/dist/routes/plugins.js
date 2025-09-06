"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPluginRoutes = createPluginRoutes;
const express_1 = require("express");
function createPluginRoutes(pluginLoader) {
    const router = (0, express_1.Router)();
    router.get('/plugins', (req, res) => {
        try {
            const plugins = Array.from(pluginLoader.getPlugins().values());
            const activePlugins = pluginLoader.getActivePlugins();
            res.json({
                success: true,
                data: {
                    total: plugins.length,
                    active: activePlugins.length,
                    plugins: plugins.map(plugin => ({
                        name: plugin.name,
                        version: plugin.version,
                        description: plugin.description,
                        status: plugin.status,
                        functions: plugin.functions.map(f => f.name),
                        error: plugin.error
                    }))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.get('/plugins/functions', (req, res) => {
        try {
            const functions = Array.from(pluginLoader.getPluginFunctions().values());
            res.json({
                success: true,
                data: {
                    total: functions.length,
                    functions: functions.map(func => ({
                        name: func.name,
                        description: func.description,
                        parameters: func.parameters
                    }))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.post('/plugins/:pluginName/load', async (req, res) => {
        try {
            const { pluginName } = req.params;
            await pluginLoader.loadPlugin(pluginName);
            res.json({
                success: true,
                message: `Plugin ${pluginName} loaded successfully`
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    router.post('/plugins/reload', async (req, res) => {
        try {
            await pluginLoader.loadAllPlugins();
            res.json({
                success: true,
                message: 'All plugins reloaded successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=plugins.js.map
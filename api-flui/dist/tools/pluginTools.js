"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginTools = void 0;
class PluginTools {
    constructor(pluginLoader) {
        this.pluginFunctions = new Map();
        this.pluginLoader = pluginLoader;
        this.loadPluginFunctions();
    }
    loadPluginFunctions() {
        this.pluginFunctions = this.pluginLoader.getPluginFunctions();
    }
    getAvailableTools() {
        return Array.from(this.pluginFunctions.values());
    }
    async executeTool(toolName, parameters) {
        const tool = this.pluginFunctions.get(toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
        }
        try {
            console.log(`🔧 Executing plugin tool: ${toolName}`);
            const result = await tool.execute(parameters);
            console.log(`✅ Plugin tool ${toolName} executed successfully`);
            return result;
        }
        catch (error) {
            console.error(`❌ Plugin tool ${toolName} failed:`, error);
            throw error;
        }
    }
    getToolSchema(toolName) {
        const tool = this.pluginFunctions.get(toolName);
        if (!tool) {
            return null;
        }
        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: tool.parameters,
                    required: Object.entries(tool.parameters)
                        .filter(([_, param]) => param.required)
                        .map(([key, _]) => key)
                }
            }
        };
    }
    getAllToolSchemas() {
        return Array.from(this.pluginFunctions.values()).map(tool => this.getToolSchema(tool.name));
    }
    refreshTools() {
        this.loadPluginFunctions();
    }
}
exports.PluginTools = PluginTools;
//# sourceMappingURL=pluginTools.js.map
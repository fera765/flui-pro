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
    async executeTool(toolName, parameters, timeoutMs = 30000) {
        const tool = this.pluginFunctions.get(toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
        }
        try {
            console.log(`🔧 Executing plugin tool: ${toolName} (timeout: ${timeoutMs}ms)`);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Tool ${toolName} execution timeout (${timeoutMs}ms)`)), timeoutMs);
            });
            const result = await Promise.race([
                tool.execute(parameters),
                timeoutPromise
            ]);
            console.log(`✅ Plugin tool ${toolName} executed successfully`);
            return result;
        }
        catch (error) {
            if (error.message.includes('timeout')) {
                console.error(`⏰ Plugin tool ${toolName} timed out after ${timeoutMs}ms`);
                throw new Error(`Tool execution timeout: ${toolName} took longer than ${timeoutMs}ms`);
            }
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
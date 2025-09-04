import { PluginFunction } from '../types/plugin';
import { PluginLoader } from '../core/pluginLoader';
export declare class PluginTools {
    private pluginLoader;
    private pluginFunctions;
    constructor(pluginLoader: PluginLoader);
    private loadPluginFunctions;
    getAvailableTools(): PluginFunction[];
    executeTool(toolName: string, parameters: any): Promise<any>;
    getToolSchema(toolName: string): any;
    getAllToolSchemas(): any[];
    refreshTools(): void;
}
//# sourceMappingURL=pluginTools.d.ts.map
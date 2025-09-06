import { Plugin, PluginFunction } from '../types/plugin';
import { EventEmitter } from 'events';
export declare class PluginLoader extends EventEmitter {
    private plugins;
    private pluginFunctions;
    private pluginsPath;
    constructor(pluginsPath?: string);
    private ensurePluginsDirectory;
    loadAllPlugins(): Promise<void>;
    loadPlugin(pluginName: string): Promise<void>;
    private installPluginDependencies;
    private testPlugin;
    private loadPluginModule;
    private compileTypeScript;
    private generateTestParams;
    private deletePlugin;
    getPluginFunctions(): Map<string, PluginFunction>;
    getPlugins(): Map<string, Plugin>;
    getActivePlugins(): Plugin[];
    watchForNewPlugins(): Promise<void>;
}
//# sourceMappingURL=pluginLoader.d.ts.map
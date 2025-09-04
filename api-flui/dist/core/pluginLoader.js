"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const events_1 = require("events");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PluginLoader extends events_1.EventEmitter {
    constructor(pluginsPath = path.join(process.cwd(), 'plugins')) {
        super();
        this.plugins = new Map();
        this.pluginFunctions = new Map();
        this.pluginsPath = pluginsPath;
        this.ensurePluginsDirectory();
    }
    ensurePluginsDirectory() {
        if (!fs.existsSync(this.pluginsPath)) {
            fs.mkdirSync(this.pluginsPath, { recursive: true });
        }
    }
    async loadAllPlugins() {
        console.log('🔍 Scanning for plugins...');
        const pluginDirs = fs.readdirSync(this.pluginsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        for (const pluginDir of pluginDirs) {
            await this.loadPlugin(pluginDir);
        }
    }
    async loadPlugin(pluginName) {
        const pluginPath = path.join(this.pluginsPath, pluginName);
        try {
            console.log(`📦 Loading plugin: ${pluginName}`);
            if (!fs.existsSync(pluginPath)) {
                throw new Error(`Plugin directory not found: ${pluginPath}`);
            }
            const plugin = {
                name: pluginName,
                version: '1.0.0',
                description: '',
                functions: [],
                dependencies: [],
                path: pluginPath,
                status: 'loading'
            };
            this.plugins.set(pluginName, plugin);
            this.emit('pluginStatus', {
                plugin: pluginName,
                status: 'loading',
                message: 'Loading plugin...'
            });
            const installResult = await this.installPluginDependencies(pluginPath);
            if (!installResult.success) {
                throw new Error(`Failed to install dependencies: ${installResult.error}`);
            }
            const testResult = await this.testPlugin(pluginPath);
            if (!testResult.success) {
                throw new Error(`Plugin test failed: ${testResult.error}`);
            }
            const pluginModule = await this.loadPluginModule(pluginPath);
            if (!pluginModule) {
                throw new Error('Failed to load plugin module');
            }
            console.log(`📦 Plugin module loaded:`, Object.keys(pluginModule));
            console.log(`📦 Plugin object:`, pluginModule.plugin);
            plugin.version = pluginModule.plugin?.version || pluginModule.version || '1.0.0';
            plugin.description = pluginModule.plugin?.description || pluginModule.description || '';
            plugin.functions = pluginModule.plugin?.functions || pluginModule.functions || [];
            plugin.dependencies = pluginModule.plugin?.dependencies || pluginModule.dependencies || [];
            plugin.status = 'active';
            console.log(`📦 Plugin functions found:`, plugin.functions.length);
            for (const func of plugin.functions) {
                this.pluginFunctions.set(func.name, func);
                console.log(`✅ Registered function: ${func.name}`);
            }
            this.plugins.set(pluginName, plugin);
            this.emit('pluginStatus', {
                plugin: pluginName,
                status: 'active',
                message: `Plugin loaded successfully with ${plugin.functions.length} functions`,
                functions: plugin.functions.map(f => f.name)
            });
            console.log(`✅ Plugin ${pluginName} loaded successfully`);
        }
        catch (error) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, error);
            const plugin = this.plugins.get(pluginName);
            if (plugin) {
                plugin.status = 'error';
                plugin.error = error.message;
                this.plugins.set(pluginName, plugin);
            }
            this.emit('pluginStatus', {
                plugin: pluginName,
                status: 'error',
                message: `Plugin failed to load: ${error.message}`
            });
            await this.deletePlugin(pluginName);
        }
    }
    async installPluginDependencies(pluginPath) {
        const packageJsonPath = path.join(pluginPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return { success: true, installedPackages: [] };
        }
        try {
            console.log(`📥 Installing dependencies for plugin at ${pluginPath}`);
            this.emit('pluginStatus', {
                plugin: path.basename(pluginPath),
                status: 'installing',
                message: 'Installing dependencies...'
            });
            const { stdout, stderr } = await execAsync('npm install', {
                cwd: pluginPath,
                timeout: 60000
            });
            if (stderr && !stderr.includes('npm WARN')) {
                throw new Error(`npm install failed: ${stderr}`);
            }
            console.log(`✅ Dependencies installed successfully`);
            return { success: true, installedPackages: [] };
        }
        catch (error) {
            console.error(`❌ Failed to install dependencies:`, error);
            return { success: false, error: error.message };
        }
    }
    async testPlugin(pluginPath) {
        try {
            console.log(`🧪 Testing plugin at ${pluginPath}`);
            this.emit('pluginStatus', {
                plugin: path.basename(pluginPath),
                status: 'testing',
                message: 'Testing plugin...'
            });
            const pluginModule = await this.loadPluginModule(pluginPath);
            if (!pluginModule) {
                throw new Error('Plugin module could not be loaded');
            }
            for (const func of pluginModule.functions || []) {
                try {
                    const testParams = this.generateTestParams(func.parameters);
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Function test timeout')), 10000);
                    });
                    const result = await Promise.race([
                        func.execute(testParams),
                        timeoutPromise
                    ]);
                    console.log(`✅ Function ${func.name} test passed`);
                }
                catch (error) {
                    if (error.message.includes('timeout')) {
                        throw new Error(`Function ${func.name} test timed out (10s limit)`);
                    }
                    throw new Error(`Function ${func.name} test failed: ${error.message}`);
                }
            }
            console.log(`✅ Plugin test passed`);
            return { success: true };
        }
        catch (error) {
            console.error(`❌ Plugin test failed:`, error);
            return { success: false, error: error.message };
        }
    }
    async loadPluginModule(pluginPath) {
        try {
            const distPath = path.join(pluginPath, 'dist', 'index.js');
            if (fs.existsSync(distPath)) {
                return require(distPath);
            }
            const srcPath = path.join(pluginPath, 'src', 'index.ts');
            if (fs.existsSync(srcPath)) {
                await this.compileTypeScript(pluginPath);
                return require(distPath);
            }
            const rootPath = path.join(pluginPath, 'index.js');
            if (fs.existsSync(rootPath)) {
                return require(rootPath);
            }
            throw new Error('No valid plugin entry point found');
        }
        catch (error) {
            console.error(`❌ Failed to load plugin module:`, error);
            return null;
        }
    }
    async compileTypeScript(pluginPath) {
        try {
            console.log(`🔨 Compiling TypeScript for plugin at ${pluginPath}`);
            const { stdout, stderr } = await execAsync('npx tsc', {
                cwd: pluginPath,
                timeout: 30000
            });
            if (stderr && !stderr.includes('npm WARN')) {
                throw new Error(`TypeScript compilation failed: ${stderr}`);
            }
            console.log(`✅ TypeScript compiled successfully`);
        }
        catch (error) {
            console.error(`❌ TypeScript compilation failed:`, error);
            throw error;
        }
    }
    generateTestParams(parameters) {
        const testParams = {};
        for (const [key, param] of Object.entries(parameters)) {
            if (param.required) {
                switch (param.type) {
                    case 'string':
                        testParams[key] = 'test';
                        break;
                    case 'number':
                        testParams[key] = 1;
                        break;
                    case 'boolean':
                        testParams[key] = true;
                        break;
                    case 'array':
                        testParams[key] = [];
                        break;
                    case 'object':
                        testParams[key] = {};
                        break;
                    default:
                        testParams[key] = 'test';
                }
            }
        }
        return testParams;
    }
    async deletePlugin(pluginName) {
        try {
            const pluginPath = path.join(this.pluginsPath, pluginName);
            if (fs.existsSync(pluginPath)) {
                console.log(`🗑️ Deleting failed plugin: ${pluginName}`);
                this.plugins.delete(pluginName);
                for (const [funcName, func] of this.pluginFunctions.entries()) {
                    if (func.name.startsWith(pluginName)) {
                        this.pluginFunctions.delete(funcName);
                    }
                }
                await execAsync(`rm -rf "${pluginPath}"`);
                this.emit('pluginStatus', {
                    plugin: pluginName,
                    status: 'deleted',
                    message: 'Plugin deleted due to failure'
                });
                console.log(`✅ Plugin ${pluginName} deleted successfully`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to delete plugin ${pluginName}:`, error);
        }
    }
    getPluginFunctions() {
        return this.pluginFunctions;
    }
    getPlugins() {
        return this.plugins;
    }
    getActivePlugins() {
        return Array.from(this.plugins.values()).filter(p => p.status === 'active');
    }
    async watchForNewPlugins() {
        console.log('👀 Watching for new plugins...');
        setInterval(async () => {
            const currentDirs = fs.readdirSync(this.pluginsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            for (const dir of currentDirs) {
                if (!this.plugins.has(dir)) {
                    console.log(`🆕 New plugin detected: ${dir}`);
                    await this.loadPlugin(dir);
                }
            }
        }, 5000);
    }
}
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=pluginLoader.js.map
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Plugin, PluginFunction, PluginTestResult, PluginInstallResult } from '../types/plugin';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export class PluginLoader extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private pluginFunctions: Map<string, PluginFunction> = new Map();
  private pluginsPath: string;

  constructor(pluginsPath: string = path.join(process.cwd(), 'plugins')) {
    super();
    this.pluginsPath = pluginsPath;
    this.ensurePluginsDirectory();
  }

  private ensurePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsPath)) {
      fs.mkdirSync(this.pluginsPath, { recursive: true });
    }
  }

  async loadAllPlugins(): Promise<void> {
    console.log('🔍 Scanning for plugins...');
    
    const pluginDirs = fs.readdirSync(this.pluginsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pluginDir of pluginDirs) {
      await this.loadPlugin(pluginDir);
    }
  }

  async loadPlugin(pluginName: string): Promise<void> {
    const pluginPath = path.join(this.pluginsPath, pluginName);
    
    try {
      console.log(`📦 Loading plugin: ${pluginName}`);
      
      // Check if plugin directory exists
      if (!fs.existsSync(pluginPath)) {
        throw new Error(`Plugin directory not found: ${pluginPath}`);
      }

      // Set status to loading
      const plugin: Plugin = {
        name: pluginName,
        version: '1.0.0',
        description: '',
        functions: [],
        dependencies: [],
        path: pluginPath,
        status: 'loading'
      };
      this.plugins.set(pluginName, plugin);

      // Emit loading event
      this.emit('pluginStatus', {
        plugin: pluginName,
        status: 'loading',
        message: 'Loading plugin...'
      });

      // Install dependencies
      const installResult = await this.installPluginDependencies(pluginPath);
      if (!installResult.success) {
        throw new Error(`Failed to install dependencies: ${installResult.error}`);
      }

      // Test plugin
      const testResult = await this.testPlugin(pluginPath);
      if (!testResult.success) {
        throw new Error(`Plugin test failed: ${testResult.error}`);
      }

      // Load plugin functions
      const pluginModule = await this.loadPluginModule(pluginPath);
      if (!pluginModule) {
        throw new Error('Failed to load plugin module');
      }

      console.log(`📦 Plugin module loaded:`, Object.keys(pluginModule));
      console.log(`📦 Plugin object:`, pluginModule.plugin);

      // Update plugin with loaded data
      plugin.version = pluginModule.plugin?.version || pluginModule.version || '1.0.0';
      plugin.description = pluginModule.plugin?.description || pluginModule.description || '';
      plugin.functions = pluginModule.plugin?.functions || pluginModule.functions || [];
      plugin.dependencies = pluginModule.plugin?.dependencies || pluginModule.dependencies || [];
      plugin.status = 'active';

      console.log(`📦 Plugin functions found:`, plugin.functions.length);

      // Register functions
      for (const func of plugin.functions) {
        this.pluginFunctions.set(func.name, func);
        console.log(`✅ Registered function: ${func.name}`);
      }

      this.plugins.set(pluginName, plugin);

      // Emit success event
      this.emit('pluginStatus', {
        plugin: pluginName,
        status: 'active',
        message: `Plugin loaded successfully with ${plugin.functions.length} functions`,
        functions: plugin.functions.map(f => f.name)
      });

      console.log(`✅ Plugin ${pluginName} loaded successfully`);

    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginName}:`, error);
      
      // Update plugin status to error
      const plugin = this.plugins.get(pluginName);
      if (plugin) {
        plugin.status = 'error';
        plugin.error = (error as Error).message;
        this.plugins.set(pluginName, plugin);
      }

      // Emit error event
      this.emit('pluginStatus', {
        plugin: pluginName,
        status: 'error',
        message: `Plugin failed to load: ${(error as Error).message}`
      });

      // Delete failed plugin
      await this.deletePlugin(pluginName);
    }
  }

  private async installPluginDependencies(pluginPath: string): Promise<PluginInstallResult> {
    const packageJsonPath = path.join(pluginPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { success: true, installedPackages: [] };
    }

    try {
      console.log(`📥 Installing dependencies for plugin at ${pluginPath}`);
      
      // Emit installing event
      this.emit('pluginStatus', {
        plugin: path.basename(pluginPath),
        status: 'installing',
        message: 'Installing dependencies...'
      });

      // Install dependencies
      const { stdout, stderr } = await execAsync('npm install', { 
        cwd: pluginPath,
        timeout: 60000 // 60 seconds timeout
      });

      if (stderr && !stderr.includes('npm WARN')) {
        throw new Error(`npm install failed: ${stderr}`);
      }

      console.log(`✅ Dependencies installed successfully`);
      return { success: true, installedPackages: [] };

    } catch (error) {
      console.error(`❌ Failed to install dependencies:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async testPlugin(pluginPath: string): Promise<PluginTestResult> {
    try {
      console.log(`🧪 Testing plugin at ${pluginPath}`);
      
      // Emit testing event
      this.emit('pluginStatus', {
        plugin: path.basename(pluginPath),
        status: 'testing',
        message: 'Testing plugin...'
      });

      // Try to load the plugin module
      const pluginModule = await this.loadPluginModule(pluginPath);
      
      if (!pluginModule) {
        throw new Error('Plugin module could not be loaded');
      }

      // Test each function
      for (const func of pluginModule.functions || []) {
        try {
          // Test with mock parameters
          const testParams = this.generateTestParams(func.parameters);
          const result = await func.execute(testParams);
          
          console.log(`✅ Function ${func.name} test passed`);
        } catch (error) {
          throw new Error(`Function ${func.name} test failed: ${(error as Error).message}`);
        }
      }

      console.log(`✅ Plugin test passed`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Plugin test failed:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async loadPluginModule(pluginPath: string): Promise<any> {
    try {
      // Try to load from dist first (compiled)
      const distPath = path.join(pluginPath, 'dist', 'index.js');
      if (fs.existsSync(distPath)) {
        return require(distPath);
      }

      // Try to load from src (TypeScript)
      const srcPath = path.join(pluginPath, 'src', 'index.ts');
      if (fs.existsSync(srcPath)) {
        // Compile TypeScript if needed
        await this.compileTypeScript(pluginPath);
        return require(distPath);
      }

      // Try to load from root
      const rootPath = path.join(pluginPath, 'index.js');
      if (fs.existsSync(rootPath)) {
        return require(rootPath);
      }

      throw new Error('No valid plugin entry point found');

    } catch (error) {
      console.error(`❌ Failed to load plugin module:`, error);
      return null;
    }
  }

  private async compileTypeScript(pluginPath: string): Promise<void> {
    try {
      console.log(`🔨 Compiling TypeScript for plugin at ${pluginPath}`);
      
      const { stdout, stderr } = await execAsync('npx tsc', { 
        cwd: pluginPath,
        timeout: 30000 // 30 seconds timeout
      });

      if (stderr && !stderr.includes('npm WARN')) {
        throw new Error(`TypeScript compilation failed: ${stderr}`);
      }

      console.log(`✅ TypeScript compiled successfully`);

    } catch (error) {
      console.error(`❌ TypeScript compilation failed:`, error);
      throw error;
    }
  }

  private generateTestParams(parameters: Record<string, any>): any {
    const testParams: any = {};
    
    for (const [key, param] of Object.entries(parameters)) {
      if (param.required) {
        // Generate test data based on type
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

  private async deletePlugin(pluginName: string): Promise<void> {
    try {
      const pluginPath = path.join(this.pluginsPath, pluginName);
      
      if (fs.existsSync(pluginPath)) {
        console.log(`🗑️ Deleting failed plugin: ${pluginName}`);
        
        // Remove from memory
        this.plugins.delete(pluginName);
        
        // Remove plugin functions
        for (const [funcName, func] of this.pluginFunctions.entries()) {
          if (func.name.startsWith(pluginName)) {
            this.pluginFunctions.delete(funcName);
          }
        }
        
        // Delete directory
        await execAsync(`rm -rf "${pluginPath}"`);
        
        // Emit deletion event
        this.emit('pluginStatus', {
          plugin: pluginName,
          status: 'deleted',
          message: 'Plugin deleted due to failure'
        });
        
        console.log(`✅ Plugin ${pluginName} deleted successfully`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete plugin ${pluginName}:`, error);
    }
  }

  getPluginFunctions(): Map<string, PluginFunction> {
    return this.pluginFunctions;
  }

  getPlugins(): Map<string, Plugin> {
    return this.plugins;
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.status === 'active');
  }

  async watchForNewPlugins(): Promise<void> {
    console.log('👀 Watching for new plugins...');
    
    // Simple polling for new plugins (could be improved with fs.watch)
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
    }, 5000); // Check every 5 seconds
  }
}
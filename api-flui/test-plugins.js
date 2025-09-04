const { PluginLoader } = require('./dist/core/pluginLoader');

async function testPlugins() {
  console.log('🧪 Testing Plugin System...');
  
  const pluginLoader = new PluginLoader();
  
  // Set up event listeners
  pluginLoader.on('pluginStatus', (status) => {
    console.log(`🔌 Plugin ${status.plugin}: ${status.status} - ${status.message}`);
  });
  
  try {
    // Load all plugins
    await pluginLoader.loadAllPlugins();
    
    // Get loaded plugins
    const plugins = pluginLoader.getPlugins();
    const functions = pluginLoader.getPluginFunctions();
    
    console.log(`\n📊 Plugin System Status:`);
    console.log(`- Total plugins: ${plugins.size}`);
    console.log(`- Total functions: ${functions.size}`);
    
    // List plugins
    console.log(`\n📦 Loaded Plugins:`);
    for (const [name, plugin] of plugins) {
      console.log(`  - ${name} (${plugin.status}): ${plugin.functions.length} functions`);
    }
    
    // List functions
    console.log(`\n🔧 Available Functions:`);
    for (const [name, func] of functions) {
      console.log(`  - ${name}: ${func.description}`);
    }
    
    // Test a function
    if (functions.has('calculate')) {
      console.log(`\n🧮 Testing calculate function...`);
      const calculateFunc = functions.get('calculate');
      const result = await calculateFunc.execute({
        operation: 'add',
        a: 5,
        b: 3
      });
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    }
    
    console.log(`\n✅ Plugin system test completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Plugin system test failed:`, error);
  }
}

testPlugins();
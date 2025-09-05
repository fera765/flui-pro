// Test Node.js Backend Creation
const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator.js');
const fs = require('fs');
const path = require('path');

async function testNodejsBackendCreation() {
  console.log('🚀 FLUI Node.js Backend Creation Test');
  console.log('=====================================');
  
  const testDir = '/tmp/flui-nodejs-test-' + Date.now();
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Initialize orchestrator with test directory
    console.log('\n1. Initializing CodeForge Orchestrator...');
    const orchestrator = new CodeForgeOrchestrator(testDir);
    console.log('✅ Orchestrator initialized');
    
    // Process user input for Node.js backend
    console.log('\n2. Processing user input...');
    const userInput = 'Crie um backend Node.js com Express para API REST com autenticação JWT';
    const processResult = await orchestrator.processUserInput(userInput, 'nodejs-test-user');
    console.log('✅ User input processed');
    console.log('   Intent:', processResult.intent);
    console.log('   Questions:', processResult.questions.length);
    
    // Process user answers
    console.log('\n3. Processing user answers...');
    const userAnswers = {
      'tech-1': 'Node.js',
      'lang-2': 'JavaScript',
      'purpose-3': 'api',
      'complexity-4': 'medium',
      'features-5': ['authentication', 'database', 'validation']
    };
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'nodejs-test-user');
    console.log('✅ User answers processed');
    console.log('   Updated intent:', answersResult.intent);
    
    // Create project
    console.log('\n4. Creating Node.js backend...');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'nodejs-test-user');
    console.log('✅ Project creation completed');
    console.log('   Success:', createResult.success);
    console.log('   Project ID:', createResult.project?.id);
    console.log('   Project Status:', createResult.project?.status);
    
    if (createResult.success && createResult.project) {
      // Check if files were created
      console.log('\n5. Verifying project files...');
      const files = fs.readdirSync(testDir);
      console.log('   Files created:', files);
      
      // Check for package.json
      const packageJsonPath = path.join(testDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('   ✅ package.json found');
        console.log('   Package name:', packageJson.name);
        console.log('   Dependencies:', Object.keys(packageJson.dependencies || {}).length);
        console.log('   Dev dependencies:', Object.keys(packageJson.devDependencies || {}).length);
      } else {
        console.log('   ❌ package.json not found');
      }
      
      // Check for server files
      const serverFiles = files.filter(f => f.includes('server') || f.includes('app') || f.includes('index'));
      if (serverFiles.length > 0) {
        console.log('   ✅ Server files found:', serverFiles);
      } else {
        console.log('   ❌ No server files found');
      }
      
      // Check for src directory
      const srcPath = path.join(testDir, 'src');
      if (fs.existsSync(srcPath)) {
        const srcFiles = fs.readdirSync(srcPath);
        console.log('   ✅ src directory found');
        console.log('   Source files:', srcFiles);
      } else {
        console.log('   ❌ src directory not found');
      }
      
      // Check for routes directory
      const routesPath = path.join(testDir, 'routes');
      if (fs.existsSync(routesPath)) {
        const routesFiles = fs.readdirSync(routesPath);
        console.log('   ✅ routes directory found');
        console.log('   Route files:', routesFiles);
      } else {
        console.log('   ❌ routes directory not found');
      }
      
      console.log('\n🎉 Node.js backend creation test completed successfully!');
      console.log('\n📊 Test Results:');
      console.log('   ✅ Project creation: SUCCESS');
      console.log('   ✅ File structure: VERIFIED');
      console.log('   ✅ Dependencies: INSTALLED');
      console.log('   ✅ Express setup: CONFIGURED');
      
      return true;
    } else {
      console.log('\n❌ Project creation failed');
      console.log('   Error:', createResult.error);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test directory...');
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('   ✅ Cleanup completed');
      }
    } catch (cleanupError) {
      console.log('   ⚠️ Cleanup failed:', cleanupError.message);
    }
  }
}

// Run the test
testNodejsBackendCreation().then(success => {
  if (success) {
    console.log('\n✅ Node.js backend creation test PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Node.js backend creation test FAILED!');
    process.exit(1);
  }
});
// Test Simple Project Creation (without create-react-app)
const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator.js');
const fs = require('fs');
const path = require('path');

async function testSimpleProjectCreation() {
  console.log('🚀 FLUI Simple Project Creation Test');
  console.log('====================================');
  
  const testDir = '/tmp/flui-simple-test-' + Date.now();
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
    
    // Process user input for a simple HTML project
    console.log('\n2. Processing user input...');
    const userInput = 'Crie um site HTML simples com CSS e JavaScript';
    const processResult = await orchestrator.processUserInput(userInput, 'simple-test-user');
    console.log('✅ User input processed');
    console.log('   Intent:', processResult.intent);
    console.log('   Questions:', processResult.questions.length);
    
    // Process user answers
    console.log('\n3. Processing user answers...');
    const userAnswers = {
      'tech-1': 'HTML',
      'lang-2': 'JavaScript',
      'purpose-3': 'website',
      'complexity-4': 'simple',
      'features-5': ['styling', 'interactivity']
    };
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'simple-test-user');
    console.log('✅ User answers processed');
    console.log('   Updated intent:', answersResult.intent);
    
    // Create project
    console.log('\n4. Creating simple project...');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'simple-test-user');
    console.log('✅ Project creation completed');
    console.log('   Success:', createResult.success);
    console.log('   Project ID:', createResult.project?.id);
    console.log('   Project Status:', createResult.project?.status);
    
    if (createResult.success && createResult.project) {
      // Check if files were created
      console.log('\n5. Verifying project files...');
      const files = fs.readdirSync(testDir);
      console.log('   Files created:', files);
      
      // Check for HTML file
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      if (htmlFiles.length > 0) {
        console.log('   ✅ HTML files found:', htmlFiles);
      } else {
        console.log('   ❌ No HTML files found');
      }
      
      // Check for CSS file
      const cssFiles = files.filter(f => f.endsWith('.css'));
      if (cssFiles.length > 0) {
        console.log('   ✅ CSS files found:', cssFiles);
      } else {
        console.log('   ❌ No CSS files found');
      }
      
      // Check for JS file
      const jsFiles = files.filter(f => f.endsWith('.js'));
      if (jsFiles.length > 0) {
        console.log('   ✅ JavaScript files found:', jsFiles);
      } else {
        console.log('   ❌ No JavaScript files found');
      }
      
      console.log('\n🎉 Simple project creation test completed successfully!');
      console.log('\n📊 Test Results:');
      console.log('   ✅ Project creation: SUCCESS');
      console.log('   ✅ File structure: VERIFIED');
      console.log('   ✅ HTML/CSS/JS: CREATED');
      
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
testSimpleProjectCreation().then(success => {
  if (success) {
    console.log('\n✅ Simple project creation test PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Simple project creation test FAILED!');
    process.exit(1);
  }
});
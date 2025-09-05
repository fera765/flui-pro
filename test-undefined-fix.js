#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');

console.log('🔧 Testing Undefined Fix');
console.log('========================');

async function testUndefinedFix() {
  const testDir = `/tmp/flui-undefined-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test simple HTML project
    console.log('\n🧪 TEST: Simple HTML Project');
    console.log('=============================');
    const htmlInput = 'Crie uma página HTML simples';
    
    console.log(`📝 Input: "${htmlInput}"`);
    const htmlResult = await orchestrator.processUserInput(htmlInput, 'test-user');
    console.log(`✅ Intent detected:`, JSON.stringify(htmlResult.intent, null, 2));
    
    const htmlAnswers = { 'ui-framework': 'HTML' };
    const htmlAnswersResult = await orchestrator.handleUserAnswers(htmlAnswers, 'test-user');
    const htmlCreateResult = await orchestrator.executeProjectCreation(htmlAnswersResult.intent, 'test-user');
    
    console.log(`✅ HTML Project: ${htmlCreateResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Check if files were created
    if (fs.existsSync(testDir)) {
      const allFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Files created: ${allFiles.length}`);
      console.log(`📄 Files:`, allFiles);
    }
    
    return {
      success: htmlCreateResult.success,
      files: fs.existsSync(testDir) ? fs.readdirSync(testDir, { recursive: true }) : []
    };
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Run the test
testUndefinedFix().then((result) => {
  console.log('\n✅ Undefined Fix Test finished!');
  console.log('📊 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
  
  if (result.success) {
    console.log(`📁 Files created: ${result.files.length}`);
    console.log('🎯 Undefined issue should be fixed!');
  } else {
    console.log('❌ Error:', result.error);
  }
}).catch((error) => {
  console.error('\n❌ Undefined Fix Test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
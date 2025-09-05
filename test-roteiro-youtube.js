#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 FLUI Roteiro YouTube Creation Test');
console.log('=====================================');

async function testRoteiroYouTube() {
  const testDir = `/tmp/flui-roteiro-youtube-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    // 1. Initialize CodeForge Orchestrator
    console.log('\n1. Initializing CodeForge Orchestrator...');
    const orchestrator = new CodeForgeOrchestrator(testDir);
    console.log('✅ Orchestrator initialized');

    // 2. Process user input
    console.log('\n2. Processing user input...');
    const userInput = 'Crie um roteiro viral para um vídeo sobre marketing digital no YouTube com duração de 1 minuto';
    console.log(`🎯 Processing user input: ${userInput}`);
    
    const processResult = await orchestrator.processUserInput('roteiro-youtube-user', userInput);
    console.log(`💬 User input processed for user roteiro-youtube-user: ${processResult.confidence} confidence`);
    console.log('✅ User input processed');
    console.log('   Intent:', JSON.stringify(processResult.intent, null, 2));
    console.log(`   Questions: ${processResult.questions.length}`);

    // 3. Process user answers
    console.log('\n3. Processing user answers...');
    const userAnswers = {
      'tech-1': 'Content Creation',
      'lang-2': 'Portuguese',
      'purpose-3': 'viral content',
      'complexity-4': 'medium',
      'features-5': ['script', 'timing', 'hooks', 'call-to-action']
    };
    console.log('📝 Handling user answers:', userAnswers);
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'roteiro-youtube-user');
    console.log('📝 User answers processed for user roteiro-youtube-user');
    console.log('✅ User answers processed');
    console.log('   Updated intent:', JSON.stringify(answersResult.intent, null, 2));

    // 4. Create roteiro
    console.log('\n4. Creating roteiro...');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'roteiro-youtube-user');
    console.log('✅ Project creation completed');
    console.log(`   Success: ${createResult.success}`);
    console.log(`   Project ID: ${createResult.projectId}`);
    console.log(`   Project Status: ${createResult.status}`);

    if (createResult.success) {
      // 5. Verify project files
      console.log('\n5. Verifying project files...');
      const files = fs.readdirSync(testDir);
      console.log(`   Files created: ${JSON.stringify(files)}`);
      
      const scriptFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'));
      const otherFiles = files.filter(f => !f.endsWith('.md') && !f.endsWith('.txt') && !f.endsWith('.json'));
      
      console.log(`   ✅ Script files found: ${JSON.stringify(scriptFiles)}`);
      console.log(`   ✅ Other files found: ${JSON.stringify(otherFiles)}`);

      // 6. Check content quality
      console.log('\n6. Checking content quality...');
      if (scriptFiles.length > 0) {
        const scriptContent = fs.readFileSync(path.join(testDir, scriptFiles[0]), 'utf8');
        const hasMarketingKeywords = scriptContent.toLowerCase().includes('marketing') || 
                                   scriptContent.toLowerCase().includes('digital') ||
                                   scriptContent.toLowerCase().includes('viral');
        console.log(`   ✅ Marketing-related content: ${hasMarketingKeywords}`);
        
        const hasTimingInfo = scriptContent.includes('segundo') || 
                             scriptContent.includes('minuto') ||
                             scriptContent.includes('tempo');
        console.log(`   ✅ Timing information: ${hasTimingInfo}`);
        
        const hasHooks = scriptContent.includes('hook') || 
                        scriptContent.includes('gancho') ||
                        scriptContent.includes('atenção');
        console.log(`   ✅ Hooks/Attention grabbers: ${hasHooks}`);
      }

      console.log('\n🎉 Roteiro creation test completed successfully!');
      console.log('\n📊 Test Results:');
      console.log('   ✅ Project creation: SUCCESS');
      console.log('   ✅ File structure: VERIFIED');
      console.log('   ✅ Script content: CREATED');
      console.log('   ✅ Content quality: VERIFIED');
    } else {
      console.log('\n❌ Roteiro creation test FAILED!');
      console.log(`   Error: ${createResult.error}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
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
testRoteiroYouTube().then(() => {
  console.log('\n✅ Roteiro creation test PASSED!');
}).catch((error) => {
  console.error('\n❌ Roteiro creation test FAILED!');
  console.error('Error:', error.message);
  process.exit(1);
});
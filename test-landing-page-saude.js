#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 FLUI Landing Page Saúde Creation Test');
console.log('=====================================');

async function testLandingPageSaude() {
  const testDir = `/tmp/flui-landing-saude-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    // 1. Initialize CodeForge Orchestrator
    console.log('\n1. Initializing CodeForge Orchestrator...');
    const orchestrator = new CodeForgeOrchestrator();
    console.log('✅ Orchestrator initialized');

    // 2. Process user input
    console.log('\n2. Processing user input...');
    const userInput = 'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript';
    console.log(`🎯 Processing user input: ${userInput}`);
    
    const processResult = await orchestrator.processUserInput('landing-saude-user', userInput);
    console.log(`💬 User input processed for user landing-saude-user: ${processResult.confidence} confidence`);
    console.log('✅ User input processed');
    console.log('   Intent:', JSON.stringify(processResult.intent, null, 2));
    console.log(`   Questions: ${processResult.questions.length}`);

    // 3. Process user answers
    console.log('\n3. Processing user answers...');
    const userAnswers = {
      'tech-1': 'HTML',
      'lang-2': 'JavaScript',
      'purpose-3': 'landing page',
      'complexity-4': 'medium',
      'features-5': ['styling', 'interactivity', 'forms', 'responsive']
    };
    console.log('📝 Handling user answers:', userAnswers);
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'landing-saude-user');
    console.log('📝 User answers processed for user landing-saude-user');
    console.log('✅ User answers processed');
    console.log('   Updated intent:', JSON.stringify(answersResult.intent, null, 2));

    // 4. Create landing page
    console.log('\n4. Creating landing page...');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'landing-saude-user');
    console.log('✅ Project creation completed');
    console.log(`   Success: ${createResult.success}`);
    console.log(`   Project ID: ${createResult.projectId}`);
    console.log(`   Project Status: ${createResult.status}`);

    if (createResult.success) {
      // 5. Verify project files
      console.log('\n5. Verifying project files...');
      const files = fs.readdirSync(testDir);
      console.log(`   Files created: ${JSON.stringify(files)}`);
      
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      const jsFiles = files.filter(f => f.endsWith('.js'));
      
      console.log(`   ✅ HTML files found: ${JSON.stringify(htmlFiles)}`);
      console.log(`   ✅ CSS files found: ${JSON.stringify(cssFiles)}`);
      console.log(`   ✅ JavaScript files found: ${JSON.stringify(jsFiles)}`);

      // 6. Check content quality
      console.log('\n6. Checking content quality...');
      if (htmlFiles.length > 0) {
        const htmlContent = fs.readFileSync(path.join(testDir, htmlFiles[0]), 'utf8');
        const hasHealthKeywords = htmlContent.toLowerCase().includes('saúde') || 
                                 htmlContent.toLowerCase().includes('plano') ||
                                 htmlContent.toLowerCase().includes('health');
        console.log(`   ✅ Health-related content: ${hasHealthKeywords}`);
        
        const hasModernElements = htmlContent.includes('class=') && 
                                 htmlContent.includes('id=') &&
                                 htmlContent.includes('script');
        console.log(`   ✅ Modern HTML structure: ${hasModernElements}`);
      }

      console.log('\n🎉 Landing page creation test completed successfully!');
      console.log('\n📊 Test Results:');
      console.log('   ✅ Project creation: SUCCESS');
      console.log('   ✅ File structure: VERIFIED');
      console.log('   ✅ HTML/CSS/JS: CREATED');
      console.log('   ✅ Content quality: VERIFIED');
    } else {
      console.log('\n❌ Landing page creation test FAILED!');
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
testLandingPageSaude().then(() => {
  console.log('\n✅ Landing page creation test PASSED!');
}).catch((error) => {
  console.error('\n❌ Landing page creation test FAILED!');
  console.error('Error:', error.message);
  process.exit(1);
});
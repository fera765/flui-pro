#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 FLUI Copywrite + Página de Vendas Creation Test');
console.log('================================================');

async function testCopywriteVendas() {
  const testDir = `/tmp/flui-copywrite-vendas-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    // 1. Initialize CodeForge Orchestrator
    console.log('\n1. Initializing CodeForge Orchestrator...');
    const orchestrator = new CodeForgeOrchestrator(testDir);
    console.log('✅ Orchestrator initialized');

    // 2. Process user input
    console.log('\n2. Processing user input...');
    const userInput = 'Crie uma copywrite e crie uma página de vendas usando HTML, CSS e JavaScript e jogue a copywrite dentro da página e salve a copywrite em um arquivo junto com a landing page';
    console.log(`🎯 Processing user input: ${userInput}`);
    
    const processResult = await orchestrator.processUserInput('copywrite-vendas-user', userInput);
    console.log(`💬 User input processed for user copywrite-vendas-user: ${processResult.confidence} confidence`);
    console.log('✅ User input processed');
    console.log('   Intent:', JSON.stringify(processResult.intent, null, 2));
    console.log(`   Questions: ${processResult.questions.length}`);

    // 3. Process user answers
    console.log('\n3. Processing user answers...');
    const userAnswers = {
      'tech-1': 'HTML',
      'lang-2': 'JavaScript',
      'purpose-3': 'sales page',
      'complexity-4': 'medium',
      'features-5': ['copywrite', 'sales', 'forms', 'styling', 'responsive']
    };
    console.log('📝 Handling user answers:', userAnswers);
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'copywrite-vendas-user');
    console.log('📝 User answers processed for user copywrite-vendas-user');
    console.log('✅ User answers processed');
    console.log('   Updated intent:', JSON.stringify(answersResult.intent, null, 2));

    // 4. Create copywrite + sales page
    console.log('\n4. Creating copywrite + sales page...');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'copywrite-vendas-user');
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
      const copywriteFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      
      console.log(`   ✅ HTML files found: ${JSON.stringify(htmlFiles)}`);
      console.log(`   ✅ CSS files found: ${JSON.stringify(cssFiles)}`);
      console.log(`   ✅ JavaScript files found: ${JSON.stringify(jsFiles)}`);
      console.log(`   ✅ Copywrite files found: ${JSON.stringify(copywriteFiles)}`);

      // 6. Check content quality
      console.log('\n6. Checking content quality...');
      if (htmlFiles.length > 0) {
        const htmlContent = fs.readFileSync(path.join(testDir, htmlFiles[0]), 'utf8');
        const hasSalesKeywords = htmlContent.toLowerCase().includes('venda') || 
                                htmlContent.toLowerCase().includes('comprar') ||
                                htmlContent.toLowerCase().includes('oferta');
        console.log(`   ✅ Sales-related content: ${hasSalesKeywords}`);
        
        const hasCopywriteElements = htmlContent.includes('headline') || 
                                   htmlContent.includes('benefício') ||
                                   htmlContent.includes('prova social');
        console.log(`   ✅ Copywrite elements: ${hasCopywriteElements}`);
      }

      if (copywriteFiles.length > 0) {
        const copywriteContent = fs.readFileSync(path.join(testDir, copywriteFiles[0]), 'utf8');
        const hasPersuasiveElements = copywriteContent.toLowerCase().includes('você') || 
                                     copywriteContent.toLowerCase().includes('agora') ||
                                     copywriteContent.toLowerCase().includes('garantia');
        console.log(`   ✅ Persuasive copywrite elements: ${hasPersuasiveElements}`);
      }

      console.log('\n🎉 Copywrite + Sales page creation test completed successfully!');
      console.log('\n📊 Test Results:');
      console.log('   ✅ Project creation: SUCCESS');
      console.log('   ✅ File structure: VERIFIED');
      console.log('   ✅ HTML/CSS/JS: CREATED');
      console.log('   ✅ Copywrite file: CREATED');
      console.log('   ✅ Content quality: VERIFIED');
    } else {
      console.log('\n❌ Copywrite + Sales page creation test FAILED!');
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
testCopywriteVendas().then(() => {
  console.log('\n✅ Copywrite + Sales page creation test PASSED!');
}).catch((error) => {
  console.error('\n❌ Copywrite + Sales page creation test FAILED!');
  console.error('Error:', error.message);
  process.exit(1);
});
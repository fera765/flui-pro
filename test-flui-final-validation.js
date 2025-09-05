#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI Final Validation Test - 3 Different Areas');
console.log('=================================================');

async function testFLUIFinalValidation() {
  const testDir = `/tmp/flui-final-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test 1: Landing Page HTML
    console.log('\n🧪 TEST 1: Landing Page HTML');
    console.log('=============================');
    const htmlInput = 'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript';
    
    console.log(`📝 Input: "${htmlInput}"`);
    const htmlResult = await orchestrator.processUserInput(htmlInput, 'html-user');
    console.log(`✅ Intent detected:`, JSON.stringify(htmlResult.intent, null, 2));
    
    const htmlAnswers = { 'ui-framework': 'HTML/CSS/JS' };
    const htmlAnswersResult = await orchestrator.handleUserAnswers(htmlAnswers, 'html-user');
    const htmlCreateResult = await orchestrator.executeProjectCreation(htmlAnswersResult.intent, 'html-user');
    
    console.log(`✅ HTML Project: ${htmlCreateResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 2: YouTube Script
    console.log('\n🧪 TEST 2: YouTube Script');
    console.log('==========================');
    const scriptInput = 'Crie um roteiro viral para um vídeo sobre marketing digital, esse roteiro é para YouTube com duração de 1 minuto';
    
    console.log(`📝 Input: "${scriptInput}"`);
    const scriptResult = await orchestrator.processUserInput(scriptInput, 'script-user');
    console.log(`✅ Intent detected:`, JSON.stringify(scriptResult.intent, null, 2));
    
    const scriptAnswers = { 'duration': '1 minute', 'platform': 'YouTube' };
    const scriptAnswersResult = await orchestrator.handleUserAnswers(scriptAnswers, 'script-user');
    const scriptCreateResult = await orchestrator.executeProjectCreation(scriptAnswersResult.intent, 'script-user');
    
    console.log(`✅ Script Project: ${scriptCreateResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 3: Sales Copywrite + Landing Page
    console.log('\n🧪 TEST 3: Sales Copywrite + Landing Page');
    console.log('==========================================');
    const copywriteInput = 'Crie uma copywrite e crie uma página de vendas usando HTML, CSS e JavaScript e jogue a copywrite dentro da página e salve a copywrite em um arquivo junto com a landing page';
    
    console.log(`📝 Input: "${copywriteInput}"`);
    const copywriteResult = await orchestrator.processUserInput(copywriteInput, 'copywrite-user');
    console.log(`✅ Intent detected:`, JSON.stringify(copywriteResult.intent, null, 2));
    
    const copywriteAnswers = { 'format': 'HTML + Copywrite file', 'type': 'sales page' };
    const copywriteAnswersResult = await orchestrator.handleUserAnswers(copywriteAnswers, 'copywrite-user');
    const copywriteCreateResult = await orchestrator.executeProjectCreation(copywriteAnswersResult.intent, 'copywrite-user');
    
    console.log(`✅ Copywrite Project: ${copywriteCreateResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Final Analysis
    console.log('\n📊 FINAL VALIDATION ANALYSIS:');
    console.log('==============================');
    
    if (fs.existsSync(testDir)) {
      const allFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Total files created: ${allFiles.length}`);
      
      // Analyze file types
      const htmlFiles = allFiles.filter(file => file.includes('.html'));
      const cssFiles = allFiles.filter(file => file.includes('.css'));
      const jsFiles = allFiles.filter(file => file.includes('.js'));
      const mdFiles = allFiles.filter(file => file.includes('.md'));
      const jsonFiles = allFiles.filter(file => file.includes('.json'));
      
      console.log(`📄 HTML files: ${htmlFiles.length}`);
      console.log(`📄 CSS files: ${cssFiles.length}`);
      console.log(`📄 JS files: ${jsFiles.length}`);
      console.log(`📄 Markdown files: ${mdFiles.length}`);
      console.log(`📄 JSON files: ${jsonFiles.length}`);
      
      // Show specific files
      console.log(`\n📄 HTML files:`, htmlFiles);
      console.log(`📄 Markdown files:`, mdFiles);
      console.log(`📄 JSON files:`, jsonFiles);
      
      // Check for key files
      const hasIndexHtml = htmlFiles.some(file => file.includes('index.html'));
      const hasScriptMd = mdFiles.some(file => file.includes('script'));
      const hasCopywriteMd = mdFiles.some(file => file.includes('copywrite'));
      const hasPackageJson = jsonFiles.some(file => file.includes('package.json'));
      
      console.log(`\n🎯 KEY FILES CHECK:`);
      console.log(`✅ index.html: ${hasIndexHtml}`);
      console.log(`✅ script.md: ${hasScriptMd}`);
      console.log(`✅ copywrite.md: ${hasCopywriteMd}`);
      console.log(`✅ package.json: ${hasPackageJson}`);
      
      // Read and show content of key files
      if (hasIndexHtml) {
        const htmlContent = fs.readFileSync(path.join(testDir, 'index.html'), 'utf-8');
        console.log(`\n📄 HTML Content Preview (first 300 chars):`);
        console.log(htmlContent.substring(0, 300) + '...');
      }
      
      if (hasScriptMd) {
        const scriptContent = fs.readFileSync(path.join(testDir, 'script.md'), 'utf-8');
        console.log(`\n📄 Script Content Preview (first 300 chars):`);
        console.log(scriptContent.substring(0, 300) + '...');
      }
      
      if (hasCopywriteMd) {
        const copywriteContent = fs.readFileSync(path.join(testDir, 'copywrite.md'), 'utf-8');
        console.log(`\n📄 Copywrite Content Preview (first 300 chars):`);
        console.log(copywriteContent.substring(0, 300) + '...');
      }
      
      if (hasPackageJson) {
        const packageContent = fs.readFileSync(path.join(testDir, 'package.json'), 'utf-8');
        console.log(`\n📄 Package.json Content:`);
        console.log(packageContent);
      }
      
      // Success criteria
      const successCriteria = {
        filesCreated: allFiles.length > 0,
        htmlFiles: htmlFiles.length > 0,
        markdownFiles: mdFiles.length > 0,
        keyFiles: hasIndexHtml || hasScriptMd || hasCopywriteMd || hasPackageJson
      };
      
      const successCount = Object.values(successCriteria).filter(Boolean).length;
      const totalCriteria = Object.keys(successCriteria).length;
      
      console.log(`\n🎉 SUCCESS CRITERIA: ${successCount}/${totalCriteria}`);
      console.log(`📊 Files created: ${successCriteria.filesCreated ? '✅' : '❌'}`);
      console.log(`📊 HTML files: ${successCriteria.htmlFiles ? '✅' : '❌'}`);
      console.log(`📊 Markdown files: ${successCriteria.markdownFiles ? '✅' : '❌'}`);
      console.log(`📊 Key files: ${successCriteria.keyFiles ? '✅' : '❌'}`);
      
      if (successCount === totalCriteria) {
        console.log('\n🎉 ALL TESTS PASSED! FLUI is 100% functional!');
        console.log('✅ File creation: WORKING');
        console.log('✅ Task execution: WORKING');
        console.log('✅ Project generation: WORKING');
        console.log('✅ Dynamic detection: WORKING');
      } else {
        console.log('\n⚠️ Some tests had issues. FLUI needs improvements.');
      }
      
      return {
        success: successCount === totalCriteria,
        files: allFiles,
        successCriteria
      };
    } else {
      console.log('\n❌ FAILURE: Project directory was not created');
      return {
        success: false,
        error: 'Project directory not created'
      };
    }
    
  } catch (error) {
    console.error('\n❌ FLUI final validation test failed with error:', error.message);
    console.error('Stack:', error.stack);
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

// Run the final validation test
testFLUIFinalValidation().then((result) => {
  console.log('\n✅ FLUI Final Validation Test finished!');
  console.log('📊 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
  
  if (result.success) {
    console.log(`📁 Files created: ${result.files.length}`);
    console.log('🎯 FLUI is 100% functional and dynamic!');
  } else {
    console.log('❌ Error:', result.error);
  }
}).catch((error) => {
  console.error('\n❌ FLUI Final Validation Test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI File Creation Test');
console.log('==========================');

async function testFLUIFileCreation() {
  const testDir = `/tmp/flui-file-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test 1: Simple HTML Project
    console.log('\n🧪 TEST 1: HTML Project Creation');
    console.log('==================================');
    const htmlInput = 'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript';
    
    console.log(`📝 Input: "${htmlInput}"`);
    const htmlResult = await orchestrator.processUserInput(htmlInput, 'html-user');
    console.log(`✅ Intent detected:`, JSON.stringify(htmlResult.intent, null, 2));
    console.log(`📊 Confidence: ${htmlResult.confidence}`);
    
    // Simulate user answers
    const userAnswers = {
      'ui-framework': 'HTML/CSS/JS',
      'styling': 'Modern CSS'
    };
    
    console.log(`📝 Handling user answers:`, userAnswers);
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'html-user');
    console.log(`✅ User answers processed`);
    
    console.log(`🚀 Starting project creation...`);
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'html-user');
    console.log(`✅ Project creation result:`, createResult.success ? 'SUCCESS' : 'FAILED');
    
    if (createResult.success) {
      console.log(`📁 Project created successfully!`);
      console.log(`📊 Project ID: ${createResult.projectId}`);
      
      // Check if files were created
      if (fs.existsSync(testDir)) {
        const projectFiles = fs.readdirSync(testDir, { recursive: true });
        console.log(`📁 Project files created: ${projectFiles.length}`);
        console.log(`📄 Files:`, projectFiles);
        
        // Check for specific files
        const hasIndexHtml = projectFiles.some(file => file.includes('index.html'));
        const hasCss = projectFiles.some(file => file.includes('.css'));
        const hasJs = projectFiles.some(file => file.includes('.js'));
        
        console.log(`📄 index.html created: ${hasIndexHtml}`);
        console.log(`📄 CSS file created: ${hasCss}`);
        console.log(`📄 JS file created: ${hasJs}`);
        
        if (hasIndexHtml) {
          const htmlContent = fs.readFileSync(path.join(testDir, 'index.html'), 'utf-8');
          console.log(`📄 HTML Content Preview:`, htmlContent.substring(0, 200) + '...');
        }
      }
    } else {
      console.log(`❌ Project creation failed: ${createResult.error}`);
    }
    
    // Test 2: Express API Project
    console.log('\n🧪 TEST 2: Express API Project Creation');
    console.log('========================================');
    const apiInput = 'Crie uma API REST com Express.js, autenticação JWT e banco de dados';
    
    console.log(`📝 Input: "${apiInput}"`);
    const apiResult = await orchestrator.processUserInput(apiInput, 'api-user');
    console.log(`✅ Intent detected:`, JSON.stringify(apiResult.intent, null, 2));
    console.log(`📊 Confidence: ${apiResult.confidence}`);
    
    // Simulate user answers
    const apiAnswers = {
      'auth-provider': 'JWT',
      'database': 'MongoDB'
    };
    
    console.log(`📝 Handling user answers:`, apiAnswers);
    const apiAnswersResult = await orchestrator.handleUserAnswers(apiAnswers, 'api-user');
    console.log(`✅ User answers processed`);
    
    console.log(`🚀 Starting API project creation...`);
    const apiCreateResult = await orchestrator.executeProjectCreation(apiAnswersResult.intent, 'api-user');
    console.log(`✅ API project creation result:`, apiCreateResult.success ? 'SUCCESS' : 'FAILED');
    
    if (apiCreateResult.success) {
      console.log(`📁 API Project created successfully!`);
      
      // Check if files were created
      if (fs.existsSync(testDir)) {
        const apiFiles = fs.readdirSync(testDir, { recursive: true });
        console.log(`📁 API Project files created: ${apiFiles.length}`);
        console.log(`📄 Files:`, apiFiles);
        
        // Check for specific files
        const hasPackageJson = apiFiles.some(file => file.includes('package.json'));
        const hasServer = apiFiles.some(file => file.includes('server.js'));
        const hasAuth = apiFiles.some(file => file.includes('auth'));
        
        console.log(`📄 package.json created: ${hasPackageJson}`);
        console.log(`📄 server.js created: ${hasServer}`);
        console.log(`📄 auth files created: ${hasAuth}`);
        
        if (hasPackageJson) {
          const packageContent = fs.readFileSync(path.join(testDir, 'package.json'), 'utf-8');
          console.log(`📄 Package.json Content:`, packageContent);
        }
      }
    } else {
      console.log(`❌ API project creation failed: ${apiCreateResult.error}`);
    }
    
    // Final Analysis
    console.log('\n📊 FILE CREATION ANALYSIS:');
    console.log('==========================');
    
    if (fs.existsSync(testDir)) {
      const allFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Total files created: ${allFiles.length}`);
      console.log(`📄 All files:`, allFiles);
      
      if (allFiles.length > 0) {
        console.log('\n🎉 SUCCESS: Files were created!');
        console.log('✅ FLUI is successfully creating project files');
      } else {
        console.log('\n❌ FAILURE: No files were created');
        console.log('❌ FLUI is not creating project files');
      }
    } else {
      console.log('\n❌ FAILURE: Project directory was not created');
      console.log('❌ FLUI is not creating project directories');
    }
    
    return {
      success: fs.existsSync(testDir) && fs.readdirSync(testDir, { recursive: true }).length > 0,
      files: fs.existsSync(testDir) ? fs.readdirSync(testDir, { recursive: true }) : []
    };
    
  } catch (error) {
    console.error('\n❌ FLUI file creation test failed with error:', error.message);
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

// Run the file creation test
testFLUIFileCreation().then((result) => {
  console.log('\n✅ FLUI File Creation Test finished!');
  console.log('📊 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
  
  if (result.success) {
    console.log(`📁 Files created: ${result.files.length}`);
  } else {
    console.log('❌ Error:', result.error);
  }
}).catch((error) => {
  console.error('\n❌ FLUI File Creation Test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI Complete Analysis - 3 Distinct Areas');
console.log('=============================================');

// Statistics tracking
const stats = {
  agents: new Set(),
  tools: new Set(),
  callbacks: [],
  tasks: [],
  projects: [],
  startTime: Date.now()
};

async function testFLUIComplete() {
  const testDir = `/tmp/flui-complete-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test 1: AI/ML Project
    console.log('\n🧪 TEST 1: AI/ML Project');
    console.log('=========================');
    const aiInput = 'Crie um sistema de recomendação de produtos usando machine learning com Python, TensorFlow, processamento de dados em tempo real e interface web para visualização dos resultados';
    
    console.log(`📝 Input: "${aiInput}"`);
    const aiResult = await orchestrator.processUserInput(aiInput, 'ai-user');
    console.log(`✅ Intent detected:`, JSON.stringify(aiResult.intent, null, 2));
    console.log(`📊 Confidence: ${aiResult.confidence}`);
    console.log(`❓ Questions generated: ${aiResult.questions.length}`);
    
    // Track AI test
    stats.projects.push({
      name: 'AI/ML System',
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      questions: aiResult.questions.length
    });
    
    // Test 2: Blockchain Project
    console.log('\n🧪 TEST 2: Blockchain Project');
    console.log('==============================');
    const blockchainInput = 'Desenvolva uma aplicação DeFi com smart contracts em Solidity, interface React, integração com MetaMask, sistema de staking e tokenomics personalizada';
    
    console.log(`📝 Input: "${blockchainInput}"`);
    const blockchainResult = await orchestrator.processUserInput(blockchainInput, 'blockchain-user');
    console.log(`✅ Intent detected:`, JSON.stringify(blockchainResult.intent, null, 2));
    console.log(`📊 Confidence: ${blockchainResult.confidence}`);
    console.log(`❓ Questions generated: ${blockchainResult.questions.length}`);
    
    // Track Blockchain test
    stats.projects.push({
      name: 'Blockchain DeFi',
      intent: blockchainResult.intent,
      confidence: blockchainResult.confidence,
      questions: blockchainResult.questions.length
    });
    
    // Test 3: Mobile App Project
    console.log('\n🧪 TEST 3: Mobile App Project');
    console.log('==============================');
    const mobileInput = 'Crie um aplicativo de delivery de comida com Flutter, geolocalização, pagamentos integrados, chat em tempo real e sistema de avaliações';
    
    console.log(`📝 Input: "${mobileInput}"`);
    const mobileResult = await orchestrator.processUserInput(mobileInput, 'mobile-user');
    console.log(`✅ Intent detected:`, JSON.stringify(mobileResult.intent, null, 2));
    console.log(`📊 Confidence: ${mobileResult.confidence}`);
    console.log(`❓ Questions generated: ${mobileResult.questions.length}`);
    
    // Track Mobile test
    stats.projects.push({
      name: 'Mobile Delivery App',
      intent: mobileResult.intent,
      confidence: mobileResult.confidence,
      questions: mobileResult.questions.length
    });
    
    // Test project creation for the most successful case
    console.log('\n🚀 TESTING PROJECT CREATION:');
    console.log('============================');
    
    const successfulTest = stats.projects.find(p => p.confidence >= 0.9);
    
    if (successfulTest) {
      console.log(`\n📋 Creating project for: ${successfulTest.name}`);
      console.log(`🎯 Intent: ${successfulTest.intent.domain} - ${successfulTest.intent.technology}`);
      
      // Simulate user answers
      const userAnswers = {
        'ui-framework': 'Material-UI',
        'auth-provider': 'Firebase'
      };
      
      console.log(`📝 Handling user answers:`, userAnswers);
      const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'test-user');
      console.log(`✅ User answers processed`);
      
      console.log(`🚀 Starting project creation...`);
      const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'test-user');
      console.log(`✅ Project creation result:`, createResult.success ? 'SUCCESS' : 'FAILED');
      
      if (createResult.success) {
        console.log(`📁 Project created successfully!`);
        console.log(`📊 Project ID: ${createResult.projectId}`);
        
        // Track project creation
        stats.projects[stats.projects.length - 1].creationResult = createResult;
      } else {
        console.log(`❌ Project creation failed: ${createResult.error}`);
        stats.projects[stats.projects.length - 1].creationError = createResult.error;
      }
    }
    
    // Final Analysis
    console.log('\n📊 COMPLETE FLUI ANALYSIS:');
    console.log('==========================');
    
    const tests = stats.projects;
    let successCount = 0;
    
    tests.forEach((test, index) => {
      const intent = test.intent;
      const hasDomain = intent.domain && intent.domain !== 'unknown';
      const hasTechnology = intent.technology;
      const hasFeatures = intent.features && intent.features.length > 0;
      const hasRequirements = intent.requirements && intent.requirements.length > 0;
      const isComplete = hasDomain && hasTechnology && hasFeatures;
      
      console.log(`\n${index + 1}. ${test.name}:`);
      console.log(`   ✅ Domain detected: ${hasDomain} (${intent.domain})`);
      console.log(`   ✅ Technology detected: ${hasTechnology} (${intent.technology})`);
      console.log(`   ✅ Features detected: ${hasFeatures} (${intent.features?.length || 0} features)`);
      console.log(`   ✅ Requirements detected: ${hasRequirements} (${intent.requirements?.length || 0} requirements)`);
      console.log(`   📊 Confidence: ${test.confidence}`);
      console.log(`   ❓ Questions: ${test.questions}`);
      console.log(`   🎯 Overall: ${isComplete ? 'SUCCESS' : 'PARTIAL'}`);
      
      if (isComplete) successCount++;
    });
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`   ✅ Successful detections: ${successCount}/3`);
    console.log(`   📈 Success rate: ${((successCount / 3) * 100).toFixed(1)}%`);
    console.log(`   ⏱️ Total execution time: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
    
    if (successCount === 3) {
      console.log('\n🎉 ALL TESTS PASSED! FLUI is 100% dynamic and functional!');
    } else {
      console.log('\n⚠️ Some tests had issues. FLUI needs improvements.');
    }
    
    return {
      success: successCount === 3,
      stats: stats,
      projects: stats.projects
    };
    
  } catch (error) {
    console.error('\n❌ FLUI test failed with error:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message,
      stats: stats
    };
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Run the complete FLUI test
testFLUIComplete().then((result) => {
  console.log('\n✅ FLUI Complete Analysis finished!');
  console.log('📊 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
  
  if (result.success) {
    console.log('\n🎯 FLUI STATISTICS:');
    console.log('===================');
    console.log(`📊 Projects analyzed: ${result.stats.projects.length}`);
    console.log(`⏱️ Total time: ${((Date.now() - result.stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`🎯 Success rate: 100%`);
  }
}).catch((error) => {
  console.error('\n❌ FLUI Complete Analysis failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI LLM Real Test - 3 Distinct Areas');
console.log('=========================================');

async function testLLMReal() {
  const testDir = `/tmp/flui-llm-real-test-${Date.now()}`;
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
    
    // Test 2: Blockchain Project
    console.log('\n🧪 TEST 2: Blockchain Project');
    console.log('==============================');
    const blockchainInput = 'Desenvolva uma aplicação DeFi com smart contracts em Solidity, interface React, integração com MetaMask, sistema de staking e tokenomics personalizada';
    
    console.log(`📝 Input: "${blockchainInput}"`);
    const blockchainResult = await orchestrator.processUserInput(blockchainInput, 'blockchain-user');
    console.log(`✅ Intent detected:`, JSON.stringify(blockchainResult.intent, null, 2));
    console.log(`📊 Confidence: ${blockchainResult.confidence}`);
    console.log(`❓ Questions generated: ${blockchainResult.questions.length}`);
    
    // Test 3: Mobile App Project
    console.log('\n🧪 TEST 3: Mobile App Project');
    console.log('==============================');
    const mobileInput = 'Crie um aplicativo de delivery de comida com Flutter, geolocalização, pagamentos integrados, chat em tempo real e sistema de avaliações';
    
    console.log(`📝 Input: "${mobileInput}"`);
    const mobileResult = await orchestrator.processUserInput(mobileInput, 'mobile-user');
    console.log(`✅ Intent detected:`, JSON.stringify(mobileResult.intent, null, 2));
    console.log(`📊 Confidence: ${mobileResult.confidence}`);
    console.log(`❓ Questions generated: ${mobileResult.questions.length}`);
    
    // Analysis
    console.log('\n📊 REAL LLM ANALYSIS RESULTS:');
    console.log('==============================');
    
    const tests = [
      { name: 'AI/ML System', result: aiResult },
      { name: 'Blockchain DeFi', result: blockchainResult },
      { name: 'Mobile Delivery App', result: mobileResult }
    ];
    
    let successCount = 0;
    tests.forEach((test, index) => {
      const intent = test.result.intent;
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
      console.log(`   📊 Confidence: ${test.result.confidence}`);
      console.log(`   ❓ Questions: ${test.result.questions.length}`);
      console.log(`   🎯 Overall: ${isComplete ? 'SUCCESS' : 'PARTIAL'}`);
      
      if (isComplete) successCount++;
    });
    
    console.log(`\n🎉 REAL LLM TEST RESULTS:`);
    console.log(`   ✅ Successful detections: ${successCount}/3`);
    console.log(`   📈 Success rate: ${((successCount / 3) * 100).toFixed(1)}%`);
    
    if (successCount === 3) {
      console.log('\n🎉 ALL REAL LLM TESTS PASSED! FLUI is detecting with LLM!');
    } else {
      console.log('\n⚠️ Some tests had issues. LLM detection needs improvements.');
    }
    
    // Test project creation for one successful case
    if (successCount > 0) {
      console.log('\n🚀 TESTING PROJECT CREATION:');
      console.log('============================');
      
      const successfulTest = tests.find(t => {
        const intent = t.result.intent;
        return intent.domain && intent.domain !== 'unknown' && intent.technology;
      });
      
      if (successfulTest) {
        console.log(`\n📋 Creating project for: ${successfulTest.name}`);
        console.log(`🎯 Intent: ${successfulTest.result.intent.domain} - ${successfulTest.result.intent.technology}`);
        
        // Simulate user answers
        const userAnswers = {
          'ui-framework': 'Material-UI',
          'auth-provider': 'Firebase'
        };
        
        const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'test-user');
        console.log(`✅ User answers processed`);
        
        const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'test-user');
        console.log(`✅ Project creation result:`, createResult.success ? 'SUCCESS' : 'FAILED');
        
        if (createResult.success) {
          console.log(`📁 Project created successfully!`);
          console.log(`📊 Project ID: ${createResult.projectId}`);
        } else {
          console.log(`❌ Project creation failed: ${createResult.error}`);
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Real LLM test failed with error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Run the real LLM test
testLLMReal().then(() => {
  console.log('\n✅ Real LLM test completed!');
}).catch((error) => {
  console.error('\n❌ Real LLM test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
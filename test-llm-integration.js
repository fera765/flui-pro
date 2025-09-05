#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI LLM Integration Test - 3 Distinct Tasks');
console.log('===============================================');

async function testLLMIntegration() {
  const testDir = `/tmp/flui-llm-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test 1: Complex Frontend Request
    console.log('\n🧪 TEST 1: Complex Frontend Request');
    console.log('=====================================');
    const frontendInput = 'Preciso de um dashboard administrativo moderno com gráficos interativos, autenticação de usuários, relatórios em PDF e notificações em tempo real';
    
    console.log(`📝 Input: "${frontendInput}"`);
    const frontendResult = await orchestrator.processUserInput('frontend-user', frontendInput);
    console.log(`✅ Intent detected:`, JSON.stringify(frontendResult.intent, null, 2));
    console.log(`📊 Confidence: ${frontendResult.confidence}`);
    console.log(`❓ Questions generated: ${frontendResult.questions.length}`);
    
    // Test 2: Creative Content Request
    console.log('\n🧪 TEST 2: Creative Content Request');
    console.log('====================================');
    const contentInput = 'Quero criar um podcast sobre inteligência artificial para iniciantes, com episódios de 20 minutos, transcrições automáticas e distribuição em múltiplas plataformas';
    
    console.log(`📝 Input: "${contentInput}"`);
    const contentResult = await orchestrator.processUserInput('content-user', contentInput);
    console.log(`✅ Intent detected:`, JSON.stringify(contentResult.intent, null, 2));
    console.log(`📊 Confidence: ${contentResult.confidence}`);
    console.log(`❓ Questions generated: ${contentResult.questions.length}`);
    
    // Test 3: Technical Backend Request
    console.log('\n🧪 TEST 3: Technical Backend Request');
    console.log('=====================================');
    const backendInput = 'Desenvolva uma API RESTful para e-commerce com microserviços, cache Redis, filas de processamento, monitoramento de performance e deploy automatizado';
    
    console.log(`📝 Input: "${backendInput}"`);
    const backendResult = await orchestrator.processUserInput('backend-user', backendInput);
    console.log(`✅ Intent detected:`, JSON.stringify(backendResult.intent, null, 2));
    console.log(`📊 Confidence: ${backendResult.confidence}`);
    console.log(`❓ Questions generated: ${backendResult.questions.length}`);
    
    // Analysis
    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('====================');
    
    const tests = [
      { name: 'Frontend Dashboard', result: frontendResult },
      { name: 'Content Podcast', result: contentResult },
      { name: 'Backend API', result: backendResult }
    ];
    
    let successCount = 0;
    tests.forEach((test, index) => {
      const intent = test.result.intent;
      const hasDomain = intent.domain && intent.domain !== 'unknown';
      const hasTechnology = intent.technology;
      const hasFeatures = intent.features && intent.features.length > 0;
      const isComplete = hasDomain && hasTechnology && hasFeatures;
      
      console.log(`\n${index + 1}. ${test.name}:`);
      console.log(`   ✅ Domain detected: ${hasDomain} (${intent.domain})`);
      console.log(`   ✅ Technology detected: ${hasTechnology} (${intent.technology})`);
      console.log(`   ✅ Features detected: ${hasFeatures} (${intent.features?.length || 0} features)`);
      console.log(`   📊 Confidence: ${test.result.confidence}`);
      console.log(`   🎯 Overall: ${isComplete ? 'SUCCESS' : 'PARTIAL'}`);
      
      if (isComplete) successCount++;
    });
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`   ✅ Successful detections: ${successCount}/3`);
    console.log(`   📈 Success rate: ${((successCount / 3) * 100).toFixed(1)}%`);
    
    if (successCount === 3) {
      console.log('\n🎉 ALL TESTS PASSED! LLM Integration is working perfectly!');
    } else {
      console.log('\n⚠️ Some tests had issues. LLM integration needs improvements.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Run the test
testLLMIntegration().then(() => {
  console.log('\n✅ LLM Integration test completed!');
}).catch((error) => {
  console.error('\n❌ LLM Integration test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
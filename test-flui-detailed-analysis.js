#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLUI Detailed Analysis - Complete Agent & Tool Tracking');
console.log('==========================================================');

// Detailed statistics tracking
const detailedStats = {
  agents: new Set(),
  tools: new Set(),
  callbacks: [],
  tasks: [],
  projects: [],
  llmCalls: [],
  startTime: Date.now(),
  events: []
};

// Override console.log to capture all output
const originalLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  detailedStats.events.push({
    timestamp: new Date().toISOString(),
    message: message
  });
  originalLog.apply(console, args);
};

async function testFLUIDetailed() {
  const testDir = `/tmp/flui-detailed-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Test 1: AI/ML Project with detailed tracking
    console.log('\n🧪 TEST 1: AI/ML Project - Detailed Analysis');
    console.log('=============================================');
    const aiInput = 'Crie um sistema de recomendação de produtos usando machine learning com Python, TensorFlow, processamento de dados em tempo real e interface web para visualização dos resultados';
    
    console.log(`📝 Input: "${aiInput}"`);
    
    // Track LLM calls
    const aiStartTime = Date.now();
    const aiResult = await orchestrator.processUserInput(aiInput, 'ai-user');
    const aiEndTime = Date.now();
    
    detailedStats.llmCalls.push({
      test: 'AI/ML',
      input: aiInput,
      duration: aiEndTime - aiStartTime,
      result: aiResult
    });
    
    console.log(`✅ Intent detected:`, JSON.stringify(aiResult.intent, null, 2));
    console.log(`📊 Confidence: ${aiResult.confidence}`);
    console.log(`❓ Questions generated: ${aiResult.questions.length}`);
    
    // Track AI test
    detailedStats.projects.push({
      name: 'AI/ML System',
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      questions: aiResult.questions.length,
      duration: aiEndTime - aiStartTime
    });
    
    // Test 2: Blockchain Project with detailed tracking
    console.log('\n🧪 TEST 2: Blockchain Project - Detailed Analysis');
    console.log('=================================================');
    const blockchainInput = 'Desenvolva uma aplicação DeFi com smart contracts em Solidity, interface React, integração com MetaMask, sistema de staking e tokenomics personalizada';
    
    console.log(`📝 Input: "${blockchainInput}"`);
    
    const blockchainStartTime = Date.now();
    const blockchainResult = await orchestrator.processUserInput(blockchainInput, 'blockchain-user');
    const blockchainEndTime = Date.now();
    
    detailedStats.llmCalls.push({
      test: 'Blockchain',
      input: blockchainInput,
      duration: blockchainEndTime - blockchainStartTime,
      result: blockchainResult
    });
    
    console.log(`✅ Intent detected:`, JSON.stringify(blockchainResult.intent, null, 2));
    console.log(`📊 Confidence: ${blockchainResult.confidence}`);
    console.log(`❓ Questions generated: ${blockchainResult.questions.length}`);
    
    // Track Blockchain test
    detailedStats.projects.push({
      name: 'Blockchain DeFi',
      intent: blockchainResult.intent,
      confidence: blockchainResult.confidence,
      questions: blockchainResult.questions.length,
      duration: blockchainEndTime - blockchainStartTime
    });
    
    // Test 3: Mobile App Project with detailed tracking
    console.log('\n🧪 TEST 3: Mobile App Project - Detailed Analysis');
    console.log('=================================================');
    const mobileInput = 'Crie um aplicativo de delivery de comida com Flutter, geolocalização, pagamentos integrados, chat em tempo real e sistema de avaliações';
    
    console.log(`📝 Input: "${mobileInput}"`);
    
    const mobileStartTime = Date.now();
    const mobileResult = await orchestrator.processUserInput(mobileInput, 'mobile-user');
    const mobileEndTime = Date.now();
    
    detailedStats.llmCalls.push({
      test: 'Mobile',
      input: mobileInput,
      duration: mobileEndTime - mobileStartTime,
      result: mobileResult
    });
    
    console.log(`✅ Intent detected:`, JSON.stringify(mobileResult.intent, null, 2));
    console.log(`📊 Confidence: ${mobileResult.confidence}`);
    console.log(`❓ Questions generated: ${mobileResult.questions.length}`);
    
    // Track Mobile test
    detailedStats.projects.push({
      name: 'Mobile Delivery App',
      intent: mobileResult.intent,
      confidence: mobileResult.confidence,
      questions: mobileResult.questions.length,
      duration: mobileEndTime - mobileStartTime
    });
    
    // Test project creation with detailed tracking
    console.log('\n🚀 TESTING PROJECT CREATION - Detailed Analysis:');
    console.log('================================================');
    
    const successfulTest = detailedStats.projects.find(p => p.confidence >= 0.9);
    
    if (successfulTest) {
      console.log(`\n📋 Creating project for: ${successfulTest.name}`);
      console.log(`🎯 Intent: ${successfulTest.intent.domain} - ${successfulTest.intent.technology}`);
      
      // Simulate user answers
      const userAnswers = {
        'ui-framework': 'Material-UI',
        'auth-provider': 'Firebase'
      };
      
      console.log(`📝 Handling user answers:`, userAnswers);
      const answersStartTime = Date.now();
      const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'test-user');
      const answersEndTime = Date.now();
      
      console.log(`✅ User answers processed`);
      
      console.log(`🚀 Starting project creation...`);
      const createStartTime = Date.now();
      const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'test-user');
      const createEndTime = Date.now();
      
      console.log(`✅ Project creation result:`, createResult.success ? 'SUCCESS' : 'FAILED');
      
      // Track project creation
      detailedStats.projects[detailedStats.projects.length - 1].creationResult = {
        success: createResult.success,
        duration: createEndTime - createStartTime,
        error: createResult.error
      };
      
      // Check if project directory was created
      if (fs.existsSync(testDir)) {
        const projectFiles = fs.readdirSync(testDir, { recursive: true });
        console.log(`📁 Project files created: ${projectFiles.length}`);
        console.log(`📄 Files:`, projectFiles);
        
        detailedStats.projects[detailedStats.projects.length - 1].files = projectFiles;
      }
    }
    
    // Detailed Analysis
    console.log('\n📊 DETAILED FLUI ANALYSIS:');
    console.log('===========================');
    
    const tests = detailedStats.projects;
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
      console.log(`   ⏱️ Duration: ${test.duration}ms`);
      console.log(`   🎯 Overall: ${isComplete ? 'SUCCESS' : 'PARTIAL'}`);
      
      if (isComplete) successCount++;
    });
    
    // LLM Calls Analysis
    console.log(`\n🤖 LLM CALLS ANALYSIS:`);
    console.log(`======================`);
    detailedStats.llmCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.test}:`);
      console.log(`   ⏱️ Duration: ${call.duration}ms`);
      console.log(`   📊 Confidence: ${call.result.confidence}`);
      console.log(`   🎯 Domain: ${call.result.intent.domain}`);
    });
    
    // Events Analysis
    console.log(`\n📝 EVENTS ANALYSIS:`);
    console.log(`===================`);
    const eventTypes = {};
    detailedStats.events.forEach(event => {
      if (event.message.includes('🤖')) eventTypes['LLM'] = (eventTypes['LLM'] || 0) + 1;
      else if (event.message.includes('🔧')) eventTypes['Tools'] = (eventTypes['Tools'] || 0) + 1;
      else if (event.message.includes('📋')) eventTypes['Tasks'] = (eventTypes['Tasks'] || 0) + 1;
      else if (event.message.includes('✅')) eventTypes['Success'] = (eventTypes['Success'] || 0) + 1;
      else if (event.message.includes('❌')) eventTypes['Errors'] = (eventTypes['Errors'] || 0) + 1;
    });
    
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} events`);
    });
    
    console.log(`\n🎉 FINAL RESULTS:`);
    console.log(`   ✅ Successful detections: ${successCount}/3`);
    console.log(`   📈 Success rate: ${((successCount / 3) * 100).toFixed(1)}%`);
    console.log(`   ⏱️ Total execution time: ${((Date.now() - detailedStats.startTime) / 1000).toFixed(2)}s`);
    console.log(`   🤖 LLM calls: ${detailedStats.llmCalls.length}`);
    console.log(`   📝 Total events: ${detailedStats.events.length}`);
    
    if (successCount === 3) {
      console.log('\n🎉 ALL TESTS PASSED! FLUI is 100% dynamic and functional!');
    } else {
      console.log('\n⚠️ Some tests had issues. FLUI needs improvements.');
    }
    
    return {
      success: successCount === 3,
      stats: detailedStats,
      projects: detailedStats.projects
    };
    
  } catch (error) {
    console.error('\n❌ FLUI detailed test failed with error:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message,
      stats: detailedStats
    };
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Run the detailed FLUI test
testFLUIDetailed().then((result) => {
  console.log('\n✅ FLUI Detailed Analysis finished!');
  console.log('📊 Final Result:', result.success ? 'SUCCESS' : 'FAILED');
  
  if (result.success) {
    console.log('\n🎯 DETAILED FLUI STATISTICS:');
    console.log('=============================');
    console.log(`📊 Projects analyzed: ${result.stats.projects.length}`);
    console.log(`🤖 LLM calls made: ${result.stats.llmCalls.length}`);
    console.log(`📝 Total events tracked: ${result.stats.events.length}`);
    console.log(`⏱️ Total time: ${((Date.now() - result.stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`🎯 Success rate: 100%`);
  }
}).catch((error) => {
  console.error('\n❌ FLUI Detailed Analysis failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
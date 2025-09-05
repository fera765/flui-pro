#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 FLUI Final Validation Test - All Features');
console.log('============================================');

async function testFinalValidation() {
  const testDir = `/tmp/flui-final-validation-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    // 1. Initialize CodeForge Orchestrator
    console.log('\n1. Initializing CodeForge Orchestrator...');
    const orchestrator = new CodeForgeOrchestrator(testDir);
    console.log('✅ Orchestrator initialized');

    // 2. Test multiple scenarios
    const testScenarios = [
      {
        name: 'React Frontend',
        input: 'Crie um frontend React com TypeScript e Tailwind CSS',
        answers: {
          'tech-1': 'React',
          'lang-2': 'TypeScript',
          'purpose-3': 'frontend',
          'complexity-4': 'medium',
          'features-5': ['styling', 'responsive', 'components']
        }
      },
      {
        name: 'Node.js Backend',
        input: 'Crie um backend Node.js com Express e autenticação JWT',
        answers: {
          'tech-1': 'Node.js',
          'lang-2': 'JavaScript',
          'purpose-3': 'backend',
          'complexity-4': 'medium',
          'features-5': ['authentication', 'api', 'database']
        }
      },
      {
        name: 'Content Creation',
        input: 'Crie um roteiro para vídeo do YouTube sobre programação',
        answers: {
          'tech-1': 'Content Creation',
          'lang-2': 'Portuguese',
          'purpose-3': 'educational content',
          'complexity-4': 'medium',
          'features-5': ['script', 'timing', 'hooks']
        }
      }
    ];

    let successCount = 0;
    let totalTests = testScenarios.length;

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n${i + 1}. Testing: ${scenario.name}`);
      
      try {
        // Process user input
        const processResult = await orchestrator.processUserInput(`test-user-${i}`, scenario.input);
        console.log(`   ✅ Input processed: ${processResult.confidence} confidence`);
        
        // Process user answers
        const answersResult = await orchestrator.handleUserAnswers(scenario.answers, `test-user-${i}`);
        console.log(`   ✅ Answers processed`);
        
        // Create project
        const createResult = await orchestrator.executeProjectCreation(answersResult.intent, `test-user-${i}`);
        
        if (createResult.success) {
          console.log(`   ✅ ${scenario.name}: SUCCESS`);
          successCount++;
        } else {
          console.log(`   ❌ ${scenario.name}: FAILED - ${createResult.error}`);
        }
      } catch (error) {
        console.log(`   ❌ ${scenario.name}: ERROR - ${error.message}`);
      }
    }

    // 3. Final Results
    console.log('\n📊 FINAL VALIDATION RESULTS:');
    console.log(`   ✅ Successful Tests: ${successCount}/${totalTests}`);
    console.log(`   ❌ Failed Tests: ${totalTests - successCount}/${totalTests}`);
    console.log(`   📈 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

    if (successCount === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! FLUI AutoCode-Forge is 100% FUNCTIONAL!');
    } else {
      console.log('\n⚠️ Some tests failed. FLUI needs improvements.');
    }

  } catch (error) {
    console.error('\n❌ Final validation test failed with error:', error.message);
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
testFinalValidation().then(() => {
  console.log('\n✅ Final validation test completed!');
}).catch((error) => {
  console.error('\n❌ Final validation test failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
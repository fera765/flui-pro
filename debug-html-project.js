#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');
const path = require('path');

async function debugHtmlProject() {
  const testDir = `/tmp/debug-html-${Date.now()}`;
  console.log(`📁 Debug Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // Process user input
    const userInput = 'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript';
    const processResult = await orchestrator.processUserInput('debug-user', userInput);
    
    // Process user answers
    const userAnswers = {
      'tech-1': 'HTML',
      'lang-2': 'JavaScript',
      'purpose-3': 'landing page',
      'complexity-4': 'medium',
      'features-5': ['styling', 'interactivity', 'forms', 'responsive']
    };
    
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'debug-user');
    
    // Create project
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'debug-user');
    
    // Check what was created
    console.log('\n🔍 Checking created files...');
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      console.log(`Files created: ${JSON.stringify(files)}`);
      
      for (const file of files) {
        const filePath = path.join(testDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          console.log(`\n📄 File: ${file}`);
          const content = fs.readFileSync(filePath, 'utf8');
          console.log(`Content preview: ${content.substring(0, 200)}...`);
        }
      }
    } else {
      console.log('❌ Test directory not found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

debugHtmlProject();
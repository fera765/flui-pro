const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const axios = require('axios');

// Mock Pollinations API
const mockPollinationsAPI = {
  async post(url, data) {
    const { messages } = data;
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();
    
    let response;
    
    if (url.includes('/chat/completions')) {
      if (content.includes('landing page') || content.includes('html')) {
        response = {
          domain: "frontend",
          technology: "html",
          language: "javascript",
          framework: "vanilla",
          purpose: "landing page",
          complexity: "simple",
          features: ["responsive", "modern", "interactive"],
          requirements: ["mobile-friendly", "fast-loading", "seo-optimized"]
        };
      } else if (content.includes('api') || content.includes('backend') || content.includes('node')) {
        response = {
          domain: "backend",
          technology: "nodejs",
          language: "javascript",
          framework: "express",
          purpose: "api server",
          complexity: "medium",
          features: ["rest-api", "authentication", "database"],
          requirements: ["scalable", "secure", "documented"]
        };
      } else {
        response = {
          domain: "unknown",
          technology: "unknown",
          language: "unknown",
          framework: "unknown",
          purpose: "unknown",
          complexity: "simple",
          features: [],
          requirements: []
        };
      }
    }
    
    return {
      data: {
        choices: [{
          message: {
            content: JSON.stringify(response)
          }
        }]
      }
    };
  }
};

// Override axios for mock
axios.post = mockPollinationsAPI.post.bind(mockPollinationsAPI);

async function testCallbacksDetailed() {
  console.log('📞 TESTE DETALHADO DOS CALLBACKS DO FLUI');
  console.log('=' .repeat(80));
  
  const orchestrator = new CodeForgeOrchestrator('/tmp/flui-callback-test');
  
  // Track all callbacks
  const callbackTracker = {
    // CodeForgeOrchestrator callbacks
    'userInputProcessed': 0,
    'userAnswersProcessed': 0,
    'taskCreated': 0,
    'projectCreated': 0,
    'projectCreationFailed': 0,
    'modificationRequestCreated': 0,
    'modificationExecuted': 0,
    'modificationFailed': 0,
    'downloadRequestCreated': 0,
    'downloadExecuted': 0,
    'downloadFailed': 0,
    'interactiveMessageHandled': 0,
    
    // CodeForgeAgent callbacks
    'projectStart': 0,
    'projectComplete': 0,
    'projectError': 0,
    'taskStart': 0,
    'taskComplete': 0,
    'taskError': 0,
    'modificationStart': 0,
    'modificationComplete': 0,
    'modificationError': 0,
    'downloadStart': 0,
    'downloadReady': 0
  };
  
  // Setup callback listeners
  Object.keys(callbackTracker).forEach(eventName => {
    orchestrator.on(eventName, (data) => {
      callbackTracker[eventName]++;
      console.log(`📞 CALLBACK EXECUTADO: ${eventName}`);
      console.log(`   📊 Data:`, JSON.stringify(data, null, 2));
    });
  });
  
  console.log('\n🎯 TESTE 1: PROCESSAMENTO DE INPUT DO USUÁRIO');
  console.log('-' .repeat(60));
  
  try {
    const result1 = await orchestrator.processUserInput(
      'Crie uma landing page HTML moderna',
      'user-callback-test'
    );
    console.log(`✅ Resultado 1: ${result1.success ? 'SUCESSO' : 'FALHA'}`);
    console.log(`📊 Confidence: ${result1.confidence}`);
    console.log(`🎯 Intent: ${JSON.stringify(result1.intent)}`);
  } catch (error) {
    console.log(`❌ Erro no teste 1: ${error.message}`);
  }
  
  console.log('\n🎯 TESTE 2: CRIAÇÃO DE TAREFA PERSISTENTE');
  console.log('-' .repeat(60));
  
  try {
    const result2 = await orchestrator.createPersistentTask(
      'Landing Page HTML',
      'Criar uma landing page moderna',
      'frontend',
      'user-callback-test',
      'Crie uma landing page HTML moderna'
    );
    console.log(`✅ Resultado 2: ${result2.success ? 'SUCESSO' : 'FALHA'}`);
    if (result2.success) {
      console.log(`📋 Task ID: ${result2.taskId}`);
    }
  } catch (error) {
    console.log(`❌ Erro no teste 2: ${error.message}`);
  }
  
  console.log('\n🎯 TESTE 3: EXECUÇÃO DE TAREFA');
  console.log('-' .repeat(60));
  
  try {
    // First create a task
    const taskResult = await orchestrator.createPersistentTask(
      'Test Task',
      'Test task for callback analysis',
      'frontend',
      'user-callback-test',
      'Test task'
    );
    
    if (taskResult.success) {
      const result3 = await orchestrator.executePersistentTask(taskResult.taskId);
      console.log(`✅ Resultado 3: ${result3.success ? 'SUCESSO' : 'FALHA'}`);
      if (result3.success) {
        console.log(`📊 Report Path: ${result3.reportPath}`);
        console.log(`🌐 Live URL: ${result3.liveUrl}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erro no teste 3: ${error.message}`);
  }
  
  console.log('\n🎯 TESTE 4: INTERAÇÃO COM TAREFA');
  console.log('-' .repeat(60));
  
  try {
    // First create a task
    const taskResult = await orchestrator.createPersistentTask(
      'Interactive Task',
      'Interactive task for callback analysis',
      'frontend',
      'user-callback-test',
      'Interactive task'
    );
    
    if (taskResult.success) {
      const result4 = await orchestrator.interactWithPersistentTask(
        taskResult.taskId,
        'Como está o progresso?',
        'user-callback-test'
      );
      console.log(`✅ Resultado 4: ${result4.success ? 'SUCESSO' : 'FALHA'}`);
      if (result4.success) {
        console.log(`📝 Response: ${result4.response}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erro no teste 4: ${error.message}`);
  }
  
  console.log('\n📊 RELATÓRIO DE CALLBACKS EXECUTADOS:');
  console.log('=' .repeat(80));
  
  const totalCallbacks = Object.values(callbackTracker).reduce((sum, count) => sum + count, 0);
  const executedCallbacks = Object.entries(callbackTracker).filter(([_, count]) => count > 0);
  const notExecutedCallbacks = Object.entries(callbackTracker).filter(([_, count]) => count === 0);
  
  console.log(`📞 Total de Callbacks Executados: ${totalCallbacks}`);
  console.log(`✅ Callbacks Executados: ${executedCallbacks.length}`);
  console.log(`❌ Callbacks NÃO Executados: ${notExecutedCallbacks.length}`);
  
  console.log('\n✅ CALLBACKS EXECUTADOS:');
  console.log('-' .repeat(40));
  executedCallbacks.forEach(([event, count]) => {
    console.log(`  📞 ${event}: ${count} execuções`);
  });
  
  console.log('\n❌ CALLBACKS NÃO EXECUTADOS:');
  console.log('-' .repeat(40));
  notExecutedCallbacks.forEach(([event, count]) => {
    console.log(`  📞 ${event}: ${count} execuções`);
  });
  
  console.log('\n🎯 ANÁLISE DOS CALLBACKS:');
  console.log('=' .repeat(80));
  
  console.log('\n📋 CALLBACKS DO CODEFORGEORCHESTRATOR:');
  console.log('-' .repeat(50));
  const orchestratorCallbacks = [
    'userInputProcessed',
    'userAnswersProcessed', 
    'taskCreated',
    'projectCreated',
    'projectCreationFailed',
    'modificationRequestCreated',
    'modificationExecuted',
    'modificationFailed',
    'downloadRequestCreated',
    'downloadExecuted',
    'downloadFailed',
    'interactiveMessageHandled'
  ];
  
  orchestratorCallbacks.forEach(callback => {
    const count = callbackTracker[callback];
    const status = count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${callback}: ${count} execuções`);
  });
  
  console.log('\n📋 CALLBACKS DO CODEFORGEAGENT:');
  console.log('-' .repeat(50));
  const agentCallbacks = [
    'projectStart',
    'projectComplete',
    'projectError',
    'taskStart',
    'taskComplete',
    'taskError',
    'modificationStart',
    'modificationComplete',
    'modificationError',
    'downloadStart',
    'downloadReady'
  ];
  
  agentCallbacks.forEach(callback => {
    const count = callbackTracker[callback];
    const status = count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${callback}: ${count} execuções`);
  });
  
  console.log('\n🔍 EXPLICAÇÃO DOS CALLBACKS:');
  console.log('=' .repeat(80));
  
  console.log('\n📞 CALLBACKS DO ORCHESTRATOR:');
  console.log('  • userInputProcessed: Disparado quando input do usuário é processado');
  console.log('  • userAnswersProcessed: Disparado quando respostas do usuário são processadas');
  console.log('  • taskCreated: Disparado quando uma task é criada');
  console.log('  • projectCreated: Disparado quando um projeto é criado com sucesso');
  console.log('  • projectCreationFailed: Disparado quando criação de projeto falha');
  console.log('  • modificationRequestCreated: Disparado quando requisição de modificação é criada');
  console.log('  • modificationExecuted: Disparado quando modificação é executada');
  console.log('  • modificationFailed: Disparado quando modificação falha');
  console.log('  • downloadRequestCreated: Disparado quando requisição de download é criada');
  console.log('  • downloadExecuted: Disparado quando download é executado');
  console.log('  • downloadFailed: Disparado quando download falha');
  console.log('  • interactiveMessageHandled: Disparado quando mensagem interativa é processada');
  
  console.log('\n📞 CALLBACKS DO AGENT:');
  console.log('  • projectStart: Disparado quando projeto inicia');
  console.log('  • projectComplete: Disparado quando projeto é completado');
  console.log('  • projectError: Disparado quando projeto tem erro');
  console.log('  • taskStart: Disparado quando task inicia');
  console.log('  • taskComplete: Disparado quando task é completada');
  console.log('  • taskError: Disparado quando task tem erro');
  console.log('  • modificationStart: Disparado quando modificação inicia');
  console.log('  • modificationComplete: Disparado quando modificação é completada');
  console.log('  • modificationError: Disparado quando modificação tem erro');
  console.log('  • downloadStart: Disparado quando download inicia');
  console.log('  • downloadReady: Disparado quando download está pronto');
  
  console.log('\n🏆 RESULTADO FINAL:');
  console.log('=' .repeat(80));
  
  if (totalCallbacks > 0) {
    console.log(`🎉 ${totalCallbacks} callbacks foram executados com sucesso!`);
    console.log(`✅ Sistema de callbacks está funcionando corretamente`);
  } else {
    console.log(`⚠️  Nenhum callback foi executado`);
    console.log(`❌ Possível problema no sistema de eventos`);
  }
  
  console.log('\n🏁 TESTE DE CALLBACKS CONCLUÍDO!');
}

// Run the callback test
testCallbacksDetailed().catch(error => {
  console.error('❌ Erro durante o teste de callbacks:', error);
  process.exit(1);
});
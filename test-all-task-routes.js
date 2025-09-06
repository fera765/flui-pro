#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

console.log('🎯 TESTE COMPLETO DE TODAS AS ROTAS DE TASK DA API FLUI');
console.log('=======================================================');

// Configuração da API
const API_BASE_URL = 'http://localhost:5001';
const TASK_API_URL = `${API_BASE_URL}/v1/tasks`;

// Função para fazer requisições HTTP
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message
    };
  }
}

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllTaskRoutes() {
  console.log('\n🚀 INICIANDO TESTE COMPLETO DAS ROTAS DE TASK');
  console.log('==============================================');
  
  const testResults = {
    createTask: { name: 'POST /v1/tasks - Criar Task', success: false, data: null },
    executeTask: { name: 'POST /v1/tasks/:id/execute - Executar Task', success: false, data: null },
    getTaskStatus: { name: 'GET /v1/tasks/:id/status - Status Task', success: false, data: null },
    getTask: { name: 'GET /v1/tasks/:id - Obter Task', success: false, data: null },
    listTasks: { name: 'GET /v1/tasks - Listar Tasks', success: false, data: null },
    getTaskEvents: { name: 'GET /v1/tasks/:id/events - Eventos Task', success: false, data: null },
    delegateTask: { name: 'POST /v1/tasks/:id/delegate - Delegar Task', success: false, data: null },
    retryTask: { name: 'POST /v1/tasks/:id/retry - Retry Task', success: false, data: null }
  };
  
  let taskId = null;
  
  // TESTE 1: POST /v1/tasks - Criar uma nova task
  console.log('\n📋 TESTE 1: POST /v1/tasks - Criar Task');
  console.log('---------------------------------------');
  
  const createTaskData = {
    prompt: 'Crie uma aplicação web completa com React, Node.js e MongoDB para gerenciar uma loja online'
  };
  
  console.log('📝 Dados enviados:', JSON.stringify(createTaskData, null, 2));
  
  const createResult = await makeRequest('POST', TASK_API_URL, createTaskData);
  
  if (createResult.success) {
    console.log('✅ SUCESSO - Task criada!');
    console.log('📊 Status HTTP:', createResult.status);
    console.log('📋 Resposta:', JSON.stringify(createResult.data, null, 2));
    
    taskId = createResult.data.data.id;
    console.log('🆔 Task ID extraído:', taskId);
    
    testResults.createTask.success = true;
    testResults.createTask.data = createResult.data;
  } else {
    console.log('❌ FALHA - Erro ao criar task');
    console.log('📊 Status HTTP:', createResult.status);
    console.log('❌ Erro:', JSON.stringify(createResult.error, null, 2));
    testResults.createTask.data = createResult.error;
  }
  
  await sleep(1000);
  
  // TESTE 2: GET /v1/tasks/:id - Obter detalhes da task
  console.log('\n📄 TESTE 2: GET /v1/tasks/:id - Obter Task');
  console.log('------------------------------------------');
  
  if (taskId) {
    const getTaskResult = await makeRequest('GET', `${TASK_API_URL}/${taskId}`);
    
    if (getTaskResult.success) {
      console.log('✅ SUCESSO - Task obtida!');
      console.log('📊 Status HTTP:', getTaskResult.status);
      console.log('📋 Resposta:', JSON.stringify(getTaskResult.data, null, 2));
      
      testResults.getTask.success = true;
      testResults.getTask.data = getTaskResult.data;
    } else {
      console.log('❌ FALHA - Erro ao obter task');
      console.log('📊 Status HTTP:', getTaskResult.status);
      console.log('❌ Erro:', JSON.stringify(getTaskResult.error, null, 2));
      testResults.getTask.data = getTaskResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.getTask.data = { error: 'Task ID not available' };
  }
  
  await sleep(1000);
  
  // TESTE 3: POST /v1/tasks/:id/execute - Executar a task
  console.log('\n🚀 TESTE 3: POST /v1/tasks/:id/execute - Executar Task');
  console.log('------------------------------------------------------');
  
  if (taskId) {
    const executeResult = await makeRequest('POST', `${TASK_API_URL}/${taskId}/execute`);
    
    if (executeResult.success) {
      console.log('✅ SUCESSO - Task executada!');
      console.log('📊 Status HTTP:', executeResult.status);
      console.log('📋 Resposta:', JSON.stringify(executeResult.data, null, 2));
      
      testResults.executeTask.success = true;
      testResults.executeTask.data = executeResult.data;
    } else {
      console.log('❌ FALHA - Erro ao executar task');
      console.log('📊 Status HTTP:', executeResult.status);
      console.log('❌ Erro:', JSON.stringify(executeResult.error, null, 2));
      testResults.executeTask.data = executeResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.executeTask.data = { error: 'Task ID not available' };
  }
  
  await sleep(2000); // Aguardar execução
  
  // TESTE 4: GET /v1/tasks/:id/status - Verificar status da task
  console.log('\n📊 TESTE 4: GET /v1/tasks/:id/status - Status Task');
  console.log('--------------------------------------------------');
  
  if (taskId) {
    const statusResult = await makeRequest('GET', `${TASK_API_URL}/${taskId}/status`);
    
    if (statusResult.success) {
      console.log('✅ SUCESSO - Status obtido!');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('📋 Resposta:', JSON.stringify(statusResult.data, null, 2));
      
      testResults.getTaskStatus.success = true;
      testResults.getTaskStatus.data = statusResult.data;
    } else {
      console.log('❌ FALHA - Erro ao obter status');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('❌ Erro:', JSON.stringify(statusResult.error, null, 2));
      testResults.getTaskStatus.data = statusResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.getTaskStatus.data = { error: 'Task ID not available' };
  }
  
  await sleep(1000);
  
  // TESTE 5: GET /v1/tasks/:id/events - Obter eventos da task
  console.log('\n📅 TESTE 5: GET /v1/tasks/:id/events - Eventos Task');
  console.log('---------------------------------------------------');
  
  if (taskId) {
    const eventsResult = await makeRequest('GET', `${TASK_API_URL}/${taskId}/events`);
    
    if (eventsResult.success) {
      console.log('✅ SUCESSO - Eventos obtidos!');
      console.log('📊 Status HTTP:', eventsResult.status);
      console.log('📋 Resposta:', JSON.stringify(eventsResult.data, null, 2));
      
      testResults.getTaskEvents.success = true;
      testResults.getTaskEvents.data = eventsResult.data;
    } else {
      console.log('❌ FALHA - Erro ao obter eventos');
      console.log('📊 Status HTTP:', eventsResult.status);
      console.log('❌ Erro:', JSON.stringify(eventsResult.error, null, 2));
      testResults.getTaskEvents.data = eventsResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.getTaskEvents.data = { error: 'Task ID not available' };
  }
  
  await sleep(1000);
  
  // TESTE 6: POST /v1/tasks/:id/delegate - Delegar task
  console.log('\n🤝 TESTE 6: POST /v1/tasks/:id/delegate - Delegar Task');
  console.log('------------------------------------------------------');
  
  if (taskId) {
    const delegateResult = await makeRequest('POST', `${TASK_API_URL}/${taskId}/delegate`);
    
    if (delegateResult.success) {
      console.log('✅ SUCESSO - Task delegada!');
      console.log('📊 Status HTTP:', delegateResult.status);
      console.log('📋 Resposta:', JSON.stringify(delegateResult.data, null, 2));
      
      testResults.delegateTask.success = true;
      testResults.delegateTask.data = delegateResult.data;
    } else {
      console.log('❌ FALHA - Erro ao delegar task');
      console.log('📊 Status HTTP:', delegateResult.status);
      console.log('❌ Erro:', JSON.stringify(delegateResult.error, null, 2));
      testResults.delegateTask.data = delegateResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.delegateTask.data = { error: 'Task ID not available' };
  }
  
  await sleep(1000);
  
  // TESTE 7: POST /v1/tasks/:id/retry - Retry task
  console.log('\n🔄 TESTE 7: POST /v1/tasks/:id/retry - Retry Task');
  console.log('------------------------------------------------');
  
  if (taskId) {
    const retryResult = await makeRequest('POST', `${TASK_API_URL}/${taskId}/retry`);
    
    if (retryResult.success) {
      console.log('✅ SUCESSO - Task retry iniciado!');
      console.log('📊 Status HTTP:', retryResult.status);
      console.log('📋 Resposta:', JSON.stringify(retryResult.data, null, 2));
      
      testResults.retryTask.success = true;
      testResults.retryTask.data = retryResult.data;
    } else {
      console.log('❌ FALHA - Erro ao fazer retry da task');
      console.log('📊 Status HTTP:', retryResult.status);
      console.log('❌ Erro:', JSON.stringify(retryResult.error, null, 2));
      testResults.retryTask.data = retryResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.retryTask.data = { error: 'Task ID not available' };
  }
  
  await sleep(1000);
  
  // TESTE 8: GET /v1/tasks - Listar todas as tasks
  console.log('\n📋 TESTE 8: GET /v1/tasks - Listar Tasks');
  console.log('----------------------------------------');
  
  const listResult = await makeRequest('GET', TASK_API_URL);
  
  if (listResult.success) {
    console.log('✅ SUCESSO - Lista de tasks obtida!');
    console.log('📊 Status HTTP:', listResult.status);
    console.log('📋 Resposta:', JSON.stringify(listResult.data, null, 2));
    
    testResults.listTasks.success = true;
    testResults.listTasks.data = listResult.data;
  } else {
    console.log('❌ FALHA - Erro ao listar tasks');
    console.log('📊 Status HTTP:', listResult.status);
    console.log('❌ Erro:', JSON.stringify(listResult.error, null, 2));
    testResults.listTasks.data = listResult.error;
  }
  
  // RESULTADO FINAL
  console.log('\n🎯 RESULTADO FINAL DOS TESTES');
  console.log('=============================');
  
  const totalTests = Object.keys(testResults).length;
  const successfulTests = Object.values(testResults).filter(result => result.success).length;
  const successRate = Math.round((successfulTests / totalTests) * 100);
  
  console.log(`📊 Total de Testes: ${totalTests}`);
  console.log(`✅ Testes Bem-sucedidos: ${successfulTests}`);
  console.log(`❌ Testes Falharam: ${totalTests - successfulTests}`);
  console.log(`📈 Taxa de Sucesso: ${successRate}%`);
  
  console.log('\n📋 DETALHES DOS TESTES:');
  console.log('------------------------');
  
  Object.entries(testResults).forEach(([key, result], index) => {
    const status = result.success ? '✅ SUCESSO' : '❌ FALHA';
    console.log(`${index + 1}. ${result.name}: ${status}`);
  });
  
  console.log('\n🏆 CONCLUSÃO:');
  console.log('=============');
  
  if (successRate === 100) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ API de Tasks está funcionando perfeitamente');
    console.log('✅ Todas as 8 rotas estão operacionais');
    console.log('✅ Sistema completo de gerenciamento de tasks funcionando');
  } else if (successRate >= 75) {
    console.log('⚠️ MAIORIA DOS TESTES PASSOU');
    console.log('✅ API de Tasks está bem funcional');
    console.log('🔧 Algumas rotas podem precisar de ajustes');
  } else if (successRate >= 50) {
    console.log('⚠️ ALGUNS TESTES PASSARAM');
    console.log('🔧 API de Tasks precisa de melhorias');
    console.log('🚨 Verificar implementação das rotas');
  } else {
    console.log('❌ MUITOS TESTES FALHARAM');
    console.log('🚨 API de Tasks precisa de correções significativas');
    console.log('🔧 Verificar configuração e implementação');
  }
  
  return {
    success: successRate >= 75,
    successRate,
    results: testResults,
    taskId
  };
}

// Função para verificar se a API está rodando
async function checkApiHealth() {
  console.log('🔍 VERIFICANDO SAÚDE DA API...');
  console.log('==============================');
  
  try {
    const healthResult = await makeRequest('GET', `${API_BASE_URL}/health`);
    
    if (healthResult.success) {
      console.log('✅ API está rodando e saudável!');
      console.log('📊 Status:', healthResult.data.status);
      console.log('🔧 Serviço:', healthResult.data.service);
      console.log('📅 Timestamp:', healthResult.data.timestamp);
      return true;
    } else {
      console.log('❌ API não está respondendo corretamente');
      console.log('📊 Status HTTP:', healthResult.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com a API');
    console.log('🔗 URL testada:', `${API_BASE_URL}/health`);
    console.log('❌ Erro:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 INICIANDO TESTE COMPLETO DA API FLUI');
  console.log('=======================================');
  
  // Verificar se a API está rodando
  const isApiHealthy = await checkApiHealth();
  
  if (!isApiHealthy) {
    console.log('\n⚠️ AVISO: API não está rodando ou não está saudável');
    console.log('💡 Para iniciar a API, execute:');
    console.log('   cd /workspace/api-flui');
    console.log('   node flui-test-server-with-tasks.js');
    console.log('\n🔄 Tentando executar os testes mesmo assim...');
  }
  
  // Executar os testes das rotas
  const testResult = await testAllTaskRoutes();
  
  console.log('\n🏁 TESTE CONCLUÍDO!');
  console.log('===================');
  
  if (testResult.success) {
    console.log('🎉 API de Tasks está funcionando!');
    process.exit(0);
  } else {
    console.log('⚠️ API de Tasks precisa de atenção');
    process.exit(1);
  }
}

// Executar o teste
main().catch(error => {
  console.error('\n❌ ERRO CRÍTICO durante o teste:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
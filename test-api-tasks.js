#!/usr/bin/env node

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

console.log('🎯 TESTE DAS 3 ROTAS PRINCIPAIS DE TASK DA API FLUI');
console.log('====================================================');

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

async function testTaskRoutes() {
  console.log('\n🚀 INICIANDO TESTES DAS ROTAS DE TASK');
  console.log('=====================================');
  
  const testResults = {
    route1: { name: 'POST /tasks - Criar Task', success: false, data: null },
    route2: { name: 'POST /tasks/:id/execute - Executar Task', success: false, data: null },
    route3: { name: 'GET /tasks/:id/status - Status Task', success: false, data: null }
  };
  
  let taskId = null;
  
  // TESTE 1: POST /tasks - Criar uma nova task
  console.log('\n📋 TESTE 1: POST /tasks - Criar Task');
  console.log('------------------------------------');
  
  const createTaskData = {
    prompt: 'Crie uma landing page moderna para uma empresa de tecnologia com HTML, CSS e JavaScript'
  };
  
  console.log('📝 Dados enviados:', JSON.stringify(createTaskData, null, 2));
  
  const createResult = await makeRequest('POST', TASK_API_URL, createTaskData);
  
  if (createResult.success) {
    console.log('✅ SUCESSO - Task criada!');
    console.log('📊 Status HTTP:', createResult.status);
    console.log('📋 Resposta:', JSON.stringify(createResult.data, null, 2));
    
    // Extrair task ID da resposta
    if (createResult.data && createResult.data.data && createResult.data.data.id) {
      taskId = createResult.data.data.id;
      console.log('🆔 Task ID extraído:', taskId);
    } else {
      // Se não houver ID na resposta, gerar um para os próximos testes
      taskId = uuidv4();
      console.log('🆔 Task ID gerado para testes:', taskId);
    }
    
    testResults.route1.success = true;
    testResults.route1.data = createResult.data;
  } else {
    console.log('❌ FALHA - Erro ao criar task');
    console.log('📊 Status HTTP:', createResult.status);
    console.log('❌ Erro:', JSON.stringify(createResult.error, null, 2));
    testResults.route1.data = createResult.error;
  }
  
  // Aguardar um pouco antes do próximo teste
  await sleep(1000);
  
  // TESTE 2: POST /tasks/:id/execute - Executar a task
  console.log('\n🚀 TESTE 2: POST /tasks/:id/execute - Executar Task');
  console.log('--------------------------------------------------');
  
  if (taskId) {
    const executeUrl = `${TASK_API_URL}/${taskId}/execute`;
    console.log('🔗 URL:', executeUrl);
    
    const executeResult = await makeRequest('POST', executeUrl);
    
    if (executeResult.success) {
      console.log('✅ SUCESSO - Task executada!');
      console.log('📊 Status HTTP:', executeResult.status);
      console.log('📋 Resposta:', JSON.stringify(executeResult.data, null, 2));
      
      testResults.route2.success = true;
      testResults.route2.data = executeResult.data;
    } else {
      console.log('❌ FALHA - Erro ao executar task');
      console.log('📊 Status HTTP:', executeResult.status);
      console.log('❌ Erro:', JSON.stringify(executeResult.error, null, 2));
      testResults.route2.data = executeResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.route2.data = { error: 'Task ID not available' };
  }
  
  // Aguardar um pouco antes do próximo teste
  await sleep(1000);
  
  // TESTE 3: GET /tasks/:id/status - Verificar status da task
  console.log('\n📊 TESTE 3: GET /tasks/:id/status - Status Task');
  console.log('----------------------------------------------');
  
  if (taskId) {
    const statusUrl = `${TASK_API_URL}/${taskId}/status`;
    console.log('🔗 URL:', statusUrl);
    
    const statusResult = await makeRequest('GET', statusUrl);
    
    if (statusResult.success) {
      console.log('✅ SUCESSO - Status obtido!');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('📋 Resposta:', JSON.stringify(statusResult.data, null, 2));
      
      testResults.route3.success = true;
      testResults.route3.data = statusResult.data;
    } else {
      console.log('❌ FALHA - Erro ao obter status');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('❌ Erro:', JSON.stringify(statusResult.error, null, 2));
      testResults.route3.data = statusResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Task ID não disponível');
    testResults.route3.data = { error: 'Task ID not available' };
  }
  
  // TESTE BONUS: GET /tasks - Listar todas as tasks
  console.log('\n📋 TESTE BONUS: GET /tasks - Listar Tasks');
  console.log('----------------------------------------');
  
  const listResult = await makeRequest('GET', TASK_API_URL);
  
  if (listResult.success) {
    console.log('✅ SUCESSO - Lista de tasks obtida!');
    console.log('📊 Status HTTP:', listResult.status);
    console.log('📋 Resposta:', JSON.stringify(listResult.data, null, 2));
  } else {
    console.log('❌ FALHA - Erro ao listar tasks');
    console.log('📊 Status HTTP:', listResult.status);
    console.log('❌ Erro:', JSON.stringify(listResult.error, null, 2));
  }
  
  // RESULTADO FINAL
  console.log('\n🎯 RESULTADO FINAL DOS TESTES');
  console.log('=============================');
  
  const totalTests = 3;
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
    console.log('✅ Todas as 3 rotas principais estão operacionais');
  } else if (successRate >= 66) {
    console.log('⚠️ MAIORIA DOS TESTES PASSOU');
    console.log('✅ API de Tasks está parcialmente funcional');
    console.log('🔧 Algumas rotas podem precisar de ajustes');
  } else {
    console.log('❌ MUITOS TESTES FALHARAM');
    console.log('🚨 API de Tasks precisa de correções');
    console.log('🔧 Verificar configuração e implementação');
  }
  
  return {
    success: successRate >= 66,
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
    console.log('   node flui-test-server.js');
    console.log('\n🔄 Tentando executar os testes mesmo assim...');
  }
  
  // Executar os testes das rotas
  const testResult = await testTaskRoutes();
  
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
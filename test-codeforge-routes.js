#!/usr/bin/env node

const axios = require('axios');

console.log('🎯 TESTE DAS 3 ROTAS PRINCIPAIS DO CODEFORGE API');
console.log('=================================================');

// Configuração da API
const API_BASE_URL = 'http://localhost:5001';
const CODEFORGE_API_URL = `${API_BASE_URL}/v1/code-forge`;

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

async function testCodeForgeRoutes() {
  console.log('\n🚀 INICIANDO TESTES DAS ROTAS DO CODEFORGE');
  console.log('===========================================');
  
  const testResults = {
    route1: { name: 'POST /process-input - Processar Input', success: false, data: null },
    route2: { name: 'POST /process-answers - Processar Respostas', success: false, data: null },
    route3: { name: 'POST /create-project - Criar Projeto', success: false, data: null }
  };
  
  let intent = null;
  let projectId = null;
  
  // TESTE 1: POST /process-input - Processar input do usuário
  console.log('\n📋 TESTE 1: POST /process-input - Processar Input');
  console.log('------------------------------------------------');
  
  const processInputData = {
    input: 'Crie uma landing page moderna para uma empresa de tecnologia com HTML, CSS e JavaScript',
    userId: 'test-user-123'
  };
  
  console.log('📝 Dados enviados:', JSON.stringify(processInputData, null, 2));
  
  const processInputResult = await makeRequest('POST', `${CODEFORGE_API_URL}/process-input`, processInputData);
  
  if (processInputResult.success) {
    console.log('✅ SUCESSO - Input processado!');
    console.log('📊 Status HTTP:', processInputResult.status);
    console.log('📋 Resposta:', JSON.stringify(processInputResult.data, null, 2));
    
    // Extrair intent da resposta
    if (processInputResult.data && processInputResult.data.data && processInputResult.data.data.intent) {
      intent = processInputResult.data.data.intent;
      console.log('🎯 Intent extraído:', JSON.stringify(intent, null, 2));
    }
    
    testResults.route1.success = true;
    testResults.route1.data = processInputResult.data;
  } else {
    console.log('❌ FALHA - Erro ao processar input');
    console.log('📊 Status HTTP:', processInputResult.status);
    console.log('❌ Erro:', JSON.stringify(processInputResult.error, null, 2));
    testResults.route1.data = processInputResult.error;
  }
  
  // Aguardar um pouco antes do próximo teste
  await sleep(1000);
  
  // TESTE 2: POST /process-answers - Processar respostas do usuário
  console.log('\n📝 TESTE 2: POST /process-answers - Processar Respostas');
  console.log('------------------------------------------------------');
  
  const processAnswersData = {
    answers: {
      'tech-1': 'React',
      'lang-2': 'TypeScript',
      'purpose-3': 'Landing page para empresa de tecnologia',
      'complexity-4': 'medium',
      'features-5': ['authentication', 'routing', 'styling']
    },
    userId: 'test-user-123'
  };
  
  console.log('📝 Dados enviados:', JSON.stringify(processAnswersData, null, 2));
  
  const processAnswersResult = await makeRequest('POST', `${CODEFORGE_API_URL}/process-answers`, processAnswersData);
  
  if (processAnswersResult.success) {
    console.log('✅ SUCESSO - Respostas processadas!');
    console.log('📊 Status HTTP:', processAnswersResult.status);
    console.log('📋 Resposta:', JSON.stringify(processAnswersResult.data, null, 2));
    
    // Atualizar intent com as respostas processadas
    if (processAnswersResult.data && processAnswersResult.data.data && processAnswersResult.data.data.intent) {
      intent = processAnswersResult.data.data.intent;
      console.log('🎯 Intent atualizado:', JSON.stringify(intent, null, 2));
    }
    
    testResults.route2.success = true;
    testResults.route2.data = processAnswersResult.data;
  } else {
    console.log('❌ FALHA - Erro ao processar respostas');
    console.log('📊 Status HTTP:', processAnswersResult.status);
    console.log('❌ Erro:', JSON.stringify(processAnswersResult.error, null, 2));
    testResults.route2.data = processAnswersResult.error;
  }
  
  // Aguardar um pouco antes do próximo teste
  await sleep(1000);
  
  // TESTE 3: POST /create-project - Criar projeto
  console.log('\n🚀 TESTE 3: POST /create-project - Criar Projeto');
  console.log('------------------------------------------------');
  
  if (intent) {
    const createProjectData = {
      intent: intent,
      userId: 'test-user-123'
    };
    
    console.log('📝 Dados enviados:', JSON.stringify(createProjectData, null, 2));
    
    const createProjectResult = await makeRequest('POST', `${CODEFORGE_API_URL}/create-project`, createProjectData);
    
    if (createProjectResult.success) {
      console.log('✅ SUCESSO - Projeto criado!');
      console.log('📊 Status HTTP:', createProjectResult.status);
      console.log('📋 Resposta:', JSON.stringify(createProjectResult.data, null, 2));
      
      // Extrair project ID da resposta
      if (createProjectResult.data && createProjectResult.data.data && createProjectResult.data.data.projectId) {
        projectId = createProjectResult.data.data.projectId;
        console.log('🆔 Project ID extraído:', projectId);
      }
      
      testResults.route3.success = true;
      testResults.route3.data = createProjectResult.data;
    } else {
      console.log('❌ FALHA - Erro ao criar projeto');
      console.log('📊 Status HTTP:', createProjectResult.status);
      console.log('❌ Erro:', JSON.stringify(createProjectResult.error, null, 2));
      testResults.route3.data = createProjectResult.error;
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Intent não disponível');
    testResults.route3.data = { error: 'Intent not available' };
  }
  
  // TESTE BONUS: GET /project-status - Verificar status do projeto
  console.log('\n📊 TESTE BONUS: GET /project-status - Status do Projeto');
  console.log('-------------------------------------------------------');
  
  if (projectId) {
    const statusUrl = `${CODEFORGE_API_URL}/project-status/test-user-123/${projectId}`;
    console.log('🔗 URL:', statusUrl);
    
    const statusResult = await makeRequest('GET', statusUrl);
    
    if (statusResult.success) {
      console.log('✅ SUCESSO - Status do projeto obtido!');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('📋 Resposta:', JSON.stringify(statusResult.data, null, 2));
    } else {
      console.log('❌ FALHA - Erro ao obter status do projeto');
      console.log('📊 Status HTTP:', statusResult.status);
      console.log('❌ Erro:', JSON.stringify(statusResult.error, null, 2));
    }
  } else {
    console.log('⚠️ PULANDO TESTE - Project ID não disponível');
  }
  
  // TESTE BONUS: GET /conversation-context - Contexto da conversa
  console.log('\n💬 TESTE BONUS: GET /conversation-context - Contexto da Conversa');
  console.log('----------------------------------------------------------------');
  
  const contextUrl = `${CODEFORGE_API_URL}/conversation-context/test-user-123`;
  console.log('🔗 URL:', contextUrl);
  
  const contextResult = await makeRequest('GET', contextUrl);
  
  if (contextResult.success) {
    console.log('✅ SUCESSO - Contexto da conversa obtido!');
    console.log('📊 Status HTTP:', contextResult.status);
    console.log('📋 Resposta:', JSON.stringify(contextResult.data, null, 2));
  } else {
    console.log('❌ FALHA - Erro ao obter contexto da conversa');
    console.log('📊 Status HTTP:', contextResult.status);
    console.log('❌ Erro:', JSON.stringify(contextResult.error, null, 2));
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
    console.log('✅ API CodeForge está funcionando perfeitamente');
    console.log('✅ Todas as 3 rotas principais estão operacionais');
    console.log('✅ Fluxo completo: Input → Answers → Project Creation');
  } else if (successRate >= 66) {
    console.log('⚠️ MAIORIA DOS TESTES PASSOU');
    console.log('✅ API CodeForge está parcialmente funcional');
    console.log('🔧 Algumas rotas podem precisar de ajustes');
  } else {
    console.log('❌ MUITOS TESTES FALHARAM');
    console.log('🚨 API CodeForge precisa de correções');
    console.log('🔧 Verificar configuração e implementação');
  }
  
  return {
    success: successRate >= 66,
    successRate,
    results: testResults,
    intent,
    projectId
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
  console.log('🚀 INICIANDO TESTE COMPLETO DA API CODEFORGE');
  console.log('============================================');
  
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
  const testResult = await testCodeForgeRoutes();
  
  console.log('\n🏁 TESTE CONCLUÍDO!');
  console.log('===================');
  
  if (testResult.success) {
    console.log('🎉 API CodeForge está funcionando!');
    process.exit(0);
  } else {
    console.log('⚠️ API CodeForge precisa de atenção');
    process.exit(1);
  }
}

// Executar o teste
main().catch(error => {
  console.error('\n❌ ERRO CRÍTICO durante o teste:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
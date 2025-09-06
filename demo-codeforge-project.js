#!/usr/bin/env node

const axios = require('axios');

console.log('🎯 DEMONSTRAÇÃO - CRIANDO PROJETO COM CODEFORGE');
console.log('===============================================');

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

async function createCodeForgeProject() {
  console.log('\n🚀 CRIANDO PROJETO COM CODEFORGE');
  console.log('=================================');
  
  // PASSO 1: Processar Input
  console.log('\n📝 PASSO 1: Processando Input do Usuário');
  console.log('----------------------------------------');
  
  const processInputData = {
    input: 'Crie uma aplicação web completa com React, TypeScript, Tailwind CSS, Node.js, Express e MongoDB para um sistema de gerenciamento de tarefas (todo app)',
    userId: 'demo-user-123'
  };
  
  console.log('📋 Input:', processInputData.input);
  
  const processInputResult = await makeRequest('POST', `${CODEFORGE_API_URL}/process-input`, processInputData);
  
  if (processInputResult.success) {
    console.log('✅ Input processado com sucesso!');
    console.log('🎯 Intent detectado:', JSON.stringify(processInputResult.data.data.intent, null, 2));
    console.log('❓ Perguntas geradas:', processInputResult.data.data.questions.length);
    
    // Mostrar as perguntas
    console.log('\n📋 Perguntas para o usuário:');
    processInputResult.data.data.questions.forEach((q, index) => {
      console.log(`${index + 1}. ${q.text}`);
      if (q.options) {
        console.log(`   Opções: ${q.options.join(', ')}`);
      }
    });
    
    // PASSO 2: Simular respostas do usuário
    console.log('\n📝 PASSO 2: Processando Respostas do Usuário');
    console.log('--------------------------------------------');
    
    const userAnswers = {
      'tech-1': 'React',
      'lang-2': 'TypeScript',
      'purpose-3': 'Sistema de gerenciamento de tarefas (todo app)',
      'complexity-4': 'medium',
      'features-5': ['authentication', 'routing', 'styling', 'testing']
    };
    
    console.log('📋 Respostas do usuário:', JSON.stringify(userAnswers, null, 2));
    
    const processAnswersData = {
      answers: userAnswers,
      userId: 'demo-user-123'
    };
    
    const processAnswersResult = await makeRequest('POST', `${CODEFORGE_API_URL}/process-answers`, processAnswersData);
    
    if (processAnswersResult.success) {
      console.log('✅ Respostas processadas com sucesso!');
      console.log('🎯 Intent final:', JSON.stringify(processAnswersResult.data.data.intent, null, 2));
      
      // PASSO 3: Criar projeto
      console.log('\n🚀 PASSO 3: Criando Projeto');
      console.log('----------------------------');
      
      const createProjectData = {
        intent: processAnswersResult.data.data.intent,
        userId: 'demo-user-123'
      };
      
      const createProjectResult = await makeRequest('POST', `${CODEFORGE_API_URL}/create-project`, createProjectData);
      
      if (createProjectResult.success) {
        console.log('✅ Projeto criado com sucesso!');
        console.log('🆔 Project ID:', createProjectResult.data.data.projectId);
        console.log('📊 Status:', createProjectResult.data.data.status);
        console.log('💬 Mensagem:', createProjectResult.data.data.message);
        
        const projectId = createProjectResult.data.data.projectId;
        
        // PASSO 4: Verificar status do projeto
        console.log('\n📊 PASSO 4: Verificando Status do Projeto');
        console.log('------------------------------------------');
        
        await sleep(2000); // Aguardar processamento
        
        const statusUrl = `${CODEFORGE_API_URL}/project-status/demo-user-123/${projectId}`;
        const statusResult = await makeRequest('GET', statusUrl);
        
        if (statusResult.success) {
          console.log('✅ Status do projeto obtido!');
          console.log('📊 Status:', statusResult.data.data.status);
          console.log('📈 Progresso:', statusResult.data.data.progress + '%');
          console.log('🔄 Tarefa atual:', statusResult.data.data.currentTask);
          
          if (statusResult.data.data.errors && statusResult.data.data.errors.length > 0) {
            console.log('❌ Erros:', statusResult.data.data.errors);
          }
          
          if (statusResult.data.data.warnings && statusResult.data.data.warnings.length > 0) {
            console.log('⚠️ Avisos:', statusResult.data.data.warnings);
          }
        }
        
        // PASSO 5: Obter contexto da conversa
        console.log('\n💬 PASSO 5: Contexto da Conversa');
        console.log('--------------------------------');
        
        const contextUrl = `${CODEFORGE_API_URL}/conversation-context/demo-user-123`;
        const contextResult = await makeRequest('GET', contextUrl);
        
        if (contextResult.success) {
          console.log('✅ Contexto da conversa obtido!');
          console.log('👤 User ID:', contextResult.data.data.userId);
          console.log('🆔 Session ID:', contextResult.data.data.sessionId);
          console.log('📚 Histórico:', contextResult.data.data.conversationHistory.length, 'mensagens');
          console.log('❓ Perguntas pendentes:', contextResult.data.data.pendingQuestions.length);
          console.log('🎯 Projeto atual:', contextResult.data.data.currentProject);
        }
        
        return {
          success: true,
          projectId: projectId,
          intent: processAnswersResult.data.data.intent,
          status: statusResult.data.data
        };
        
      } else {
        console.log('❌ Erro ao criar projeto');
        console.log('📊 Status HTTP:', createProjectResult.status);
        console.log('❌ Erro:', JSON.stringify(createProjectResult.error, null, 2));
        return { success: false, error: createProjectResult.error };
      }
      
    } else {
      console.log('❌ Erro ao processar respostas');
      console.log('📊 Status HTTP:', processAnswersResult.status);
      console.log('❌ Erro:', JSON.stringify(processAnswersResult.error, null, 2));
      return { success: false, error: processAnswersResult.error };
    }
    
  } else {
    console.log('❌ Erro ao processar input');
    console.log('📊 Status HTTP:', processInputResult.status);
    console.log('❌ Erro:', JSON.stringify(processInputResult.error, null, 2));
    return { success: false, error: processInputResult.error };
  }
}

// Função principal
async function main() {
  console.log('🚀 INICIANDO DEMONSTRAÇÃO DO CODEFORGE');
  console.log('======================================');
  
  const result = await createCodeForgeProject();
  
  console.log('\n🎯 RESULTADO FINAL');
  console.log('==================');
  
  if (result.success) {
    console.log('🎉 PROJETO CRIADO COM SUCESSO!');
    console.log('🆔 Project ID:', result.projectId);
    console.log('🎯 Intent:', JSON.stringify(result.intent, null, 2));
    console.log('📊 Status:', JSON.stringify(result.status, null, 2));
    
    console.log('\n📁 O projeto foi criado e está disponível em:');
    console.log(`   /workspace/api-flui/flui-projects/${result.projectId}/`);
    
  } else {
    console.log('❌ FALHA NA CRIAÇÃO DO PROJETO');
    console.log('❌ Erro:', JSON.stringify(result.error, null, 2));
  }
  
  console.log('\n🏁 DEMONSTRAÇÃO CONCLUÍDA!');
}

// Executar a demonstração
main().catch(error => {
  console.error('\n❌ ERRO CRÍTICO durante a demonstração:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
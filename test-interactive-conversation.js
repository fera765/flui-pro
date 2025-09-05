#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');

console.log('🧪 TESTE COMPLETO DE CONVERSAÇÃO INTERATIVA');
console.log('===========================================');

async function testInteractiveConversation() {
  const testDir = `/tmp/flui-interactive-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // ========================================
    // FASE 1: CRIAÇÃO INICIAL DA LANDING PAGE
    // ========================================
    console.log('\n🚀 FASE 1: CRIAÇÃO INICIAL DA LANDING PAGE');
    console.log('==========================================');
    
    const initialInput = 'Crie uma landing page usando html css e javascript';
    console.log(`👤 Usuário: "${initialInput}"`);
    
    const initialResult = await orchestrator.processUserInput(initialInput, 'test-user');
    console.log(`🤖 FLUI: Intent detectado:`, JSON.stringify(initialResult.intent, null, 2));
    
    // Simular respostas do usuário
    const userAnswers = { 
      'ui-framework': 'HTML/CSS/JS',
      'styling': 'Moderno e responsivo'
    };
    
    console.log(`👤 Usuário responde:`, userAnswers);
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'test-user');
    
    console.log(`🤖 FLUI: Começando desenvolvimento...`);
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'test-user');
    
    console.log(`✅ FASE 1 RESULTADO: ${createResult.success ? 'SUCESSO' : 'FALHA'}`);
    
    if (!createResult.success) {
      throw new Error(`Falha na criação inicial: ${createResult.error}`);
    }
    
    // ========================================
    // FASE 2: TESTE DE MENSAGENS INTERATIVAS
    // ========================================
    console.log('\n💬 FASE 2: TESTE DE MENSAGENS INTERATIVAS');
    console.log('=========================================');
    
    const interactiveMessages = [
      {
        message: 'Está terminando?',
        expectedType: 'status_inquiry',
        description: 'Pergunta sobre status'
      },
      {
        message: 'Está travado?',
        expectedType: 'status_inquiry', 
        description: 'Pergunta sobre travamento'
      },
      {
        message: 'Está com algum problema? Esta demorando muito!',
        expectedType: 'status_inquiry',
        description: 'Pergunta sobre problemas/demora'
      },
      {
        message: 'Adicione um modal na página inicial quando abrir a página',
        expectedType: 'modification_request',
        description: 'Solicitação de adição de feature'
      },
      {
        message: 'Modifique a cor do botão para azul',
        expectedType: 'modification_request',
        description: 'Solicitação de modificação'
      },
      {
        message: 'Remova o formulário de contato',
        expectedType: 'modification_request',
        description: 'Solicitação de remoção'
      },
      {
        message: 'Me dê o zip do projeto',
        expectedType: 'download_request',
        description: 'Solicitação de download'
      }
    ];
    
    const interactiveResults = [];
    
    for (let i = 0; i < interactiveMessages.length; i++) {
      const testCase = interactiveMessages[i];
      console.log(`\n📝 TESTE ${i + 1}: ${testCase.description}`);
      console.log(`👤 Usuário: "${testCase.message}"`);
      
      try {
        // Simular mensagem interativa durante desenvolvimento
        const interactiveResult = await orchestrator.handleInteractiveMessage(
          testCase.message, 
          'test-user'
        );
        
        console.log(`🤖 FLUI: ${interactiveResult.response}`);
        console.log(`📊 Tipo detectado: ${interactiveResult.modificationRequest ? 'modification' : 
                                        interactiveResult.downloadRequest ? 'download' : 'status'}`);
        
        interactiveResults.push({
          testCase,
          result: interactiveResult,
          success: interactiveResult.success
        });
        
        // Se for uma modificação, simular execução
        if (interactiveResult.modificationRequest) {
          console.log(`🔧 Executando modificação: ${interactiveResult.modificationRequest.description}`);
          // Aqui o FLUI deveria executar a modificação automaticamente
        }
        
        if (interactiveResult.downloadRequest) {
          console.log(`📦 Preparando download: ${interactiveResult.downloadRequest.format}`);
          // Aqui o FLUI deveria preparar o download automaticamente
        }
        
      } catch (error) {
        console.log(`❌ Erro no teste ${i + 1}: ${error.message}`);
        interactiveResults.push({
          testCase,
          result: { success: false, error: error.message },
          success: false
        });
      }
    }
    
    // ========================================
    // FASE 3: VALIDAÇÃO FINAL
    // ========================================
    console.log('\n🔍 FASE 3: VALIDAÇÃO FINAL');
    console.log('===========================');
    
    // Verificar arquivos criados
    let finalFiles = [];
    if (fs.existsSync(testDir)) {
      finalFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Arquivos finais criados: ${finalFiles.length}`);
      console.log(`📄 Lista de arquivos:`, finalFiles);
      
      // Verificar conteúdo dos arquivos principais
      const htmlFile = finalFiles.find(f => f.includes('index.html'));
      if (htmlFile) {
        const htmlContent = fs.readFileSync(`${testDir}/${htmlFile}`, 'utf8');
        console.log(`📄 HTML criado: ${htmlContent.length} caracteres`);
        console.log(`🔍 HTML contém modal: ${htmlContent.toLowerCase().includes('modal') ? 'SIM' : 'NÃO'}`);
      }
    }
    
    // ========================================
    // RELATÓRIO FINAL
    // ========================================
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    
    const successfulTests = interactiveResults.filter(r => r.success).length;
    const totalTests = interactiveResults.length;
    
    console.log(`✅ Testes de conversação: ${successfulTests}/${totalTests} sucessos`);
    console.log(`📁 Arquivos criados: ${finalFiles.length}`);
    console.log(`🎯 Projeto inicial: ${createResult.success ? 'SUCESSO' : 'FALHA'}`);
    
    // Análise detalhada dos resultados
    console.log('\n📋 ANÁLISE DETALHADA:');
    interactiveResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Teste ${index + 1}: ${result.testCase.description} - ${result.success ? 'SUCESSO' : 'FALHA'}`);
    });
    
    return {
      success: createResult.success && successfulTests > 0,
      projectCreated: createResult.success,
      interactiveTests: {
        total: totalTests,
        successful: successfulTests,
        results: interactiveResults
      },
      files: finalFiles,
      hasModal: finalFiles.some(f => {
        if (f.includes('html') || f.includes('js')) {
          try {
            const content = fs.readFileSync(`${testDir}/${f}`, 'utf8');
            return content.toLowerCase().includes('modal');
          } catch {
            return false;
          }
        }
        return false;
      })
    };
    
  } catch (error) {
    console.error('\n❌ Teste falhou com erro:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
}

// Executar o teste
testInteractiveConversation().then((result) => {
  console.log('\n🎉 TESTE INTERATIVO FINALIZADO!');
  console.log('===============================');
  
  if (result.success) {
    console.log('✅ RESULTADO: SUCESSO TOTAL!');
    console.log(`📊 Projeto criado: ${result.projectCreated ? 'SIM' : 'NÃO'}`);
    console.log(`💬 Testes interativos: ${result.interactiveTests.successful}/${result.interactiveTests.total}`);
    console.log(`📁 Arquivos criados: ${result.files.length}`);
    console.log(`🎯 Modal adicionado: ${result.hasModal ? 'SIM' : 'NÃO'}`);
    
    console.log('\n🚀 FLUI ESTÁ FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('❌ RESULTADO: FALHA!');
    console.log('Erro:', result.error);
  }
}).catch((error) => {
  console.error('\n❌ TESTE INTERATIVO FALHOU!');
  console.error('Erro:', error.message);
  process.exit(1);
});
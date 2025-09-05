#!/usr/bin/env node

const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const fs = require('fs');

console.log('🔧 TESTE DE CORREÇÃO DAS MODIFICAÇÕES');
console.log('=====================================');

async function testModificationFix() {
  const testDir = `/tmp/flui-modification-test-${Date.now()}`;
  console.log(`📁 Test Directory: ${testDir}`);
  
  try {
    const orchestrator = new CodeForgeOrchestrator(testDir);
    
    // ========================================
    // FASE 1: CRIAÇÃO INICIAL
    // ========================================
    console.log('\n🚀 FASE 1: CRIAÇÃO INICIAL DA LANDING PAGE');
    console.log('==========================================');
    
    const initialInput = 'Crie uma landing page usando html css e javascript';
    console.log(`👤 Usuário: "${initialInput}"`);
    
    const initialResult = await orchestrator.processUserInput(initialInput, 'test-user');
    console.log(`✅ Intent detectado: ${initialResult.intent.domain} - ${initialResult.intent.technology}`);
    
    const userAnswers = { 'ui-framework': 'HTML/CSS/JS' };
    const answersResult = await orchestrator.handleUserAnswers(userAnswers, 'test-user');
    const createResult = await orchestrator.executeProjectCreation(answersResult.intent, 'test-user');
    
    console.log(`✅ Projeto criado: ${createResult.success ? 'SUCESSO' : 'FALHA'}`);
    
    if (!createResult.success) {
      throw new Error(`Falha na criação: ${createResult.error}`);
    }
    
    // Verificar arquivos iniciais
    let initialFiles = [];
    if (fs.existsSync(testDir)) {
      initialFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Arquivos iniciais: ${initialFiles.length}`);
    }
    
    // ========================================
    // FASE 2: TESTE DE MODIFICAÇÃO - MODAL
    // ========================================
    console.log('\n🔧 FASE 2: TESTE DE ADIÇÃO DE MODAL');
    console.log('===================================');
    
    const modalMessage = 'Adicione um modal na página inicial quando abrir a página';
    console.log(`👤 Usuário: "${modalMessage}"`);
    
    const modalResult = await orchestrator.handleInteractiveMessage(modalMessage, 'test-user');
    console.log(`🤖 FLUI: ${modalResult.response}`);
    
    // Verificar se arquivos foram criados
    let afterModalFiles = [];
    if (fs.existsSync(testDir)) {
      afterModalFiles = fs.readdirSync(testDir, { recursive: true });
      console.log(`📁 Arquivos após modal: ${afterModalFiles.length}`);
      console.log(`📄 Novos arquivos:`, afterModalFiles.filter(f => !initialFiles.includes(f)));
    }
    
    // Verificar se modal foi adicionado ao HTML
    const htmlFile = afterModalFiles.find(f => f.includes('index.html'));
    let hasModal = false;
    if (htmlFile) {
      const htmlContent = fs.readFileSync(`${testDir}/${htmlFile}`, 'utf8');
      hasModal = htmlContent.toLowerCase().includes('modal');
      console.log(`🔍 HTML contém modal: ${hasModal ? 'SIM' : 'NÃO'}`);
    }
    
    // ========================================
    // FASE 3: TESTE DE MODIFICAÇÃO - COR DO BOTÃO
    // ========================================
    console.log('\n🎨 FASE 3: TESTE DE MODIFICAÇÃO DE COR');
    console.log('======================================');
    
    const colorMessage = 'Modifique a cor do botão para azul';
    console.log(`👤 Usuário: "${colorMessage}"`);
    
    const colorResult = await orchestrator.handleInteractiveMessage(colorMessage, 'test-user');
    console.log(`🤖 FLUI: ${colorResult.response}`);
    
    // Verificar se CSS foi modificado
    const cssFile = afterModalFiles.find(f => f.includes('style.css'));
    let hasBlueButton = false;
    if (cssFile) {
      const cssContent = fs.readFileSync(`${testDir}/${cssFile}`, 'utf8');
      hasBlueButton = cssContent.includes('#007bff') || cssContent.includes('blue');
      console.log(`🔍 CSS contém botão azul: ${hasBlueButton ? 'SIM' : 'NÃO'}`);
    }
    
    // ========================================
    // FASE 4: TESTE DE REMOÇÃO
    // ========================================
    console.log('\n🗑️ FASE 4: TESTE DE REMOÇÃO');
    console.log('===========================');
    
    const removeMessage = 'Remova o formulário de contato';
    console.log(`👤 Usuário: "${removeMessage}"`);
    
    const removeResult = await orchestrator.handleInteractiveMessage(removeMessage, 'test-user');
    console.log(`🤖 FLUI: ${removeResult.response}`);
    
    // ========================================
    // RELATÓRIO FINAL
    // ========================================
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    
    let finalFiles = [];
    if (fs.existsSync(testDir)) {
      finalFiles = fs.readdirSync(testDir, { recursive: true });
    }
    
    console.log(`✅ Projeto inicial: ${createResult.success ? 'SUCESSO' : 'FALHA'}`);
    console.log(`✅ Modal adicionado: ${hasModal ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Botão azul: ${hasBlueButton ? 'SIM' : 'NÃO'}`);
    console.log(`📁 Arquivos finais: ${finalFiles.length}`);
    console.log(`📄 Lista de arquivos:`, finalFiles);
    
    // Análise detalhada
    console.log('\n🔍 ANÁLISE DETALHADA:');
    console.log(`📊 Arquivos iniciais: ${initialFiles.length}`);
    console.log(`📊 Arquivos após modal: ${afterModalFiles.length}`);
    console.log(`📊 Arquivos finais: ${finalFiles.length}`);
    
    const newFiles = afterModalFiles.filter(f => !initialFiles.includes(f));
    console.log(`📄 Novos arquivos criados:`, newFiles);
    
    return {
      success: createResult.success && hasModal && hasBlueButton,
      projectCreated: createResult.success,
      modalAdded: hasModal,
      blueButton: hasBlueButton,
      files: {
        initial: initialFiles.length,
        afterModal: afterModalFiles.length,
        final: finalFiles.length,
        newFiles: newFiles
      }
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
testModificationFix().then((result) => {
  console.log('\n🎉 TESTE DE MODIFICAÇÃO FINALIZADO!');
  console.log('===================================');
  
  if (result.success) {
    console.log('✅ RESULTADO: SUCESSO TOTAL!');
    console.log(`📊 Projeto criado: ${result.projectCreated ? 'SIM' : 'NÃO'}`);
    console.log(`🎯 Modal adicionado: ${result.modalAdded ? 'SIM' : 'NÃO'}`);
    console.log(`🎨 Botão azul: ${result.blueButton ? 'SIM' : 'NÃO'}`);
    console.log(`📁 Arquivos: ${result.files.initial} → ${result.files.afterModal} → ${result.files.final}`);
    console.log(`📄 Novos arquivos: ${result.files.newFiles.length}`);
    
    console.log('\n🚀 CORREÇÃO DAS MODIFICAÇÕES: SUCESSO!');
  } else {
    console.log('❌ RESULTADO: FALHA!');
    console.log('Erro:', result.error);
  }
}).catch((error) => {
  console.error('\n❌ TESTE DE MODIFICAÇÃO FALHOU!');
  console.error('Erro:', error.message);
  process.exit(1);
});
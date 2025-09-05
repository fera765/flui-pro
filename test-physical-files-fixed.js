const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock Pollinations API for dynamic responses
const mockPollinationsAPI = {
  async post(url, data) {
    console.log(`🌐 Mock API Call: ${url}`);
    
    if (url.includes('/chat/completions')) {
      const { messages } = data;
      const lastMessage = messages[messages.length - 1];
      const content = lastMessage.content;
      
      // Generate dynamic responses based on context
      let response;
      
      if (content.includes('tarefa é criada')) {
        response = `🎉 Tarefa criada com sucesso! ID: ${Math.random().toString(36).substr(2, 9)} - Iniciando processo de desenvolvimento autônomo...`;
      } else if (content.includes('tarefa inicia execução')) {
        response = `🚀 Execução iniciada! Sistema autônomo ativado - Analisando requisitos e preparando ambiente de desenvolvimento...`;
      } else if (content.includes('agente especializado')) {
        response = `🤖 Agente especializado ativado! Executando análise inteligente e geração de código dinâmico...`;
      } else if (content.includes('progresso atual')) {
        response = `📊 Progresso atual: ${Math.floor(Math.random() * 100)}% - Executando etapa de desenvolvimento com inteligência artificial...`;
      } else if (content.includes('agente finalizou')) {
        response = `🎯 Agente finalizou com sucesso! Processo de desenvolvimento autônomo concluído com precisão...`;
      } else if (content.includes('testes automatizados')) {
        response = `🧪 Executando bateria de testes automatizados! Validando qualidade e funcionalidade do projeto...`;
      } else if (content.includes('relatório detalhado')) {
        response = `📊 Relatório detalhado gerado! Documentação completa criada com análise profunda dos resultados...`;
      } else if (content.includes('ferramenta finalizada')) {
        response = `⚡ Ferramenta finalizada! Operação concluída com resultados otimizados e qualidade garantida...`;
      } else if (content.includes('testes aprovados')) {
        response = `✅ Testes aprovados! Validação completa realizada - Projeto certificado e pronto para produção...`;
      } else if (content.includes('ferramenta especializada')) {
        response = `🔧 Ferramenta especializada em ação! Executando operações de desenvolvimento com máxima eficiência...`;
      } else if (content.includes('tarefa concluída')) {
        response = `✅ Tarefa concluída com excelência! Projeto finalizado e testado automaticamente - Pronto para entrega!`;
      } else if (content.includes('extrair intenção')) {
        // Return a valid intent for HTML/CSS/JS projects
        response = '{"domain":"frontend","technology":"html","language":"javascript","framework":"vanilla","purpose":"landing-page","complexity":"medium","features":["responsive","modern","interactive"],"requirements":["healthcare","sales","professional"]}';
      } else if (content.includes('gerar perguntas')) {
        response = '[]'; // No questions needed
      } else if (content.includes('arquitetura da solução')) {
        response = '{"buildTool":"none","packageManager":"none","dependencies":[],"scripts":{},"projectStructure":{"":["index.html","style.css","script.js"]}}';
      } else if (content.includes('tarefas dinâmicas')) {
        response = '[{"id":"task-1","type":"file_write","description":"Criar arquivo HTML principal","parameters":{"filePath":"index.html","content":"<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Plano de Saúde</title>\\n    <link rel=\\"stylesheet\\" href=\\"style.css\\">\\n</head>\\n<body>\\n    <h1>Planos de Saúde</h1>\\n    <script src=\\"script.js\\"></script>\\n</body>\\n</html>"},"projectPhase":"implementation","priority":"high","estimatedTime":5},{"id":"task-2","type":"file_write","description":"Criar arquivo CSS","parameters":{"filePath":"style.css","content":"body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; } h1 { color: #333; text-align: center; }"},"projectPhase":"implementation","priority":"medium","estimatedTime":3},{"id":"task-3","type":"file_write","description":"Criar arquivo JavaScript","parameters":{"filePath":"script.js","content":"console.log(\\"Landing page carregada!\\");"},"projectPhase":"implementation","priority":"medium","estimatedTime":2}]';
      } else {
        response = `🔄 Processo dinâmico em execução! Sistema autônomo trabalhando com inteligência artificial avançada...`;
      }
      
      return {
        data: {
          choices: [{
            message: {
              content: response
            }
          }]
        }
      };
    }
    
    return {
      data: {
        choices: [{
          message: {
            content: '{"domain":"general","technology":"mixed","language":"mixed","framework":"none","purpose":"general","complexity":"medium","features":["flexible","adaptive","dynamic"],"requirements":["user-friendly","efficient","reliable"]}'
          }
        }]
      }
    };
  }
};

// Override axios for mock
axios.post = mockPollinationsAPI.post.bind(mockPollinationsAPI);

async function testPhysicalFiles() {
  console.log('🎯 TESTE DE ARQUIVOS FÍSICOS - VERIFICAÇÃO CRÍTICA');
  console.log('=' .repeat(80));
  
  const orchestrator = new CodeForgeOrchestrator('/tmp/flui-physical-test');
  
  // Test: Landing Page HTML/CSS/JS
  console.log('\n🎯 TESTE: LANDING PAGE HTML/CSS/JAVASCRIPT');
  console.log('-' .repeat(60));
  
  const result = await orchestrator.processUserInput(
    'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript',
    'user-physical-test'
  );
  
  console.log(`✅ Processamento: ${result.intent ? 'SUCESSO' : 'FALHA'}`);
  if (result.intent) {
    console.log(`📋 Intent: ${result.intent.domain}`);
    console.log(`🔧 Technology: ${result.intent.technology}`);
  }
  
  // Check for physical files
  console.log('\n🔍 VERIFICAÇÃO DE ARQUIVOS FÍSICOS:');
  console.log('-' .repeat(50));
  
  const taskDir = `/tmp/flui-physical-test/tasks`;
  console.log(`📁 Diretório das tarefas: ${taskDir}`);
    
  try {
    if (fs.existsSync(taskDir)) {
      const files = fs.readdirSync(taskDir);
      console.log(`📄 Arquivos encontrados: ${files.length}`);
      
      files.forEach(file => {
        const filePath = path.join(taskDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  📁 ${file} (${stats.isDirectory() ? 'diretório' : 'arquivo'})`);
        
        if (stats.isDirectory()) {
          const projectDir = path.join(filePath, 'project');
          if (fs.existsSync(projectDir)) {
            const projectFiles = fs.readdirSync(projectDir);
            console.log(`    📄 Projeto: ${projectFiles.length} arquivos`);
            projectFiles.forEach(projectFile => {
              console.log(`      📄 ${projectFile}`);
            });
          } else {
            console.log(`    ❌ Pasta project não encontrada`);
          }
        }
      });
    } else {
      console.log('❌ Diretório de tarefas não encontrado');
    }
  } catch (error) {
    console.log(`\n❌ ERRO: ${error.message}`);
  }
  
  console.log('\n🏁 TESTE DE ARQUIVOS FÍSICOS CONCLUÍDO!');
}

// Run the test
testPhysicalFiles().catch(error => {
  console.error('❌ Erro durante o teste de arquivos físicos:', error);
  process.exit(1);
});
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
      } else if (content.includes('progresso da tarefa')) {
        response = `📊 Progresso atual: ${Math.floor(Math.random() * 100)}% - Executando etapa de desenvolvimento com inteligência artificial...`;
      } else if (content.includes('tarefa é completada')) {
        response = `✅ Tarefa concluída com excelência! Projeto finalizado e testado automaticamente - Pronto para entrega!`;
      } else if (content.includes('agente inicia execução')) {
        response = `🤖 Agente especializado ativado! Executando análise inteligente e geração de código dinâmico...`;
      } else if (content.includes('agente completa execução')) {
        response = `🎯 Agente finalizou com sucesso! Processo de desenvolvimento autônomo concluído com precisão...`;
      } else if (content.includes('ferramenta inicia execução')) {
        response = `🔧 Ferramenta especializada em ação! Executando operações de desenvolvimento com máxima eficiência...`;
      } else if (content.includes('ferramenta completa execução')) {
        response = `⚡ Ferramenta finalizada! Operação concluída com resultados otimizados e qualidade garantida...`;
      } else if (content.includes('teste inicia')) {
        response = `🧪 Executando bateria de testes automatizados! Validando qualidade e funcionalidade do projeto...`;
      } else if (content.includes('teste é completado')) {
        response = `✅ Testes aprovados! Validação completa realizada - Projeto certificado e pronto para produção...`;
      } else if (content.includes('relatório é gerado')) {
        response = `📊 Relatório detalhado gerado! Documentação completa criada com análise profunda dos resultados...`;
      } else if (content.includes('interação é recebida')) {
        response = `💬 Interação processada! Sistema inteligente analisando solicitação e preparando resposta personalizada...`;
      } else if (content.includes('interação é processada')) {
        response = `🎯 Interação finalizada! Resposta inteligente gerada com base no contexto e necessidades específicas...`;
      } else if (content.includes('intenção do usuário')) {
        // Dynamic intent detection
        if (content.includes('landing page') || content.includes('html') || content.includes('css') || content.includes('javascript')) {
          response = '{"domain":"frontend","technology":"html","language":"javascript","framework":"vanilla","purpose":"landing page","complexity":"simple","features":["responsive","modern","interactive"],"requirements":["mobile-friendly","fast-loading","seo-optimized"]}';
        } else if (content.includes('api') || content.includes('backend') || content.includes('nodejs')) {
          response = '{"domain":"backend","technology":"nodejs","language":"javascript","framework":"express","purpose":"api","complexity":"medium","features":["rest-api","authentication","database"],"requirements":["scalable","secure","documented"]}';
        } else if (content.includes('roteiro') || content.includes('video') || content.includes('youtube')) {
          response = '{"domain":"content","technology":"markdown","language":"markdown","framework":"none","purpose":"script","complexity":"simple","features":["engaging","viral","structured"],"requirements":["1-minute","youtube-optimized","hook-driven"]}';
        } else {
          response = '{"domain":"general","technology":"mixed","language":"mixed","framework":"none","purpose":"general","complexity":"medium","features":["flexible","adaptive","dynamic"],"requirements":["user-friendly","efficient","reliable"]}';
        }
      } else if (content.includes('perguntas para esclarecer')) {
        response = '["Qual é o público-alvo do projeto?","Há alguma preferência de tecnologia específica?","Qual o prazo estimado para entrega?","Existem requisitos de design específicos?","Há integrações necessárias?"]';
      } else if (content.includes('arquitetura da solução')) {
        response = '{"buildTool":"npm","packageManager":"npm","dependencies":["express","cors","helmet"],"scripts":{"start":"node server.js","dev":"nodemon server.js","test":"jest"},"projectStructure":{"src/":["server.js","routes/","models/"],"public/":["index.html","css/","js/"],"tests/":["unit/","integration/"]}}';
      } else if (content.includes('tarefas dinâmicas')) {
        response = '[{"id":"task-1","type":"file_write","description":"Criar arquivo principal do projeto","parameters":{"filePath":"index.html","content":"<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Projeto Dinâmico</title>\\n</head>\\n<body>\\n    <h1>Projeto Criado Dinamicamente</h1>\\n</body>\\n</html>"},"projectPhase":"implementation","priority":"high","estimatedTime":5},{"id":"task-2","type":"file_write","description":"Criar arquivo de estilos","parameters":{"filePath":"style.css","content":"body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; } h1 { color: #333; text-align: center; }"},"projectPhase":"implementation","priority":"medium","estimatedTime":3},{"id":"task-3","type":"shell","description":"Executar comando de teste","parameters":{"command":"echo \\"Projeto testado com sucesso\\"","workingDirectory":"./"},"projectPhase":"testing","priority":"high","estimatedTime":2}]';
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
          console.log(`   - ${file}`);
        });
        
        if (files.length > 0) {
          console.log('\n✅ SUCESSO: Arquivos físicos criados!');
        } else {
          console.log('\n❌ FALHA: Diretório vazio - arquivos não foram criados');
        }
      } else {
        console.log('\n❌ FALHA: Diretório do projeto não existe');
      }
    } catch (error) {
      console.log(`\n❌ ERRO: ${error.message}`);
    }
  }
  
  console.log('\n🏁 TESTE DE ARQUIVOS FÍSICOS CONCLUÍDO!');
}

// Run the test
testPhysicalFiles().catch(error => {
  console.error('❌ Erro durante o teste de arquivos físicos:', error);
  process.exit(1);
});
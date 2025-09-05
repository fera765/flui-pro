const { CodeForgeOrchestrator } = require('./api-flui/dist/core/codeForgeOrchestrator');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Detailed logging system
class DetailedLogger {
  constructor() {
    this.logs = [];
    this.callbacks = [];
    this.agents = [];
    this.tools = [];
    this.startTime = Date.now();
  }

  log(level, category, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data,
      elapsed: Date.now() - this.startTime
    };
    
    this.logs.push(logEntry);
    console.log(`[${timestamp}] ${level.toUpperCase()} [${category}] ${message}`);
    
    if (data && Object.keys(data).length > 0) {
      console.log(`  📊 Data:`, JSON.stringify(data, null, 2));
    }
  }

  trackCallback(eventName, data) {
    this.callbacks.push({
      timestamp: new Date().toISOString(),
      event: eventName,
      data,
      elapsed: Date.now() - this.startTime
    });
    this.log('INFO', 'CALLBACK', `Event: ${eventName}`, data);
  }

  trackAgent(agentName, action, data) {
    this.agents.push({
      timestamp: new Date().toISOString(),
      agent: agentName,
      action,
      data,
      elapsed: Date.now() - this.startTime
    });
    this.log('INFO', 'AGENT', `${agentName}: ${action}`, data);
  }

  trackTool(toolName, action, data) {
    this.tools.push({
      timestamp: new Date().toISOString(),
      tool: toolName,
      action,
      data,
      elapsed: Date.now() - this.startTime
    });
    this.log('INFO', 'TOOL', `${toolName}: ${action}`, data);
  }

  generateReport() {
    return {
      summary: {
        totalLogs: this.logs.length,
        totalCallbacks: this.callbacks.length,
        totalAgents: this.agents.length,
        totalTools: this.tools.length,
        duration: Date.now() - this.startTime
      },
      logs: this.logs,
      callbacks: this.callbacks,
      agents: this.agents,
      tools: this.tools
    };
  }
}

// Mock Pollinations API with detailed logging
const mockPollinationsAPI = {
  async post(url, data) {
    console.log(`🌐 API Call: ${url}`);
    console.log(`📝 Request:`, JSON.stringify(data, null, 2));
    
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
      } else if (content.includes('copywrite') || content.includes('conteúdo') || content.includes('script')) {
        response = {
          domain: "content",
          technology: "markdown",
          language: "portuguese",
          framework: "none",
          purpose: "marketing content",
          complexity: "simple",
          features: ["persuasive", "engaging", "conversion-focused"],
          requirements: ["viral", "1-minute", "youtube-optimized"]
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
    
    console.log(`📤 Response:`, JSON.stringify(response, null, 2));
    
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

async function analyzeDetailedLogs() {
  console.log('🔍 INICIANDO ANÁLISE DETALHADA DOS LOGS DO FLUI');
  console.log('=' .repeat(100));
  
  const logger = new DetailedLogger();
  const orchestrator = new CodeForgeOrchestrator('/tmp/flui-detailed-analysis');
  
  // Setup detailed event tracking
  const eventTracker = {
    taskCreated: 0,
    projectCreated: 0,
    modificationRequestCreated: 0,
    downloadRequestCreated: 0,
    userAnswersProcessed: 0,
    interactiveMessageHandled: 0,
    taskStart: 0,
    taskComplete: 0,
    projectCreationFailed: 0,
    modificationExecuted: 0,
    modificationFailed: 0,
    downloadExecuted: 0,
    downloadFailed: 0
  };
  
  // Track all events
  Object.keys(eventTracker).forEach(eventName => {
    orchestrator.on(eventName, (data) => {
      eventTracker[eventName]++;
      logger.trackCallback(eventName, data);
    });
  });
  
  // Test 1: Landing Page HTML - Detailed Analysis
  console.log('\n🎯 TESTE 1: LANDING PAGE HTML - ANÁLISE DETALHADA');
  console.log('=' .repeat(80));
  
  logger.log('INFO', 'TEST', 'Iniciando Teste 1: Landing Page HTML');
  
  const task1Start = Date.now();
  const task1Result = await orchestrator.createPersistentTask(
    'Landing Page HTML',
    'Criar uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript',
    'frontend',
    'user-001',
    'Crie uma landing page moderna de vendas de plano de saúde usando HTML, CSS e JavaScript'
  );
  
  logger.log('INFO', 'TASK_CREATION', `Tarefa 1 criada: ${task1Result.success ? 'SUCESSO' : 'FALHA'}`, {
    taskId: task1Result.taskId,
    success: task1Result.success,
    error: task1Result.error
  });
  
  if (task1Result.success) {
    logger.trackAgent('TaskOrchestrator', 'createPersistentTask', {
      taskId: task1Result.taskId,
      name: 'Landing Page HTML',
      type: 'frontend'
    });
    
    // Execute task with detailed tracking
    logger.log('INFO', 'TASK_EXECUTION', 'Iniciando execução da Tarefa 1');
    const execute1Result = await orchestrator.executePersistentTask(task1Result.taskId);
    
    logger.log('INFO', 'TASK_EXECUTION', `Execução 1: ${execute1Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: execute1Result.success,
      reportPath: execute1Result.reportPath,
      liveUrl: execute1Result.liveUrl,
      error: execute1Result.error
    });
    
    if (execute1Result.success) {
      logger.trackAgent('TaskOrchestrator', 'executeTask', {
        taskId: task1Result.taskId,
        reportPath: execute1Result.reportPath,
        liveUrl: execute1Result.liveUrl
      });
      
      logger.trackTool('LiveTester', 'executeTests', {
        taskId: task1Result.taskId,
        tests: ['build', 'server', 'curl']
      });
      
      logger.trackTool('MarkdownReporter', 'generateReport', {
        taskId: task1Result.taskId,
        reportPath: execute1Result.reportPath
      });
    }
    
    // Test interaction
    logger.log('INFO', 'INTERACTION', 'Testando interação com Tarefa 1');
    const interaction1Result = await orchestrator.interactWithPersistentTask(
      task1Result.taskId,
      'Como está o progresso do projeto?',
      'user-001'
    );
    
    logger.log('INFO', 'INTERACTION', `Interação 1: ${interaction1Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: interaction1Result.success,
      response: interaction1Result.response,
      error: interaction1Result.error
    });
    
    if (interaction1Result.success) {
      logger.trackAgent('TaskOrchestrator', 'interactWithTask', {
        taskId: task1Result.taskId,
        interaction: 'question',
        response: interaction1Result.response
      });
    }
  }
  
  // Test 2: API Node.js - Detailed Analysis
  console.log('\n🎯 TESTE 2: API NODE.JS - ANÁLISE DETALHADA');
  console.log('=' .repeat(80));
  
  logger.log('INFO', 'TEST', 'Iniciando Teste 2: API Node.js');
  
  const task2Start = Date.now();
  const task2Result = await orchestrator.createPersistentTask(
    'API Node.js',
    'Criar uma API REST com Node.js e Express para gerenciamento de usuários',
    'backend',
    'user-002',
    'Crie uma API REST com Node.js e Express para gerenciamento de usuários'
  );
  
  logger.log('INFO', 'TASK_CREATION', `Tarefa 2 criada: ${task2Result.success ? 'SUCESSO' : 'FALHA'}`, {
    taskId: task2Result.taskId,
    success: task2Result.success,
    error: task2Result.error
  });
  
  if (task2Result.success) {
    logger.trackAgent('TaskOrchestrator', 'createPersistentTask', {
      taskId: task2Result.taskId,
      name: 'API Node.js',
      type: 'backend'
    });
    
    // Execute task
    logger.log('INFO', 'TASK_EXECUTION', 'Iniciando execução da Tarefa 2');
    const execute2Result = await orchestrator.executePersistentTask(task2Result.taskId);
    
    logger.log('INFO', 'TASK_EXECUTION', `Execução 2: ${execute2Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: execute2Result.success,
      reportPath: execute2Result.reportPath,
      liveUrl: execute2Result.liveUrl,
      error: execute2Result.error
    });
    
    if (execute2Result.success) {
      logger.trackAgent('TaskOrchestrator', 'executeTask', {
        taskId: task2Result.taskId,
        reportPath: execute2Result.reportPath,
        liveUrl: execute2Result.liveUrl
      });
      
      logger.trackTool('LiveTester', 'executeTests', {
        taskId: task2Result.taskId,
        tests: ['build', 'server', 'curl']
      });
      
      logger.trackTool('MarkdownReporter', 'generateReport', {
        taskId: task2Result.taskId,
        reportPath: execute2Result.reportPath
      });
    }
    
    // Test modification
    logger.log('INFO', 'MODIFICATION', 'Testando modificação na Tarefa 2');
    const modification2Result = await orchestrator.interactWithPersistentTask(
      task2Result.taskId,
      'Adicionar autenticação JWT',
      'user-002'
    );
    
    logger.log('INFO', 'MODIFICATION', `Modificação 2: ${modification2Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: modification2Result.success,
      response: modification2Result.response,
      error: modification2Result.error
    });
    
    if (modification2Result.success) {
      logger.trackAgent('TaskOrchestrator', 'interactWithTask', {
        taskId: task2Result.taskId,
        interaction: 'modification',
        modification: 'Adicionar autenticação JWT',
        response: modification2Result.response
      });
    }
  }
  
  // Test 3: Conteúdo/Copywrite - Detailed Analysis
  console.log('\n🎯 TESTE 3: CONTEÚDO/COPYWRITE - ANÁLISE DETALHADA');
  console.log('=' .repeat(80));
  
  logger.log('INFO', 'TEST', 'Iniciando Teste 3: Conteúdo/Copywrite');
  
  const task3Start = Date.now();
  const task3Result = await orchestrator.createPersistentTask(
    'Conteúdo Copywrite',
    'Criar um roteiro viral para YouTube sobre marketing digital com duração de 1 minuto',
    'content',
    'user-003',
    'Criar um roteiro viral para YouTube sobre marketing digital com duração de 1 minuto'
  );
  
  logger.log('INFO', 'TASK_CREATION', `Tarefa 3 criada: ${task3Result.success ? 'SUCESSO' : 'FALHA'}`, {
    taskId: task3Result.taskId,
    success: task3Result.success,
    error: task3Result.error
  });
  
  if (task3Result.success) {
    logger.trackAgent('TaskOrchestrator', 'createPersistentTask', {
      taskId: task3Result.taskId,
      name: 'Conteúdo Copywrite',
      type: 'content'
    });
    
    // Execute task
    logger.log('INFO', 'TASK_EXECUTION', 'Iniciando execução da Tarefa 3');
    const execute3Result = await orchestrator.executePersistentTask(task3Result.taskId);
    
    logger.log('INFO', 'TASK_EXECUTION', `Execução 3: ${execute3Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: execute3Result.success,
      reportPath: execute3Result.reportPath,
      liveUrl: execute3Result.liveUrl,
      error: execute3Result.error
    });
    
    if (execute3Result.success) {
      logger.trackAgent('TaskOrchestrator', 'executeTask', {
        taskId: task3Result.taskId,
        reportPath: execute3Result.reportPath,
        liveUrl: execute3Result.liveUrl
      });
      
      logger.trackTool('LiveTester', 'executeTests', {
        taskId: task3Result.taskId,
        tests: ['build', 'server', 'curl']
      });
      
      logger.trackTool('MarkdownReporter', 'generateReport', {
        taskId: task3Result.taskId,
        reportPath: execute3Result.reportPath
      });
    }
    
    // Test download request
    logger.log('INFO', 'DOWNLOAD', 'Testando download da Tarefa 3');
    const download3Result = await orchestrator.interactWithPersistentTask(
      task3Result.taskId,
      'Quero baixar o conteúdo em formato ZIP',
      'user-003'
    );
    
    logger.log('INFO', 'DOWNLOAD', `Download 3: ${download3Result.success ? 'SUCESSO' : 'FALHA'}`, {
      success: download3Result.success,
      response: download3Result.response,
      error: download3Result.error
    });
    
    if (download3Result.success) {
      logger.trackAgent('TaskOrchestrator', 'interactWithTask', {
        taskId: task3Result.taskId,
        interaction: 'download',
        format: 'zip',
        response: download3Result.response
      });
    }
  }
  
  // Generate detailed report
  const report = logger.generateReport();
  
  console.log('\n📊 RELATÓRIO DETALHADO DOS LOGS');
  console.log('=' .repeat(100));
  
  console.log('\n📈 ESTATÍSTICAS GERAIS:');
  console.log(`⏱️  Duração Total: ${report.summary.duration}ms`);
  console.log(`📝 Total de Logs: ${report.summary.totalLogs}`);
  console.log(`📞 Total de Callbacks: ${report.summary.totalCallbacks}`);
  console.log(`🤖 Total de Agentes: ${report.summary.totalAgents}`);
  console.log(`🔧 Total de Tools: ${report.summary.totalTools}`);
  
  console.log('\n📞 CALLBACKS DETALHADOS:');
  console.log('-' .repeat(50));
  Object.entries(eventTracker).forEach(([eventName, count]) => {
    if (count > 0) {
      console.log(`  ${eventName}: ${count} execuções`);
    }
  });
  
  console.log('\n🤖 AGENTES EXECUTADOS:');
  console.log('-' .repeat(50));
  const agentStats = {};
  report.agents.forEach(agent => {
    if (!agentStats[agent.agent]) {
      agentStats[agent.agent] = { count: 0, actions: new Set() };
    }
    agentStats[agent.agent].count++;
    agentStats[agent.agent].actions.add(agent.action);
  });
  
  Object.entries(agentStats).forEach(([agent, stats]) => {
    console.log(`  ${agent}: ${stats.count} execuções`);
    console.log(`    Ações: ${Array.from(stats.actions).join(', ')}`);
  });
  
  console.log('\n🔧 TOOLS EXECUTADAS:');
  console.log('-' .repeat(50));
  const toolStats = {};
  report.tools.forEach(tool => {
    if (!toolStats[tool.tool]) {
      toolStats[tool.tool] = { count: 0, actions: new Set() };
    }
    toolStats[tool.tool].count++;
    toolStats[tool.tool].actions.add(tool.action);
  });
  
  Object.entries(toolStats).forEach(([tool, stats]) => {
    console.log(`  ${tool}: ${stats.count} execuções`);
    console.log(`    Ações: ${Array.from(stats.actions).join(', ')}`);
  });
  
  console.log('\n📋 SEQUÊNCIA TEMPORAL DETALHADA:');
  console.log('-' .repeat(50));
  report.logs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.elapsed}ms] ${log.level.toUpperCase()} [${log.category}] ${log.message}`);
  });
  
  // Save detailed report to file
  const reportPath = '/tmp/flui-detailed-analysis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);
  
  console.log('\n🏆 ANÁLISE DETALHADA CONCLUÍDA!');
  console.log('=' .repeat(100));
}

// Run the detailed analysis
analyzeDetailedLogs().catch(error => {
  console.error('❌ Erro durante a análise detalhada:', error);
  process.exit(1);
});
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { 
  MarkdownReport, 
  ProjectStructure, 
  TestResults, 
  ExecutionSummary, 
  MarkdownReporterOptions,
  ReportGenerationResult,
  ProjectFile,
  TestDetail
} from '../types/markdownReporter';

export class MarkdownReporter {
  private reportsDirectory: string;

  constructor(reportsDirectory: string) {
    this.reportsDirectory = reportsDirectory;
    try {
      this.ensureDirectoryExists();
    } catch (error) {
      // Directory creation will be handled in individual methods
      console.warn('Could not create directory in constructor:', (error as Error).message);
    }
  }

  async generateHTMLProjectReport(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    liveUrl: string,
    options: MarkdownReporterOptions = {}
  ): Promise<ReportGenerationResult> {
    try {
      // Validate inputs
      if (!title) {
        return {
          success: false,
          error: 'Title is required'
        };
      }

      if (!projectStructure) {
        return {
          success: false,
          error: 'Project structure is required'
        };
      }

      // Ensure directory exists
      this.ensureDirectoryExists();

      const reportId = uuidv4();
      const timestamp = new Date();
      
      // Generate report content
      let content = this.generateHTMLReportContent(
        title,
        projectStructure,
        testResults,
        executionSummary,
        liveUrl,
        options
      );

      // Save report
      const fileName = `html-project-${reportId}-${timestamp.getTime()}.md`;
      const filePath = path.join(this.reportsDirectory, fileName);
      
      fs.writeFileSync(filePath, content);

      return {
        success: true,
        reportPath: filePath,
        reportContent: content,
        metadata: {
          sectionsGenerated: this.countSections(content),
          linksGenerated: this.countLinks(content),
          processingTime: Date.now() - timestamp.getTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async generateNodeJSProjectReport(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    liveUrl: string,
    options: MarkdownReporterOptions = {}
  ): Promise<ReportGenerationResult> {
    try {
      const reportId = uuidv4();
      const timestamp = new Date();
      
      // Generate report content
      let content = this.generateNodeJSReportContent(
        title,
        projectStructure,
        testResults,
        executionSummary,
        liveUrl,
        options
      );

      // Save report
      const fileName = `nodejs-project-${reportId}-${timestamp.getTime()}.md`;
      const filePath = path.join(this.reportsDirectory, fileName);
      
      fs.writeFileSync(filePath, content);

      return {
        success: true,
        reportPath: filePath,
        reportContent: content,
        metadata: {
          sectionsGenerated: this.countSections(content),
          linksGenerated: this.countLinks(content),
          processingTime: Date.now() - timestamp.getTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async generateContentProjectReport(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    options: MarkdownReporterOptions = {}
  ): Promise<ReportGenerationResult> {
    try {
      const reportId = uuidv4();
      const timestamp = new Date();
      
      // Generate report content
      let content = this.generateContentReportContent(
        title,
        projectStructure,
        testResults,
        executionSummary,
        options
      );

      // Save report
      const fileName = `content-project-${reportId}-${timestamp.getTime()}.md`;
      const filePath = path.join(this.reportsDirectory, fileName);
      
      fs.writeFileSync(filePath, content);

      return {
        success: true,
        reportPath: filePath,
        reportContent: content,
        metadata: {
          sectionsGenerated: this.countSections(content),
          linksGenerated: this.countLinks(content),
          processingTime: Date.now() - timestamp.getTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async generateCustomReport(
    data: any,
    options: MarkdownReporterOptions = {}
  ): Promise<ReportGenerationResult> {
    try {
      const reportId = uuidv4();
      const timestamp = new Date();
      
      // Generate report content
      let content = this.generateCustomReportContent(data, options);

      // Save report
      const fileName = `custom-report-${reportId}-${timestamp.getTime()}.md`;
      const filePath = path.join(this.reportsDirectory, fileName);
      
      fs.writeFileSync(filePath, content);

      return {
        success: true,
        reportPath: filePath,
        reportContent: content,
        metadata: {
          sectionsGenerated: this.countSections(content),
          linksGenerated: this.countLinks(content),
          processingTime: Date.now() - timestamp.getTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async generateReportFromTemplate(
    data: any,
    options: MarkdownReporterOptions = {}
  ): Promise<ReportGenerationResult> {
    try {
      const reportId = uuidv4();
      const timestamp = new Date();
      
      // Generate report content from template
      let content = this.processTemplate(data, options);

      // Save report
      const fileName = `template-report-${reportId}-${timestamp.getTime()}.md`;
      const filePath = path.join(this.reportsDirectory, fileName);
      
      fs.writeFileSync(filePath, content);

      return {
        success: true,
        reportPath: filePath,
        reportContent: content,
        metadata: {
          sectionsGenerated: this.countSections(content),
          linksGenerated: this.countLinks(content),
          processingTime: Date.now() - timestamp.getTime()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private generateHTMLReportContent(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    liveUrl: string,
    options: MarkdownReporterOptions
  ): string {
    const icon = options.includeIcons ? '🌐' : '';
    const emoji = options.includeEmojis ? '✨' : '';
    
    let content = `# ${icon} ${title} ${emoji}\n\n`;
    
    if (options.includeTimestamps) {
      content += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    }

    // Overview section
    content += `## 📋 Visão Geral\n\n`;
    content += `Projeto HTML criado com sucesso! ${emoji}\n\n`;
    content += `- **Tipo:** Frontend HTML/CSS/JavaScript\n`;
    content += `- **Status:** ${this.getStatusEmoji(executionSummary)} ${this.getStatusText(executionSummary)}\n`;
    content += `- **Tempo de execução:** ${executionSummary.totalTime}ms\n\n`;

    // Project structure section
    if (options.includeFileStructure && projectStructure) {
      content += `## 📁 Estrutura do Projeto\n\n`;
      content += `**Arquivos criados:** ${projectStructure.files.length}\n`;
      content += `**Tamanho total:** ${this.formatFileSize(projectStructure.totalSize)}\n\n`;
      
      if (projectStructure.files.length > 0) {
        content += `### Arquivos:\n\n`;
        const maxFiles = options.maxFileListItems || 10;
        const filesToShow = projectStructure.files.slice(0, maxFiles);
        
        for (const file of filesToShow) {
          content += `- **${file.name}** (${this.formatFileSize(file.size)})`;
          if (file.description) {
            content += ` - ${file.description}`;
          }
          content += `\n`;
        }
        
        if (projectStructure.files.length > maxFiles) {
          content += `- ... e mais ${projectStructure.files.length - maxFiles} arquivos\n`;
        }
        content += `\n`;
      }
    }

    // Test results section
    if (options.includeTestDetails && testResults) {
      content += `## 🧪 Resultados dos Testes\n\n`;
      content += `- **Total:** ${testResults.total}\n`;
      content += `- **✅ Passou:** ${testResults.passed}\n`;
      content += `- **❌ Falhou:** ${testResults.failed}\n`;
      content += `- **⏭️ Pulou:** ${testResults.skipped}\n`;
      content += `- **⏱️ Duração:** ${testResults.duration}ms\n\n`;

      if (testResults.details && testResults.details.length > 0) {
        content += `### Detalhes dos Testes:\n\n`;
        const maxDetails = options.maxTestDetails || 5;
        const detailsToShow = testResults.details.slice(0, maxDetails);
        
        for (const detail of detailsToShow) {
          const statusIcon = detail.status === 'passed' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
          content += `- ${statusIcon} **${detail.name}** (${detail.duration}ms)\n`;
          if (detail.output) {
            content += `  - ${detail.output}\n`;
          }
          if (detail.error) {
            content += `  - ❌ ${detail.error}\n`;
          }
        }
        content += `\n`;
      }
    }

    // Execution summary section
    if (options.includeExecutionSummary) {
      content += `## 🚀 Execução\n\n`;
      content += `- **Build:** ${this.getStatusEmoji(executionSummary, 'build')} ${executionSummary.buildStatus}\n`;
      content += `- **Servidor:** ${this.getStatusEmoji(executionSummary, 'server')} ${executionSummary.serverStatus}\n`;
      content += `- **Testes:** ${this.getStatusEmoji(executionSummary, 'test')} ${executionSummary.testStatus}\n`;
      content += `- **Curl:** ${this.getStatusEmoji(executionSummary, 'curl')} ${executionSummary.curlStatus}\n\n`;

      if (executionSummary.errors && executionSummary.errors.length > 0) {
        content += `### ❌ Erros:\n\n`;
        for (const error of executionSummary.errors) {
          content += `- ${error}\n`;
        }
        content += `\n`;
      }

      if (executionSummary.warnings && executionSummary.warnings.length > 0) {
        content += `### ⚠️ Avisos:\n\n`;
        for (const warning of executionSummary.warnings) {
          content += `- ${warning}\n`;
        }
        content += `\n`;
      }
    }

    // Links section
    content += `## 🔗 Links\n\n`;
    if (liveUrl) {
      content += `- **🌐 Demo ao Vivo:** [Acessar Projeto](${liveUrl})\n`;
    }
    content += `- **📁 Download:** [Baixar Projeto](#download)\n\n`;

    // Next steps section
    content += `## 🎯 Próximos Passos\n\n`;
    content += `1. Acesse o link de demo para testar o projeto\n`;
    content += `2. Faça download dos arquivos se necessário\n`;
    content += `3. Personalize conforme suas necessidades\n`;
    content += `4. Deploy em seu servidor de produção\n\n`;

    return content;
  }

  private generateNodeJSReportContent(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    liveUrl: string,
    options: MarkdownReporterOptions
  ): string {
    const icon = options.includeIcons ? '🚀' : '';
    const emoji = options.includeEmojis ? '✨' : '';
    
    let content = `# ${icon} ${title} ${emoji}\n\n`;
    
    if (options.includeTimestamps) {
      content += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    }

    // Overview section
    content += `## 📋 Visão Geral\n\n`;
    content += `Projeto Node.js criado com sucesso! ${emoji}\n\n`;
    content += `- **Tipo:** Backend Node.js/Express\n`;
    content += `- **Status:** ${this.getStatusEmoji(executionSummary)} ${this.getStatusText(executionSummary)}\n`;
    content += `- **Tempo de execução:** ${executionSummary.totalTime}ms\n\n`;

    // Dependencies section
    if (options.includeFileStructure && projectStructure) {
      content += `## 📦 Dependências\n\n`;
      content += `**Arquivos criados:** ${projectStructure.files.length}\n`;
      content += `**Tamanho total:** ${this.formatFileSize(projectStructure.totalSize)}\n\n`;
      
      if (projectStructure.configFiles && projectStructure.configFiles.length > 0) {
        content += `### Arquivos de Configuração:\n\n`;
        for (const configFile of projectStructure.configFiles) {
          const file = projectStructure.files.find(f => f.name === configFile);
          if (file) {
            content += `- **${file.name}** (${this.formatFileSize(file.size)})`;
            if (file.description) {
              content += ` - ${file.description}`;
            }
            content += `\n`;
          }
        }
        content += `\n`;
      }

      if (projectStructure.files.length > 0) {
        content += `### Arquivos do Projeto:\n\n`;
        const maxFiles = options.maxFileListItems || 10;
        const filesToShow = projectStructure.files.slice(0, maxFiles);
        
        for (const file of filesToShow) {
          content += `- **${file.name}** (${this.formatFileSize(file.size)})`;
          if (file.description) {
            content += ` - ${file.description}`;
          }
          content += `\n`;
        }
        
        if (projectStructure.files.length > maxFiles) {
          content += `- ... e mais ${projectStructure.files.length - maxFiles} arquivos\n`;
        }
        content += `\n`;
      }
    }

    // Test results section
    if (options.includeTestDetails && testResults) {
      content += `## 🧪 Resultados dos Testes\n\n`;
      content += `- **Total:** ${testResults.total}\n`;
      content += `- **✅ Passou:** ${testResults.passed}\n`;
      content += `- **❌ Falhou:** ${testResults.failed}\n`;
      content += `- **⏭️ Pulou:** ${testResults.skipped}\n`;
      content += `- **⏱️ Duração:** ${testResults.duration}ms\n\n`;

      if (testResults.details && testResults.details.length > 0) {
        content += `### Detalhes dos Testes:\n\n`;
        const maxDetails = options.maxTestDetails || 5;
        const detailsToShow = testResults.details.slice(0, maxDetails);
        
        for (const detail of detailsToShow) {
          const statusIcon = detail.status === 'passed' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
          content += `- ${statusIcon} **${detail.name}** (${detail.duration}ms)\n`;
          if (detail.output) {
            content += `  - ${detail.output}\n`;
          }
          if (detail.error) {
            content += `  - ❌ ${detail.error}\n`;
          }
        }
        content += `\n`;
      }
    }

    // Execution summary section
    if (options.includeExecutionSummary) {
      content += `## 🚀 Execução\n\n`;
      content += `- **Build:** ${this.getStatusEmoji(executionSummary, 'build')} ${executionSummary.buildStatus}\n`;
      content += `- **Servidor:** ${this.getStatusEmoji(executionSummary, 'server')} ${executionSummary.serverStatus}\n`;
      content += `- **Testes:** ${this.getStatusEmoji(executionSummary, 'test')} ${executionSummary.testStatus}\n`;
      content += `- **Curl:** ${this.getStatusEmoji(executionSummary, 'curl')} ${executionSummary.curlStatus}\n\n`;

      if (executionSummary.errors && executionSummary.errors.length > 0) {
        content += `### ❌ Erros:\n\n`;
        for (const error of executionSummary.errors) {
          content += `- ${error}\n`;
        }
        content += `\n`;
      }

      if (executionSummary.warnings && executionSummary.warnings.length > 0) {
        content += `### ⚠️ Avisos:\n\n`;
        for (const warning of executionSummary.warnings) {
          content += `- ${warning}\n`;
        }
        content += `\n`;
      }
    }

    // Links section
    content += `## 🔗 Links\n\n`;
    if (liveUrl) {
      content += `- **🌐 API Endpoint:** [Acessar API](${liveUrl})\n`;
    }
    content += `- **📁 Download:** [Baixar Projeto](#download)\n\n`;

    // Next steps section
    content += `## 🎯 Próximos Passos\n\n`;
    content += `1. Acesse o endpoint da API para testar\n`;
    content += `2. Faça download dos arquivos se necessário\n`;
    content += `3. Configure variáveis de ambiente\n`;
    content += `4. Deploy em seu servidor de produção\n\n`;

    return content;
  }

  private generateContentReportContent(
    title: string,
    projectStructure: ProjectStructure,
    testResults: TestResults,
    executionSummary: ExecutionSummary,
    options: MarkdownReporterOptions
  ): string {
    const icon = options.includeIcons ? '📝' : '';
    const emoji = options.includeEmojis ? '✨' : '';
    
    let content = `# ${icon} ${title} ${emoji}\n\n`;
    
    if (options.includeTimestamps) {
      content += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    }

    // Overview section
    content += `## 📋 Visão Geral\n\n`;
    content += `Conteúdo criado com sucesso! ${emoji}\n\n`;
    content += `- **Tipo:** Conteúdo/Copywrite\n`;
    content += `- **Status:** ${this.getStatusEmoji(executionSummary)} ${this.getStatusText(executionSummary)}\n`;
    content += `- **Tempo de execução:** ${executionSummary.totalTime}ms\n\n`;

    // Content section
    if (options.includeFileStructure && projectStructure) {
      content += `## 📝 Conteúdo Gerado\n\n`;
      content += `**Arquivos criados:** ${projectStructure.files.length}\n`;
      content += `**Tamanho total:** ${this.formatFileSize(projectStructure.totalSize)}\n\n`;
      
      if (projectStructure.files.length > 0) {
        content += `### Arquivos de Conteúdo:\n\n`;
        const maxFiles = options.maxFileListItems || 10;
        const filesToShow = projectStructure.files.slice(0, maxFiles);
        
        for (const file of filesToShow) {
          content += `- **${file.name}** (${this.formatFileSize(file.size)})`;
          if (file.description) {
            content += ` - ${file.description}`;
          }
          content += `\n`;
        }
        
        if (projectStructure.files.length > maxFiles) {
          content += `- ... e mais ${projectStructure.files.length - maxFiles} arquivos\n`;
        }
        content += `\n`;
      }
    }

    // Validation section
    if (options.includeTestDetails && testResults) {
      content += `## 🧪 Validação\n\n`;
      content += `- **Total:** ${testResults.total}\n`;
      content += `- **✅ Passou:** ${testResults.passed}\n`;
      content += `- **❌ Falhou:** ${testResults.failed}\n`;
      content += `- **⏭️ Pulou:** ${testResults.skipped}\n`;
      content += `- **⏱️ Duração:** ${testResults.duration}ms\n\n`;

      if (testResults.details && testResults.details.length > 0) {
        content += `### Detalhes da Validação:\n\n`;
        const maxDetails = options.maxTestDetails || 5;
        const detailsToShow = testResults.details.slice(0, maxDetails);
        
        for (const detail of detailsToShow) {
          const statusIcon = detail.status === 'passed' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
          content += `- ${statusIcon} **${detail.name}** (${detail.duration}ms)\n`;
          if (detail.output) {
            content += `  - ${detail.output}\n`;
          }
          if (detail.error) {
            content += `  - ❌ ${detail.error}\n`;
          }
        }
        content += `\n`;
      }
    }

    // Links section
    content += `## 🔗 Links\n\n`;
    content += `- **📁 Download:** [Baixar Conteúdo](#download)\n\n`;

    // Next steps section
    content += `## 🎯 Próximos Passos\n\n`;
    content += `1. Revise o conteúdo gerado\n`;
    content += `2. Faça ajustes conforme necessário\n`;
    content += `3. Use o conteúdo em seus projetos\n`;
    content += `4. Compartilhe com sua equipe\n\n`;

    return content;
  }

  private generateCustomReportContent(data: any, options: MarkdownReporterOptions): string {
    const icon = options.includeIcons ? '📊' : '';
    const emoji = options.includeEmojis ? '✨' : '';
    
    let content = `# ${icon} ${data.title} ${emoji}\n\n`;
    
    if (data.description) {
      content += `${data.description}\n\n`;
    }

    if (data.sections && data.sections.length > 0) {
      for (const section of data.sections) {
        content += `## ${section.title}\n\n`;
        content += `${section.content}\n\n`;
      }
    }

    if (data.links && data.links.length > 0) {
      content += `## 🔗 Links\n\n`;
      for (const link of data.links) {
        content += `- [${link.title}](${link.url})\n`;
      }
      content += `\n`;
    }

    return content;
  }

  private processTemplate(data: any, options: MarkdownReporterOptions): string {
    let template = options.customTemplate || '';
    
    // Simple template processing
    template = template.replace(/\{\{title\}\}/g, data.title || '');
    template = template.replace(/\{\{description\}\}/g, data.description || '');
    
    // Process arrays
    if (data.files && Array.isArray(data.files)) {
      const filesList = data.files.map((file: any) => `- ${file.name} (${file.size} bytes)`).join('\n');
      template = template.replace(/\{\{#each files\}\}([\s\S]*?)\{\{\/each\}\}/g, filesList);
    }
    
    if (data.links && Array.isArray(data.links)) {
      const linksList = data.links.map((link: any) => `- [${link.title}](${link.url})`).join('\n');
      template = template.replace(/\{\{#each links\}\}([\s\S]*?)\{\{\/each\}\}/g, linksList);
    }
    
    return template;
  }

  private getStatusEmoji(executionSummary: ExecutionSummary, type?: string): string {
    if (type === 'build') {
      return executionSummary.buildStatus === 'success' ? '✅' : executionSummary.buildStatus === 'failed' ? '❌' : '⏭️';
    }
    if (type === 'server') {
      return executionSummary.serverStatus === 'running' ? '✅' : executionSummary.serverStatus === 'failed' ? '❌' : '⏭️';
    }
    if (type === 'test') {
      return executionSummary.testStatus === 'passed' ? '✅' : executionSummary.testStatus === 'failed' ? '❌' : '⏭️';
    }
    if (type === 'curl') {
      return executionSummary.curlStatus === 'success' ? '✅' : executionSummary.curlStatus === 'failed' ? '❌' : '⏭️';
    }
    
    // Overall status
    if (executionSummary.testStatus === 'passed' && executionSummary.curlStatus === 'success') {
      return '✅';
    } else if (executionSummary.testStatus === 'failed' || executionSummary.curlStatus === 'failed') {
      return '❌';
    } else {
      return '⚠️';
    }
  }

  private getStatusText(executionSummary: ExecutionSummary): string {
    if (executionSummary.testStatus === 'passed' && executionSummary.curlStatus === 'success') {
      return 'Sucesso';
    } else if (executionSummary.testStatus === 'failed' || executionSummary.curlStatus === 'failed') {
      return 'Falha';
    } else {
      return 'Parcial';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private countSections(content: string): number {
    return (content.match(/^## /gm) || []).length;
  }

  private countLinks(content: string): number {
    return (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  }

  private ensureDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.reportsDirectory)) {
        fs.mkdirSync(this.reportsDirectory, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create reports directory: ${(error as Error).message}`);
    }
  }

  async listReports(): Promise<{ success: boolean; reports?: string[]; error?: string }> {
    try {
      if (!fs.existsSync(this.reportsDirectory)) {
        return {
          success: true,
          reports: []
        };
      }

      const files = fs.readdirSync(this.reportsDirectory)
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.reportsDirectory, a));
          const statB = fs.statSync(path.join(this.reportsDirectory, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      return {
        success: true,
        reports: files
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getReportContent(reportFileName: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const filePath = path.join(this.reportsDirectory, reportFileName);
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Report file not found: ${reportFileName}`
        };
      }

      const content = fs.readFileSync(filePath, 'utf8');

      return {
        success: true,
        content
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async deleteReport(reportFileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = path.join(this.reportsDirectory, reportFileName);
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Report file not found: ${reportFileName}`
        };
      }

      fs.unlinkSync(filePath);

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
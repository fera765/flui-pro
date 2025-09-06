import { injectable, inject } from 'inversify';
import { IAgent, MicroTask, TaskType } from '../types/ITask';
import { ILlmService } from '../../interfaces/ILlmService';
import { IEmotionMemory } from '../../memory/interfaces/IEmotionMemory';
import { IFileSystem } from '../types/ITask';

@injectable()
export class MergeAgent implements IAgent {
  public readonly name = 'MergeAgent';
  private readonly llmService: ILlmService;
  private readonly emotionMemory: IEmotionMemory;
  private readonly fileSystem: IFileSystem;

  constructor(
    @inject('ILlmService') llmService: ILlmService,
    @inject('IEmotionMemory') emotionMemory: IEmotionMemory,
    @inject('IFileSystem') fileSystem: IFileSystem
  ) {
    this.llmService = llmService;
    this.emotionMemory = emotionMemory;
    this.fileSystem = fileSystem;
  }

  getPriority(): number {
    return 8;
  }

  canHandle(task: any, projectState: any): boolean {
    // Pode lidar se há conflitos de merge ou divergências de checksum
    const hasConflicts = this.hasMergeConflicts(projectState.files);
    const hasDivergences = this.hasChecksumDivergences(task.checksums, projectState.files);
    
    return hasConflicts || hasDivergences;
  }

  async execute(context: any): Promise<MicroTask[]> {
    const { task, projectState, emotionMemory, llmService, fileSystem } = context;
    
    try {
      // Detectar conflitos e divergências
      const conflicts = await this.detectConflicts(task, projectState);
      
      if (conflicts.length === 0) {
        return [];
      }

      // Usar LLM para resolver conflitos
      const mergePrompt = this.generateMergePrompt(task.prompt, conflicts, projectState);
      
      if (!(await llmService.isConnected())) {
        return this.generateFallbackMergeTasks(conflicts);
      }

      const mergeResponse = await llmService.generateResponse(mergePrompt);
      const mergeTasks = this.parseMergeResponse(mergeResponse, task.projectPath);
      
      // Armazenar experiência na memória emocional
      await this.storeMergeExperience(task, conflicts, mergeTasks, emotionMemory);
      
      return mergeTasks;
      
    } catch (error) {
      console.error('Erro no MergeAgent:', error);
      return [];
    }
  }

  private hasMergeConflicts(files: Record<string, string>): boolean {
    // Verificar se há marcadores de conflito de merge
    for (const [path, content] of Object.entries(files)) {
      if (content.includes('<<<<<<<') || 
          content.includes('=======') || 
          content.includes('>>>>>>>')) {
        return true;
      }
    }
    return false;
  }

  private hasChecksumDivergences(checksums: Record<string, string>, files: Record<string, string>): boolean {
    // Verificar se há divergências entre checksums esperados e atuais
    for (const [path, expectedChecksum] of Object.entries(checksums)) {
      if (files[path]) {
        try {
          const currentChecksum = this.calculateChecksum(files[path]);
          if (currentChecksum !== expectedChecksum) {
            return true;
          }
        } catch (error) {
          console.warn(`Erro ao calcular checksum de ${path}:`, error);
        }
      }
    }
    return false;
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async detectConflicts(task: any, projectState: any): Promise<Array<{type: string, path: string, content: string, conflict: any}>> {
    const conflicts: Array<{type: string, path: string, content: string, conflict: any}> = [];
    
    // Detectar conflitos de merge
    for (const [path, content] of Object.entries(projectState.files)) {
      const contentStr = String(content);
      if (this.hasMergeConflicts({[path]: contentStr})) {
        const conflict = this.parseMergeConflict(contentStr);
        conflicts.push({
          type: 'merge_conflict',
          path,
          content: contentStr,
          conflict
        });
      }
    }
    
    // Detectar divergências de checksum
    for (const [path, expectedChecksum] of Object.entries(task.checksums || {})) {
      if (projectState.files[path]) {
        const contentStr = String(projectState.files[path]);
        const currentChecksum = this.calculateChecksum(contentStr);
        if (currentChecksum !== expectedChecksum) {
          conflicts.push({
            type: 'checksum_divergence',
            path,
            content: contentStr,
            conflict: {
              expected: expectedChecksum,
              current: currentChecksum,
              original: await this.getOriginalContent(path, task)
            }
          });
        }
      }
    }
    
    return conflicts;
  }

  private parseMergeConflict(content: string): any {
    const lines = content.split('\n');
    const conflict = {
      ours: '',
      theirs: '',
      base: '',
      markers: {
        start: -1,
        separator: -1,
        end: -1
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('<<<<<<<')) {
        conflict.markers.start = i;
      } else if (line.startsWith('=======')) {
        conflict.markers.separator = i;
      } else if (line.startsWith('>>>>>>>')) {
        conflict.markers.end = i;
        break;
      }
    }
    
    if (conflict.markers.start !== -1 && conflict.markers.separator !== -1 && conflict.markers.end !== -1) {
      conflict.ours = lines.slice(conflict.markers.start + 1, conflict.markers.separator).join('\n');
      conflict.theirs = lines.slice(conflict.markers.separator + 1, conflict.markers.end).join('\n');
    }
    
    return conflict;
  }

  private async getOriginalContent(path: string, task: any): Promise<string> {
    try {
      // Tentar recuperar conteúdo original do histórico da task
      const taskLogs = task.logs || [];
      for (const log of taskLogs.reverse()) {
        if (log.details && log.details.path === path && log.details.originalContent) {
          return log.details.originalContent;
        }
      }
      
      // Fallback: retornar string vazia
      return '';
    } catch (error) {
      console.warn(`Erro ao recuperar conteúdo original de ${path}:`, error);
      return '';
    }
  }

  private generateMergePrompt(prompt: string, conflicts: Array<{type: string, path: string, content: string, conflict: any}>, projectState: any): string {
    const conflictSummary = conflicts.map(conflict => {
      if (conflict.type === 'merge_conflict') {
        return `MERGE CONFLICT em ${conflict.path}:
Nossa versão:
${conflict.conflict.ours}

Versão deles:
${conflict.conflict.theirs}`;
      } else if (conflict.type === 'checksum_divergence') {
        return `CHECKSUM DIVERGENCE em ${conflict.path}:
Esperado: ${conflict.conflict.expected}
Atual: ${conflict.conflict.current}
Conteúdo atual:
${conflict.content.substring(0, 500)}...`;
      }
      return '';
    }).join('\n\n');
    
    return `Resolva os conflitos de merge e divergências do projeto:

PROMPT ORIGINAL: "${prompt}"

CONFLITOS DETECTADOS:
${conflictSummary}

ARQUIVOS DO PROJETO:
${Object.keys(projectState.files).join(', ')}

Para cada conflito:
1. Analise o contexto e propósito do arquivo
2. Mantenha a funcionalidade correta
3. Preserve a intenção original do prompt
4. Resolva conflitos de forma inteligente
5. Mantenha consistência com o resto do projeto
6. Priorize a versão mais recente e funcional

Retorne um JSON com:
{
  "resolutions": [
    {
      "type": "merge_conflict|checksum_divergence",
      "path": "caminho/do/arquivo",
      "resolvedContent": "conteúdo resolvido completo",
      "strategy": "strategy usada para resolução",
      "confidence": "high|medium|low"
    }
  ],
  "newChecksums": {
    "caminho/do/arquivo": "novo_checksum"
  },
  "instructions": "instruções de implementação"
}`;
  }

  private parseMergeResponse(response: string, projectPath: string): MicroTask[] {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      const tasks: MicroTask[] = [];
      
      // Criar tasks de resolução
      if (parsed.resolutions && Array.isArray(parsed.resolutions)) {
        for (const resolution of parsed.resolutions) {
          tasks.push({
            id: `merge-resolve-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'merge_resolve' as TaskType,
            path: resolution.path,
            oldSnippet: 'conteúdo_original',
            newSnippet: resolution.resolvedContent,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 3
          });
        }
      }
      
      return tasks;
      
    } catch (error) {
      console.error('Erro ao parsear resposta de merge:', error);
      return this.generateFallbackMergeTasks([]);
    }
  }

  private generateFallbackMergeTasks(conflicts: Array<{type: string, path: string, content: string, conflict: any}>): MicroTask[] {
    const tasks: MicroTask[] = [];
    
    // Gerar tasks básicas para cada conflito
    for (const conflict of conflicts) {
      if (conflict.type === 'merge_conflict') {
        // Para conflitos de merge, usar a versão "ours" como fallback
        const resolvedContent = conflict.conflict.ours || conflict.content;
        
        tasks.push({
          id: `fallback-merge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'file_replace' as TaskType,
          path: conflict.path,
          oldSnippet: conflict.content,
          newSnippet: resolvedContent,
          status: 'pending',
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        });
      } else if (conflict.type === 'checksum_divergence') {
        // Para divergências de checksum, manter o conteúdo atual
        tasks.push({
          id: `fallback-checksum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'file_replace' as TaskType,
          path: conflict.path,
          oldSnippet: 'conteúdo_anterior',
          newSnippet: conflict.content,
          status: 'pending',
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 3
        });
      }
    }
    
    return tasks;
  }

  private async storeMergeExperience(
    task: any, 
    conflicts: Array<{type: string, path: string, content: string, conflict: any}>, 
    mergeTasks: MicroTask[], 
    emotionMemory: IEmotionMemory
  ): Promise<void> {
    try {
      const context = `MergeAgent executado para task ${task.id}`;
      const outcome = mergeTasks.length > 0;
      
      const conflictTypes = conflicts.map(c => c.type).join(', ');
      
      await emotionMemory.storeMemory(
        await emotionMemory.analyzeEmotionalContext(`Resolução de ${conflicts.length} conflitos (${conflictTypes}): ${mergeTasks.length} resoluções aplicadas`),
        await emotionMemory.createPolicyDelta('merge_resolution', context),
        context,
        outcome
      );
    } catch (error) {
      console.warn('Erro ao armazenar experiência do MergeAgent:', error);
    }
  }

  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  }
}
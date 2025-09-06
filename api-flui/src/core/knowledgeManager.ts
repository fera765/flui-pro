import { v4 as uuidv4 } from 'uuid';
import { 
  KnowledgeSource, 
  KnowledgeContext, 
  CreateKnowledgeSourceRequest, 
  UpdateKnowledgeSourceRequest 
} from '../types/knowledge';

export class KnowledgeManager {
  private knowledgeSources: Map<string, KnowledgeSource> = new Map();
  private activeContext: KnowledgeContext | null = null;

  constructor() {
    this.loadDefaultKnowledge();
  }

  private loadDefaultKnowledge(): void {
    // 100% Dynamic Knowledge Loading - No static data
    // Knowledge is now loaded dynamically via LLM or external APIs
    console.log('🧠 Knowledge Manager: 100% Dynamic - No static knowledge loaded');
  }

  createKnowledgeSource(request: CreateKnowledgeSourceRequest): KnowledgeSource {
    const id = uuidv4();
    const now = new Date();
    
    const knowledgeSource: KnowledgeSource = {
      id,
      title: request.title,
      content: request.content,
      category: request.category || 'general',
      tags: request.tags || [],
      priority: request.priority || 5,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.knowledgeSources.set(id, knowledgeSource);
    this.updateContext();
    
    return knowledgeSource;
  }

  getKnowledgeSource(id: string): KnowledgeSource | null {
    return this.knowledgeSources.get(id) || null;
  }

  getAllKnowledgeSources(): KnowledgeSource[] {
    return Array.from(this.knowledgeSources.values())
      .sort((a, b) => b.priority - a.priority);
  }

  getActiveKnowledgeSources(): KnowledgeSource[] {
    return this.getAllKnowledgeSources()
      .filter(source => source.isActive);
  }

  updateKnowledgeSource(id: string, request: UpdateKnowledgeSourceRequest): KnowledgeSource | null {
    const existing = this.knowledgeSources.get(id);
    if (!existing) {
      return null;
    }

    const updated: KnowledgeSource = {
      ...existing,
      ...request,
      updatedAt: new Date()
    };

    this.knowledgeSources.set(id, updated);
    this.updateContext();
    
    return updated;
  }

  deleteKnowledgeSource(id: string): boolean {
    const deleted = this.knowledgeSources.delete(id);
    if (deleted) {
      this.updateContext();
    }
    return deleted;
  }

  getKnowledgeContext(): KnowledgeContext {
    if (!this.activeContext) {
      this.updateContext();
    }
    return this.activeContext!;
  }

  private updateContext(): void {
    const activeSources = this.getActiveKnowledgeSources();
    
    this.activeContext = {
      sources: activeSources,
      totalSources: activeSources.length,
      lastUpdated: new Date()
    };
  }

  getContextualKnowledge(taskPrompt: string, maxSources: number = 5): string {
    const activeSources = this.getActiveKnowledgeSources();
    
    // Simple relevance scoring based on keyword matching
    const scoredSources = activeSources.map(source => {
      const promptLower = taskPrompt.toLowerCase();
      const contentLower = source.content.toLowerCase();
      const titleLower = source.title.toLowerCase();
      
      let score = 0;
      
      // Check for keyword matches in content
      const words = promptLower.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && contentLower.includes(word)) {
          score += 2;
        }
        if (word.length > 3 && titleLower.includes(word)) {
          score += 3;
        }
      });
      
      // Boost score based on priority
      score += source.priority;
      
      return { source, score };
    });

    // Sort by score and take top sources
    const topSources = scoredSources
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSources)
      .map(item => item.source);

    // Format knowledge for injection
    if (topSources.length === 0) {
      return "";
    }

    const knowledgeText = topSources
      .map(source => `**${source.title}** (${source.category}):\n${source.content}`)
      .join('\n\n');

    return `\n\n--- RELEVANT KNOWLEDGE SOURCES ---\n${knowledgeText}\n--- END KNOWLEDGE SOURCES ---\n\n`;
  }

  searchKnowledgeSources(query: string): KnowledgeSource[] {
    const queryLower = query.toLowerCase();
    
    return this.getActiveKnowledgeSources().filter(source => {
      return source.title.toLowerCase().includes(queryLower) ||
             source.content.toLowerCase().includes(queryLower) ||
             (source.tags && source.tags.some(tag => tag.toLowerCase().includes(queryLower))) ||
             (source.category && source.category.toLowerCase().includes(queryLower));
    });
  }
}
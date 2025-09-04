export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  priority: number; // 1-10, higher number = higher priority
}

export interface KnowledgeContext {
  sources: KnowledgeSource[];
  totalSources: number;
  lastUpdated: Date;
}

export interface CreateKnowledgeSourceRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  priority?: number;
}

export interface UpdateKnowledgeSourceRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  priority?: number;
  isActive?: boolean;
}
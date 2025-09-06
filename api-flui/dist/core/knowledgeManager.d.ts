import { KnowledgeSource, KnowledgeContext, CreateKnowledgeSourceRequest, UpdateKnowledgeSourceRequest } from '../types/knowledge';
export declare class KnowledgeManager {
    private knowledgeSources;
    private activeContext;
    constructor();
    private loadDefaultKnowledge;
    createKnowledgeSource(request: CreateKnowledgeSourceRequest): KnowledgeSource;
    getKnowledgeSource(id: string): KnowledgeSource | null;
    getAllKnowledgeSources(): KnowledgeSource[];
    getActiveKnowledgeSources(): KnowledgeSource[];
    updateKnowledgeSource(id: string, request: UpdateKnowledgeSourceRequest): KnowledgeSource | null;
    deleteKnowledgeSource(id: string): boolean;
    getKnowledgeContext(): KnowledgeContext;
    private updateContext;
    getContextualKnowledge(taskPrompt: string, maxSources?: number): string;
    searchKnowledgeSources(query: string): KnowledgeSource[];
}
//# sourceMappingURL=knowledgeManager.d.ts.map
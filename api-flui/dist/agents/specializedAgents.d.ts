import { Agent } from '../types/advanced';
export declare class SpecializedAgents {
    static createCodeForgeAgent(): Agent;
    static createConversationAgent(): Agent;
    static createModificationAgent(): Agent;
    static createValidationAgent(): Agent;
    static createDownloadAgent(): Agent;
    static getAllAgents(): Agent[];
    static getAgentById(id: string): Agent | undefined;
}
//# sourceMappingURL=specializedAgents.d.ts.map